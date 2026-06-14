

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