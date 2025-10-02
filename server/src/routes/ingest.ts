import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabaseAdmin } from '../db/connection.js';
import { calculateScore } from '../scoring.js';
import { normalizeAddress, createCanonicalKey } from '../utils/normalize.js';

const adminToken = process.env.ADMIN_TOKEN_NEW || 'secure-admin-token-12345';

export async function ingestRoutes(fastify: FastifyInstance) {
  fastify.post('/api/ingest/firecrawl', async (request, reply) => {
    const token = request.headers['x-admin-token'];
    if (token !== adminToken) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const itemSchema = z.object({
      source: z.string(),
      permitNumber: z.string().optional(),
      issueDate: z.string().optional(),
      status: z.string().optional(),
      permitType: z.string().optional(),
      rawAddress: z.string(),
      contractorName: z.string().optional(),
      estValue: z.number().optional(),
      lotAcres: z.number().optional(),
      yearBuilt: z.number().optional(),
    });

    const bodySchema = z.array(itemSchema);
    const items = bodySchema.parse(request.body);

    const results = [];

    for (const item of items) {
      const normalized = normalizeAddress(item.rawAddress);
      const canonicalKey = createCanonicalKey(normalized.street, normalized.city, normalized.zip);
      const score = calculateScore({
        lotAcres: item.lotAcres,
        issueDate: item.issueDate,
        estValue: item.estValue,
        yearBuilt: item.yearBuilt,
        status: item.status,
      });

      const { data, error } = await supabaseAdmin
        .from('leads')
        .upsert(
          {
            canonical_key: canonicalKey,
            source: item.source,
            kind: 'permit',
            permit_number: item.permitNumber || null,
            issue_date: item.issueDate || null,
            status: item.status || null,
            permit_type: item.permitType || null,
            raw_address: item.rawAddress,
            street: normalized.street,
            city: normalized.city,
            state: normalized.state,
            zip: normalized.zip,
            contractor_name: item.contractorName || null,
            est_value: item.estValue || null,
            year_built: item.yearBuilt || null,
            lot_acres: item.lotAcres || null,
            score,
            last_seen: new Date().toISOString(),
          },
          {
            onConflict: 'canonical_key',
          }
        )
        .select()
        .single();

      if (!error && data) {
        results.push({ id: data.id, canonicalKey });
      }
    }

    reply.send({
      success: true,
      count: results.length,
      results,
    });
  });

  fastify.post('/api/ingest/n8n', async (request, reply) => {
    const token = request.headers['x-admin-token'];
    if (token !== adminToken) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const itemSchema = z.object({
      source: z.string(),
      kind: z.enum(['permit', 'builder', 'assessor', 'manual']),
      rawAddress: z.string(),
      street: z.string(),
      city: z.string(),
      state: z.string().default('NJ'),
      zip: z.string(),
      county: z.string().optional(),
      town: z.string().optional(),
      lotAcres: z.number().optional(),
      yearBuilt: z.number().optional(),
      status: z.string().optional(),
      issueDate: z.string().optional(),
      estValue: z.number().optional(),
      permitNumber: z.string().optional(),
      permitType: z.string().optional(),
      ownerName: z.string().optional(),
      contractorName: z.string().optional(),
      parcelId: z.string().optional(),
    });

    const bodySchema = z.array(itemSchema);
    const items = bodySchema.parse(request.body);

    const results = [];

    for (const item of items) {
      const canonicalKey = createCanonicalKey(item.street, item.city, item.zip);
      const score = calculateScore({
        lotAcres: item.lotAcres,
        issueDate: item.issueDate,
        estValue: item.estValue,
        yearBuilt: item.yearBuilt,
        status: item.status,
      });

      const { data, error } = await supabaseAdmin
        .from('leads')
        .upsert(
          {
            canonical_key: canonicalKey,
            source: item.source,
            kind: item.kind,
            permit_number: item.permitNumber || null,
            issue_date: item.issueDate || null,
            status: item.status || null,
            permit_type: item.permitType || null,
            raw_address: item.rawAddress,
            street: item.street,
            city: item.city,
            state: item.state,
            zip: item.zip,
            county: item.county || null,
            town: item.town || null,
            parcel_id: item.parcelId || null,
            owner_name: item.ownerName || null,
            contractor_name: item.contractorName || null,
            est_value: item.estValue || null,
            year_built: item.yearBuilt || null,
            lot_acres: item.lotAcres || null,
            score,
            last_seen: new Date().toISOString(),
          },
          {
            onConflict: 'canonical_key',
          }
        )
        .select()
        .single();

      if (!error && data) {
        results.push({ id: data.id, canonicalKey });
      }
    }

    reply.send({
      success: true,
      count: results.length,
      results,
    });
  });
}
