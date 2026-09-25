import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Eye, User, Landmark, LogOut, ChevronDown, Shield, ClipboardList } from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  session, 
  onOpenAuth, 
  onLogout
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const isOfficial = session?.role === 'official';
  const isCitizen = session?.role === 'citizen';

  const getUserInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      {/* Brand */}
      <div 
        className="brand" 
        onClick={() => {
          if (!isOfficial) {
            setCurrentTab('studio');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        style={{ cursor: !isOfficial ? 'pointer' : 'default' }}
      >
        <div className="logo-mark">
          <svg viewBox="0 0 26 26" fill="none" width="26" height="26">
            <circle cx="13" cy="13" r="11" stroke="#1656e0" strokeWidth="1.8" />
            <circle cx="13" cy="13" r="4.5" fill="#1656e0" />
          </svg>
        </div>
        <div className="brand-name">
          CivicLens
        </div>
        {isOfficial && (
          <span className="brand-badge" style={{ background: 'var(--navy)', color: 'var(--white)' }}>
            {session.profile?.level ? `${session.profile.level.charAt(0).toUpperCase() + session.profile.level.slice(1)} Official` : 'Official'}
          </span>
        )}
      </div>

      {/* Main Navigation Tabs - ONLY shown for Citizens / Visitors */}
      {!isOfficial ? (
        <div className="nav-links-center">
          <div className="nav-tabs">
            <button 
              className={`nav-tab-btn ${currentTab === 'studio' ? 'active' : ''}`}
              onClick={() => setCurrentTab('studio')}
            >
              <Sparkles size={15} />
              <span>Report Issue</span>
            </button>

            <button 
              className={`nav-tab-btn ${currentTab === 'feed' ? 'active' : ''}`}
              onClick={() => setCurrentTab('feed')}
            >
              <Eye size={15} />
              <span>Public Issues</span>
            </button>
          </div>
        </div>
      ) : (
        /* Official Mode Indicator */
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: 'var(--navy-soft)' }}>
          <Landmark size={16} color="var(--blue)" />
          <span style={{ fontWeight: 600, color: 'var(--navy)' }}>Governance Intelligence Portal</span>
        </div>
      )}

      {/* User Actions - Single unified account entry & reactive menu */}
      <div className="nav-actions">
        {session ? (
          <div style={{ position: 'relative' }} ref={menuRef}>
            {/* Authenticated Avatar / Pill Button */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="citizen-pill"
              style={{
                cursor: 'pointer',
                background: isOfficial ? 'var(--ice)' : 'var(--white)',
                borderColor: isOfficial ? 'var(--sky)' : 'var(--line)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px 6px 8px',
                transition: 'all 0.2s ease',
                boxShadow: isMenuOpen ? '0 0 0 2px var(--sky)' : 'none'
              }}
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: isOfficial ? 'var(--navy)' : 'var(--blue)',
                color: 'var(--white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11.5px',
                fontWeight: 700
              }}>
                {isOfficial ? <Landmark size={14} /> : getUserInitials(session.profile?.name)}
              </div>
              <span style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '13px' }}>
                {isOfficial 
                  ? (session.profile?.name?.split(',')[0] || 'Official')
                  : (session.profile?.name || 'Citizen Account')}
              </span>
              <ChevronDown size={14} color="var(--navy-soft)" style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '260px',
                background: 'var(--white)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 12px 32px rgba(8, 26, 58, 0.12)',
                zIndex: 1000,
                overflow: 'hidden',
                animation: 'fadeIn 0.15s ease'
              }}>
                {/* Account Details Header */}
                <div style={{ padding: '14px 16px', background: 'var(--ice)', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginBottom: '2px' }}>
                    {session.profile?.name || (isOfficial ? 'Government Official' : 'Citizen')}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--navy-soft)', wordBreak: 'break-all' }}>
                    {session.profile?.email || (isOfficial ? session.profile?.dept : 'Authenticated')}
                  </div>
                  <div style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: isOfficial ? 'var(--navy)' : 'var(--blue)', color: 'var(--white)' }}>
                    <Shield size={10} />
                    <span>{isOfficial ? `${(session.profile?.level || 'official').toUpperCase()} TIER OFFICIAL` : 'VERIFIED CITIZEN'}</span>
                  </div>
                </div>

                {/* Persona-specific Menu Items */}
                <div style={{ padding: '6px' }}>
                  {isCitizen && (
                    <>
                      <button
                        type="button"
                        className="dropdown-menu-item"
                        onClick={() => {
                          setCurrentTab('studio');
                          setIsMenuOpen(false);
                          const formEl = document.getElementById('complaint-form-card');
                          if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        <Sparkles size={15} color="var(--blue)" />
                        <span>Submit Issue</span>
                      </button>

                      <button
                        type="button"
                        className="dropdown-menu-item"
                        onClick={() => {
                          setCurrentTab('feed');
                          setIsMenuOpen(false);
                        }}
                      >
                        <Eye size={15} color="var(--blue)" />
                        <span>Browse Public Issues</span>
                      </button>

                      <button
                        type="button"
                        className="dropdown-menu-item"
                        onClick={() => {
                          setCurrentTab('my-issues');
                          setIsMenuOpen(false);
                        }}
                      >
                        <ClipboardList size={15} color="var(--blue)" />
                        <span>My Reported Issues</span>
                      </button>
                    </>
                  )}

                  {isOfficial && (
                    <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--navy-soft)' }}>
                      <div><strong>Jurisdiction:</strong> {session.profile?.state || 'All-India Scope'}</div>
                      <div style={{ marginTop: '2px' }}><strong>Dept:</strong> {session.profile?.department || '—'}</div>
                    </div>
                  )}

                  <div style={{ height: '1px', background: 'var(--line)', margin: '4px 0' }} />

                  {/* Sign Out Button */}
                  <button
                    type="button"
                    className="dropdown-menu-item danger"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout();
                    }}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Unauthenticated Single Sign In Entry Point */
          <button
            className="btn-secondary"
            onClick={() => onOpenAuth('select')}
            id="nav-signin-button"
            aria-label="Sign in to CivicLens"
          >
            <User size={15} style={{ marginRight: '6px' }} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </nav>
  );
}

