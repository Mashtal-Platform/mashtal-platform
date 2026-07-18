/**
 * Curated blocklist for weapons / explicit content (EN + AR).
 * Matched against normalized text (lowercase, punctuation stripped).
 */

const WEAPONS_EN = [
  'gun',
  'guns',
  'pistol',
  'pistols',
  'rifle',
  'rifles',
  'shotgun',
  'shotguns',
  'firearm',
  'firearms',
  'handgun',
  'handguns',
  'ammunition',
  'ammo',
  'bullet',
  'bullets',
  'ak-47',
  'ak47',
  'ak 47',
  'ar-15',
  'ar15',
  'glock',
  'uzi',
  'revolver',
  'carbine',
  'machine gun',
  'machinegun',
  'assault rifle',
  'sniper',
  'silencer',
  'suppressor',
  'grenade',
  'explosive',
  'explosives',
  'bomb',
  'bombs',
  'molotov',
];

const WEAPONS_AR = [
  'سلاح',
  'أسلحة',
  'اسلحة',
  'مسدس',
  'مسدسات',
  'بندقية',
  'بنادق',
  'رشاش',
  'رشاشات',
  'ذخيرة',
  'ذخائر',
  'طلقة',
  'طلقات',
  'قنبلة',
  'قنابل',
  'متفجرات',
  'متفجر',
];

const SEXUAL_EN = [
  'porn',
  'porno',
  'pornography',
  'xxx',
  'onlyfans',
  'nude',
  'nudes',
  'naked',
  'nsfw',
  'hentai',
  'sex video',
  'sex tape',
  'blowjob',
  'handjob',
  'cumshot',
  'fetish',
];

const SEXUAL_AR = [
  'إباحي',
  'اباحي',
  'إباحية',
  'اباحية',
  'سكس',
  'جنس صريح',
  'عاري',
  'عارية',
  'صور عارية',
  'فيديو إباحي',
  'فيديو اباحي',
];

const ALL_TERMS = [...WEAPONS_EN, ...WEAPONS_AR, ...SEXUAL_EN, ...SEXUAL_AR];

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s+-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {string} text
 * @returns {{ hit: boolean, term?: string }}
 */
function checkBlocklist(text) {
  const normalized = normalizeText(text);
  if (!normalized) return { hit: false };

  for (const term of ALL_TERMS) {
    const t = term.toLowerCase();
    if (t.includes(' ')) {
      if (normalized.includes(t)) return { hit: true, term };
    } else {
      // Word-boundary style for Latin; substring for Arabic (no clear \b)
      const isLatin = /^[a-z0-9+\-\s]+$/i.test(t);
      if (isLatin) {
        const re = new RegExp(`(?:^|\\s)${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|\\s)`, 'i');
        if (re.test(normalized)) return { hit: true, term };
      } else if (normalized.includes(t)) {
        return { hit: true, term };
      }
    }
  }
  return { hit: false };
}

module.exports = {
  checkBlocklist,
  ALL_TERMS,
};
