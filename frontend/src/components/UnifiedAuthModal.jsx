import React, { useState } from 'react';
import { 
  User, Landmark, X, ArrowRight, ShieldCheck, 
  Lock, Eye, EyeOff, AlertCircle, Sparkles, 
  LogIn, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

const DEMO_CITIZENS = [
  { name: 'Aarav Sharma', phone: '9876543210', location: 'Bengaluru, KA' },
  { name: 'Priya Patel', phone: '9811223344', location: 'Ahmedabad, GJ' },
  { name: 'Rameshwar Yadav', phone: '9988776655', location: 'Rampur, UP' },
  { name: 'Ananya Mukherjee', phone: '9123456780', location: 'Kolkata, WB' },
  { name: 'Karthik Swamy', phone: '9845012345', location: 'Hyderabad, TS' }
];

const PRESET_OFFICIALS = [
  { id: 'admin', pass: 'civic2026', name: 'Dr. Rajeshwar Rao, IAS', dept: 'National Infrastructure Mission', tag: 'National Tier', level: 'National' },
  { id: 'state_up', pass: 'jal2026', name: 'Anil Srivastava', dept: 'UP Jal Nigam & Rural Infra', tag: 'State Tier (UP)', level: 'State' },
  { id: 'delhi_pwd', pass: 'pwd2026', name: 'Sunita Verma', dept: 'Delhi Public Works Dept (PWD)', tag: 'State Tier (Delhi)', level: 'State' },
  { id: 'dm_varanasi', pass: 'varanasi2026', name: 'K. S. Sharma, DM', dept: 'District Administration, Varanasi', tag: 'District Tier (Varanasi)', level: 'District' },
  { id: 'bbmp_bangalore', pass: 'bbmp2026', name: 'Kavitha Reddy', dept: 'BBMP Urban Infrastructure & Traffic', tag: 'District Tier (Bengaluru)', level: 'District' },
  { id: 'local_rampur', pass: 'local2026', name: 'Rameshwar Yadav', dept: 'Rampur Village Development Office', tag: 'Local Tier (Rampur)', level: 'Local' }
];

export default function UnifiedAuthModal({ 
  isOpen, 
  onClose, 
  onCitizenAuthSuccess, 
  onOfficialAuthSuccess,
  initialMode = 'select' // 'select' | 'citizen' | 'official'
}) {
  // Active Tab: 'citizen' | 'official'
  const [activeTab, setActiveTab] = useState(initialMode === 'official' ? 'official' : 'citizen');
  
  // Citizen State
  const [citizenStep, setCitizenStep] = useState('phone'); // 'phone' | 'otp'
  const [phoneNumber, setPhoneNumber] = useState('9876543210');
  const [citizenName, setCitizenName] = useState('Aarav Sharma');
  const [otp, setOtp] = useState('');

  // Official State
  const [officialId, setOfficialId] = useState('admin');
  const [officialPassword, setOfficialPassword] = useState('civic2026');
  const [showOfficialPassword, setShowOfficialPassword] = useState(false);

  // Demo profile disclosure (Part H) — hidden by default
  const [showCitizenDemos, setShowCitizenDemos] = useState(false);
  const [showOfficialDemos, setShowOfficialDemos] = useState(false);

  // Common State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError('');
  };

  // --- Citizen Auth Handlers ---

  const handleSendPhoneOtp = async (e) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.sendOtp(cleanPhone);
      setCitizenStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to dispatch OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code (Demo: 123456).');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.verifyOtp(phoneNumber, otp.trim(), citizenName || 'Verified Citizen');
      onCitizenAuthSuccess(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillCitizenDemo = (demo) => {
    setPhoneNumber(demo.phone);
    setCitizenName(demo.name);
    setError('');
  };

  // --- Official Auth Handlers ---

  const handleOfficialLogin = async (e) => {
    e.preventDefault();
    if (!officialId.trim() || !officialPassword.trim()) {
      setError('Please provide your Official ID and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.officialLogin(officialId.trim(), officialPassword.trim());
      onOfficialAuthSuccess({
        ...res.official,
        token: res.token
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Invalid official credentials. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillOfficialPreset = (preset) => {
    setOfficialId(preset.id);
    setOfficialPassword(preset.pass);
    setError('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '32px 30px' }}
      >
        {/* Close Button */}
        <button 
          className="modal-close" 
          onClick={onClose}
          aria-label="Close authentication modal"
        >
          <X size={18} />
        </button>

        {/* Modal Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--ice)',
            border: '1.5px solid var(--sky)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            color: 'var(--blue)'
          }}>
            <svg viewBox="0 0 26 26" fill="none" width="26" height="26">
              <circle cx="13" cy="13" r="11" stroke="#1656e0" strokeWidth="2" />
              <circle cx="13" cy="13" r="4.5" fill="#1656e0" />
            </svg>
          </div>

          <div className="eyebrow" style={{ fontSize: '11px', padding: '3px 10px', margin: '0 auto 8px' }}>
            <Sparkles size={12} color="var(--blue)" />
            <span>AI for Digital Public Infrastructure</span>
          </div>

          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--navy)',
            margin: '0 0 4px',
            letterSpacing: '-0.02em'
          }}>
            Welcome to CivicLens
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--navy-soft)', margin: 0 }}>
            "Your problems, finally in focus."
          </p>
        </div>

        {/* Pill-Shaped Two-Tab Role Selector Toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--ice)',
          padding: '4px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--line)',
          marginBottom: '20px',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => handleTabSwitch('citizen')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '9px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'citizen' ? 'var(--blue)' : 'transparent',
              color: activeTab === 'citizen' ? 'var(--white)' : 'var(--navy-soft)',
              boxShadow: activeTab === 'citizen' ? '0 2px 8px rgba(22, 86, 224, 0.25)' : 'none'
            }}
          >
            <User size={15} />
            <span>I am a Citizen</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('official')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '9px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'official' ? 'var(--navy)' : 'transparent',
              color: activeTab === 'official' ? 'var(--white)' : 'var(--navy-soft)',
              boxShadow: activeTab === 'official' ? '0 2px 8px rgba(8, 26, 58, 0.25)' : 'none'
            }}
          >
            <Landmark size={15} />
            <span>Government Official</span>
          </button>
        </div>

        {/* Error Alert Display */}
        {error && (
          <div style={{
            background: 'var(--rose-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--rose)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ROLE 1: CITIZEN AUTHENTICATION (Numbered Two-Step Flow)                    */}
        {/* ========================================================================= */}
        {activeTab === 'citizen' && (
          <div>
            {/* Step Indicator Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
              padding: '8px 12px',
              background: 'var(--ice)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--line)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: citizenStep === 'phone' ? 'var(--blue)' : 'var(--emerald)'
              }}>
                <span style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: citizenStep === 'phone' ? 'var(--blue)' : 'var(--emerald)',
                  color: 'var(--white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  {citizenStep === 'otp' ? '✓' : '1'}
                </span>
                <span>Step 1: Mobile Phone</span>
              </div>

              <ChevronRight size={14} color="var(--navy-soft)" />

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: citizenStep === 'otp' ? 'var(--blue)' : 'var(--navy-soft)',
                opacity: citizenStep === 'otp' ? 1 : 0.6
              }}>
                <span style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: citizenStep === 'otp' ? 'var(--blue)' : 'var(--line)',
                  color: citizenStep === 'otp' ? 'var(--white)' : 'var(--navy)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  2
                </span>
                <span>Step 2: 6-Digit OTP</span>
              </div>
            </div>

            {/* Step 1: Phone Entry */}
            {citizenStep === 'phone' && (
              <form onSubmit={handleSendPhoneOtp}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--navy)', marginBottom: '5px' }}>
                    Indian Mobile Number (+91)
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1.5px solid var(--line)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0 14px',
                    background: 'var(--white)',
                    transition: 'border-color 0.2s'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--navy)', marginRight: '10px' }}>
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="98765 43210"
                      required
                      style={{
                        width: '100%',
                        padding: '11px 0',
                        border: 'none',
                        fontSize: '14.5px',
                        outline: 'none',
                        color: 'var(--navy)',
                        fontWeight: 500
                      }}
                      autoFocus
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--navy)', marginBottom: '5px' }}>
                    Citizen Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--line)',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  />
                </div>



                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px' }}
                >
                  <span>{loading ? 'Sending OTP code...' : 'Get OTP Code'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {citizenStep === 'otp' && (
              <form onSubmit={handleVerifyPhoneOtp}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--navy)' }}>
                      6-Digit OTP sent to +91 {phoneNumber}
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtp('123456')}
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--blue)',
                        background: 'none',
                        border: 'none',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Auto-fill (123456)
                    </button>
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    required
                    style={{
                      width: '100%',
                      padding: '13px',
                      border: '1.5px solid var(--line)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '22px',
                      letterSpacing: '8px',
                      textAlign: 'center',
                      fontWeight: 700,
                      color: 'var(--navy)',
                      background: 'var(--ice)',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center', padding: '12px', fontSize: '14px' }}
                  >
                    <ShieldCheck size={16} />
                    <span>{loading ? 'Verifying OTP...' : 'Verify & Access'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setCitizenStep('phone'); setError(''); }}
                    className="btn-secondary"
                    style={{ padding: '12px 14px', fontSize: '13px' }}
                  >
                    Change Number
                  </button>
                </div>
              </form>
            )}

            {/* Quick Demo Citizen Profiles — hidden by default (Part H) */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
              <button
                type="button"
                onClick={() => setShowCitizenDemos(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '13.5px', fontWeight: 600, color: 'var(--navy-soft)', padding: 0
                }}
              >
                {showCitizenDemos ? <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} /> : <ChevronRight size={14} />}
                {showCitizenDemos ? 'Hide demo profiles' : 'Show demo profiles'}
              </button>
              {showCitizenDemos && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                  {DEMO_CITIZENS.map((demo) => {
                    const isSelected = phoneNumber === demo.phone;
                    return (
                      <button
                        key={demo.phone}
                        type="button"
                        onClick={() => handleFillCitizenDemo(demo)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '5px 10px', borderRadius: 'var(--radius-full)',
                          fontSize: '13.5px', fontWeight: isSelected ? 600 : 500,
                          background: isSelected ? 'var(--sky)' : 'var(--ice)',
                          border: isSelected ? '1px solid var(--blue)' : '1px solid var(--line)',
                          color: 'var(--navy)', cursor: 'pointer', transition: 'all 0.15s ease'
                        }}
                      >
                        <span>{demo.name}</span>
                        <span style={{ fontSize: '12.5px', color: 'var(--navy-soft)' }}>({demo.phone.slice(-4)})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ROLE 2: GOVERNMENT OFFICIAL LOGIN (Numbered Two-Step Flow)                 */}
        {/* ========================================================================= */}
        {activeTab === 'official' && (
          <div>
            {/* Step Indicator Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
              padding: '8px 12px',
              background: 'var(--ice)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--line)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--navy)'
              }}>
                <span style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'var(--navy)',
                  color: 'var(--white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  1
                </span>
                <span>Step 1: Official ID</span>
              </div>

              <ChevronRight size={14} color="var(--navy-soft)" />

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--navy)'
              }}>
                <span style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'var(--navy)',
                  color: 'var(--white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  2
                </span>
                <span>Step 2: Password</span>
              </div>
            </div>

            <form onSubmit={handleOfficialLogin}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--navy)', marginBottom: '5px' }}>
                  Step 1 · Official ID / Username
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={officialId}
                    onChange={(e) => setOfficialId(e.target.value)}
                    placeholder="e.g. admin, state_up, dm_varanasi, bbmp_bangalore"
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--line)',
                      fontSize: '13.5px',
                      outline: 'none',
                      color: 'var(--navy)',
                      fontWeight: 500
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--navy)', marginBottom: '5px' }}>
                  Step 2 · Password (bcrypt verified)
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--navy-soft)' }} />
                  <input
                    type={showOfficialPassword ? 'text' : 'password'}
                    value={officialPassword}
                    onChange={(e) => setOfficialPassword(e.target.value)}
                    placeholder="Enter official password"
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 38px 10px 36px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--line)',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOfficialPassword(!showOfficialPassword)}
                    aria-label={showOfficialPassword ? "Hide password" : "Show password"}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--navy-soft)',
                      padding: 0
                    }}
                  >
                    {showOfficialPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '12px',
                  fontSize: '14px',
                  background: 'var(--navy)'
                }}
              >
                <LogIn size={16} />
                <span>{loading ? 'Authenticating Official...' : 'Enter Governance Portal'}</span>
              </button>
            </form>

            {/* Quick Demo 4-Tier Official Accounts — hidden by default (Part H) */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
              <button
                type="button"
                onClick={() => setShowOfficialDemos(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '13.5px', fontWeight: 600, color: 'var(--navy-soft)', padding: 0
                }}
              >
                {showOfficialDemos ? <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} /> : <ChevronRight size={14} />}
                {showOfficialDemos ? 'Hide demo profiles' : 'Show demo profiles'}
              </button>
              {showOfficialDemos && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '10px' }}>
                  {PRESET_OFFICIALS.map((p) => {
                    const isSelected = officialId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleFillOfficialPreset(p)}
                        style={{
                          textAlign: 'left', padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: isSelected ? 'var(--sky)' : 'var(--ice)',
                          border: isSelected ? '1.5px solid var(--blue)' : '1px solid var(--line)',
                          color: 'var(--navy)', cursor: 'pointer', transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700 }}>{p.tag}</span>
                          <span style={{ fontSize: '11px', background: 'rgba(8, 26, 58, 0.1)', color: 'var(--navy)', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                            {p.level}
                          </span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--navy-soft)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
