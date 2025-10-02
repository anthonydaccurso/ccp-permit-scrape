import { Lead, Area, Source } from './types';

const API_BASE = '/api';

export async function fetchLeads(params?: {
  search?: string;
  minScore?: number;
  dateFrom?: string;
  dateTo?: string;
  county?: string;
  town?: string;
  source?: string;
  status?: string;
}): Promise<{ data: Lead[]; total: number }> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }

  const url = `${API_BASE}/leads${queryParams.toString() ? `?${queryParams}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch leads');
  return response.json();
}

export async function fetchAreas(): Promise<Area[]> {
  const response = await fetch(`${API_BASE}/areas`);
  if (!response.ok) throw new Error('Failed to fetch areas');
  return response.json();
}

export async function updateArea(id: string, data: { active?: boolean }): Promise<Area> {
  const response = await fetch(`${API_BASE}/areas/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update area');
  return response.json();
}

export async function fetchSources(): Promise<Source[]> {
  const response = await fetch(`${API_BASE}/sources`);
  if (!response.ok) throw new Error('Failed to fetch sources');
  return response.json();
}

export async function updateSource(id: string, data: { active?: boolean }): Promise<Source> {
  const response = await fetch(`${API_BASE}/sources/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update source');
  return response.json();
}

export async function updateLead(id: string, data: { notes?: string; tags?: string[]; status?: string }): Promise<Lead> {
  const response = await fetch(`${API_BASE}/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update lead');
  return response.json();
}

export function getExportUrl(params?: {
  dateFrom?: string;
  dateTo?: string;
  minScore?: number;
  county?: string;
  town?: string;
  source?: string;
}): string {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }
  return `${API_BASE}/export.csv${queryParams.toString() ? `?${queryParams}` : ''}`;
}
