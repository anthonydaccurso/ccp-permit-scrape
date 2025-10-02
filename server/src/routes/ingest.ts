// server/src/routes/ingest.ts
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { supabaseAdmin } from '../db/connection.js'
import { calculateScore } from '../scoring.js'
import { normalizeAddress, createCanonicalKey } from '../utils/normalize.js'

/**
 * Admin token: ONLY from env (never hardcode).
 * Support a couple of env names so you can rotate safely in Netlify.
 */
function getAdminToken(): string {
  const candidates = [
    process.env.ADMIN_TOKEN?.trim(),
    process.env.ADMIN_TOKEN_NEW?.trim(),
    process.env.ADMIN_TOKEN_V2?.trim()
  ].filter(Boolean) as string[]
  if (!candidates.length) throw new Error('ADMIN_TOKEN is not set in environment')
  return candidates[0]!
}
const ADMIN_TOKEN = getAdminToken()

/**
 * Common auth guard. Rejects if x-admin-token mismatch.
 */
function requireAdmin(req: any): void {
  const token = (req.headers['x-admin-token'] ?? '').toString().trim()
  if (!token || token !== ADMIN_TOKEN) {
    const err: any = new Error('Unauthorized')
    err.statusCode = 401
    throw err
  }
}

/**
 * Schemas
 */
const FirecrawlItem = z.object({
  source: z.string().min(1),
  permitNumber: z.string().optional(),
  issueDate: z.string().optional(), // ISO or parseable
  status: z.string().optional(),
  permitType: z.string().optional(),
  rawAddress: z.string().min(3),
  contractorName: z.string().optional(),
  estValue: z.number().optional(),
  lotAcres: z.number().optional(),
  yearBuilt: z.number().optional()
})
const FirecrawlBody = z.array(FirecrawlItem)

const N8nItem = z.object({
  source: z.string().min(1),
  kind: z.enum(['permit', 'builder', 'assessor', 'manual']).default('permit'),
  rawAddress: z.string().min(3),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().default('NJ'),
  zip: z.string().min(3),
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
  lat: z.number().optional(),
  lon: z.number().optional()
})
const N8nBody = z.array(N8nItem)

const SourceItem = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  url: z.string().url(),
  type: z.enum(['permit', 'assessor', 'builder', 'other']).default('permit'),
  county: z.string().optional(),
  town: z.string().optional(),
  active: z.boolean().default(true),
  last_run: z.string().optional(),     // ISO
  last_status: z.string().optional()
})
const SourcesBody = z.array(SourceItem)

/**
 * Helpers
 */
function toIsoOrNull(v?: string): string | null {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

export async function ingestRoutes(app: FastifyInstance) {
  /**
   * Quick health for admin wiring
   */
  app.get('/api/ingest/health', async (_req, reply) => {
    const hasAdmin = !!ADMIN_TOKEN
    // minimal DB ping: list 0 rows to ensure table exists and service key works
    const { error } = await supabaseAdmin.from('leads').select('id').limit(1)
    reply.send({
      ok: !error,
      db: error ? { ok: false, message: error.message } : { ok: true },
      admin: hasAdmin
    })
  })

  /**
   * POST /api/ingest/firecrawl
   * Accepts rows from FireCrawl pipeline (rawAddress, few fields).
   * Normalizes address + computes canonical_key, score, upserts into leads.
   */
  app.post('/api/ingest/firecrawl', async (request, reply) => {
    try {
      requireAdmin(request)
      const items = FirecrawlBody.parse(request.body)

      if (!items.length) return reply.send({ success: true, count: 0, results: [] })

      const nowIso = new Date().toISOString()
      const payload = items.map((item) => {
        const norm = normalizeAddress(item.rawAddress)
        const canonicalKey = createCanonicalKey(norm.street, norm.city, norm.zip)
        const issueIso = toIsoOrNull(item.issueDate)
        const score = calculateScore({
          lotAcres: item.lotAcres,
          issueDate: issueIso ?? undefined,
          estValue: item.estValue,
          yearBuilt: item.yearBuilt,
          status: item.status
        })
        return {
          canonical_key: canonicalKey,
          source: item.source,
          kind: 'permit',
          permit_number: item.permitNumber ?? null,
          issue_date: issueIso,
          status: item.status ?? null,
          permit_type: item.permitType ?? null,
          raw_address: item.rawAddress,
          street: norm.street,
          city: norm.city,
          state: norm.state,
          zip: norm.zip,
          contractor_name: item.contractorName ?? null,
          est_value: item.estValue ?? null,
          year_built: item.yearBuilt ?? null,
          lot_acres: item.lotAcres ?? null,
          score,
          first_seen: nowIso,
          last_seen: nowIso
        }
      })

      const { data, error } = await supabaseAdmin
        .from('leads')
        .upsert(payload, { onConflict: 'canonical_key' })
        .select('id, canonical_key')

      if (error) return reply.code(500).send({ success: false, error: error.message })

      reply.send({
        success: true,
        count: data?.length ?? 0,
        results: data ?? []
      })
    } catch (e: any) {
      const status = e.statusCode ?? 500
      reply.code(status).send({ success: false, error: e?.message ?? 'server_error' })
    }
  })

  /**
   * POST /api/ingest/n8n
   * Accepts richer, already-normalized rows (from n8n or other scrapers).
   */
  app.post('/api/ingest/n8n', async (request, reply) => {
    try {
      requireAdmin(request)
      const items = N8nBody.parse(request.body)
      if (!items.length) return reply.send({ success: true, count: 0, results: [] })

      const nowIso = new Date().toISOString()
      const payload = items.map((item) => {
        const canonicalKey = createCanonicalKey(item.street, item.city, item.zip)
        const issueIso = toIsoOrNull(item.issueDate)
        const score = calculateScore({
          lotAcres: item.lotAcres,
          issueDate: issueIso ?? undefined,
          estValue: item.estValue,
          yearBuilt: item.yearBuilt,
          status: item.status
        })
        return {
          canonical_key: canonicalKey,
          source: item.source,
          kind: item.kind ?? 'permit',
          permit_number: item.permitNumber ?? null,
          issue_date: issueIso,
          status: item.status ?? null,
          permit_type: item.permitType ?? null,
          raw_address: item.rawAddress,
          street: item.street,
          city: item.city,
          state: item.state ?? 'NJ',
          zip: item.zip,
          county: item.county ?? null,
          town: item.town ?? null,
          parcel_id: item.parcelId ?? null,
          owner_name: item.ownerName ?? null,
          contractor_name: item.contractorName ?? null,
          est_value: item.estValue ?? null,
          year_built: item.yearBuilt ?? null,
          lot_acres: item.lotAcres ?? null,
          lat: item.lat ?? null,
          lon: item.lon ?? null,
          score,
          first_seen: nowIso,
          last_seen: nowIso
        }
      })

      const { data, error } = await supabaseAdmin
        .from('leads')
        .upsert(payload, { onConflict: 'canonical_key' })
        .select('id, canonical_key')

      if (error) return reply.code(500).send({ success: false, error: error.message })

      reply.send({
        success: true,
        count: data?.length ?? 0,
        results: data ?? []
      })
    } catch (e: any) {
      const status = e.statusCode ?? 500
      reply.code(status).send({ success: false, error: e?.message ?? 'server_error' })
    }
  })

  /**
   * POST /api/ingest/sources
   * Upsert crawl sources (permit/assessor/builder pages).
   */
  app.post('/api/ingest/sources', async (request, reply) => {
    try {
      requireAdmin(request)
      const items = SourcesBody.parse(request.body)
      if (!items.length) return reply.send({ success: true, count: 0, results: [] })

      const payload = items.map((s) => ({
        name: s.name,
        slug: s.slug,
        url: s.url,
        type: s.type ?? 'permit',
        county: s.county ?? null,
        town: s.town ?? null,
        active: s.active ?? true,
        last_run: toIsoOrNull(s.last_run),
        last_status: s.last_status ?? null
      }))

      const { data, error } = await supabaseAdmin
        .from('sources')
        .upsert(payload, { onConflict: 'slug' })
        .select('id, slug')

      if (error) return reply.code(500).send({ success: false, error: error.message })

      reply.send({
        success: true,
        count: data?.length ?? 0,
        results: data ?? []
      })
    } catch (e: any) {
      const status = e.statusCode ?? 500
      reply.code(status).send({ success: false, error: e?.message ?? 'server_error' })
    }
  })
}