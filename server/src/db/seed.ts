import { supabase } from './connection.js';
import { slugify } from '../utils/normalize.js';
import { ALL_NJ_COUNTIES, ALL_NJ_TOWNS } from './comprehensive-areas.js';

const NJ_COUNTIES = ALL_NJ_COUNTIES;

const SOURCES = [
  {
    name: 'Freehold Township Permits',
    url: 'https://www.freeholdtownshipnj.gov/permits',
    type: 'permit',
    county: 'Monmouth',
    town: 'Freehold'
  },
  {
    name: 'Holmdel Township Building',
    url: 'https://www.holmdeltownship.com/permits',
    type: 'permit',
    county: 'Monmouth',
    town: 'Holmdel'
  },
  {
    name: 'Marlboro Township Permits',
    url: 'https://www.marlboro-nj.gov/building-permits',
    type: 'permit',
    county: 'Monmouth',
    town: 'Marlboro'
  },
  {
    name: 'Middletown Township Building Dept',
    url: 'https://www.middletownnj.org/building-permits',
    type: 'permit',
    county: 'Monmouth',
    town: 'Middletown'
  },
  {
    name: 'Howell Township Permits',
    url: 'https://www.twp.howell.nj.us/permits',
    type: 'permit',
    county: 'Monmouth',
    town: 'Howell'
  },
  {
    name: 'Colts Neck Township Permits',
    url: 'https://www.coltsneck.org/permits',
    type: 'permit',
    county: 'Monmouth',
    town: 'Colts Neck'
  },
  {
    name: 'Ocean County Clerk / Land Records',
    url: 'https://oclandrecords.co.ocean.nj.us',
    type: 'permit',
    county: 'Ocean',
    town: null
  },
  {
    name: 'Monmouth County Assessor Data',
    url: 'https://oprs.co.monmouth.nj.us',
    type: 'assessor',
    county: 'Monmouth',
    town: null
  },
  {
    name: 'Middlesex County Permits Portal',
    url: 'https://middlesexcountynj.gov/permits',
    type: 'permit',
    county: 'Middlesex',
    town: null
  },
  {
    name: 'Camden County Permits Portal',
    url: 'https://camdencounty.com/permits',
    type: 'permit',
    county: 'Camden',
    town: null
  },
  {
    name: 'Somerset County Building Dept',
    url: 'https://somersetcountynj.gov/building',
    type: 'permit',
    county: 'Somerset',
    town: null
  },
  {
    name: 'Union County Permit Records',
    url: 'https://ucnj.org/permits',
    type: 'permit',
    county: 'Union',
    town: null
  },
  {
    name: 'Morris County Construction Records',
    url: 'https://morriscountynj.gov/permits',
    type: 'permit',
    county: 'Morris',
    town: null
  },
  {
    name: 'Mercer County Building Dept',
    url: 'https://mercercounty.org/permits',
    type: 'permit',
    county: 'Mercer',
    town: null
  },
  {
    name: 'Hunterdon County Permit Office',
    url: 'https://co.hunterdon.nj.us/permits',
    type: 'permit',
    county: 'Hunterdon',
    town: null
  },
  {
    name: 'Essex County Permits',
    url: 'https://essexcountynj.org/permits',
    type: 'permit',
    county: 'Essex',
    town: null
  },
  {
    name: 'Bergen County Permit System',
    url: 'https://bergen.nj.gov/permits',
    type: 'permit',
    county: 'Bergen',
    town: null
  },
  {
    name: 'Gloucester County Building Dept',
    url: 'https://gloucestercountynj.gov/permits',
    type: 'permit',
    county: 'Gloucester',
    town: null
  },
  {
    name: 'Burlington County Permits',
    url: 'https://co.burlington.nj.us/permits',
    type: 'permit',
    county: 'Burlington',
    town: null
  },
  {
    name: 'Warren County Construction Office',
    url: 'https://warrencountynj.gov/permits',
    type: 'permit',
    county: 'Warren',
    town: null
  },
  {
    name: 'Passaic County Permit Data',
    url: 'https://passaiccountynj.gov/permits',
    type: 'permit',
    county: 'Passaic',
    town: null
  },
  {
    name: 'Toll Brothers NJ Communities',
    url: 'https://www.tollbrothers.com/luxury-homes/New-Jersey',
    type: 'builder',
    county: null,
    town: null
  }
];

const MOCK_LEADS = [
  {
    source: 'freehold-permits',
    kind: 'permit',
    permitNumber: '25-001234',
    issueDate: '2025-09-15',
    status: 'ISSUED',
    permitType: 'New SFD',
    rawAddress: '123 Wemrock Rd, Freehold, NJ 07728',
    contractorName: 'Premier Builders LLC',
    estValue: 750000,
    lotAcres: 0.35
  },
  {
    source: 'holmdel-permits',
    kind: 'permit',
    permitNumber: '25-000456',
    issueDate: '2025-08-22',
    status: 'CO',
    permitType: 'New Construction',
    rawAddress: '45 Oak Hill Rd, Holmdel, NJ 07733',
    contractorName: 'Landmark Homes',
    estValue: 920000,
    lotAcres: 0.42,
    yearBuilt: 2025
  },
  {
    source: 'monmouth-assessor',
    kind: 'assessor',
    rawAddress: '78 Main St, Marlboro, NJ 07746',
    county: 'Monmouth',
    town: 'Marlboro',
    lotAcres: 0.28,
    yearBuilt: 2025,
    status: 'FINAL',
    issueDate: '2025-09-01'
  },
  {
    source: 'freehold-permits',
    kind: 'permit',
    permitNumber: '25-002100',
    issueDate: '2025-07-10',
    status: 'ISSUED',
    permitType: 'Pool Construction',
    rawAddress: '234 Broad St, Freehold, NJ 07728',
    contractorName: 'Aqua Pools Inc',
    estValue: 85000,
    lotAcres: 0.15
  },
  {
    source: 'middletown-permits',
    kind: 'permit',
    permitNumber: '25-003456',
    issueDate: '2025-09-20',
    status: 'ISSUED',
    permitType: 'New SFD',
    rawAddress: '567 Kings Hwy, Middletown, NJ 07748',
    contractorName: 'Elite Construction',
    estValue: 680000,
    lotAcres: 0.38
  },
  {
    source: 'monmouth-assessor',
    kind: 'assessor',
    rawAddress: '890 Harmony Rd, Howell, NJ 07731',
    county: 'Monmouth',
    town: 'Howell',
    lotAcres: 0.52,
    yearBuilt: 2024,
    status: 'CO',
    issueDate: '2024-12-15',
    estValue: 810000
  },
  {
    source: 'builder-tollbrothers',
    kind: 'builder',
    rawAddress: '12 Estates Dr, Colts Neck, NJ 07722',
    county: 'Monmouth',
    town: 'Colts Neck',
    lotAcres: 0.75,
    yearBuilt: 2025,
    estValue: 1250000,
    status: 'ISSUED',
    issueDate: '2025-09-10'
  },
  {
    source: 'marlboro-permits',
    kind: 'permit',
    permitNumber: '25-001890',
    issueDate: '2025-08-05',
    status: 'ISSUED',
    permitType: 'Addition',
    rawAddress: '456 Route 79, Marlboro, NJ 07746',
    contractorName: 'HomeWorks Renovation',
    estValue: 125000,
    lotAcres: 0.22
  },
  {
    source: 'monmouth-assessor',
    kind: 'assessor',
    rawAddress: '321 Phalanx Rd, Colts Neck, NJ 07722',
    county: 'Monmouth',
    town: 'Colts Neck',
    lotAcres: 1.2,
    yearBuilt: 2025,
    estValue: 1450000,
    status: 'FINAL',
    issueDate: '2025-09-25'
  },
  {
    source: 'howell-permits',
    kind: 'permit',
    permitNumber: '25-004567',
    issueDate: '2025-09-18',
    status: 'ISSUED',
    permitType: 'New SFD',
    rawAddress: '789 Aldrich Rd, Howell, NJ 07731',
    contractorName: 'Modern Living Builders',
    estValue: 695000,
    lotAcres: 0.41
  }
];

async function seed() {
  try {
    console.log('Starting seed...');

    console.log('Seeding counties...');
    for (const county of NJ_COUNTIES) {
      await supabase.from('areas').upsert(
        {
          level: 'county',
          name: county,
          state: 'NJ',
          slug: slugify(county),
          active: true,
        },
        { onConflict: 'slug' }
      );
    }

    console.log('Seeding all NJ towns...');
    for (const [county, towns] of Object.entries(ALL_NJ_TOWNS)) {
      for (const town of towns) {
        await supabase.from('areas').upsert(
          {
            level: 'town',
            name: town,
            state: 'NJ',
            parent_county: county,
            slug: slugify(town),
            active: true,
          },
          { onConflict: 'slug' }
        );
      }
    }

    console.log('Seeding sources...');
    for (const source of SOURCES) {
      await supabase.from('sources').upsert(
        {
          name: source.name,
          slug: slugify(source.name),
          url: source.url,
          type: source.type,
          county: source.county,
          town: source.town,
          active: true,
        },
        { onConflict: 'slug' }
      );
    }

    console.log('Seeding mock leads...');
    for (const lead of MOCK_LEADS) {
      const normalized = normalizeAddressSimple(lead.rawAddress);
      const canonicalKey = createCanonicalKeySimple(normalized.street, normalized.city, normalized.zip);

      let score = 0;
      if (lead.lotAcres && lead.lotAcres >= 0.09) score += 2;
      if (lead.issueDate) {
        const daysSince = (Date.now() - new Date(lead.issueDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince <= 180) score += 2;
      }
      if ((lead.estValue && lead.estValue >= 500000) || (lead.yearBuilt && lead.yearBuilt >= 2024)) score += 1;
      if (lead.status && ['FINAL', 'CO', 'ISSUED'].includes(lead.status.toUpperCase())) score += 1;
      score = Math.min(score, 10);

      await supabase.from('leads').upsert(
        {
          source: lead.source,
          kind: lead.kind,
          permit_number: lead.permitNumber || null,
          issue_date: lead.issueDate || null,
          status: lead.status || null,
          permit_type: lead.permitType || null,
          raw_address: lead.rawAddress,
          street: normalized.street,
          city: normalized.city,
          state: normalized.state,
          zip: normalized.zip,
          county: lead.county || null,
          town: lead.town || null,
          contractor_name: lead.contractorName || null,
          est_value: lead.estValue || null,
          year_built: lead.yearBuilt || null,
          lot_acres: lead.lotAcres || null,
          score,
          canonical_key: canonicalKey,
          tags: [],
        },
        { onConflict: 'canonical_key' }
      );
    }

    console.log('Seed completed successfully!');
  } catch (err) {
    console.error('Seed error:', err);
    throw err;
  }
}

function normalizeAddressSimple(raw: string) {
  const parts = raw.split(',').map(p => p.trim());
  if (parts.length >= 3) {
    const stateZip = parts[2].split(' ').filter(p => p);
    return {
      street: parts[0],
      city: parts[1],
      state: stateZip[0] || 'NJ',
      zip: stateZip[1] || '00000'
    };
  }
  return { street: parts[0] || '', city: parts[1] || '', state: 'NJ', zip: '00000' };
}

function createCanonicalKeySimple(street: string, city: string, zip: string) {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${clean(street)}_${clean(city)}_${clean(zip)}`;
}

seed();
