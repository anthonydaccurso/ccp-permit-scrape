import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import serverless from 'serverless-http';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

let cachedHandler: any;

async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: (origin, cb) => cb(null, true),
    credentials: true,
  });

  app.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  app.get('/api/leads', async (request, reply) => {
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

    reply.send({
      data: data || [],
      total: count || 0,
      limit,
      offset,
    });
  });

  app.get('/api/leads/:id', async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    reply.send(data);
  });

  app.patch('/api/leads/:id', async (request, reply) => {
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

    reply.send(data);
  });

  app.get('/api/areas', async (request, reply) => {
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .order('county')
      .order('town');

    if (error) {
      return reply.status(500).send({ error: error.message });
    }

    reply.send(data || []);
  });

  app.get('/api/sources', async (request, reply) => {
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .order('county')
      .order('town');

    if (error) {
      return reply.status(500).send({ error: error.message });
    }

    reply.send(data || []);
  });

  app.post('/api/sources', async (request, reply) => {
    const bodySchema = z.object({
      county: z.string(),
      town: z.string(),
      url: z.string().url(),
      enabled: z.boolean().optional(),
    });

    const body = bodySchema.parse(request.body);

    const { data, error } = await supabase
      .from('sources')
      .insert({
        county: body.county,
        town: body.town,
        url: body.url,
        enabled: body.enabled ?? true,
      })
      .select()
      .single();

    if (error) {
      return reply.status(500).send({ error: error.message });
    }

    reply.send(data);
  });

  app.patch('/api/sources/:id', async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const bodySchema = z.object({
      enabled: z.boolean().optional(),
      url: z.string().url().optional(),
    });

    const body = bodySchema.parse(request.body);

    const updates: any = {};
    if (body.enabled !== undefined) updates.enabled = body.enabled;
    if (body.url !== undefined) updates.url = body.url;

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

    reply.send(data);
  });

  app.delete('/api/sources/:id', async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);

    const { error } = await supabase
      .from('sources')
      .delete()
      .eq('id', params.id);

    if (error) {
      return reply.status(500).send({ error: error.message });
    }

    reply.status(204).send();
  });

  app.post('/api/ingest/firecrawl', async (request, reply) => {
    try {
      const hdr = String((request.headers['x-admin-token'] ?? '')).trim();
      if (!hdr || hdr !== process.env.ADMIN_TOKEN) {
        return reply.code(401).send({ error: 'unauthorized' });
      }

      const rows = Array.isArray(request.body) ? (request.body as any[]) : [];
      if (!rows.length) return reply.send({ inserted: 0, updated: 0, skipped: 0 });

      const now = new Date().toISOString();
      const payload = rows.map((r) => ({
        source: r.source,
        kind: r.kind ?? 'permit',
        raw_address: r.rawAddress,
        street: r.street,
        city: r.city,
        state: r.state ?? 'NJ',
        zip: r.zip,
        county: r.county ?? null,
        town: r.town ?? null,
        permit_number: r.permitNumber ?? null,
        permit_type: r.permitType ?? null,
        status: r.status ?? null,
        issue_date: r.issueDate ?? null,
        owner_name: r.ownerName ?? null,
        contractor_name: r.contractorName ?? null,
        score: typeof r.score === 'number' ? r.score : 0,
        canonical_key: r.canonicalKey,
        first_seen: r.firstSeen ?? now,
        last_seen: r.lastSeen ?? now,
        lat: r.lat ?? null,
        lon: r.lon ?? null
      }));

      const { data, error } = await supabaseAdmin
        .from('leads')
        .upsert(payload, { onConflict: 'canonical_key' })
        .select('id, canonical_key');

      if (error) {
        return reply.code(500).send({ error: error.message });
      }

      return reply.send({ upserted: data?.length ?? 0 });
    } catch (e: any) {
      return reply.code(500).send({ error: e.message ?? 'server error' });
    }
  });

  app.get('/api/export', async (request, reply) => {
    const querySchema = z.object({
      format: z.enum(['csv', 'json']).optional(),
      minScore: z.string().optional(),
    });

    const params = querySchema.parse(request.query);
    const format = params.format || 'csv';

    let query = supabase.from('leads').select('*');

    if (params.minScore) {
      query = query.gte('score', parseInt(params.minScore));
    }

    query = query.order('score', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return reply.status(500).send({ error: error.message });
    }

    if (format === 'json') {
      reply.header('Content-Type', 'application/json');
      reply.header('Content-Disposition', 'attachment; filename="leads.json"');
      return reply.send(data);
    }

    const csvHeader = 'ID,Address,County,Town,Owner,Contractor,Issue Date,Score,Status\n';
    const csvRows = (data || []).map((lead: any) => {
      return [
        lead.id,
        `"${lead.raw_address || ''}"`,
        lead.county || '',
        lead.town || '',
        `"${lead.owner_name || ''}"`,
        `"${lead.contractor_name || ''}"`,
        lead.issue_date || '',
        lead.score || 0,
        lead.status || 'new',
      ].join(',');
    });

    const csv = csvHeader + csvRows.join('\n');

    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="leads.csv"');
    reply.send(csv);
  });

  app.post('/api/webhook/firecrawl', async (request, reply) => {
    try {
      const body = request.body as any;

      if (body.status === 'completed' && body.data) {
        const leads = Array.isArray(body.data) ? body.data : [body.data];

        const { data, error } = await supabase
          .from('leads')
          .insert(leads)
          .select();

        if (error) {
          return reply.status(500).send({ error: error.message });
        }

        return reply.send({ success: true, inserted: data?.length || 0 });
      }

      reply.send({ success: true, message: 'Webhook received' });
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  return app;
}

export const handler = async (event: any, context: any) => {
  if (!cachedHandler) {
    const app = await buildApp();
    await app.ready();
    cachedHandler = serverless(app.server);
  }
  return cachedHandler(event, context);
};
