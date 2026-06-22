import { Component } from 'react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ maxWidth: 480, margin: '80px auto', padding: 24, textAlign: 'center' }}>
          <AlertTriangle size={32} color="#E24B4A" style={{ marginBottom: 12 }} />
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>
            This page hit an error. Try going back to search.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
            style={{
              padding: '10px 24px', borderRadius: 8, background: '#1D9E75',
              color: '#fff', border: 'none', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            <ArrowLeft size={15} />
            Back to search
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
