import { getDisplayName, getCleanSaltName } from '../utils/medicineNames';

export default function SavingsBanner({ currentMedicine, currentPrice, generics, onSwitchToGeneric }) {
  if (!generics || generics.length === 0 || !currentPrice) return null;

  const curPrice = parseFloat(currentPrice);
  if (!curPrice || curPrice <= 0) return null;

  // Find cheapest generic that's cheaper than current
  const cheaperGenerics = generics
    .filter(g => g.lowest_price && parseFloat(g.lowest_price) < curPrice)
    .sort((a, b) => parseFloat(a.lowest_price) - parseFloat(b.lowest_price));

  // If current medicine IS the cheapest — show a small badge
  if (cheaperGenerics.length === 0) {
    return (
      <div style={{
        padding: '10px 16px', borderRadius: 10,
        background: '#E1F5EE', border: '1px solid #6ee7b7',
        marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>✓</span>
        <span style={{ fontSize: 13, color: '#065f46', fontWeight: 500 }}>
          You're already viewing the most affordable option
        </span>
      </div>
    );
  }

  const cheapest = cheaperGenerics[0];
  const cheapestPrice = parseFloat(cheapest.lowest_price);
  const savings = curPrice - cheapestPrice;
  const savingsPct = Math.round((savings / curPrice) * 100);
  const monthlySavings = savings * 30;
  const yearlySavings = savings * 365;

  const currentName = getDisplayName(currentMedicine?.brand_name, currentMedicine?.salt_name);
  const genericName = getDisplayName(cheapest.brand_name, cheapest.salt_name);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #E1F5EE 0%, #f0fff4 100%)',
      border: '1.5px solid #6ee7b7',
      borderRadius: 14,
      padding: '20px 24px',
      marginBottom: 24,
    }}>
      {/* Top savings headline */}
      <div style={{
        fontSize: 18, fontWeight: 700, color: '#065f46',
        marginBottom: 16, lineHeight: 1.4,
      }}>
        💰 Save up to ₹{savings.toFixed(2)} ({savingsPct}%) with a generic alternative
      </div>

      {/* Comparison visual */}
      <div style={{
        background: '#fff', borderRadius: 10,
        padding: '14px 18px', marginBottom: 16,
      }}>
        {/* Current medicine row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', paddingBottom: 10,
          borderBottom: '1px solid #f0f0f0',
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Current
            </div>
            <div style={{
              fontSize: 14, fontWeight: 500, color: '#333',
              maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {currentName}
            </div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#666' }}>
            ₹{curPrice.toFixed(2)}
          </div>
        </div>

        {/* Generic medicine row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', paddingTop: 10,
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#1D9E75', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
              Generic
            </div>
            <div style={{
              fontSize: 14, fontWeight: 500, color: '#111',
              maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {genericName}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1D9E75' }}>
              ₹{cheapestPrice.toFixed(2)}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#fff',
              background: '#1D9E75', borderRadius: 20,
              padding: '3px 10px', whiteSpace: 'nowrap',
            }}>
              ← SAVE ₹{savings.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Monthly / yearly savings */}
      {monthlySavings > 50 && (
        <div style={{
          fontSize: 13, color: '#065f46', marginBottom: 14,
          fontWeight: 500, textAlign: 'center',
        }}>
          📊 That's ₹{Math.round(monthlySavings)}/month or ₹{Math.round(yearlySavings)}/year saved!
        </div>
      )}

      {/* Switch button */}
      <button
        onClick={() => onSwitchToGeneric(cheapest.id)}
        style={{
          width: '100%',
          padding: '12px 20px',
          borderRadius: 10,
          border: 'none',
          background: '#1D9E75',
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: 12,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#178a65'}
        onMouseLeave={e => e.currentTarget.style.background = '#1D9E75'}
      >
        Switch to Generic →
      </button>

      {/* Educational note */}
      <div style={{
        fontSize: 11, color: '#6b7280', lineHeight: 1.5,
        display: 'flex', gap: 6, alignItems: 'flex-start',
      }}>
        <span style={{ flexShrink: 0 }}>ℹ️</span>
        <span>
          Generic medicines contain the same active ingredient and are equally effective
          as per FDA/CDSCO guidelines.
        </span>
      </div>
    </div>
  );
}
