const BASE = import.meta.env.VITE_API_URL;

export const searchMedicines = async (q) => {
  const res = await fetch(`${BASE}/api/medicines/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
};

export const comparePrices = async (id) => {
  const res = await fetch(`${BASE}/api/medicines/${id}/compare`);
  if (!res.ok) throw new Error('Compare failed');
  return res.json();
};

export const getGenerics = async (id) => {
  const res = await fetch(`${BASE}/api/medicines/${id}/generics`);
  if (!res.ok) throw new Error('Generics failed');
  return res.json();
};


export const ocrPrescription = async (imageBase64, mimeType) => {
  const res = await fetch(`${BASE}/api/ai/ocr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType }),
  });
  if (!res.ok) throw new Error('OCR failed');
  return res.json();
};

export const explainPrice = async (payload) => {
  const res = await fetch(`${BASE}/api/ai/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Explain failed');
  return res.json();
};