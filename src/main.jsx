import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary Caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem 1.25rem',
          backgroundColor: '#fef2f2',
          color: '#991b1b',
          minHeight: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '2rem', color: '#dc2626' }}></i>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Ops! Ocorreu um erro no aplicativo</h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#b91c1c' }}>Abaixo estão os detalhes para correção:</p>
            </div>
          </div>

          <div style={{
            backgroundColor: '#fee2e2',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #f87171',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: '0.85rem',
            fontFamily: 'monospace'
          }}>
            <strong>{this.state.error?.toString()}</strong>
            <br /><br />
            {this.state.errorInfo?.componentStack}
          </div>

          <button 
            type="button"
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <i className="fa-solid fa-arrows-rotate"></i>
            <span>Limpar Dados Locais e Recarregar</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
