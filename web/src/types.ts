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
