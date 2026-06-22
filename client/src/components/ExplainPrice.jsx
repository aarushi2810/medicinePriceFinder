import { useState } from 'react';
import { Bot } from 'lucide-react';
import { explainPrice } from '../api';

export default function ExplainPrice({ medicine, pharmacy, price, cheapestPrice, nppaCeiling, avgPrice }) {
  const [explanation, setExplanation] = useState('');
  const [loading,     setLoading]     = useState(false);

  const handleExplain = async () => {
    setLoading(true);
    try {
      const data = await explainPrice({
        medicine, pharmacy, price, cheapestPrice, nppaCeiling, avgPrice
      });
      setExplanation(data.explanation);
    } catch {
      setExplanation('Could not generate explanation right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      {!explanation && (
        <button
          onClick={handleExplain}
          disabled={loading}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#666', fontSize: 12, padding: 0, textDecoration: 'underline',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}
        >
          {loading ? 'Analysing...' : <><Bot size={13} /> Why this price?</>}
        </button>
      )}
      {explanation && (
        <p style={{
          fontSize: 12, color: '#555', marginTop: 4,
          background: '#f9f9f9', padding: '8px 10px',
          borderRadius: 6, lineHeight: 1.6,
        }}>
          {explanation}
        </p>
      )}
    </div>
  );
}
