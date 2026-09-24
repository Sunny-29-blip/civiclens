import React, { useState } from 'react';
import { Landmark, X, AlertCircle, LogIn, Sparkles, Shield } from 'lucide-react';
import { api } from '../services/api';

const PRESET_OFFICIALS = [
  { id: 'admin', pass: 'civic2026', name: 'Dr. Rajeshwar Rao, IAS', dept: 'National Mission', tag: 'National Tier', level: 'National' },
  { id: 'state_up', pass: 'jal2026', name: 'Anil Srivastava', dept: 'UP Jal Nigam', tag: 'State Tier (UP)', level: 'State' },
  { id: 'delhi_pwd', pass: 'pwd2026', name: 'Sunita Verma', dept: 'Delhi PWD', tag: 'State Tier (Delhi)', level: 'State' },
  { id: 'dm_varanasi', pass: 'varanasi2026', name: 'K. S. Sharma, DM', dept: 'District Admin', tag: 'District Tier (Varanasi)', level: 'District' },
  { id: 'bbmp_bangalore', pass: 'bbmp2026', name: 'Kavitha Reddy', dept: 'BBMP Urban Infra', tag: 'District Tier (Bengaluru)', level: 'District' },
  { id: 'local_rampur', pass: 'local2026', name: 'Rameshwar Yadav', dept: 'Gram Panchayat', tag: 'Local Tier (Rampur)', level: 'Local' }
];

export default function OfficialLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [officialId, setOfficialId] = useState('admin');
  const [password, setPassword] = useState('civic2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.officialLogin(officialId, password);
      onLoginSuccess({
        ...res.official,
        token: res.token
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Invalid official credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setOfficialId(preset.id);
    setPassword(preset.pass);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'var(--navy)',
            color: 'var(--white)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <Landmark size={26} />
          </div>
          <h2 style={{ fontSize: '22px', marginBottom: '6px' }}>
            Government Officials Login
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--navy-soft)' }}>
            Tier-authenticated access for National, State, District, and Local governance officers.
          </p>
        </div>

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

        {/* 4-Tier Demo Presets */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--navy-soft)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Select 1-Click Demo Tier Account:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {PRESET_OFFICIALS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p)}
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: officialId === p.id ? 'var(--sky)' : 'var(--ice)',
                  border: officialId === p.id ? '1.5px solid var(--blue)' : '1px solid var(--line)',
                  color: 'var(--navy)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700 }}>{p.tag}</span>
                  <span style={{ fontSize: '9.5px', background: 'rgba(22, 86, 224, 0.1)', color: 'var(--blue)', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>{p.level}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--navy-soft)', marginTop: '2px' }}>{p.name}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--navy)', marginBottom: '5px' }}>
              Official ID
            </label>
            <input
              type="text"
              value={officialId}
              onChange={(e) => setOfficialId(e.target.value)}
              placeholder="e.g. admin, state_up, dm_varanasi, local_rampur"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1.5px solid var(--line)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13.5px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--navy)', marginBottom: '5px' }}>
              Password (bcrypt verified)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1.5px solid var(--line)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13.5px'
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          >
            <LogIn size={16} />
            <span>{loading ? 'Authenticating...' : 'Enter Governance Portal'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
