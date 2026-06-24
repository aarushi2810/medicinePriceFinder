import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Search  from './pages/Search';
import Results from './pages/Results';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        minHeight: '100vh',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Header />
        <ErrorBoundary>
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/"            element={<Search />} />
              <Route path="/results/:id" element={<Results />} />
              <Route path="*"            element={<Navigate to="/" />} />
            </Routes>
          </main>
        </ErrorBoundary>
        <Footer />
      </div>
    </BrowserRouter>
  );
}






function Header() {
  return (
    <nav style={{
      borderBottom: '1px solid #eee',
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      position: 'sticky',
      top: 0,
      background: '#fff',
      zIndex: 100,
    }}>
      <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}></span>
        <span style={{ fontWeight: 600, fontSize: 16, color: '#111' }}>MedPrice</span>
        <span style={{
          fontSize: 10, padding: '2px 6px',
          background: '#E1F5EE', color: '#085041',
          borderRadius: 20, fontWeight: 500,
        }}>Govt. verified</span>
      </a>
    </nav>
  );
}

function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid #eee',
      padding: '24px',
      color: '#888',
      textAlign: 'center',
      fontSize: 12,
      lineHeight: 1.7,
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 }}>
        MedPrice
      </div>
      <div>Compare medicine prices across pharmacies</div>
      <div>Prices are for informational purposes only.</div>
      <div style={{ marginTop: 6 }}>© 2026 MedPrice</div>
    </footer>
  );
}
