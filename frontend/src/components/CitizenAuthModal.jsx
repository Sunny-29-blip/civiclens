import React, { useState } from 'react';
import { Phone, KeyRound, ArrowRight, ShieldCheck, X, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function CitizenAuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phoneNumber, setPhoneNumber] = useState('9876543210');
  const [otp, setOtp] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoHint, setDemoHint] = useState('');

  if (!isOpen) return null;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.sendOtp(phoneNumber);
      setDemoHint(res.demo_hint || 'Demo OTP: 123456');
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.verifyOtp(phoneNumber, otp, citizenName);
      onAuthSuccess(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Verification failed. Try Demo OTP: 123456');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoPhone, name) => {
    setPhoneNumber(demoPhone);
    setCitizenName(name);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'var(--ice)',
            border: '1px solid var(--sky)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            color: 'var(--blue)'
          }}>
            {step === 'phone' ? <Phone size={24} /> : <KeyRound size={24} />}
          </div>
          <h2 style={{ fontSize: '22px', marginBottom: '6px' }}>
            {step === 'phone' ? 'Citizen Authentication' : 'Enter Verification Code'}
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--navy-soft)' }}>
            {step === 'phone' 
              ? 'Enter your mobile number to submit complaints and back public issues.' 
              : `6-digit OTP sent to +91 ${phoneNumber}`}
          </p>
        </div>

        {/* Error Alert */}
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
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Phone Form */}
        {step === 'phone' ? (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>
                Indian Mobile Number
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                border: '1.5px solid var(--line)',
                borderRadius: 'var(--radius-md)',
                padding: '0 14px',
                background: 'var(--white)'
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
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    border: 'none',
                    fontSize: '15px',
                    fontWeight: 500,
                    color: 'var(--navy)'
                  }}
                  autoFocus
                />
              </div>
            </div>

            {/* Quick Demo Personas */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--navy-soft)', marginBottom: '8px', fontWeight: 600 }}>
                Quick Demo Personas:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleFillDemo('9876543210', 'Aarav Sharma')}
                  style={{
                    fontSize: '12px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: phoneNumber === '9876543210' ? 'var(--sky)' : 'var(--ice)',
                    border: '1px solid var(--line)',
                    color: 'var(--navy)'
                  }}
                >
                  Aarav (Urban)
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemo('9988776655', 'Rameshwar Yadav')}
                  style={{
                    fontSize: '12px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: phoneNumber === '9988776655' ? 'var(--sky)' : 'var(--ice)',
                    border: '1px solid var(--line)',
                    color: 'var(--navy)'
                  }}
                >
                  Rameshwar (Rural)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              <span>{loading ? 'Sending OTP...' : 'Get OTP Code'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          /* Step 2: OTP Form */
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--navy)' }}>
                  6-Digit OTP
                </label>
                <button
                  type="button"
                  onClick={() => setOtp('123456')}
                  style={{
                    fontSize: '12px',
                    color: 'var(--blue)',
                    background: 'none',
                    fontWeight: 600
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
                style={{
                  width: '100%',
                  padding: '14px',
                  border: '1.5px solid var(--line)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '22px',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  fontWeight: 700,
                  color: 'var(--navy)',
                  background: 'var(--ice)'
                }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--navy-soft)', marginBottom: '4px' }}>
                Your Name (Optional)
              </label>
              <input
                type="text"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginBottom: '10px' }}
            >
              <span>{loading ? 'Verifying...' : 'Verify & Continue'}</span>
              <ShieldCheck size={16} />
            </button>

            <button
              type="button"
              onClick={() => setStep('phone')}
              style={{
                width: '100%',
                background: 'none',
                color: 'var(--navy-soft)',
                fontSize: '13px',
                padding: '6px'
              }}
            >
              Change Phone Number
            </button>
          </form>
        )}

        {/* Statutory / Project Notice */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--line)',
          fontSize: '11px',
          color: 'var(--navy-soft)',
          lineHeight: '1.4',
          textAlign: 'center'
        }}>
          🛡️ <strong>Hackathon Notice</strong>: This uses phone SMS authentication. 
          Real Aadhaar / UIDAI biometric verification requires government statutory authorization not accessible for hackathons.
        </div>
      </div>
    </div>
  );
}
