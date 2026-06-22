import { FlaskConical, Lightbulb } from 'lucide-react';
import { getDisplayName, getCleanSaltName } from '../utils/medicineNames';

export default function GenericSavingsCard({ generics, currentMedicine, currentPrice, onSelect }) {
  if (!generics || generics.length === 0) return null;

  const curPrice = parseFloat(currentPrice) || 0;
  const saltName = currentMedicine?.salt_name;
  const cleanSalt = getCleanSaltName(saltName);

  // Sort by price ascending (items without price go to end)
  const sorted = [...generics].sort((a, b) => {
    const pa = parseFloat(a.lowest_price) || Infinity;
    const pb = parseFloat(b.lowest_price) || Infinity;
    return pa - pb;
  });

  const cheapestPrice = sorted[0]?.lowest_price ? parseFloat(sorted[0].lowest_price) : null;

  return (
    <div style={{
      border: '1px solid #d4edda', borderRadius: 14,
      padding: '24px', background: '#f9fffe', marginBottom: 32,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Lightbulb size={20} color="#1D9E75" />
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#085041', margin: 0 }}>
          Generic Alternatives
        </h2>
      </div>

      {/* Active ingredient */}
      {cleanSalt && (
        <div style={{
          margin: '8px 0 18px 28px',
          padding: '8px 14px',
          background: '#E1F5EE',
          borderRadius: 8,
          display: 'inline-block',
        }}>
          <span style={{ fontSize: 12, color: '#065f46', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <FlaskConical size={14} />
            Active ingredient: <strong>{cleanSalt}</strong>
          </span>
        </div>
      )}

      <p style={{ fontSize: 13, color: '#666', margin: '0 0 16px 28px' }}>
        All these medicines contain the same active ingredient{cleanSalt ? `: ${cleanSalt}` : ''}.
        They are medically equivalent alternatives.
      </p>

      {/* Comparison table */}
      <div style={{ overflowX: 'auto' }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 90px 90px 70px',
          gap: 8,
          padding: '8px 14px',
          background: '#f0f0f0',
          borderRadius: '8px 8px 0 0',
          fontSize: 11,
          fontWeight: 600,
          color: '#888',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          <div>Medicine</div>
          <div style={{ textAlign: 'right' }}>Price</div>
          <div style={{ textAlign: 'right' }}>Savings</div>
          <div style={{ textAlign: 'right' }}>%</div>
        </div>

        {/* Table rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {sorted.map((g, i) => {
            const gPrice = parseFloat(g.lowest_price) || 0;
            const isCheapest = cheapestPrice && gPrice === cheapestPrice && gPrice > 0;
            const savings = curPrice > 0 && gPrice > 0 ? curPrice - gPrice : 0;
            const savingsPct = curPrice > 0 && savings > 0 ? Math.round((savings / curPrice) * 100) : 0;
            const displayName = getDisplayName(g.brand_name, g.salt_name) || g.brand_name?.slice(0, 40);

            return (
              <button
                key={g.id}
                onClick={() => onSelect(g.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 90px 90px 70px',
                  gap: 8,
                  padding: '12px 14px',
                  background: isCheapest ? '#f0fff4' : '#fff',
                  border: 'none',
                  borderBottom: i < sorted.length - 1 ? '1px solid #f3f3f3' : 'none',
                  borderLeft: isCheapest ? '3px solid #1D9E75' : '3px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  alignItems: 'center',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = isCheapest ? '#e6fff0' : '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = isCheapest ? '#f0fff4' : '#fff'}
              >
                {/* Name */}
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: isCheapest ? 600 : 500, color: '#111',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {displayName}
                    {isCheapest && (
                      <span style={{
                        fontSize: 10, padding: '1px 7px', borderRadius: 20,
                        background: '#1D9E75', color: '#fff', fontWeight: 600,
                        whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        Best Price
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                    {g.form && g.form !== 'other' ? g.form : ''}
                  </div>
                </div>

                {/* Price */}
                <div style={{
                  textAlign: 'right', fontSize: 14,
                  fontWeight: 600, color: isCheapest ? '#1D9E75' : '#333',
                }}>
                  {gPrice > 0 ? `₹${gPrice.toFixed(2)}` : '—'}
                </div>

                {/* Savings */}
                <div style={{
                  textAlign: 'right', fontSize: 13,
                  color: savings > 0 ? '#1D9E75' : '#bbb',
                  fontWeight: savings > 0 ? 500 : 400,
                }}>
                  {savings > 0 ? `₹${savings.toFixed(2)}` : '—'}
                </div>

                {/* Savings % */}
                <div style={{
                  textAlign: 'right', fontSize: 12,
                  color: savingsPct > 0 ? '#1D9E75' : '#bbb',
                  fontWeight: savingsPct > 0 ? 600 : 400,
                }}>
                  {savingsPct > 0 ? `${savingsPct}%` : '—'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      {sorted.length > 8 && (
        <p style={{ fontSize: 12, color: '#aaa', marginTop: 12, textAlign: 'center' }}>
          Showing {sorted.length} generic alternatives
        </p>
      )}
    </div>
  );
}
