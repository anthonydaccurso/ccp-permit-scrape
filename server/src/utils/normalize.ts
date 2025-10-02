export function normalizeAddress(raw: string): {
  street: string;
  city: string;
  state: string;
  zip: string;
} {
  const parts = raw.split(',').map(p => p.trim());

  if (parts.length >= 3) {
    const street = parts[0];
    const city = parts[1];
    const stateZip = parts[2].split(' ').filter(p => p);
    const state = stateZip[0] || 'NJ';
    const zip = stateZip[1] || '00000';

    return { street, city, state, zip };
  }

  return {
    street: parts[0] || '',
    city: parts[1] || '',
    state: 'NJ',
    zip: '00000',
  };
}

export function createCanonicalKey(street: string, city: string, zip: string): string {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${clean(street)}_${clean(city)}_${clean(zip)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
