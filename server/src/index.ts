import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { leadsRoutes } from './routes/leads.js';
import { areasRoutes } from './routes/areas.js';
import { sourcesRoutes } from './routes/sources.js';
import { ingestRoutes } from './routes/ingest.js';
import { exportRoutes } from './routes/export.js';
import { registerWebhookRoutes } from './routes/webhook.js';

const PORT = parseInt(process.env.PORT || '3001');

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

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
