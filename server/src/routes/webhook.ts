import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase } from '../db/supabase-client';

const WebhookLeadSchema = z.object({
  source: z.string(),
  kind: z.enum(['permit', 'builder', 'assessor', 'manual']).default('permit'),
  permitNumber: z.string().optional(),
  issueDate: z.string().optional(),
  status: z.string().optional(),
  permitType: z.string().optional(),
  rawAddress: z.string(),
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  county: z.string().optional(),
  town: z.string().optional(),
  parcelId: z.string().optional(),
  ownerName: z.string().optional(),
  contractorName: z.string().optional(),
  estValue: z.number().optional(),
  yearBuilt: z.number().optional(),
  lotAcres: z.number().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function registerWebhookRoutes(fastify: FastifyInstance) {

  fastify.post('/webhook/n8n/leads', async (request, reply) => {
    try {
      const data = WebhookLeadSchema.parse(request.body);

      const canonicalKey = `${data.street}|${data.city}|${data.state}|${data.zip}`.toLowerCase();

      const { data: existingLead, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('canonical_key', canonicalKey)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      const now = new Date().toISOString();

      if (existingLead) {
        const { error: updateError } = await supabase
          .from('leads')
          .update({
            last_seen: now,
            permit_number: data.permitNumber || existingLead.permit_number,
            issue_date: data.issueDate || existingLead.issue_date,
            status: data.status || existingLead.status,
            permit_type: data.permitType || existingLead.permit_type,
            county: data.county || existingLead.county,
            town: data.town || existingLead.town,
            parcel_id: data.parcelId || existingLead.parcel_id,
            owner_name: data.ownerName || existingLead.owner_name,
            contractor_name: data.contractorName || existingLead.contractor_name,
            est_value: data.estValue ?? existingLead.est_value,
            year_built: data.yearBuilt ?? existingLead.year_built,
            lot_acres: data.lotAcres ?? existingLead.lot_acres,
            lat: data.lat ?? existingLead.lat,
            lon: data.lon ?? existingLead.lon,
            notes: data.notes || existingLead.notes,
            tags: data.tags || existingLead.tags,
          })
          .eq('id', existingLead.id);

        if (updateError) {
          throw updateError;
        }

        return reply.send({
          success: true,
          action: 'updated',
          id: existingLead.id,
        });
      } else {
        const { data: newLead, error: insertError } = await supabase
          .from('leads')
          .insert([{
            source: data.source,
            kind: data.kind,
            permit_number: data.permitNumber,
            issue_date: data.issueDate,
            status: data.status,
            permit_type: data.permitType,
            raw_address: data.rawAddress,
            street: data.street,
            city: data.city,
            state: data.state,
            zip: data.zip,
            county: data.county,
            town: data.town,
            parcel_id: data.parcelId,
            owner_name: data.ownerName,
            contractor_name: data.contractorName,
            est_value: data.estValue,
            year_built: data.yearBuilt,
            lot_acres: data.lotAcres,
            lat: data.lat,
            lon: data.lon,
            score: 5,
            canonical_key: canonicalKey,
            first_seen: now,
            last_seen: now,
            notes: data.notes,
            tags: data.tags || [],
          }])
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        return reply.send({
          success: true,
          action: 'created',
          id: newLead.id,
        });
      }
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Invalid request',
      });
    }
  });

  fastify.post('/webhook/n8n/batch', async (request, reply) => {
    try {
      const { leads } = request.body as { leads: any[] };

      if (!Array.isArray(leads) || leads.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'leads array is required and must not be empty',
        });
      }

      const results = [];

      for (const leadData of leads) {
        try {
          const data = WebhookLeadSchema.parse(leadData);
          const canonicalKey = `${data.street}|${data.city}|${data.state}|${data.zip}`.toLowerCase();

          const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('canonical_key', canonicalKey)
            .maybeSingle();

          const now = new Date().toISOString();

          if (existingLead) {
            await supabase
              .from('leads')
              .update({
                last_seen: now,
                permit_number: data.permitNumber,
                issue_date: data.issueDate,
                status: data.status,
                permit_type: data.permitType,
                county: data.county,
                town: data.town,
                contractor_name: data.contractorName,
                est_value: data.estValue,
                lot_acres: data.lotAcres,
              })
              .eq('id', existingLead.id);

            results.push({ action: 'updated', id: existingLead.id });
          } else {
            const { data: newLead } = await supabase
              .from('leads')
              .insert([{
                source: data.source,
                kind: data.kind,
                permit_number: data.permitNumber,
                issue_date: data.issueDate,
                status: data.status,
                permit_type: data.permitType,
                raw_address: data.rawAddress,
                street: data.street,
                city: data.city,
                state: data.state,
                zip: data.zip,
                county: data.county,
                town: data.town,
                contractor_name: data.contractorName,
                est_value: data.estValue,
                lot_acres: data.lotAcres,
                score: 5,
                canonical_key: canonicalKey,
                first_seen: now,
                last_seen: now,
                tags: data.tags || [],
              }])
              .select('id')
              .single();

            results.push({ action: 'created', id: newLead?.id });
          }
        } catch (err: any) {
          results.push({ action: 'error', error: err.message });
        }
      }

      return reply.send({
        success: true,
        processed: results.length,
        results,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Server error',
      });
    }
  });

  fastify.get('/webhook/health', async (request, reply) => {
    return reply.send({
      status: 'ok',
      service: 'cpp-permit-lookup-webhooks',
      timestamp: new Date().toISOString(),
    });
  });
}
