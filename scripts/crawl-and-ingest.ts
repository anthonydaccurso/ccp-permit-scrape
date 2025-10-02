import fetch from 'node-fetch';

interface Source {
  id: string;
  name: string;
  slug: string;
  url: string;
  type: string;
  county: string | null;
  town: string | null;
  active: boolean;
}

interface Lead {
  source: string;
  permitNumber?: string;
  issueDate?: string;
  status?: string;
  permitType?: string;
  rawAddress: string;
  contractorName?: string;
  estValue?: number;
  lotAcres?: number;
  yearBuilt?: number;
  lat?: number;
  lon?: number;
}

interface FireCrawlResponse {
  success: boolean;
  data?: any;
  error?: string;
}

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'secure-admin-token-12345';
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const NOMINATIM_UA = process.env.NOMINATIM_UA;

const ADDRESS_REGEX = /^(\d{1,6})\s+([A-Za-z0-9.\- ]+),?\s*([A-Za-z.\- ]+),?\s*(NJ|NY|PA)\s+(\d{5})(?:-\d{4})?/i;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  if (!NOMINATIM_UA) {
    return null;
  }

  try {
    await sleep(1000);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': NOMINATIM_UA,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as any[];
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    console.error(`Geocoding failed for ${address}:`, error);
  }

  return null;
}

function normalizeAddress(raw: string): { street: string; city: string; state: string; zip: string } {
  const match = raw.match(ADDRESS_REGEX);
  if (match) {
    return {
      street: `${match[1]} ${match[2]}`.trim(),
      city: match[3].trim(),
      state: match[4].toUpperCase(),
      zip: match[5],
    };
  }

  const parts = raw.split(',').map(p => p.trim());
  if (parts.length >= 3) {
    const stateZip = parts[2].split(' ').filter(p => p);
    return {
      street: parts[0],
      city: parts[1],
      state: stateZip[0] || 'NJ',
      zip: stateZip[1] || '00000',
    };
  }

  return {
    street: parts[0] || raw,
    city: parts[1] || 'Unknown',
    state: 'NJ',
    zip: '00000',
  };
}

async function getSources(): Promise<Source[]> {
  try {
    const response = await fetch(`${APP_BASE_URL}/api/sources`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sources: ${response.statusText}`);
    }
    const sources = await response.json() as Source[];
    return sources.filter(s => s.active);
  } catch (error) {
    console.error('Error fetching sources:', error);
    return [];
  }
}

async function crawlWithFireCrawl(source: Source): Promise<any[]> {
  if (!FIRECRAWL_API_KEY) {
    console.error('FIRECRAWL_API_KEY not set, skipping crawl');
    return [];
  }

  const requestBody = {
    url: source.url,
    includeHtml: true,
    javascript: true,
    extract: {
      mode: 'list',
      selectors: [
        {
          name: 'rows',
          selector: 'table, .permit-list, .results table',
          type: 'elements',
        },
      ],
      fields: [
        { name: 'issueDate', selector: 'td:nth-child(1), .col-date', type: 'text' },
        { name: 'permitNumber', selector: 'td:nth-child(2), .col-permit', type: 'text' },
        { name: 'rawAddress', selector: 'td:nth-child(3), .col-address', type: 'text' },
        { name: 'permitType', selector: 'td:nth-child(4), .col-type', type: 'text' },
        { name: 'status', selector: 'td:nth-child(5), .col-status', type: 'text' },
      ],
    },
  };

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`FireCrawl API error for ${source.name}: ${response.status} ${errorText}`);
      return [];
    }

    const result = await response.json() as FireCrawlResponse;

    if (!result.success || !result.data) {
      console.log(`No data returned from FireCrawl for ${source.name}`);
      return [];
    }

    return Array.isArray(result.data) ? result.data : [];
  } catch (error) {
    console.error(`Error crawling ${source.name}:`, error);
    return [];
  }
}

async function processSource(source: Source): Promise<number> {
  console.log(`\nProcessing: ${source.name} (${source.url})`);

  const rawData = await crawlWithFireCrawl(source);

  if (!rawData || rawData.length === 0) {
    console.log(`  ⚠ No rows found for ${source.name}`);
    return 0;
  }

  const leads: Lead[] = [];

  for (const row of rawData) {
    if (!row.rawAddress || typeof row.rawAddress !== 'string') {
      continue;
    }

    const normalized = normalizeAddress(row.rawAddress);

    const lead: Lead = {
      source: source.slug,
      permitNumber: row.permitNumber || undefined,
      issueDate: row.issueDate ? new Date(row.issueDate).toISOString().split('T')[0] : undefined,
      status: row.status || undefined,
      permitType: row.permitType || undefined,
      rawAddress: row.rawAddress,
      contractorName: row.contractorName || undefined,
      estValue: row.estValue ? parseFloat(row.estValue) : undefined,
      lotAcres: row.lotAcres ? parseFloat(row.lotAcres) : undefined,
      yearBuilt: row.yearBuilt ? parseInt(row.yearBuilt) : undefined,
    };

    if (NOMINATIM_UA) {
      const coords = await geocodeAddress(row.rawAddress);
      if (coords) {
        lead.lat = coords.lat;
        lead.lon = coords.lon;
      }
    }

    leads.push(lead);
  }

  if (leads.length === 0) {
    console.log(`  ⚠ No valid leads extracted for ${source.name}`);
    return 0;
  }

  try {
    const response = await fetch(`${APP_BASE_URL}/api/ingest/firecrawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': ADMIN_TOKEN,
      },
      body: JSON.stringify(leads),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  ✗ Failed to ingest leads: ${response.status} ${errorText}`);
      return 0;
    }

    const result = await response.json() as { success: boolean; count: number };
    console.log(`  ✓ Posted ${result.count} leads for ${source.name}`);
    return result.count;
  } catch (error) {
    console.error(`  ✗ Error posting leads for ${source.name}:`, error);
    return 0;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Custom Pool Pros - Crawl & Ingest');
  console.log('='.repeat(60));
  console.log(`App Base URL: ${APP_BASE_URL}`);
  console.log(`Geocoding: ${NOMINATIM_UA ? 'Enabled' : 'Disabled'}`);
  console.log(`FireCrawl API: ${FIRECRAWL_API_KEY ? 'Configured' : 'Not Configured'}`);
  console.log('='.repeat(60));

  const sources = await getSources();

  if (sources.length === 0) {
    console.log('\n⚠ No active sources found. Exiting.');
    process.exit(0);
  }

  console.log(`\nFound ${sources.length} active source(s)\n`);

  let totalLeads = 0;
  let successCount = 0;
  let failureCount = 0;

  for (const source of sources) {
    try {
      const count = await processSource(source);
      totalLeads += count;
      if (count > 0) {
        successCount++;
      } else {
        failureCount++;
      }
    } catch (error) {
      console.error(`  ✗ Error processing ${source.name}:`, error);
      failureCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Total sources processed: ${sources.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed or empty: ${failureCount}`);
  console.log(`Total leads ingested: ${totalLeads}`);
  console.log('='.repeat(60));

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
