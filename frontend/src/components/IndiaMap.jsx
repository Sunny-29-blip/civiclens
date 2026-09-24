import React, { useState, useCallback } from 'react';
import { api } from '../services/api';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { Map as MapIcon, AlertCircle } from 'lucide-react';
import statesGeoData from '../data/india_states.json';
import districtsGeoData from '../data/india_districts.json';

/* ─── Name normalization & alias map ──────────────────────────────────────── */
const normalize = (s) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();

const STATE_ALIASES = {
  'andaman and nicobar': 'andaman & nicobar islands',
  'jammu and kashmir': 'jammu & kashmir',
  'nct of delhi': 'delhi',
  'delhi': 'nct of delhi',
  'uttarakhand': 'uttaranchal',
  'uttaranchal': 'uttarakhand',
  'odisha': 'orissa',
  'orissa': 'odisha',
  'dadra and nagar haveli and daman and diu': 'dadra and nagar haveli',
};

const DISTRICT_ALIASES = {
  'bengaluru urban': 'bangalore urban',
  'bangalore urban': 'bengaluru urban',
  'bengaluru rural': 'bangalore rural',
  'bangalore rural': 'bengaluru rural',
  'bengaluru': 'bangalore',
  'bangalore': 'bengaluru',
  'gurugram': 'gurgaon',
  'gurgaon': 'gurugram',
  'vishakhapatnam': 'visakhapatnam',
  'visakhapatnam': 'vishakhapatnam',
};

function matchRegion(geoName, dataMap, aliases) {
  const key = normalize(geoName);
  if (dataMap.has(key)) return dataMap.get(key);
  const alt = aliases[key];
  if (alt && dataMap.has(normalize(alt))) return dataMap.get(normalize(alt));
  return null;
}

/* ─── Color scale (light → dark blue) ────────────────────────────────────── */
// #bfe0ff (--sky) → #0a2e86 (--navy-deep)
function interpolateColor(t) {
  const r = Math.round(0xbf + (0x0a - 0xbf) * t);
  const g = Math.round(0xe0 + (0x2e - 0xe0) * t);
  const b = Math.round(0xff + (0x86 - 0xff) * t);
  return `rgb(${r},${g},${b})`;
}

function regionColor(count, maxCount) {
  if (!maxCount || maxCount === 0) return interpolateColor(0.12);
  const t = Math.pow(count / maxCount, 0.6);
  return interpolateColor(0.1 + t * 0.85);
}

// Part B: sky-blue hover fill (#bfe0ff = --sky)
const SKY_HOVER   = '#bfe0ff';
const NO_DATA_COLOR = '#e8f0fb';

/* ─── Tooltip ─────────────────────────────────────────────────────────────── */
function MapTooltip({ x, y, content }) {
  if (!content) return null;
  return (
    <div style={{
      position: 'fixed',
      left: x + 14, top: y - 8,
      background: 'var(--navy)', color: '#fff',
      fontSize: '12px', fontWeight: 500,
      padding: '6px 10px', borderRadius: 'var(--radius-sm)',
      pointerEvents: 'none', zIndex: 9999,
      whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
      lineHeight: 1.4, border: '1px solid var(--sky)'
    }}>
      {content}
    </div>
  );
}

/* ─── District stat card (local tier) ────────────────────────────────────── */
function DistrictStatCard({ regions }) {
  const region = regions?.[0];
  if (!region) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: 'var(--navy-soft)', fontSize: '13px' }}>
        No data available for this district.
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', padding: '24px 0' }}>
      <div style={{
        background: 'var(--ice)', border: '1px solid var(--sky)',
        borderRadius: 'var(--radius-md)', padding: '24px 32px',
        textAlign: 'center', minWidth: '160px', boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--blue)', lineHeight: 1.1 }}>
          {region.complaint_count}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--navy-soft)', marginTop: '4px', fontWeight: 500 }}>
          Total Complaints
        </div>
      </div>
      <div style={{
        background: 'var(--ice)', border: '1px solid var(--sky)',
        borderRadius: 'var(--radius-md)', padding: '24px 32px',
        textAlign: 'center', minWidth: '160px', boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--navy)', lineHeight: 1.1 }}>
          {region.avg_priority_score}<span style={{ fontSize: '16px', fontWeight: 500 }}>/100</span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--navy-soft)', marginTop: '4px', fontWeight: 500 }}>
          Avg Priority Score
        </div>
      </div>
    </div>
  );
}

/* ─── Choropleth map panel ────────────────────────────────────────────────── */
function ChoroplethMap({ geoData, isNational, scopeState, dataMap, maxCount }) {
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, content: null });
  const [hoveredKey, setHoveredKey] = useState(null);

  const handleMouseMove = useCallback((e) => {
    setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
  }, []);

  const STATE_CENTERS = {
    'uttar pradesh': [81.0, 27.0], 'maharashtra': [75.7, 19.7], 'rajasthan': [74.2, 27.0],
    'madhya pradesh': [78.6, 23.5], 'tamil nadu': [78.6, 10.9], 'karnataka': [76.9, 15.3],
    'gujarat': [71.5, 22.2], 'andhra pradesh': [79.7, 15.9], 'odisha': [85.1, 20.9],
    'west bengal': [87.8, 22.8], 'telangana': [79.0, 17.4], 'kerala': [76.2, 10.4],
    'bihar': [85.3, 25.1], 'jharkhand': [85.3, 23.6], 'assam': [92.9, 26.2],
    'punjab': [75.3, 31.1], 'haryana': [76.0, 29.0], 'delhi': [77.1, 28.7],
    'himachal pradesh': [77.1, 31.8], 'uttarakhand': [79.0, 30.1],
    'chhattisgarh': [81.8, 21.3], 'default': [82.0, 22.0]
  };
  const stateCenter = STATE_CENTERS[scopeState] || STATE_CENTERS['default'];

  const projectionConfig = isNational
    ? { scale: 1000, center: [82, 22] }
    : { scale: 3400, center: stateCenter };

  return (
    // Part A fix: explicit height on the container so SVG doesn't collapse
    <div
      style={{ width: '100%', height: '420px', position: 'relative', userSelect: 'none' }}
      onMouseMove={handleMouseMove}
    >
      <ComposableMap
        projection="geoMercator"
        projectionConfig={projectionConfig}
        style={{ width: '100%', height: '100%' }}
        width={800}
        height={420}
      >
        <ZoomableGroup>
          <Geographies geography={geoData}>
            {({ geographies }) => {
              if (!geographies || !Array.isArray(geographies) || geographies.length === 0) {
                return null;
              }
              const visibleGeos = isNational
                ? geographies
                : geographies.filter(geo => {
                    const geoState = normalize(geo.properties?.NAME_1 || '');
                    return geoState === scopeState ||
                      STATE_ALIASES[scopeState] === geoState ||
                      STATE_ALIASES[geoState] === scopeState;
                  });

              return visibleGeos.map(geo => {
                const rawName = isNational
                  ? (geo.properties?.NAME_1 || 'Unknown')
                  : (geo.properties?.NAME_2 || geo.properties?.NAME_1 || 'Unknown');
                const regionData = matchRegion(rawName, dataMap, isNational ? STATE_ALIASES : DISTRICT_ALIASES);
                const count = regionData?.complaint_count ?? 0;
                const avgPs = regionData?.avg_priority_score ?? '—';

                const isHovered = hoveredKey === geo.rsmKey;

                // Part B: hover fill is --sky (#bfe0ff), distinct from the data-driven fill
                const baseFill = count > 0 ? regionColor(count, maxCount) : NO_DATA_COLOR;
                const fill = isHovered ? SKY_HOVER : baseFill;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={isHovered ? 1.5 : 0.5}
                    style={{
                      default:  { outline: 'none', transition: 'fill 0.12s ease' },
                      hover:    { outline: 'none', cursor: 'pointer' },
                      pressed:  { outline: 'none' }
                    }}
                    onMouseEnter={() => {
                      setHoveredKey(geo.rsmKey);
                      const label = count > 0
                        ? `${rawName}: ${count} complaint${count !== 1 ? 's' : ''} · Avg priority: ${avgPs}/100`
                        : `${rawName}: No data`;
                      setTooltip(prev => ({ ...prev, content: label }));
                    }}
                    onMouseLeave={() => {
                      setHoveredKey(null);
                      setTooltip(prev => ({ ...prev, content: null }));
                    }}
                  />
                );
              });
            }}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      <MapTooltip x={tooltip.x} y={tooltip.y} content={tooltip.content} />
    </div>
  );
}

/* ─── Main IndiaMap component ─────────────────────────────────────────────── */
export default function IndiaMap({ token }) {
  const [mapData, setMapData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!token) { setLoaded(true); return; }
    api.getMapData(token)
      .then(data => { setMapData(data); setLoaded(true); })
      .catch(err => { setError(err.message); setLoaded(true); });
  }, [token]);

  // Build lookup map
  const dataMap = React.useMemo(() => {
    const m = new Map();
    if (mapData?.regions) {
      for (const r of mapData.regions) m.set(normalize(r.name), r);
    }
    return m;
  }, [mapData]);

  const maxCount = React.useMemo(
    () => Math.max(1, ...(mapData?.regions?.map(r => r.complaint_count) || [1])),
    [mapData]
  );

  // No map for local tier
  if (loaded && mapData?.level === 'local') return null;

  const level = mapData?.level;
  const scope = mapData?.scope;

  const mapTitle = !level
    ? 'Complaint Density Map'
    : level === 'national'
      ? 'India — Complaint Density by State'
      : level === 'state'
        ? `${scope?.state || 'State'} — Complaint Density by District`
        : `District Summary: ${scope?.district || '—'}`;

  const cardStyle = {
    background: 'var(--white)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
    boxShadow: 'var(--shadow-sm)'
  };

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
      <MapIcon size={18} color="var(--blue)" />
      <h3 style={{ fontSize: '16px', margin: 0 }}>{mapTitle}</h3>
      {(level === 'national' || level === 'state') && (
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--navy-soft)' }}>
          Hover for details · Scroll to zoom
        </span>
      )}
    </div>
  );

  // Loading
  if (!loaded) {
    return (
      <div style={cardStyle}>
        {header}
        <div style={{ height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy-soft)', fontSize: '13px' }}>
          <div>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              border: '3px solid var(--line)', borderTopColor: 'var(--blue)',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 10px'
            }} />
            Loading map data…
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--rose)', fontSize: '13px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      </div>
    );
  }

  // No token / no data: show placeholder
  if (!mapData) {
    return (
      <div style={cardStyle}>
        {header}
        <div style={{ height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy-soft)', fontSize: '13px' }}>
          Map data unavailable — log in as a government official to view.
        </div>
      </div>
    );
  }

  // District tier → stat card (no choropleth needed)
  if (level === 'district') {
    return (
      <div style={cardStyle}>
        {header}
        <DistrictStatCard regions={mapData.regions} />
      </div>
    );
  }

  // National / State tier → choropleth
  const isNational = level === 'national';
  const scopeState = normalize(scope?.state || '');
  const geoData = isNational ? statesGeoData : districtsGeoData;

  return (
    <div style={cardStyle}>
      {header}

      {/* Color legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', color: 'var(--navy-soft)' }}>Fewer</span>
        <div style={{
          flex: 1, maxWidth: '140px', height: '7px', borderRadius: '4px',
          background: `linear-gradient(to right, ${interpolateColor(0.1)}, ${interpolateColor(0.95)})`
        }} />
        <span style={{ fontSize: '11px', color: 'var(--navy-soft)' }}>More complaints</span>
        <span style={{ fontSize: '11px', color: 'var(--navy-soft)', marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ display: 'inline-block', width: '14px', height: '10px', background: SKY_HOVER, borderRadius: '2px', border: '1px solid #93c5fd' }} />
          Hovered
        </span>
      </div>

      <ChoroplethMap
        geoData={geoData}
        isNational={isNational}
        scopeState={scopeState}
        dataMap={dataMap}
        maxCount={maxCount}
      />

      <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--navy-soft)' }}>
        Shading based on complaint count per region · Hover to inspect exact figures
      </div>
    </div>
  );
}
