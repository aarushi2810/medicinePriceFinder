import { useState, useRef } from 'react';
import { ocrPrescription } from '../api';

export default function PrescriptionOCR({ onMedicinesFound }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [found,   setFound]   = useState([]);
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setError('');
    setFound([]);

    try {
      // Convert to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { medicines, error: ocrErr } = await ocrPrescription(base64, file.type);

      if (ocrErr || !medicines.length) {
        setError('Could not read medicines. Try a clearer photo.');
        return;
      }

      setFound(medicines);
      onMedicinesFound(medicines);  // pass up to parent

    } catch {
      setError('OCR failed. Check your Gemini API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])}
      />

      <button
        onClick={() => inputRef.current.click()}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          border: '1.5px dashed #1D9E75',
          borderRadius: 10,
          background: '#f9fffe',
          cursor: loading ? 'wait' : 'pointer',
          color: '#085041',
          fontSize: 14,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {loading ? (
          <>⏳ Reading prescription...</>
        ) : (
          <>📷 Scan prescription — AI finds all medicines</>
        )}
      </button>

      {error && (
        <p style={{ color: '#E24B4A', fontSize: 13, marginTop: 6 }}>{error}</p>
      )}

      {found.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <p style={{ fontSize: 12, color: '#085041', fontWeight: 500, marginBottom: 6 }}>
            ✓ Found {found.length} medicine{found.length > 1 ? 's' : ''} — click to search each:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {found.map((m, i) => (
              <button
                key={i}
                onClick={() => onMedicinesFound([m])}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  border: '1px solid #1D9E75',
                  background: '#E1F5EE',
                  color: '#085041',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {m.name} {m.dosage}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}