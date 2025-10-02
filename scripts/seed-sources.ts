import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import * as Papa from 'papaparse';
import * as fs from 'fs';
import * as path from 'path';

const TARGET_COUNTIES = [
  'Middlesex', 'Ocean', 'Camden', 'Somerset', 'Union', 'Morris', 'Mercer',
  'Hunterdon', 'Essex', 'Bergen', 'Gloucester', 'Burlington', 'Monmouth',
  'Warren', 'Passaic'
];

const PERMIT_PATHS = [
  '/building', '/building-department', '/building-dept', '/construction',
  '/construction-office', '/permits', '/permit', '/code-enforcement',
  '/department/building', '/departments/building', '/department/construction',
  '/departments/construction', '/planning-zoning', '/zoning',
  '/?s=permit', '/search?query=permit', '/_search?q=permit'
];

const APP_BASE_URL = process.env.APP_BASE_URL!;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN!;

type Municipality = {
  county: string;
  municipality: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-').trim();
}

function normalizeTown(town: string): string {
  return town
    .replace(/\s+(Township|Borough|City|Town|Village)$/i, '')
    .trim();
}

async function fetchWithTimeout(url: string, options: any = {}, timeout = 5000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return response;
  } catch (error) {
    clearTimeout(timer);
    throw error;
  }
}

async function downloadMunicipalitiesCSV(): Promise<Municipality[]> {
  const dataDir = path.join(process.cwd(), 'data');
  const csvPath = path.join(dataDir, 'nj_municipalities.csv');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(csvPath)) {
    console.log('Using cached nj_municipalities.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
    return parsed.data as Municipality[];
  }

  console.log('Downloading NJ municipalities CSV from state website...');
  const njLibraryUrl = 'https://www.njstatelib.org/research_library/new_jersey_resources/local_government/municipalities_counties/';

  try {
    const response = await fetchWithTimeout(njLibraryUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    let csvUrl = '';
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes('municipalities') && (href.endsWith('.csv') || href.includes('export'))) {
        csvUrl = href;
        return false;
      }
    });

    if (!csvUrl) {
      console.warn('Could not find CSV link, using fallback data');
      return generateFallbackMunicipalities();
    }

    if (!csvUrl.startsWith('http')) {
      csvUrl = new URL(csvUrl, njLibraryUrl).href;
    }

    const csvResponse = await fetchWithTimeout(csvUrl);
    const csvContent = await csvResponse.text();
    fs.writeFileSync(csvPath, csvContent);

    const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
    return parsed.data as Municipality[];
  } catch (error) {
    console.error('Error downloading CSV:', error);
    return generateFallbackMunicipalities();
  }
}

function generateFallbackMunicipalities(): Municipality[] {
  const munis: Municipality[] = [];
  const counties = TARGET_COUNTIES;
  const suffixes = ['Township', 'Borough', 'City'];

  for (const county of counties) {
    for (let i = 1; i <= 3; i++) {
      const suffix = suffixes[i % 3];
      munis.push({
        county,
        municipality: `Sample ${i} ${suffix}`
      });
    }
  }

  return munis;
}

async function findMunicipalWebsite(town: string, county: string): Promise<string | null> {
  const cleanTown = normalizeTown(town).toLowerCase().replace(/\s+/g, '');
  const cleanCounty = county.toLowerCase().replace(/\s+/g, '');

  const suffixes = ['', 'township', 'city', 'boro', 'borough', 'nj'];
  const tlds = ['nj.gov', 'org', 'com', 'net', 'us'];

  const candidates: string[] = [];

  for (const suffix of suffixes) {
    for (const tld of tlds) {
      const domain = suffix ? `${cleanTown}${suffix}.${tld}` : `${cleanTown}.${tld}`;
      candidates.push(`https://${domain}`);
      candidates.push(`http://${domain}`);
    }
  }

  candidates.push(`https://${cleanTown}${cleanCounty}.org`);
  candidates.push(`https://${cleanTown}${cleanCounty}.com`);
  candidates.push(`http://${cleanTown}${cleanCounty}.org`);
  candidates.push(`http://${cleanTown}${cleanCounty}.com`);

  for (const url of candidates) {
    try {
      const response = await fetchWithTimeout(url, { method: 'HEAD' }, 5000);
      if (response.ok) {
        console.log(`  ✓ Found base URL: ${url}`);
        return url;
      }
    } catch (error) {
    }
    await sleep(200);
  }

  return null;
}

async function findPermitPage(baseUrl: string): Promise<string | null> {
  for (const path of PERMIT_PATHS) {
    const url = new URL(path, baseUrl).href;
    try {
      const response = await fetchWithTimeout(url, { method: 'GET' }, 5000);
      if (response.ok) {
        const html = await response.text();
        const text = html.toLowerCase();
        if (
          text.includes('permit') ||
          text.includes('construction') ||
          text.includes('building') ||
          text.includes('ucc') ||
          text.includes('zoning') ||
          text.includes('code')
        ) {
          console.log(`  ✓ Found permit page: ${url}`);
          return url;
        }
      }
    } catch (error) {
    }
    await sleep(500);
  }

  return null;
}

async function upsertSource(source: {
  name: string;
  slug: string;
  url: string;
  type: string;
  county: string;
  town: string;
  active: boolean;
}): Promise<void> {
  try {
    const response = await fetch(`${APP_BASE_URL}/api/ingest/sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': ADMIN_TOKEN,
      },
      body: JSON.stringify(source),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    console.log(`  ✓ Upserted source: ${source.name}`);
  } catch (error) {
    console.error(`  ✗ Failed to upsert source: ${error}`);
    throw error;
  }
}

async function run() {
  console.log('='.repeat(60));
  console.log('NJ Municipal Permit Pages - Source Seeder');
  console.log('='.repeat(60));
  console.log(`App Base URL: ${APP_BASE_URL}`);
  console.log('='.repeat(60));

  const municipalities = await downloadMunicipalitiesCSV();
  const filtered = municipalities.filter(m =>
    TARGET_COUNTIES.includes(m.county)
  );

  console.log(`\nFound ${filtered.length} municipalities in target counties\n`);

  const misses: any[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const muni of filtered) {
    const { county, municipality } = muni;
    const cleanTown = normalizeTown(municipality);
    const slug = slugify(`${cleanTown}-permits`);

    console.log(`\nProcessing: ${municipality}, ${county}`);

    const baseUrl = await findMunicipalWebsite(municipality, county);

    if (!baseUrl) {
      console.log(`  ✗ Could not find base website`);
      misses.push({
        county,
        town: municipality,
        baseTried: 'multiple',
        reason: 'base URL not found',
      });
      failCount++;
      continue;
    }

    const permitUrl = await findPermitPage(baseUrl);

    if (!permitUrl) {
      console.log(`  ✗ Could not find permit page`);
      misses.push({
        county,
        town: municipality,
        baseTried: baseUrl,
        reason: 'permit page not found',
      });
      failCount++;
      continue;
    }

    try {
      await upsertSource({
        name: `${cleanTown} Permits`,
        slug,
        url: permitUrl,
        type: 'permit',
        county,
        town: cleanTown,
        active: true,
      });
      successCount++;
    } catch (error) {
      console.error(`  ✗ Error upserting source: ${error}`);
      misses.push({
        county,
        town: municipality,
        baseTried: baseUrl,
        reason: 'upsert failed',
      });
      failCount++;
    }

    await sleep(500);
  }

  if (misses.length > 0) {
    const missesPath = path.join(process.cwd(), 'data', 'seed-misses.csv');
    const csv = Papa.unparse(misses);
    fs.writeFileSync(missesPath, csv);
    console.log(`\nWrote ${misses.length} misses to ${missesPath}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Total municipalities processed: ${filtered.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log('='.repeat(60));
}

run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
