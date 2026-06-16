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

/**
 * Title-case a string: capitalize first letter of each word.
 */
function titleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/(?:^|\s|[-/+])\S/g, match => match.toUpperCase());
}

/**
 * Check if a salt name has ugly parenthetical dosage info.
 * e.g. "Cefixime Trihydrate+ Ofloxacin (Ahydrous Cefixime-100mg Ofloxacin-100mg)"
 */
function hasParenDosage(saltName) {
  if (!saltName) return false;
  // Match parenthetical content containing dosage-like patterns (mg, ml, mcg, iu, digits)
  return /\([^)]*\d+\s*(mg|ml|mcg|iu|gm|g)\b/i.test(saltName);
}

/**
 * Strip the parenthetical dosage portion from a salt name.
 */
function stripParenDosage(saltName) {
  if (!saltName) return '';
  return saltName.replace(/\s*\([^)]*\d+\s*(mg|ml|mcg|iu|gm|g)\b[^)]*\)/gi, '').trim();
}

export function cleanMedicineName(name) {
  if (!name) return '';
  return name
    .replace(/\(each.*$/i, '')
    .replace(/\(Each.*$/i, '')
    .trim();
}

/**
 * Clean a salt name for display:
 * - Strips parenthetical dosage info
 * - Cleans up + separators
 * - Title-cases
 * - Strips trailing whitespace and dosage fragments
 */
export function getCleanSaltName(saltName) {
  if (!saltName) return '';

  let cleaned = cleanMedicineName(saltName);

  // Strip parenthetical dosage info: "Paracetamol (Tablet 500mg)" → "Paracetamol"
  if (hasParenDosage(cleaned)) {
    cleaned = stripParenDosage(cleaned);
  }

  // Also strip generic paren content that looks like dosage: "(500mg)" or "(Tablet 500mg)"
  cleaned = cleaned.replace(/\s*\([^)]*\)/g, (match) => {
    // Only strip if it contains dosage-like content
    if (/\d+\s*(mg|ml|mcg|iu|gm|g)\b/i.test(match)) return '';
    return match;
  });

  // Clean up + separators: "Cefixime Trihydrate+ Ofloxacin" → "Cefixime + Ofloxacin"
  cleaned = cleaned.replace(/\s*\+\s*/g, ' + ');

  // Strip trailing dosage fragments like "500mg" at the end, unless it's part of a ratio (contains /)
  if (!cleaned.includes('/')) {
    cleaned = cleaned.replace(/\s+\d+\s*(mg|ml|mcg|iu|gm|g)\s*$/i, '');
  }

  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return titleCase(cleaned);
}

export function getDisplayName(brandName, saltName) {
  // If brandName is a real brand (not a company name), prefer it
  if (brandName && !isCompanyName(brandName)) {
    // If it looks like a clean product name (not too long, not raw NPPA data)
    const cleanBrand = cleanMedicineName(brandName).replace(/\s*\([^)]*\)/g, '').trim();
    if (cleanBrand.length > 0 && cleanBrand.length < 50) {
      return titleCase(cleanBrand);
    }
  }

  // If saltName exists, clean it up
  if (saltName) {
    return getCleanSaltName(saltName);
  }

  // Fallback: clean up the brand name as best we can
  if (!brandName) return 'Medicine';

  return titleCase(
    cleanMedicineName(brandName)
      .replace(/^m\/s\s+/i, '')
      .replace(/pvt\.?\s*ltd\.?/i, '')
      .trim()
  ) || 'Medicine';
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