import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { comparePrices, getGenerics } from '../api';

// ─── Helpers ────

function cleanMedicineName(name) {
  if (!name) return 'Unknown';
  const isCompany = /pvt|ltd|m\/s|limited|pharma|laboratories|industries|corporation/i.test(name);
  if (isCompany) return null; // will fall back to salt name
  return name;
}

function shortDosage(dosage) {
  if (!dosage) return '';
  const cleaned = dosage.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.length > 70 ? cleaned.slice(0, 70) + '…' : cleaned;
}

function formatPrice(val) {
  return parseFloat(val).toFixed(2);
}

// ─── Main page ───

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

  // Display name: prefer a clean brand name, fall back to salt name
  const displayName = cleanMedicineName(medicine.brand_name) || medicine.salt_name?.split(' ').slice(0, 4).join(' ') || medicine.brand_name;
  const isCompanyName = !cleanMedicineName(medicine.brand_name);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px 60px' }}>

      {/* Back button */}
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
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111', margin: '0 0 6px', lineHeight: 1.3 }}>
          {displayName}
        </h1>
        <p style={{ color: '#777', fontSize: 14, margin: '0 0 4px' }}>
          {medicine.salt_name}
        </p>
        <p style={{ color: '#aaa', fontSize: 13, margin: 0 }}>
          {shortDosage(medicine.dosage)}
          {medicine.form && medicine.form !== 'other' ? ` · ${medicine.form}` : ''}
          {isCompanyName && (
            <span style={{ marginLeft: 8, color: '#bbb' }}>
              · Marketed by {medicine.brand_name?.slice(0, 40)}
            </span>
          )}
        </p>
      </div>

      {/* Summary stats */}
      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 1, marginBottom: 28,
          border: '1px solid #eee', borderRadius: 12, overflow: 'hidden',
          background: '#eee',
        }}>
          <StatBox label="Cheapest"     value={`₹${formatPrice(summary.cheapest_price)}`}  color="#1D9E75" />
          <StatBox label="Most expensive" value={`₹${formatPrice(summary.most_expensive)}`} />
          <StatBox label="Max savings"  value={`₹${formatPrice(summary.max_savings)}`}     color={parseFloat(summary.max_savings) > 0 ? '#1D9E75' : '#111'} />
          <StatBox label="NPPA ceiling" value={summary.nppa_ceiling ? `₹${formatPrice(summary.nppa_ceiling)}/unit` : '—'} />
          {summary.nppa_breach_count > 0 && (
            <StatBox
              label="Overcharging"
              value={`${summary.nppa_breach_count}/${summary.pharmacy_count} pharmacies`}
              color="#E24B4A"
            />
          )}
        </div>
      )}

      {/* NPPA breach banner */}
      {summary?.nppa_breach_count > 0 && (
        <div style={{
          background: '#fff5f5', border: '1px solid #fde8e8',
          borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <div>
            <p style={{ fontWeight: 600, color: '#A32D2D', fontSize: 14, margin: '0 0 2px' }}>
              NPPA ceiling exceeded
            </p>
            <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>
              {summary.nppa_breach_count} pharmacy / pharmacies is selling above the government's
              legal ceiling of ₹{formatPrice(summary.nppa_ceiling)} per unit.
              You can report this to NPPA at nppaindia.nic.in.
            </p>
          </div>
        </div>
      )}

      {/* Price cards */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
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
              <PriceCard key={`${p.pharmacy_id}-${i}`} price={p} isCheapest={i === 0} />
            ))}
          </div>
        )}
      </div>

      {/* Generic alternatives */}
      {generics.length > 0 && (
        <div style={{
          border: '1px solid #d4edda', borderRadius: 12,
          padding: '20px', background: '#f9fffe',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#085041', margin: 0 }}>
              Same medicine, lower price
            </h2>
          </div>
          <p style={{ fontSize: 13, color: '#666', margin: '0 0 14px 28px' }}>
            These contain the same active ingredient — medically equivalent alternatives
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {generics.slice(0, 6).map(g => (
              <GenericCard key={g.id} generic={g} onClick={() => navigate(`/results/${g.id}`)} />
            ))}
          </div>

          {generics.length > 6 && (
            <p style={{ fontSize: 12, color: '#aaa', marginTop: 10, textAlign: 'center' }}>
              + {generics.length - 6} more alternatives available
            </p>
          )}
        </div>
      )}

      {/* Share */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #eee' }}>
        <button
          onClick={() => {
            const msg = `Found ${displayName} for ₹${formatPrice(summary?.cheapest_price)} at ${prices[0]?.pharmacy_name}. Check MedPrice for cheapest medicines near you!`;
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 8,
            background: '#25D366', color: '#fff',
            border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
          }}
        >
          <span>📤</span> Share on WhatsApp
        </button>
      </div>

    </div>
  );
}

// ─── Sub-components ───

function PriceCard({ price, isCheapest }) {
  const isOnline = price.pharmacy_type === 'online';
  const breach   = price.nppa_breach;

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 18px', borderRadius: 10,
      border: `1.5px solid ${isCheapest ? '#1D9E75' : breach ? '#fde8e8' : '#eee'}`,
      background: isCheapest ? '#f9fffe' : breach ? '#fffafa' : '#fff',
      transition: 'box-shadow 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 9,
          background: isCheapest ? '#E1F5EE' : '#f5f5f5',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 18, flexShrink: 0,
        }}>
          {isOnline ? '🌐' : '🏥'}
        </div>

        {/* Name + badges */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5 }}>
            <span style={{ fontWeight: 500, fontSize: 15, color: '#111' }}>
              {price.pharmacy_name}
            </span>
            {isCheapest && <Pill text="Cheapest ✓" color="#085041" bg="#E1F5EE" />}
            {breach      && <Pill text="⚠️ Above NPPA ceiling" color="#A32D2D" bg="#fde8e8" />}
          </div>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 3 }}>
            {price.in_stock ? '✓ In stock' : '✗ Out of stock'}
            {price.discount_pct > 0 && ` · ${price.discount_pct}% off MRP`}
            {price.updated_at && ` · Updated ${new Date(price.updated_at).toLocaleDateString('en-IN')}`}
          </div>
        </div>
      </div>

      {/* Price */}
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
  );
}

function GenericCard({ generic, onClick }) {
  const displayName = cleanMedicineName(generic.brand_name) || generic.brand_name?.slice(0, 40);

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', padding: '10px 14px',
        background: '#fff', border: '1px solid #e8f5e9',
        borderRadius: 8, cursor: 'pointer', textAlign: 'left',
        width: '100%', transition: 'background 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#f0fff4'}
      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#111',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {displayName}
        </div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
          {shortDosage(generic.dosage)?.slice(0, 50)}
          {generic.form && generic.form !== 'other' ? ` · ${generic.form}` : ''}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
        {generic.lowest_price ? (
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1D9E75' }}>
            from ₹{formatPrice(generic.lowest_price)}
          </span>
        ) : (
          <span style={{ fontSize: 13, color: '#bbb' }}>No price</span>
        )}
        <div style={{ fontSize: 11, color: '#bbb', marginTop: 1 }}>→ view</div>
      </div>
    </button>
  );
}

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
      <p style={{ fontSize: 12, marginTop: 4 }}>
        Run the 1mg scraper to populate real prices.
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
      <div style={{ fontSize: 36, marginBottom: 12 }}></div>
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