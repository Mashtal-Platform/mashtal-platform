import rawCsv from '../../data/lebanon_locations_ar_en.csv?raw';

export interface LebanonLocation {
  ar: string;
  en: string;
  district?: string;
  governorate?: string;
}

function parseCsvLine(line: string): string[] {
  // This CSV appears simple (no quoted commas). Keep parser minimal and safe.
  return line.split(',').map((x) => x.trim());
}

export function loadLebanonLocations(): LebanonLocation[] {
  const lines = String(rawCsv || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  // Expected header: ",Village Name,English Name,District Name,Mohafaza"
  const dataLines = lines.slice(1);

  const out: LebanonLocation[] = [];
  for (const line of dataLines) {
    const cols = parseCsvLine(line);
    // Example: 0,عبا,Aba,النبطية,النبطية
    const ar = cols[1] || '';
    const en = cols[2] || '';
    const district = cols[3] || '';
    const governorate = cols[4] || '';

    if (!ar && !en) continue;
    out.push({
      ar,
      en,
      district: district || undefined,
      governorate: governorate || undefined,
    });
  }

  // De-dup by (ar|en)
  const seen = new Set<string>();
  return out.filter((x) => {
    const k = `${x.ar}|${x.en}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function stripArabicDiacritics(s: string) {
  return s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
}

export function normalizeForSearch(s: string): string {
  try {
    return stripArabicDiacritics(String(s || ''))
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  } catch {
    return stripArabicDiacritics(String(s || '')).toLowerCase().trim();
  }
}

export function searchLebanonLocationsLocal(
  locations: LebanonLocation[],
  query: string,
  limit: number = 30
): LebanonLocation[] {
  const qRaw = String(query || '').trim();
  if (!qRaw) return locations.slice(0, limit);

  const q = normalizeForSearch(qRaw);

  const scored = locations
    .map((loc) => {
      const arNorm = normalizeForSearch(loc.ar);
      const enNorm = normalizeForSearch(loc.en);
      const arRaw = loc.ar || '';

      const inAr = arNorm.includes(q) || arRaw.includes(qRaw);
      const inEn = enNorm.includes(q);
      if (!inAr && !inEn) return null;

      const starts =
        (arNorm.startsWith(q) || enNorm.startsWith(q) || arRaw.startsWith(qRaw)) ? 0 : 1;
      const idx =
        Math.min(
          arNorm.indexOf(q) === -1 ? 9999 : arNorm.indexOf(q),
          enNorm.indexOf(q) === -1 ? 9999 : enNorm.indexOf(q)
        );

      return { loc, starts, idx };
    })
    .filter(Boolean) as Array<{ loc: LebanonLocation; starts: number; idx: number }>;

  scored.sort((a, b) => {
    if (a.starts !== b.starts) return a.starts - b.starts; // startsWith first
    if (a.idx !== b.idx) return a.idx - b.idx; // earlier contains position first
    return (a.loc.en || a.loc.ar).localeCompare(b.loc.en || b.loc.ar);
  });

  return scored.slice(0, limit).map((x) => x.loc);
}

