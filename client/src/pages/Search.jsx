import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchMedicines } from '../api';
import PrescriptionOCR from '../components/PrescriptionOCR';
import { getDisplayName, getManufacturerTag } from '../utils/medicineNames';

export default function Search() {
  const [query,      setQuery]      = useState('');
  const [results,    setResults]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [open,       setOpen]       = useState(false);
  const [error,      setError]      = useState('');
  const [stats,      setStats]      = useState(null);
  const [ocrResults, setOcrResults] = useState([]);
  const navigate  = useNavigate();
  const wrapRef   = useRef();

  // Fetch live stats once on mount
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/medicines/stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  // Debounced search — 300ms
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); setOpen(false); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = await searchMedicines(query);
        setResults(data.results || []);
        setOpen(true);
      } catch {
        setError('Search failed. Is the server running?');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (medicine) => {
    setOpen(false);
    setQuery(getDisplayName(medicine.brand_name, medicine.salt_name));
    navigate(`/results/${medicine.id}`);
  };

  const handleOcrResults = (medicines) => {
    if (medicines.length === 1) {
      setQuery(`${medicines[0].name} ${medicines[0].dosage}`);
    } else {
      setOcrResults(medicines);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '60px 24px 24px' }}>

      {/* Hero */}
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 8 }}>
        Check medicine prices against government rates
      </h1>
      <p style={{ color: '#666', marginBottom: 32, fontSize: 15 }}>
        NPPA-verified reference prices for {stats ? Number(stats.total_medicines).toLocaleString() : '840'}+ medicines.
        {' '}Live multi-pharmacy comparison available for {stats?.medicines_with_live_prices || '50'}+ common medicines.
      </p>

      {/* Search bar */}
      <div ref={wrapRef} style={{ position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          border: '1.5px solid #ddd', borderRadius: 10,
          padding: '12px 16px', background: '#fff',
          boxShadow: open ? '0 4px 20px rgba(0,0,0,0.08)' : 'none',
          transition: 'box-shadow 0.15s',
        }}>
          <span style={{ marginRight: 10, fontSize: 18 }}>🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by medicine or salt name (e.g. Paracetamol, Crocin)"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#111', background: 'transparent' }}
            autoFocus
          />
          {loading && <Spinner />}
        </div>

        {/* Dropdown — must be inside the relative wrapper, NOT inside the input box */}
        {open && results.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: '#fff', border: '1px solid #eee',
            borderRadius: 10, marginTop: 4, zIndex: 50,
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            maxHeight: 360, overflowY: 'auto',
          }}>
            {results.map(med => (
              <button
                key={med.id}
                onClick={() => handleSelect(med)}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '12px 16px', border: 'none',
                  background: 'none', cursor: 'pointer',
                  borderBottom: '1px solid #f5f5f5',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14, color: '#111' }}>
                    {getDisplayName(med.brand_name, med.salt_name)}
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                    {med.formulation_count > 1 && `${med.formulation_count} brands available`}
                    {getManufacturerTag(med.brand_name) && (
                      <span style={{ marginLeft: 6, color: '#bbb' }}>· {getManufacturerTag(med.brand_name)}</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  {med.lowest_price && (
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1D9E75' }}>
                      from ₹{parseFloat(med.lowest_price).toFixed(2)}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#aaa' }}>
                    {med.pharmacy_count} {med.pharmacy_count === 1 ? 'source' : 'sources'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {open && results.length === 0 && !loading && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: '#fff', border: '1px solid #eee', borderRadius: 10,
            marginTop: 4, padding: '20px', textAlign: 'center',
            color: '#888', fontSize: 14,
          }}>
            No medicines found for "{query}"
          </div>
        )}
      </div>

      {error && <p style={{ color: '#E24B4A', fontSize: 13, marginTop: 8 }}>{error}</p>}

      {/* OCR — sits below search bar, outside the relative wrapper */}
      <PrescriptionOCR onMedicinesFound={handleOcrResults} />

      {ocrResults.length > 1 && (
        <div style={{ marginTop: 12, padding: 12, background: '#f9fffe', borderRadius: 8, border: '1px solid #E1F5EE' }}>
          <p style={{ fontSize: 13, color: '#085041', marginBottom: 8, fontWeight: 500 }}>
            Found {ocrResults.length} medicines in prescription:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ocrResults.map((m, i) => (
              <button key={i}
                onClick={() => { setQuery(`${m.name} ${m.dosage}`); setOcrResults([]); }}
                style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid #1D9E75',
                         background: '#E1F5EE', color: '#085041', fontSize: 13, cursor: 'pointer' }}>
                {m.name} {m.dosage}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular searches */}
      <div style={{ marginTop: 32 }}>
        <p style={{ fontSize: 12, color: '#aaa', marginBottom: 10 }}>Popular searches</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['Paracetamol', 'Amoxicillin', 'Metformin', 'Atorvastatin', 'Azithromycin', 'Omeprazole'].map(name => (
            <button
              key={name}
              onClick={() => setQuery(name)}
              style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid #eee', background: '#fafafa', fontSize: 13, cursor: 'pointer', color: '#555' }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar — live from DB */}
      {stats && (
        <div style={{ marginTop: 60, display: 'flex', gap: 32, borderTop: '1px solid #eee', paddingTop: 24, flexWrap: 'wrap' }}>
          {[
            { n: `${Number(stats.total_medicines).toLocaleString()}+`, label: 'Medicines in database' },
            { n: stats.ceiling_prices, label: 'NPPA ceiling prices', sub: 'Government regulated' },
            { n: stats.medicines_with_live_prices, label: 'With multi-pharmacy comparison',
              color: stats.medicines_with_live_prices > 30 ? '#1D9E75' : '#888' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color || '#111' }}>{s.n}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{s.label}</div>
              {s.sub && <div style={{ fontSize: 11, color: '#bbb' }}>{s.sub}</div>}
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: '#aaa', marginTop: 12, textAlign: 'center' }}>
        "Reference price" = NPPA government-approved price. "Live comparison" = real prices across 1mg, Netmeds, PharmEasy for select medicines.
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 16, height: 16, borderRadius: '50%',
      border: '2px solid #eee', borderTopColor: '#1D9E75',
      animation: 'spin 0.6s linear infinite',
    }} />
  );
}