import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { leadsRoutes } from '../../server/dist/routes/leads.js';
import { areasRoutes } from '../../server/dist/routes/areas.js';
import { sourcesRoutes } from '../../server/dist/routes/sources.js';
import { ingestRoutes } from '../../server/dist/routes/ingest.js';
import { exportRoutes } from '../../server/dist/routes/export.js';
import { registerWebhookRoutes } from '../../server/dist/routes/webhook.js';
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
