import React from 'react';

export default function Footer({ onOpenReport, onSwitchFeed }) {
  const year = new Date().getFullYear();

  return (
    <footer style={{
      background: 'var(--ice)',
      borderTop: '1px solid var(--line)',
      padding: '28px 6%',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '20px',
      }}>

        {/* ── Left: Brand ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '20px', height: '20px', flexShrink: 0
            }}>
              <svg viewBox="0 0 26 26" fill="none" width="20" height="20">
                <circle cx="13" cy="13" r="11" stroke="#1656e0" strokeWidth="1.8" />
                <circle cx="13" cy="13" r="4.5" fill="#1656e0" />
              </svg>
            </span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.01em' }}>
              CivicLens
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--navy-soft)', lineHeight: 1.5, maxWidth: '200px' }}>
            Civic infrastructure intelligence for India.
          </div>
        </div>

        {/* ── Centre: Quick links ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--navy-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
            Quick Links
          </div>
          <button
            type="button"
            onClick={() => {
              document.getElementById('report-section')?.scrollIntoView({ behavior: 'smooth' });
              if (onOpenReport) onOpenReport();
            }}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontSize: '12.5px', color: 'var(--navy-soft)', textAlign: 'left',
              fontFamily: 'inherit', transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--blue)'}
            onMouseLeave={e => e.target.style.color = 'var(--navy-soft)'}
          >
            Report an Issue
          </button>
          <button
            type="button"
            onClick={() => {
              if (onSwitchFeed) onSwitchFeed();
            }}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontSize: '12.5px', color: 'var(--navy-soft)', textAlign: 'left',
              fontFamily: 'inherit', transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--blue)'}
            onMouseLeave={e => e.target.style.color = 'var(--navy-soft)'}
          >
            Public Issues
          </button>
        </div>

        {/* ── Right: Credits ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end', textAlign: 'right', minWidth: '200px' }}>
          <div style={{ fontSize: '12px', color: 'var(--navy-soft)' }}>
            © {year} CivicLens
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--navy-soft)' }}>
            Built by Surendra, Srinivas and Uday.
          </div>
        </div>

      </div>
    </footer>
  );
}
