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
  
  if (saltName) return saltName;

  if (!isCompanyName(brandName)) return brandName;

  return brandName
    .replace(/^m\/s\s+/i, '')
    .replace(/pvt\.?\s*ltd\.?/i, '')
    .trim() || 'Medicine';
}

export function getManufacturerTag(brandName) {
  if (!isCompanyName(brandName)) return null;
  return brandName
    .replace(/^m\/s\s+/i, '')
    .replace(/pvt\.?\s*ltd\.?/i, '')
    .replace(/\blimited\b/i, '')
    .trim()
    .slice(0, 30);
}