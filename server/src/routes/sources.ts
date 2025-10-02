import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase } from '../db/connection.js';
import { dbToSource } from '../types.js';
import { slugify } from '../utils/normalize.js';

export async function sourcesRoutes(fastify: FastifyInstance) {
  fastify.get('/api/sources', async (request, reply) => {
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .order('type')
      .order('name');

    if (error) {
      return reply.status(500).send({ error: error.message });
    }

    reply.send((data || []).map(dbToSource));
  });

  fastify.post('/api/sources', async (request, reply) => {
    const bodySchema = z.object({
      name: z.string(),
      url: z.string(),
      type: z.enum(['permit', 'assessor', 'builder', 'other']),
      county: z.string().optional(),
      town: z.string().optional(),
      active: z.boolean().default(true),
    });

    const body = bodySchema.parse(request.body);
    const slug = slugify(body.name);

    const { data, error } = await supabase
      .from('sources')
      .insert({
        name: body.name,
        slug,
        url: body.url,
        type: body.type,
        county: body.county || null,
        town: body.town || null,
        active: body.active,
      })
      .select()
      .single();

    if (error) {
      return reply.status(400).send({ error: error.message });
    }

    reply.status(201).send(dbToSource(data));
  });

  fastify.patch('/api/sources/:id', async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const bodySchema = z.object({
      active: z.boolean().optional(),
      lastRun: z.string().optional(),
      lastStatus: z.string().optional(),
    });

    const body = bodySchema.parse(request.body);

    const updates: any = {};
    if (body.active !== undefined) updates.active = body.active;
    if (body.lastRun !== undefined) updates.last_run = body.lastRun;
    if (body.lastStatus !== undefined) updates.last_status = body.lastStatus;

    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('sources')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error || !data) {
      return reply.status(404).send({ error: 'Source not found' });
    }

    reply.send(dbToSource(data));
  });
}
