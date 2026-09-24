import React from 'react';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('CivicLens Uncaught Render Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetSession = () => {
    try {
      localStorage.removeItem('civiclens_session');
    } catch (e) {
      console.warn('Could not clear session', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse 80% 60% at 50% 20%, #eef5fd 0%, #ffffff 70%)',
          padding: '24px',
          fontFamily: "'Inter', -apple-system, sans-serif"
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #d7e9fb',
            boxShadow: '0 20px 40px rgba(8, 26, 58, 0.08)',
            padding: '36px 32px',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}>
            {/* Logo / Warning Badge */}
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#fef2f2',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '24px',
              fontWeight: 700,
              color: '#081a3a',
              margin: '0 0 10px',
              letterSpacing: '-0.02em'
            }}>
              Something went wrong
            </h1>

            <p style={{
              fontSize: '14.5px',
              lineHeight: 1.55,
              color: '#475569',
              margin: '0 0 24px'
            }}>
              An unexpected render error occurred in CivicLens. Please refresh the page or reset the session to recover.
            </p>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '24px'
            }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 22px',
                  borderRadius: '9999px',
                  background: '#1656e0',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(22, 86, 224, 0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                <RefreshCw size={15} />
                <span>Refresh Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetSession}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 20px',
                  borderRadius: '9999px',
                  background: '#ffffff',
                  color: '#081a3a',
                  border: '1.5px solid #d7e9fb',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <LogOut size={15} />
                <span>Clear Session & Reload</span>
              </button>
            </div>

            {/* Collapsible Error Details for Demo Day Debugging */}
            {this.state.error && (
              <details style={{
                textAlign: 'left',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '12px',
                color: '#334155',
                marginTop: '16px'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#1656e0',
                  userSelect: 'none'
                }}>
                  View Technical Error Details
                </summary>
                <pre style={{
                  marginTop: '10px',
                  marginBottom: 0,
                  padding: '10px',
                  background: '#081a3a',
                  color: '#38bdf8',
                  borderRadius: '6px',
                  overflowX: 'auto',
                  fontSize: '11.5px',
                  lineHeight: 1.45,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
