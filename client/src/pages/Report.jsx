import { useMemo, useState } from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { generateReport } from '../api';
import PrescriptionOCR from '../components/PrescriptionOCR';
import DownloadReportButton from '../components/report/DownloadReportButton';
import MedicineSavingsTable from '../components/report/MedicineSavingsTable';
import NPPASection from '../components/report/NPPASection';
import PharmacyComparison from '../components/report/PharmacyComparison';
import SavingsChart from '../components/report/SavingsChart';
import SavingsSummary from '../components/report/SavingsSummary';

export default function Report() {
  const [entry, setEntry] = useState('');
  const [medicines, setMedicines] = useState(['Crocin 650', 'Azithral 500', 'Pantop 40']);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const chartData = useMemo(() => {
    if (!report) return null;
    return {
      medicineLabels: report.medicines.map(row => row.medicine.brand_name),
      medicineSavings: report.medicines.map(row => Number(row.genericSavings || row.perMedicineSavings || 0)),
      pharmacyLabels: report.pharmacies.map(row => row.name),
      pharmacyTotals: report.pharmacies.map(row => Number(row.total || 0)),
    };
  }, [report]);

  const addMedicine = () => {
    const value = entry.trim();
    if (!value) return;
    setMedicines(prev => [...prev, value]);
    setEntry('');
  };

  const handleOcrResults = (found) => {
    const names = found.map(item => `${item.name || ''} ${item.dosage || ''}`.trim()).filter(Boolean);
    if (names.length) {
      setMedicines(prev => [...prev, ...names]);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      setReport(await generateReport(medicines));
    } catch {
      setError('Could not generate the report. Check the medicine names and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 20px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, margin: '0 0 6px', color: '#111' }}>Medicine Savings Report</h1>
          <p style={{ color: '#666', fontSize: 14, margin: 0 }}>Build a prescription-level report across pharmacies, generics, and NPPA ceilings.</p>
        </div>
        <DownloadReportButton report={report} />
      </div>

      <section style={{ border: '1px solid #eee', borderRadius: 8, padding: 18, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, marginBottom: 12 }}>
          <input
            value={entry}
            onChange={event => setEntry(event.target.value)}
            onKeyDown={event => event.key === 'Enter' && addMedicine()}
            placeholder="Add medicine, e.g. Crocin 650"
            style={{ border: '1.5px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 14 }}
          />
          <button onClick={addMedicine} style={buttonStyle}>
            <Plus size={16} />
            Add
          </button>
        </div>

        <PrescriptionOCR onMedicinesFound={handleOcrResults} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {medicines.map((name, index) => (
            <span key={`${name}-${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, background: '#f5f5f5', fontSize: 13 }}>
              {name}
              <button
                onClick={() => setMedicines(prev => prev.filter((_, i) => i !== index))}
                aria-label={`Remove ${name}`}
                style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex' }}
              >
                <Trash2 size={13} color="#777" />
              </button>
            </span>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || medicines.length === 0}
          style={{ ...buttonStyle, marginTop: 16, background: '#1D9E75' }}
        >
          <FileText size={16} />
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
        {error && <p style={{ color: '#E24B4A', fontSize: 13, margin: '10px 0 0' }}>{error}</p>}
      </section>

      {report && (
        <div style={{ display: 'grid', gap: 22 }}>
          <SavingsSummary summary={report.summary} />

          {report.unresolved?.length > 0 && (
            <div style={{ padding: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, color: '#92400e', fontSize: 13 }}>
              {report.unresolved.length} medicine {report.unresolved.length === 1 ? 'was' : 'were'} not resolved: {report.unresolved.map(String).join(', ')}
            </div>
          )}

          <PharmacyComparison pharmacies={report.pharmacies} />
          <MedicineSavingsTable medicines={report.medicines} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
            <SavingsChart title="Savings by medicine" labels={chartData.medicineLabels} values={chartData.medicineSavings} />
            <SavingsChart title="Pharmacy totals" labels={chartData.pharmacyLabels} values={chartData.pharmacyTotals} />
          </div>

          <NPPASection medicines={report.medicines} summary={report.summary} />
        </div>
      )}
    </div>
  );
}

const buttonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  padding: '10px 14px',
  borderRadius: 8,
  border: 'none',
  background: '#111',
  color: '#fff',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
};
