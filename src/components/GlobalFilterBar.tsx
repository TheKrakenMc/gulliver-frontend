import { ChevronDown, Bell, LogOut, User as UserIcon, Calendar, Menu, Settings, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { FilterState } from '../types';
import { useGlobalStore } from '../store/globalStore';
import { useState, useEffect } from 'react';
import GlobalDatePicker from './GlobalDatePicker';
import HierarchyManagerModal from './HierarchyManagerModal';

interface GlobalFilterBarProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  singleDateOnly?: boolean;
}

export default function GlobalFilterBar({
  filters,
  onFilterChange,
  darkMode,
  onToggleDarkMode,
  singleDateOnly,
}: GlobalFilterBarProps) {
  const { t, i18n } = useTranslation();
  const { userSession, logout, globalDateRange, setDateRange, notifications, clearNotifications, toggleMobileDrawer, hierarchy } = useGlobalStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isHierarchyModalOpen, setIsHierarchyModalOpen] = useState(false);

  // Dynamic Lists — 3 levels: Location > BusinessUnit > Process
  const locationsList = hierarchy.map(l => l.name);
  const selectedLoc = hierarchy.find(l => l.name === filters.location) || hierarchy[0];
  const businessUnitsList = selectedLoc ? selectedLoc.business_units.map(b => b.name) : [];
  const selectedBU = selectedLoc?.business_units.find(b => b.name === filters.businessUnit) || selectedLoc?.business_units[0];
  const processesList = selectedBU ? selectedBU.processes.map(p => p.name) : [];

  // Sync state if invalid
  useEffect(() => {
    if (hierarchy.length === 0) return;
    
    let updated = false;
    let newFilters = { ...filters };

    if (!locationsList.includes(filters.location) && locationsList.length > 0) {
      newFilters.location = locationsList[0];
      updated = true;
    }
    
    const loc = hierarchy.find(l => l.name === newFilters.location);
    const bus = loc ? loc.business_units.map(b => b.name) : [];
    if (!bus.includes(newFilters.businessUnit) && bus.length > 0) {
      newFilters.businessUnit = bus[0];
      updated = true;
    }

    const bu = loc?.business_units.find(b => b.name === newFilters.businessUnit);
    const procs = bu ? bu.processes.map(p => p.name) : [];
    if (!procs.includes(newFilters.process) && procs.length > 0) {
      newFilters.process = procs[0];
      updated = true;
    }

    if (updated) {
      if (newFilters.location !== filters.location) onFilterChange('location', newFilters.location);
      else if (newFilters.businessUnit !== filters.businessUnit) onFilterChange('businessUnit', newFilters.businessUnit);
      else if (newFilters.process !== filters.process) onFilterChange('process', newFilters.process);
    }
  }, [hierarchy, filters, onFilterChange]);

  const isSpanish = i18n.language === 'es';

  const toggleLanguage = () => {
    const newLang = isSpanish ? 'en' : 'es';
    i18n.changeLanguage(newLang);
    localStorage.setItem('gv_language', newLang);
  };

  const [isTablet, setIsTablet] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsTablet(window.innerWidth <= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectStyle: React.CSSProperties = {
    appearance: 'none',
    background: 'var(--gv-surface-alt)',
    border: '1px solid var(--gv-border)',
    borderRadius: 8,
    padding: isTablet ? '10px 30px 10px 12px' : '12px 42px 12px 18px',
    color: 'var(--gv-text-heading)',
    fontSize: 16,
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: isTablet ? 110 : 150,
    whiteSpace: 'nowrap',
  };

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
  };

  const chevronStyle: React.CSSProperties = {
    position: 'absolute',
    right: 12,
    pointerEvents: 'none',
    color: 'var(--gv-text-muted)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--gv-text-muted)',
    fontWeight: 700,
    marginBottom: 6,
  };

  return (
    <header
      className="hide-scrollbar"
      style={{
        background: 'var(--gv-surface)',
        borderBottom: '1px solid var(--gv-border)',
        padding: isTablet ? '10px 16px' : '12px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 60,
        backdropFilter: 'blur(12px)',
        overflowX: 'auto',
      }}
    >
      <div style={{ display: 'flex', gap: isTablet ? 12 : 16, alignItems: 'flex-end', flexWrap: 'nowrap', flexShrink: 0 }}>
        {/* Hamburger Menu Button for Tablet/Mobile Drawer */}
        {isTablet && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleMobileDrawer}
            style={{
              background: 'var(--gv-surface-alt)',
              border: '1px solid var(--gv-border)',
              color: 'var(--gv-text-heading)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 4,
              marginBottom: 0,
              height: 36,
              width: 36,
            }}
          >
            <Menu size={18} />
          </motion.button>
        )}

        {/* Date Range Selector */}
        <GlobalDatePicker isTablet={isTablet} singleDateOnly={singleDateOnly} />

        {!isTablet && <span style={{ color: 'var(--gv-text-muted)', fontSize: 18, marginBottom: 6, userSelect: 'none' }}>|</span>}

        {/* Location (Ubicación) */}
        <div>
          <div style={labelStyle}>{t('filters.location')}</div>
          <div style={wrapperStyle}>
            <select
              style={selectStyle}
              value={filters.location}
              onChange={(e) => onFilterChange('location', e.target.value)}
            >
              {locationsList.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <ChevronDown size={16} style={chevronStyle} />
          </div>
        </div>

        {!isTablet && <span style={{ color: 'var(--gv-text-muted)', fontSize: 18, marginBottom: 6, userSelect: 'none' }}>›</span>}

        {/* Business Unit (Unidad de Negocio) */}
        <div>
          <div style={labelStyle}>{t('filters.businessUnit')}</div>
          <div style={wrapperStyle}>
            <select
              style={selectStyle}
              value={filters.businessUnit}
              onChange={(e) => onFilterChange('businessUnit', e.target.value)}
            >
              {businessUnitsList.map((bu) => (
                <option key={bu} value={bu}>{bu}</option>
              ))}
            </select>
            <ChevronDown size={16} style={chevronStyle} />
          </div>
        </div>


        {!isTablet && <span style={{ color: 'var(--gv-text-muted)', fontSize: 18, marginBottom: 6, userSelect: 'none' }}>›</span>}

        {/* Process (Proceso) */}
        <div>
          <div style={labelStyle}>{t('filters.process')}</div>
          <div style={wrapperStyle}>
            <select
              style={selectStyle}
              value={filters.process}
              onChange={(e) => onFilterChange('process', e.target.value)}
            >
              {processesList.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <ChevronDown size={16} style={chevronStyle} />
          </div>
        </div>
      </div>

      {/* Actions & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        {/* Edit Hierarchy Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsHierarchyModalOpen(true)}
          style={{
            background: 'var(--gv-surface-alt)',
            border: '1px solid var(--gv-border)',
            color: 'var(--gv-text)',
            cursor: 'pointer',
            padding: 8,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--gv-shadow-sm)'
          }}
          title="Gestionar Plantas y Unidades"
        >
          <Building2 size={18} color="#3b82f6" />
        </motion.button>
      </div>
      
      <HierarchyManagerModal 
        isOpen={isHierarchyModalOpen} 
        onClose={() => setIsHierarchyModalOpen(false)} 
      />
    </header>
  );
}
