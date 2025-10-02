/*
  # New Homes Lead Finder - Initial Schema

  ## New Tables
    - `areas`
      - `id` (uuid, primary key)
      - `level` (text, county or town)
      - `name` (text, area name)
      - `state` (text, always 'NJ')
      - `parent_county` (text, nullable, for towns)
      - `slug` (text, unique, URL-friendly)
      - `active` (boolean, default true)
      - `created_at` (timestamptz)

    - `sources`
      - `id` (uuid, primary key)
      - `name` (text, source display name)
      - `slug` (text, unique, URL-friendly)
      - `url` (text, source URL)
      - `type` (text, permit/assessor/builder/other)
      - `county` (text, nullable)
      - `town` (text, nullable)
      - `active` (boolean, default true)
      - `last_run` (timestamptz, nullable)
      - `last_status` (text, nullable)
      - `created_at` (timestamptz)

    - `leads`
      - `id` (uuid, primary key)
      - `source` (text, source identifier)
      - `kind` (text, permit/builder/assessor/manual)
      - `permit_number` (text, nullable)
      - `issue_date` (date, nullable)
      - `status` (text, nullable)
      - `permit_type` (text, nullable)
      - `raw_address` (text)
      - `street` (text)
      - `city` (text)
      - `state` (text)
      - `zip` (text)
      - `county` (text, nullable)
      - `town` (text, nullable)
      - `parcel_id` (text, nullable)
      - `owner_name` (text, nullable)
      - `contractor_name` (text, nullable)
      - `est_value` (numeric, nullable)
      - `year_built` (integer, nullable)
      - `lot_acres` (numeric, nullable)
      - `lat` (numeric, nullable)
      - `lon` (numeric, nullable)
      - `score` (integer, default 0)
      - `canonical_key` (text, unique, for deduplication)
      - `first_seen` (timestamptz, default now())
      - `last_seen` (timestamptz, default now())
      - `notes` (text, nullable)
      - `tags` (text[], default array)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  ## Security
    - Enable RLS on all tables
    - Add policies for authenticated access
    - Public read access for leads (for webhook ingestion)

  ## Indexes
    - Unique index on leads.canonical_key
    - Index on leads.score for filtering
    - Index on leads.issue_date for date range queries
    - Index on leads.county and leads.town for area filtering
    - Index on areas.slug and sources.slug for lookups

  ## Functions
    - upsert_lead: Function to insert or update lead by canonical_key
*/

CREATE TABLE IF NOT EXISTS areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL CHECK (level IN ('county', 'town')),
  name text NOT NULL,
  state text NOT NULL DEFAULT 'NJ',
  parent_county text,
  slug text UNIQUE NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  url text NOT NULL,
  type text NOT NULL CHECK (type IN ('permit', 'assessor', 'builder', 'other')),
  county text,
  town text,
  active boolean DEFAULT true,
  last_run timestamptz,
  last_status text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('permit', 'builder', 'assessor', 'manual')),
  permit_number text,
  issue_date date,
  status text,
  permit_type text,
  raw_address text NOT NULL,
  street text NOT NULL,
  city text NOT NULL,
  state text NOT NULL DEFAULT 'NJ',
  zip text NOT NULL,
  county text,
  town text,
  parcel_id text,
  owner_name text,
  contractor_name text,
  est_value numeric,
  year_built integer,
  lot_acres numeric,
  lat numeric,
  lon numeric,
  score integer DEFAULT 0,
  canonical_key text UNIQUE NOT NULL,
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  notes text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_canonical_key ON leads(canonical_key);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_issue_date ON leads(issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_leads_county ON leads(county);
CREATE INDEX IF NOT EXISTS idx_leads_town ON leads(town);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_areas_slug ON areas(slug);
CREATE INDEX IF NOT EXISTS idx_sources_slug ON sources(slug);

ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to areas"
  ON areas FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to sources"
  ON sources FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to leads"
  ON leads FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to leads"
  ON leads FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to leads"
  ON leads FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public insert to areas"
  ON areas FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to areas"
  ON areas FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public insert to sources"
  ON sources FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to sources"
  ON sources FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION upsert_lead(
  p_canonical_key text,
  p_source text,
  p_kind text,
  p_permit_number text,
  p_issue_date date,
  p_status text,
  p_permit_type text,
  p_raw_address text,
  p_street text,
  p_city text,
  p_state text,
  p_zip text,
  p_county text,
  p_town text,
  p_parcel_id text,
  p_owner_name text,
  p_contractor_name text,
  p_est_value numeric,
  p_year_built integer,
  p_lot_acres numeric,
  p_lat numeric,
  p_lon numeric,
  p_score integer,
  p_notes text,
  p_tags text[]
) RETURNS uuid AS $$
DECLARE
  v_lead_id uuid;
BEGIN
  INSERT INTO leads (
    canonical_key, source, kind, permit_number, issue_date, status, permit_type,
    raw_address, street, city, state, zip, county, town, parcel_id, owner_name,
    contractor_name, est_value, year_built, lot_acres, lat, lon, score, notes, tags,
    first_seen, last_seen, updated_at
  ) VALUES (
    p_canonical_key, p_source, p_kind, p_permit_number, p_issue_date, p_status, p_permit_type,
    p_raw_address, p_street, p_city, p_state, p_zip, p_county, p_town, p_parcel_id, p_owner_name,
    p_contractor_name, p_est_value, p_year_built, p_lot_acres, p_lat, p_lon, p_score, p_notes, p_tags,
    now(), now(), now()
  )
  ON CONFLICT (canonical_key) DO UPDATE SET
    source = EXCLUDED.source,
    kind = EXCLUDED.kind,
    permit_number = COALESCE(EXCLUDED.permit_number, leads.permit_number),
    issue_date = COALESCE(EXCLUDED.issue_date, leads.issue_date),
    status = COALESCE(EXCLUDED.status, leads.status),
    permit_type = COALESCE(EXCLUDED.permit_type, leads.permit_type),
    raw_address = EXCLUDED.raw_address,
    street = EXCLUDED.street,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip = EXCLUDED.zip,
    county = COALESCE(EXCLUDED.county, leads.county),
    town = COALESCE(EXCLUDED.town, leads.town),
    parcel_id = COALESCE(EXCLUDED.parcel_id, leads.parcel_id),
    owner_name = COALESCE(EXCLUDED.owner_name, leads.owner_name),
    contractor_name = COALESCE(EXCLUDED.contractor_name, leads.contractor_name),
    est_value = COALESCE(EXCLUDED.est_value, leads.est_value),
    year_built = COALESCE(EXCLUDED.year_built, leads.year_built),
    lot_acres = COALESCE(EXCLUDED.lot_acres, leads.lot_acres),
    lat = COALESCE(EXCLUDED.lat, leads.lat),
    lon = COALESCE(EXCLUDED.lon, leads.lon),
    score = EXCLUDED.score,
    notes = COALESCE(EXCLUDED.notes, leads.notes),
    tags = EXCLUDED.tags,
    last_seen = now(),
    updated_at = now()
  RETURNING id INTO v_lead_id;

  RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql;
