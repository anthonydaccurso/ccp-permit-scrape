import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase } from '../db/connection.js';
import { dbToLead } from '../types.js';

export async function leadsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/leads', async (request, reply) => {
    const querySchema = z.object({
      search: z.string().optional(),
      minScore: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      county: z.string().optional(),
      town: z.string().optional(),
      source: z.string().optional(),
      status: z.string().optional(),
      limit: z.string().optional(),
      offset: z.string().optional(),
    });

    const params = querySchema.parse(request.query);
    const limit = parseInt(params.limit || '100');
    const offset = parseInt(params.offset || '0');

    let query = supabase.from('leads').select('*', { count: 'exact' });

    if (params.search) {
      query = query.or(`raw_address.ilike.%${params.search}%,contractor_name.ilike.%${params.search}%,owner_name.ilike.%${params.search}%`);
    }
    if (params.minScore) {
      query = query.gte('score', parseInt(params.minScore));
    }
    if (params.dateFrom) {
      query = query.gte('issue_date', params.dateFrom);
    }
    if (params.dateTo) {
      query = query.lte('issue_date', params.dateTo);
    }
    if (params.county) {
      query = query.eq('county', params.county);
    }
    if (params.town) {
      query = query.eq('town', params.town);
    }
    if (params.source) {
      query = query.eq('source', params.source);
    }
    if (params.status) {
      query = query.eq('status', params.status);
    }

    query = query.order('score', { ascending: false }).order('issue_date', { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return reply.status(500).send({ error: error.message });
    }

    const leads = (data || []).map(dbToLead);

    reply.send({
      data: leads,
      total: count || 0,
      limit,
      offset,
    });
  });

  fastify.get('/api/leads/:id', async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    reply.send(dbToLead(data));
  });

  fastify.patch('/api/leads/:id', async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const bodySchema = z.object({
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
      status: z.string().optional(),
    });

    const body = bodySchema.parse(request.body);

    const updates: any = {};
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.status !== undefined) updates.status = body.status;

    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: 'No fields to update' });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error || !data) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    reply.send(dbToLead(data));
  });
}
