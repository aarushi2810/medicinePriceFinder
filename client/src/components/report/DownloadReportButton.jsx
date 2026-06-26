import { Download } from 'lucide-react';
import { buildReportPdf } from '../../utils/reportPdf';

export default function DownloadReportButton({ report }) {
  const handleDownload = () => {
    if (!report) return;
    const blob = buildReportPdf(report);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medprice-savings-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={!report}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        borderRadius: 8,
        border: 'none',
        background: '#111',
        color: '#fff',
        fontSize: 13,
        fontWeight: 700,
        cursor: report ? 'pointer' : 'not-allowed',
      }}
    >
      <Download size={16} />
      Download Report
    </button>
  );
}
