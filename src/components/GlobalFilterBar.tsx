import { Sun, Moon, ChevronDown } from 'lucide-react';
import type { FilterState } from '../types';
import { filterOptions } from '../data/mockData';

interface GlobalFilterBarProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function GlobalFilterBar({
  filters,
  onFilterChange,
  darkMode,
  onToggleDarkMode,
}: GlobalFilterBarProps) {
  const selectStyle: React.CSSProperties = {
    appearance: 'none',
    background: 'var(--gv-surface-alt)',
    border: '1px solid var(--gv-border)',
    borderRadius: 8,
    padding: '8px 36px 8px 14px',
    color: 'var(--gv-text-heading)',
    fontSize: 13,
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: 150,
  };

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
  };

  const chevronStyle: React.CSSProperties = {
    position: 'absolute',
    right: 10,
    pointerEvents: 'none',
    color: 'var(--gv-text-muted)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--gv-text-muted)',
    fontWeight: 600,
    marginBottom: 4,
  };

  return (
    <header
      style={{
        background: 'var(--gv-surface)',
        borderBottom: '1px solid var(--gv-border)',
        padding: '12px 28px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {/* Location */}
        <div>
          <div style={labelStyle}>Location</div>
          <div style={wrapperStyle}>
            <select
              style={selectStyle}
              value={filters.location}
              onChange={(e) => onFilterChange('location', e.target.value)}
            >
              {filterOptions.locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <ChevronDown size={14} style={chevronStyle} />
          </div>
        </div>

        {/* Separator */}
        <span style={{ color: 'var(--gv-text-muted)', fontSize: 18, marginBottom: 6, userSelect: 'none' }}>›</span>

        {/* Business Unit */}
        <div>
          <div style={labelStyle}>Business Unit</div>
          <div style={wrapperStyle}>
            <select
              style={selectStyle}
              value={filters.businessUnit}
              onChange={(e) => onFilterChange('businessUnit', e.target.value)}
            >
              {filterOptions.businessUnits.map((bu) => (
                <option key={bu} value={bu}>{bu}</option>
              ))}
            </select>
            <ChevronDown size={14} style={chevronStyle} />
          </div>
        </div>

        <span style={{ color: 'var(--gv-text-muted)', fontSize: 18, marginBottom: 6, userSelect: 'none' }}>›</span>

        {/* Facility */}
        <div>
          <div style={labelStyle}>Facility</div>
          <div style={wrapperStyle}>
            <select
              style={selectStyle}
              value={filters.facility}
              onChange={(e) => onFilterChange('facility', e.target.value)}
            >
              {filterOptions.facilities.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <ChevronDown size={14} style={chevronStyle} />
          </div>
        </div>

        <span style={{ color: 'var(--gv-text-muted)', fontSize: 18, marginBottom: 6, userSelect: 'none' }}>›</span>

        {/* Process */}
        <div>
          <div style={labelStyle}>Process</div>
          <div style={wrapperStyle}>
            <select
              style={selectStyle}
              value={filters.process}
              onChange={(e) => onFilterChange('process', e.target.value)}
            >
              {filterOptions.processes.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <ChevronDown size={14} style={chevronStyle} />
          </div>
        </div>
      </div>

      {/* Dark mode toggle */}
      <button
        onClick={onToggleDarkMode}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 10,
          border: '1px solid var(--gv-border)',
          background: 'var(--gv-surface-alt)',
          color: 'var(--gv-text)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          flexShrink: 0,
        }}
        title={darkMode ? 'Light Mode (Reportes)' : 'Dark Mode (Control)'}
      >
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
  );
}
