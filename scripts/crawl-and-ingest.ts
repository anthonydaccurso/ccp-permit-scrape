import fetch from 'node-fetch';

type Source = {
  name: string;
  slug: string;
  url: string;
  type: 'permit' | 'assessor' | 'builder' | 'other';
  county?: string;
  town?: string;
  active: boolean;
};

const addrRe = /(\d{1,6})\s+([A-Za-z0-9.\- ]+),?\s*([A-Za-z.\- ]+),?\s*(NJ|NY|PA)\s+(\d{5})(?:-\d{4})?/i;
const slug = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

async function fetchSources(base: string): Promise<Source[]> {
  const r = await fetch(`${base}/api/sources`);
  if (!r.ok) throw new Error(`/api/sources ${r.status}`);
  const data = await r.json() as any[];
  return data.filter((s: any) => s.enabled);
}

function crawlBodyFor(src: Source) {
  if (src.slug === 'spring-lake-pdf') {
    return {
      url: src.url,
      pdf: true,
      extract: { mode: 'text' },
    };
  }

  return {
    url: src.url,
    includeHtml: true,
    javascript: true,
    extract: {
      mode: 'list',
      selectors: [{ name: 'rows', selector: 'table, .permit-list, .results table', type: 'elements' }],
      fields: [
        { name: 'issueDate', selector: 'td:nth-child(1), .col-date', type: 'text' },
        { name: 'permitNumber', selector: 'td:nth-child(2), .col-permit', type: 'text' },
        { name: 'rawAddress', selector: 'td:nth-child(3), .col-address', type: 'text' },
        { name: 'permitType', selector: 'td:nth-child(4), .col-type', type: 'text' },
        { name: 'status', selector: 'td:nth-child(5), .col-status', type: 'text' },
      ],
    },
  };
}

async function crawlOne(url: string, src: Source) {
  const body = crawlBodyFor(src);
  const r = await fetch('https://api.firecrawl.dev/v1/crawl', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`FireCrawl ${r.status}`);
  const j = (await r.json()) as any;
  return Array.isArray(j) ? j : j.items || j.data || [];
}

function normalizeRow(r: any, src: Source) {
  const raw = (r.rawAddress || r.address || '').trim();
  const m = addrRe.exec(raw);
  if (!m) return null;
  const [, num, streetName, city, state, zip] = m;
  const street = `${num} ${streetName}`.trim();
  const canonicalKey = slug(`${street} ${city} ${zip}`);

  let issueDate: string | null = null;
  if (r.issueDate) {
    const d = new Date(r.issueDate);
    if (!isNaN(d.getTime())) issueDate = d.toISOString();
  }

  return {
    source: src.slug,
    kind: 'permit',
    permitNumber: r.permitNumber ?? null,
    issueDate,
    status: r.status ?? null,
    permitType: r.permitType ?? null,
    rawAddress: raw,
    street,
    city: city.trim(),
    state: state.trim(),
    zip: zip.trim(),
    county: src.county ?? null,
    town: src.town ?? null,
    canonicalKey,
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    lat: null,
    lon: null,
  };
}

async function geocodeOne(lead: any) {
  if (!process.env.NOMINATIM_UA) return lead;
  const q = `${lead.street}, ${lead.city}, ${lead.state} ${lead.zip}`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { 'User-Agent': process.env.NOMINATIM_UA! } });
  const arr = (await r.json()) as any[];
  if (Array.isArray(arr) && arr[0]?.lat) {
    lead.lat = parseFloat(arr[0].lat);
    lead.lon = parseFloat(arr[0].lon);
  }
  await new Promise((res) => setTimeout(res, 1000));
  return lead;
}

async function postLeads(base: string, leads: any[]) {
  const r = await fetch(`${base}/api/ingest/firecrawl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': process.env.ADMIN_TOKEN!,
    },
    body: JSON.stringify(leads),
  });
  if (!r.ok) throw new Error(`ingest ${r.status}`);
  return r.json();
}

async function run() {
  const base = process.env.APP_BASE_URL!;
  const sources = await fetchSources(base);

  console.log('='.repeat(60));
  console.log('Custom Pool Pros - Crawl & Ingest');
  console.log('='.repeat(60));
  console.log(`App Base URL: ${base}`);
  console.log(`Geocoding: ${process.env.NOMINATIM_UA ? 'Enabled' : 'Disabled'}`);
  console.log(`FireCrawl API: ${process.env.FIRECRAWL_API_KEY ? 'Configured' : 'Not Configured'}`);
  console.log(`Found ${sources.length} active source(s)`);
  console.log('='.repeat(60));

  for (const src of sources) {
    try {
      console.log(`\nProcessing: ${src.name} (${src.url})`);
      const rows = await crawlOne(src.url, src);
      const cleaned: any[] = [];
      for (const r of rows) {
        const n = normalizeRow(r, src);
        if (n) cleaned.push(await geocodeOne(n));
      }
      if (cleaned.length) {
        await postLeads(base, cleaned);
        console.log(`✅ ${src.name}: posted ${cleaned.length} leads`);
      } else {
        console.log(`ℹ️ ${src.name}: no rows`);
      }
    } catch (e: any) {
      console.error(`⚠️ ${src.name} failed: ${e.message}`);
    }
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
