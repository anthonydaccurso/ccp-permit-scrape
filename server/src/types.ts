export type LeadKind = 'permit' | 'builder' | 'assessor' | 'manual';
export type SourceType = 'permit' | 'assessor' | 'builder' | 'other';
export type AreaLevel = 'county' | 'town';

export interface Lead {
  id: string;
  source: string;
  kind: LeadKind;
  permitNumber?: string | null;
  issueDate?: string | null;
  status?: string | null;
  permitType?: string | null;
  rawAddress: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  county?: string | null;
  town?: string | null;
  parcelId?: string | null;
  ownerName?: string | null;
  contractorName?: string | null;
  estValue?: number | null;
  yearBuilt?: number | null;
  lotAcres?: number | null;
  lat?: number | null;
  lon?: number | null;
  score: number;
  canonicalKey: string;
  firstSeen: string;
  lastSeen: string;
  notes?: string | null;
  tags: string[];
}

export interface Area {
  id: string;
  level: AreaLevel;
  name: string;
  state: string;
  parentCounty?: string | null;
  slug: string;
  active: boolean;
}

export interface Source {
  id: string;
  name: string;
  slug: string;
  url: string;
  type: SourceType;
  county?: string | null;
  town?: string | null;
  active: boolean;
  lastRun?: string | null;
  lastStatus?: string | null;
}

export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function dbToLead(row: any): Lead {
  return {
    id: row.id,
    source: row.source,
    kind: row.kind,
    permitNumber: row.permit_number,
    issueDate: row.issue_date,
    status: row.status,
    permitType: row.permit_type,
    rawAddress: row.raw_address,
    street: row.street,
    city: row.city,
    state: row.state,
    zip: row.zip,
    county: row.county,
    town: row.town,
    parcelId: row.parcel_id,
    ownerName: row.owner_name,
    contractorName: row.contractor_name,
    estValue: row.est_value ? parseFloat(row.est_value) : null,
    yearBuilt: row.year_built,
    lotAcres: row.lot_acres ? parseFloat(row.lot_acres) : null,
    lat: row.lat ? parseFloat(row.lat) : null,
    lon: row.lon ? parseFloat(row.lon) : null,
    score: row.score,
    canonicalKey: row.canonical_key,
    firstSeen: row.first_seen,
    lastSeen: row.last_seen,
    notes: row.notes,
    tags: row.tags || [],
  };
}

export function dbToArea(row: any): Area {
  return {
    id: row.id,
    level: row.level,
    name: row.name,
    state: row.state,
    parentCounty: row.parent_county,
    slug: row.slug,
    active: row.active,
  };
}

export function dbToSource(row: any): Source {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    url: row.url,
    type: row.type,
    county: row.county,
    town: row.town,
    active: row.active,
    lastRun: row.last_run,
    lastStatus: row.last_status,
  };
}
