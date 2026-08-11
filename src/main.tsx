import {StrictMode, Component, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMsg: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false, errorMsg: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMsg: error?.message || 'An error occurred' };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("App execution error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', textAlign: 'center', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#0f172a', color: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '20px', padding: '32px 24px', maxWidth: '420px', width: '100%' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#38bdf8' }}>Sistem Keuangan Tiga Bersaudara</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px', lineHeight: '1.6' }}>
              Memuat ulang sesi browser Anda untuk mengoptimalkan tampilan di layar HP iOS / Android.
            </p>
            <button
              onClick={() => {
                window.location.reload();
              }}
              style={{ width: '100%', padding: '14px 20px', background: '#10b981', color: '#0f172a', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
            >
              🔄 Buka Aplikasi Sekarang
            </button>
          </div>
        </div>
      );
    }
    return (this.props as ErrorBoundaryProps).children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

