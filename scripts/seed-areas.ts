import fetch from 'node-fetch';
import * as Papa from 'papaparse';
import * as fs from 'fs';
import * as path from 'path';

const TARGET_COUNTIES = [
  'Middlesex', 'Ocean', 'Camden', 'Somerset', 'Union', 'Morris', 'Mercer',
  'Hunterdon', 'Essex', 'Bergen', 'Gloucester', 'Burlington', 'Monmouth',
  'Warren', 'Passaic'
];

const APP_BASE_URL = process.env.APP_BASE_URL!;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN_NEW!;

type Municipality = {
  county: string;
  municipality: string;
};

function normalizeTown(town: string): string {
  return town
    .replace(/\s+(Township|Borough|City|Town|Village)$/i, '')
    .trim();
}

async function getMunicipalities(): Promise<Municipality[]> {
  const csvPath = path.join(process.cwd(), 'data', 'nj_municipalities.csv');

  if (!fs.existsSync(csvPath)) {
    console.error('nj_municipalities.csv not found. Run seed:sources first.');
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
  return parsed.data as Municipality[];
}

async function upsertArea(area: { county: string; town: string }): Promise<void> {
  try {
    const response = await fetch(`${APP_BASE_URL}/api/ingest/areas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': ADMIN_TOKEN_NEW,
      },
      body: JSON.stringify(area),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    console.log(`  ✓ Upserted area: ${area.town}, ${area.county}`);
  } catch (error) {
    console.error(`  ✗ Failed to upsert area: ${error}`);
  }
}

async function run() {
  console.log('='.repeat(60));
  console.log('NJ Counties & Towns - Area Seeder');
  console.log('='.repeat(60));
  console.log(`App Base URL: ${APP_BASE_URL}`);
  console.log('='.repeat(60));

  const municipalities = await getMunicipalities();
  const filtered = municipalities.filter(m =>
    TARGET_COUNTIES.includes(m.county)
  );

  console.log(`\nFound ${filtered.length} municipalities in target counties\n`);

  const areas = new Map<string, Set<string>>();

  for (const muni of filtered) {
    const { county, municipality } = muni;
    const cleanTown = normalizeTown(municipality);

    if (!areas.has(county)) {
      areas.set(county, new Set());
    }
    areas.get(county)!.add(cleanTown);
  }

  let successCount = 0;

  for (const [county, towns] of areas.entries()) {
    console.log(`\nProcessing county: ${county} (${towns.size} towns)`);

    for (const town of towns) {
      await upsertArea({ county, town });
      successCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Total areas upserted: ${successCount}`);
  console.log(`Counties: ${areas.size}`);
  console.log('='.repeat(60));
}

run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
