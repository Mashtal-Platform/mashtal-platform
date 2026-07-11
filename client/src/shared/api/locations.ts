import { apiGet } from './client';

export interface LocationResult {
  id: string;
  name: string;
  name_ar?: string;
  name_en?: string;
  type?: string;
  lat?: string;
  lon?: string;
}

export async function searchLebanonLocations(q: string, limit: number = 10): Promise<LocationResult[]> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  return apiGet(`/locations/search?${params.toString()}`);
}

