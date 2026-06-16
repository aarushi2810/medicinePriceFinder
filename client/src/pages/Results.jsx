import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { comparePrices, getGenerics, explainPrice } from '../api';

import SavingsBanner from '../components/SavingsBanner';
import GenericSavingsCard from '../components/GenericSavingsCard';
import { getDisplayName, getManufacturerTag } from '../utils/medicineNames';
import { getCleanProductName, getCompositionText } from '../utils/parseMedicineName';
 
// ─── Helpers ─────────────────────────────────────────────────────────────────
 

function shortDosage(dosage) {
  if (!dosage) return '';
  const cleaned = dosage.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.length > 70 ? cleaned.slice(0, 70) + '…' : cleaned;
}
 
function formatPrice(val) {
  return parseFloat(val || 0).toFixed(2);
}
 
// ─── Main Results page ────────────────────────────────────────────────────────
 
export default function Results() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [data,     setData]     = useState(null);
  const [generics, setGenerics] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
 
  useEffect(() => {
    setLoading(true);
    setData(null);
    setGenerics([]);
    setError('');
 
    Promise.all([comparePrices(id), getGenerics(id)])
      .then(([compareData, genericsData]) => {
        setData(compareData);
        setGenerics(genericsData.generics || []);
      })
      .catch(() => setError('Failed to load prices. Try searching again.'))
      .finally(() => setLoading(false));
  }, [id]);
 
  if (loading) return <LoadingState />;
  if (error)   return <ErrorState msg={error} onBack={() => navigate('/')} />;
  if (!data)   return null;
 
  const { medicine, prices, summary } = data;
 
  const displayName  = getDisplayName(medicine.brand_name, medicine.salt_name);
  const manufacturerTag = getManufacturerTag(medicine.brand_name);
 
  const cheapestPrice = summary?.cheapest_price || 0;
  const avgPrice      = prices.length
    ? (prices.reduce((s, p) => s + parseFloat(p.price), 0) / prices.length).toFixed(2)
    : null;

  const isNppaOnly = prices.length === 1 && prices[0]?.pharmacy_name === 'NPPA Standard';
  const hasMultipleSources = prices.length > 1;
  const showMaxSavings = parseFloat(summary?.max_savings) > 0;
 
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px 60px' }}>
 
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#666', fontSize: 14, marginBottom: 24,
          padding: '6px 0', display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        ← Back to search
      </button>
 
      {/* Medicine header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: '#111' }}>
          {getCleanProductName(medicine.brand_name, medicine.salt_name)}
        </h1>
        {getManufacturerTag(medicine.brand_name) && (
          <p style={{ fontSize: 12, color: '#aaa', margin: '0 0 4px' }}>
            by {getManufacturerTag(medicine.brand_name)}
          </p>
        )}
        <p style={{ color: '#666', fontSize: 13, margin: 0, maxWidth: 600, marginInline: 'auto' }}>
          {getCompositionText(medicine.brand_name).slice(0, 180)}
          {getCompositionText(medicine.brand_name).length > 180 ? '...' : ''}
        </p>
      </div>

      {/* Savings Banner — shows when branded medicine has cheaper generics */}
      <SavingsBanner
        currentMedicine={medicine}
        currentPrice={cheapestPrice}
        generics={generics}
        onSwitchToGeneric={(genericId) => navigate(`/results/${genericId}`)}
      />

      {/* NPPA-only: clean reference price card */}
      {isNppaOnly && (
        <div style={{
          border: '1.5px solid #d4edda', borderRadius: 14,
          padding: '24px', background: '#f9fffe', marginBottom: 28,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#085041', marginBottom: 10 }}>
            📋 Government Reference Price: ₹{formatPrice(prices[0]?.price)} per {medicine.unit_of_packing || 'unit'}
          </div>
          <p style={{ fontSize: 13, color: '#666', margin: '0 0 8px' }}>
            This is the government-regulated ceiling price under the Drug Price Control Order (DPCO).
          </p>
          <p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>
            Live pharmacy comparison coming soon for this medicine.
          </p>
        </div>
      )}

      {/* Summary stats — only show when there's meaningful comparison data */}
      {summary && !isNppaOnly && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 1, marginBottom: 28,
          border: '1px solid #eee', borderRadius: 12,
          overflow: 'hidden', background: '#eee',
        }}>
          <StatBox label="Cheapest"       value={`₹${formatPrice(summary.cheapest_price)}`} color="#1D9E75" />
          {hasMultipleSources && (
            <StatBox label="Most expensive" value={`₹${formatPrice(summary.most_expensive)}`} />
          )}
          {showMaxSavings && (
            <StatBox label="Max savings"    value={`₹${formatPrice(summary.max_savings)}`}
              color="#1D9E75" />
          )}
          <StatBox label="Govt. ceiling"
            value={summary.nppa_ceiling ? `₹${formatPrice(summary.nppa_ceiling)}/unit` : '—'} />
          {summary.nppa_breach_count > 0 && (
            <StatBox
              label="Above ceiling"
              value={`${summary.nppa_breach_count}/${summary.pharmacy_count} sources`}
              color="#E24B4A"
            />
          )}
        </div>
      )}
 
      {summary?.nppa_breach_count > 0 && (
        <div style={{
          margin: '0 0 20px', padding: '10px 14px',
          background: '#fff8f0', border: '1px solid #f5cba7',
          borderRadius: 8, fontSize: 13, color: '#7d4e00', lineHeight: 1.6,
        }}>
          ⚠️ <strong>{summary.nppa_breach_count} of {summary.pharmacy_count} sources</strong> are
          priced above the NPPA ceiling of ₹{summary.nppa_ceiling}.
          The ceiling price is the <em>maximum retail price</em> set by the government
          under the Drug Price Control Order (DPCO).
        </div>
      )}

{!isNppaOnly && prices.length === 1 && (
  <div style={{
    padding: '8px 14px', background: '#fffbeb',
    border: '1px solid #fde68a', borderRadius: 8,
    fontSize: 13, color: '#92400e', marginBottom: 16,
  }}>
    📋 <strong>Reference price only</strong> — showing the government-regulated ceiling
    price. Live comparison across 1mg, Netmeds & PharmEasy coming soon.
  </div>
)}

{hasMultipleSources && (
  <div style={{
    padding: '8px 14px', background: '#E1F5EE',
    border: '1px solid #6ee7b7', borderRadius: 8,
    fontSize: 13, color: '#065f46', marginBottom: 16,
  }}>
    ✓ <strong>Live comparison available</strong> — prices verified across
    {prices.length} sources
  </div>
)}

      {/* Price comparison — hide entirely for NPPA-only */}
      {!isNppaOnly && (
        <div style={{ marginBottom: 32 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'baseline', marginBottom: 12,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111', margin: 0 }}>
              Price comparison
            </h2>
            <span style={{ fontSize: 13, color: '#aaa' }}>
              {prices.length} {prices.length === 1 ? 'source' : 'sources'} · sorted cheapest first
            </span>
          </div>
 
          {prices.length === 0 ? (
            <EmptyPrices />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {prices.map((p, i) => (
                <PriceCard
                  key={`${p.pharmacy_id}-${i}`}
                  price={p}
                  isCheapest={i === 0}
                  medicine={medicine}
                  cheapestPrice={cheapestPrice}
                  avgPrice={avgPrice}
                />
              ))}
            </div>
          )}
        </div>
      )}
 
      {/* Generic alternatives — using new GenericSavingsCard */}
      <GenericSavingsCard
        generics={generics}
        currentMedicine={medicine}
        currentPrice={cheapestPrice}
        onSelect={(genericId) => navigate(`/results/${genericId}`)}
      />
 

      {/* Find pharmacies — opens Google Maps */}
      <FindPharmacies medicineName={displayName} />
 
      {/* WhatsApp share */}
      <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #eee' }}>
        <button
          onClick={() => {
            const msg = `Found ${displayName} for ₹${formatPrice(summary?.cheapest_price)} at ${prices[0]?.pharmacy_name}. Check MedPrice for cheapest medicines near you!`;
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 8,
            background: '#25D366', color: '#fff',
            border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 500,
          }}
        >
          <span>📤</span> Share on WhatsApp
        </button>
      </div>
 
    </div>
  );
}




 
// ─── PriceCard ────────────────────────────────────────────────────────────────
 
function PriceCard({ price, isCheapest, medicine, cheapestPrice, avgPrice }) {
  const [explanation, setExplanation] = useState('');
  const [explaining,  setExplaining]  = useState(false);
  const isOnline = price.pharmacy_type === 'online';
  const breach   = price.nppa_breach;
 
  const handleExplain = async () => {
    setExplaining(true);
    try {
      const data = await explainPrice({
        medicine:      `${medicine?.brand_name} ${medicine?.dosage}`,
        pharmacy:      price.pharmacy_name,
        price:         price.price,
        cheapestPrice,
        nppaCeiling:   medicine?.nppa_ceiling_price,
        avgPrice,
      });
      setExplanation(data.explanation);
    } catch {
      setExplanation('Could not generate explanation right now.');
    } finally {
      setExplaining(false);
    }
  };
 
  return (
    <div style={{
      padding: '14px 18px', borderRadius: 10,
      border: `1.5px solid ${isCheapest ? '#1D9E75' : breach ? '#fde8e8' : '#eee'}`,
      background: isCheapest ? '#f9fffe' : breach ? '#fffafa' : '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
 
        {/* Left: icon + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 9,
            background: isCheapest ? '#E1F5EE' : '#f5f5f5',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 18, flexShrink: 0,
          }}>
            {isOnline ? '🌐' : '🏥'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5 }}>
              <span style={{ fontWeight: 500, fontSize: 15, color: '#111' }}>
                {price.pharmacy_name}
              </span>
              {isCheapest && <Pill text="Cheapest ✓" color="#085041" bg="#E1F5EE" />}
              {breach      && <Pill text="⚠️ Above ceiling price" color="#A32D2D" bg="#fde8e8" />}
            </div>
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 3 }}>
              {price.in_stock ? '✓ In stock' : '✗ Out of stock'}
              {price.discount_pct > 0 && ` · ${price.discount_pct}% off MRP`}
              {price.updated_at && ` · ${new Date(price.updated_at).toLocaleDateString('en-IN')}`}
            </div>
          </div>
        </div>
 
        {/* Right: price */}
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
          <div style={{
            fontSize: 20, fontWeight: 700,
            color: isCheapest ? '#1D9E75' : breach ? '#E24B4A' : '#111',
          }}>
            ₹{formatPrice(price.price)}
          </div>
          <div style={{ fontSize: 12, color: '#bbb' }}>
            MRP ₹{formatPrice(price.mrp)}
          </div>
          {price.vs_cheapest_pct > 0 && (
            <div style={{ fontSize: 11, color: '#E24B4A', marginTop: 1 }}>
              +{price.vs_cheapest_pct}% costlier
            </div>
          )}
        </div>
      </div>
 
      {/* AI explainer — below the price row */}
      <div style={{ marginTop: 8, paddingLeft: 50 }}>
        {!explanation && (
          <button
            onClick={handleExplain}
            disabled={explaining}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#999', fontSize: 12, padding: 0,
              textDecoration: 'underline', textDecorationStyle: 'dotted',
            }}
          >
            {explaining ? '⏳ Analysing...' : '🤖 Why this price?'}
          </button>
        )}
        {explanation && (
          <p style={{
            fontSize: 12, color: '#555', margin: 0,
            background: '#f5f5f5', padding: '8px 10px',
            borderRadius: 6, lineHeight: 1.6,
          }}>
            {explanation}
          </p>
        )}
      </div>
    </div>
  );
}
 
// ─── Other sub-components ─────────────────────────────────────────────────────

function StatBox({ label, value, color = '#111' }) {
  return (
    <div style={{ background: '#fff', padding: '14px 18px' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>{label}</div>
    </div>
  );
}
 
function Pill({ text, color, bg }) {
  return (
    <span style={{
      fontSize: 11, padding: '2px 8px', borderRadius: 20,
      background: bg, color, fontWeight: 500,
    }}>
      {text}
    </span>
  );
}
 
function EmptyPrices() {
  return (
    <div style={{
      textAlign: 'center', padding: '32px 20px',
      border: '1px dashed #eee', borderRadius: 10, color: '#aaa',
    }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
      <p style={{ fontSize: 14, margin: 0 }}>No pharmacy prices found yet.</p>
      <p style={{ fontSize: 12, marginTop: 4, color: '#bbb' }}>
        Prices are updated weekly from verified sources.
      </p>
    </div>
  );
}
 
function LoadingState() {
  return (
    <div style={{ maxWidth: 720, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid #eee', borderTopColor: '#1D9E75',
        animation: 'spin 0.7s linear infinite',
        margin: '0 auto 16px',
      }} />
      <p style={{ color: '#888', fontSize: 14 }}>Fetching prices...</p>
    </div>
  );
}
 
function ErrorState({ msg, onBack }) {
  return (
    <div style={{ maxWidth: 720, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>❌</div>
      <p style={{ color: '#E24B4A', marginBottom: 16, fontSize: 14 }}>{msg}</p>
      <button
        onClick={onBack}
        style={{
          padding: '8px 20px', borderRadius: 8,
          border: '1px solid #ddd', cursor: 'pointer',
          fontSize: 14, background: '#fff',
        }}
      >
        ← Back to search
      </button>
    </div>
  );
}

// ─── FindPharmacies — opens Google Maps ──────────────────────────────────────

function FindPharmacies({ medicineName }) {
  const [pincode, setPincode] = useState('');

  const openGoogleMaps = (searchQuery) => {
    const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
    window.open(url, '_blank', 'noopener');
  };

  const handlePincodeSearch = () => {
    if (pincode.length !== 6) return;
    openGoogleMaps(`pharmacy near ${pincode} India`);
  };

  const handleNearMe = () => {
    openGoogleMaps('pharmacy near me');
  };

  return (
    <div style={{
      marginTop: 28, padding: '20px 24px',
      border: '1px solid #eee', borderRadius: 14,
      background: '#fafafa',
    }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111', margin: '0 0 4px' }}>
        📍 Find pharmacies nearby
      </h3>
      <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px' }}>
        Opens Google Maps with real pharmacies — ratings, phone numbers, directions & hours
      </p>

      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', flexWrap: 'wrap' }}>
        <input
          value={pincode}
          onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={e => e.key === 'Enter' && handlePincodeSearch()}
          placeholder="Enter pincode"
          maxLength={6}
          style={{
            padding: '10px 14px', borderRadius: 8,
            border: '1.5px solid #ddd', fontSize: 15,
            fontWeight: 500, color: '#111', width: 140,
          }}
        />
        <button
          onClick={handlePincodeSearch}
          disabled={pincode.length !== 6}
          style={{
            padding: '10px 20px', borderRadius: 8, border: 'none',
            background: pincode.length === 6 ? '#1D9E75' : '#ccc',
            color: '#fff', cursor: pincode.length === 6 ? 'pointer' : 'default',
            fontSize: 14, fontWeight: 600,
            transition: 'background 0.15s',
          }}
        >
          🔍 Search area
        </button>
        <button
          onClick={handleNearMe}
          style={{
            padding: '10px 16px', borderRadius: 8,
            border: '1px solid #1D9E75', background: '#fff',
            color: '#1D9E75', cursor: 'pointer',
            fontSize: 13, fontWeight: 500,
          }}
        >
          📍 Near me
        </button>
      </div>

      {medicineName && (
        <button
          onClick={() => openGoogleMaps(`${medicineName} pharmacy near me`)}
          style={{
            marginTop: 10, padding: '6px 14px', borderRadius: 20,
            border: '1px solid #eee', background: '#fff',
            color: '#555', cursor: 'pointer', fontSize: 12,
          }}
        >
          🔎 Search "{medicineName}" on Google Maps
        </button>
      )}
    </div>
  );
}
