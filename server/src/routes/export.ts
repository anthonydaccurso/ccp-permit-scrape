import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase } from '../db/connection.js';

export async function exportRoutes(fastify: FastifyInstance) {
  fastify.get('/api/export.csv', async (request, reply) => {
    const querySchema = z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      minScore: z.string().optional(),
      county: z.string().optional(),
      town: z.string().optional(),
      source: z.string().optional(),
    });

    const params = querySchema.parse(request.query);

    let query = supabase
      .from('leads')
      .select('street,city,state,zip,county,town,score,status,issue_date,permit_type,contractor_name,lot_acres,est_value,source,last_seen');

    if (!params.dateFrom && !params.dateTo) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query = query.gte('issue_date', sevenDaysAgo.toISOString().split('T')[0]);
    } else {
      if (params.dateFrom) {
        query = query.gte('issue_date', params.dateFrom);
      }
      if (params.dateTo) {
        query = query.lte('issue_date', params.dateTo);
      }
    }

    if (params.minScore) {
      query = query.gte('score', parseInt(params.minScore));
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

    query = query.order('score', { ascending: false }).order('issue_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return reply.status(500).send({ error: error.message });
    }

    const headers = [
      'street', 'city', 'state', 'zip', 'county', 'town', 'score', 'status',
      'issueDate', 'permitType', 'contractorName', 'lotAcres', 'estValue',
      'source', 'lastSeen'
    ];

    const csvRows = [headers.join(',')];

    for (const row of data || []) {
      const values = [
        escapeCsv(row.street),
        escapeCsv(row.city),
        escapeCsv(row.state),
        escapeCsv(row.zip),
        escapeCsv(row.county),
        escapeCsv(row.town),
        row.score,
        escapeCsv(row.status),
        row.issue_date || '',
        escapeCsv(row.permit_type),
        escapeCsv(row.contractor_name),
        row.lot_acres || '',
        row.est_value || '',
        escapeCsv(row.source),
        row.last_seen || ''
      ];
      csvRows.push(values.join(','));
    }

    const csv = csvRows.join('\n');

    reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', `attachment; filename="leads-export-${new Date().toISOString().split('T')[0]}.csv"`)
      .send(csv);
  });
}

function escapeCsv(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
