<<<<<<< HEAD


export function getCleanProductName(rawName, saltName) {
    if (!rawName) return saltName || 'Unknown Medicine';
  
    
    const match = rawName.match(/^\(([^)]+)\)/);
    if (match && match[1].length < 50) {
      return match[1].trim();
    }
  
    
    if (saltName) return saltName;
  
  
    return rawName.slice(0, 40).replace(/[(),]/g, '').trim();
  }
  
  export function getCompositionText(rawName) {
    if (!rawName) return '';
  
    
    let text = rawName.replace(/^\([^)]+\)\s*/, '');
  

    text = text.replace(/\uFFFD/g, '=');
  

    const containsIdx = text.indexOf('contains:');
    if (containsIdx !== -1) {
      const secondIdx = text.indexOf('contains:', containsIdx + 9);
      if (secondIdx !== -1) {
        text = text.slice(0, secondIdx);
      }
    }
  
    return text.trim();
  }
=======
import { isCompanyName } from './medicineNames';

export function getCleanProductName(rawName, saltName) {
  if (!rawName) return saltName || 'Unknown Medicine';

  // Try extracting from parenthetical brand name pattern: "(BrandName) rest..."
  const match = rawName.match(/^\(([^)]+)\)/);
  if (match && match[1].length < 50 && !isCompanyName(match[1])) {
    return cleanOutput(match[1].trim(), 60);
  }

  // If rawName is a company name, fall through to saltName
  if (isCompanyName(rawName)) {
    if (saltName) return cleanOutput(saltName, 60);
    // Strip company suffixes and return what's left
    const stripped = rawName
      .replace(/^m\/s\s+/i, '')
      .replace(/pvt\.?\s*ltd\.?/i, '')
      .replace(/\blimited\b/i, '')
      .replace(/\blaboratories?\b/i, '')
      .replace(/\bpharmaceuticals?\b/i, '')
      .trim();
    return cleanOutput(stripped || 'Medicine', 60);
  }

  // If saltName available and rawName looks messy, prefer saltName
  if (saltName && rawName.length > 60) return cleanOutput(saltName, 60);

  // Use saltName if provided and rawName doesn't look like a product name
  if (saltName) return cleanOutput(saltName, 60);

  // Fallback: clean up rawName
  return cleanOutput(rawName.replace(/[(),]/g, '').trim(), 60);
}

export function getCompositionText(rawName) {
  if (!rawName) return '';

  // Strip leading parenthetical brand name
  let text = rawName.replace(/^\([^)]+\)\s*/, '');

  // Strip company name prefixes
  text = text.replace(/^m\/s\s+/i, '');
  text = text
    .replace(/pvt\.?\s*ltd\.?/i, '')
    .replace(/\blimited\b/i, '')
    .replace(/\blaboratories?\b/i, '')
    .replace(/\bpharmaceuticals?\b/i, '');

  // Replace \n and \\n with space
  text = text.replace(/\\n/g, ' ').replace(/\n/g, ' ');

  // Clean up replacement characters
  text = text.replace(/\uFFFD/g, '=');
  text = text.replace(/�/g, '');

  // Handle duplicate "contains:" sections
  const containsIdx = text.indexOf('contains:');
  if (containsIdx !== -1) {
    const secondIdx = text.indexOf('contains:', containsIdx + 9);
    if (secondIdx !== -1) {
      text = text.slice(0, secondIdx);
    }
  }

  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Limit to 200 chars
  if (text.length > 200) {
    text = text.slice(0, 197) + '...';
  }

  return text;
}

/**
 * Clean output string: remove newlines, collapse whitespace, limit length.
 */
function cleanOutput(str, maxLen) {
  if (!str) return '';
  let cleaned = str
    .replace(/\\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length > maxLen) {
    cleaned = cleaned.slice(0, maxLen - 1) + '…';
  }
  return cleaned;
}
>>>>>>> d21353d (Improve search, medicine parsing, savings insights and pharmacy integration)
