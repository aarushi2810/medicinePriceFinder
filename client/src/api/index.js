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