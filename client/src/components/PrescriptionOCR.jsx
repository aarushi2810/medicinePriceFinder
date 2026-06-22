import { useState, useRef } from 'react';
import { Camera, CheckCircle } from 'lucide-react';
import { ocrPrescription } from '../api';

export default function PrescriptionOCR({ onMedicinesFound }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [found,   setFound]   = useState([]);
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setError('');    // clear previous error on every new attempt
    setFound([]);

    try {
      const base64 = await toBase64(file);
      const { medicines, error: ocrErr } = await ocrPrescription(base64, file.type);

      if (ocrErr || !medicines?.length) {
        setError('Could not read medicines clearly. Try a better-lit photo.');
        return;
      }

      setFound(medicines);
      if (medicines.length === 1) {
        onMedicinesFound(medicines);
      }
    } catch {
      setError('OCR failed — check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
      />

      <button
        onClick={() => { setError(''); inputRef.current.click(); }}
        disabled={loading}
        style={{
          width: '100%', padding: 12,
          border: '1.5px dashed #1D9E75', borderRadius: 10,
          background: loading ? '#f0faf5' : '#f9fffe',
          cursor: loading ? 'wait' : 'pointer',
          color: '#085041', fontSize: 14, fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'background 0.15s',
        }}
      >
        {loading
          ? <><span style={spinner} />Reading prescription with AI...</>
          : <><Camera size={16} />Scan prescription — AI finds all medicines</>
        }
      </button>

      {/* Only show error after an attempt, not on initial render */}
      {error && !loading && (
        <p style={{ color: '#E24B4A', fontSize: 12, marginTop: 6 }}>{error}</p>
      )}

      {found.length > 1 && (
        <div style={{ marginTop: 10, padding: 12, background: '#f9fffe',
                      borderRadius: 8, border: '1px solid #E1F5EE' }}>
          <p style={{ fontSize: 12, color: '#085041', fontWeight: 500, marginBottom: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} />
              Found {found.length} medicines — tap to search each:
            </span>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {found.map((m, i) => (
              <button key={i}
                onClick={() => onMedicinesFound([m])}
                style={{
                  padding: '5px 12px', borderRadius: 20,
                  border: '1px solid #1D9E75', background: '#E1F5EE',
                  color: '#085041', fontSize: 13, cursor: 'pointer',
                }}>
                {m.name} {m.dosage}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const toBase64 = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload  = () => resolve(r.result.split(',')[1]);
  r.onerror = reject;
  r.readAsDataURL(file);
});

const spinner = {
  display: 'inline-block', width: 14, height: 14,
  borderRadius: '50%', border: '2px solid #ccc',
  borderTopColor: '#1D9E75', animation: 'spin 0.6s linear infinite',
};
