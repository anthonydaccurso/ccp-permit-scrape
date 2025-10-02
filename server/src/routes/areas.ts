import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase } from '../db/connection.js';
import { dbToArea } from '../types.js';
import { slugify } from '../utils/normalize.js';

export async function areasRoutes(fastify: FastifyInstance) {
  fastify.get('/api/areas', async (request, reply) => {
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .order('level')
      .order('name');

    if (error) {
      return reply.status(500).send({ error: error.message });
    }

    reply.send((data || []).map(dbToArea));
  });

  fastify.post('/api/areas', async (request, reply) => {
    const bodySchema = z.object({
      level: z.enum(['county', 'town']),
      name: z.string(),
      state: z.string().default('NJ'),
      parentCounty: z.string().optional(),
      active: z.boolean().default(true),
    });

    const body = bodySchema.parse(request.body);
    const slug = slugify(body.name);

    const { data, error } = await supabase
      .from('areas')
      .insert({
        level: body.level,
        name: body.name,
        state: body.state,
        parent_county: body.parentCounty || null,
        slug,
        active: body.active,
      })
      .select()
      .single();

    if (error) {
      return reply.status(400).send({ error: error.message });
    }

    reply.status(201).send(dbToArea(data));
  });

  fastify.patch('/api/areas/:id', async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const bodySchema = z.object({
      active: z.boolean().optional(),
      name: z.string().optional(),
    });

    const body = bodySchema.parse(request.body);

    const updates: any = {};
    if (body.active !== undefined) updates.active = body.active;
    if (body.name !== undefined) {
      updates.name = body.name;
      updates.slug = slugify(body.name);
    }

    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('areas')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error || !data) {
      return reply.status(404).send({ error: 'Area not found' });
    }

    reply.send(dbToArea(data));
  });
}
