const COMPANY_PATTERNS = [
  /^m\/s\s+/i,
  /pvt\.?\s*ltd\.?/i,
  /\bltd\.?\b/i,
  /\blimited\b/i,
  /laboratories?\b/i,
  /pharmaceuticals?\b/i,
  /\bindustries\b/i,
  /\bhealthcare\b/i,
  /\bbiotech\b/i,
  /\bchemicals?\b/i,
  /\bformulations?\b/i,
  /\benterprises?\b/i,
];

export function isCompanyName(name) {
  if (!name) return false;
  return COMPANY_PATTERNS.some(p => p.test(name));
}

export function getDisplayName(brandName, saltName) {
  if (!isCompanyName(brandName)) return brandName;

  // Extract meaningful drug name from salt (first 2-3 words)
  const salt = (saltName || '').trim();
  const words = salt.split(/\s+/);

  // Take drug name words — stop before dosage (number pattern)
  const drugWords = [];
  for (const w of words) {
    if (/^\d/.test(w) || /mg|ml|mcg|iu/i.test(w)) break;
    drugWords.push(w);
    if (drugWords.length === 3) break;
  }

  return drugWords.length > 0 ? drugWords.join(' ') : brandName;
}

export function getManufacturerTag(brandName) {
  if (!isCompanyName(brandName)) return null;
  // Return shortened company name for subtitle
  return brandName
    .replace(/^m\/s\s+/i, '')
    .replace(/pvt\.?\s*ltd\.?/i, '')
    .replace(/\blimited\b/i, '')
    .trim()
    .slice(0, 30);
}
