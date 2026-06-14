import { isCompanyName } from './medicineNames';

export function getCleanProductName(rawName, saltName) {
  if (!rawName) return saltName || 'Unknown Medicine';

  // Extract brand name from "(Brand)" pattern
  const match = rawName.match(/^\(([^)]+)\)/);
  if (match && match[1].length < 50 && !isCompanyName(match[1])) {
    return cleanOutput(match[1].trim(), 60);
  }

  // If the raw name is basically a company, use salt instead
  if (isCompanyName(rawName)) {
    if (saltName) return cleanOutput(saltName, 60);

    const stripped = rawName
      .replace(/^m\/s\s+/i, '')
      .replace(/pvt\.?\s*ltd\.?/i, '')
      .replace(/\blimited\b/i, '')
      .replace(/\blaboratories?\b/i, '')
      .replace(/\bpharmaceuticals?\b/i, '')
      .trim();

    return cleanOutput(stripped || 'Medicine', 60);
  }

  // Very long messy NPPA names → prefer salt name
  if (saltName && rawName.length > 60) {
    return cleanOutput(saltName, 60);
  }

  if (saltName) {
    return cleanOutput(saltName, 60);
  }

  return cleanOutput(
    rawName.replace(/[(),]/g, '').trim(),
    60
  );
}

export function getCompositionText(rawName) {
  if (!rawName) return '';

  let text = rawName;

  // Remove brand section
  text = text.replace(/^\([^)]+\)\s*/, '');

  // Remove company prefixes
  text = text.replace(/^m\/s\s+/i, '');
  text = text.replace(/pvt\.?\s*ltd\.?/gi, '');
  text = text.replace(/\blimited\b/gi, '');
  text = text.replace(/\blaboratories?\b/gi, '');
  text = text.replace(/\bpharmaceuticals?\b/gi, '');

  // Replace encoded newlines
  text = text.replace(/\\n/g, ' ');
  text = text.replace(/\n/g, ' ');

  // Fix bad unicode chars
  text = text.replace(/\uFFFD/g, '=');
  text = text.replace(/�/g, '');

  // Remove duplicate "contains:" blocks
  const firstContains = text.indexOf('contains:');
  if (firstContains !== -1) {
    const secondContains = text.indexOf(
      'contains:',
      firstContains + 9
    );

    if (secondContains !== -1) {
      text = text.slice(0, secondContains);
    }
  }

  // Collapse spaces
  text = text.replace(/\s+/g, ' ').trim();

  // Limit length
  if (text.length > 200) {
    text = text.slice(0, 197) + '...';
  }

  return text;
}

function cleanOutput(str, maxLen = 60) {
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