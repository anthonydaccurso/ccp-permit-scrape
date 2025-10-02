import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { leadsRoutes } from '../../server/src/routes/leads.js';
import { areasRoutes } from '../../server/src/routes/areas.js';
import { sourcesRoutes } from '../../server/src/routes/sources.js';
import { ingestRoutes } from '../../server/src/routes/ingest.js';
import { exportRoutes } from '../../server/src/routes/export.js';
import { registerWebhookRoutes } from '../../server/src/routes/webhook.js';
import serverless from '@fastify/aws-lambda';

const fastify = Fastify({
  logger: true,
});

await fastify.register(cors, {
  origin: true,
  credentials: true,
});

await fastify.register(leadsRoutes);
await fastify.register(areasRoutes);
await fastify.register(sourcesRoutes);
await fastify.register(ingestRoutes);
await fastify.register(exportRoutes);
await fastify.register(registerWebhookRoutes);

fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

export const handler = serverless(fastify);
