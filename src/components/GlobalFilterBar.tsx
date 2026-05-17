import { Sun, Moon, ChevronDown, Bell, LogOut, User as UserIcon, Calendar, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { FilterState } from '../types';
import { filterOptions } from '../data/mockData';
import { useGlobalStore } from '../store/globalStore';
import { useState, useEffect } from 'react';

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
  const { t, i18n } = useTranslation();
  const { userSession, logout, globalDateRange, setDateRange, notifications, clearNotifications, toggleMobileDrawer } = useGlobalStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isSpanish = i18n.language === 'es';

  const toggleLanguage = () => {
    i18n.changeLanguage(isSpanish ? 'en' : 'es');
  };

  const [isTablet, setIsTablet] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsTablet(window.innerWidth < 1024);
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
    padding: isTablet ? '8px 26px 8px 10px' : '8px 36px 8px 14px',
    color: 'var(--gv-text-heading)',
    fontSize: 13,
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: isTablet ? 90 : 120,
  };

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
  };

  const chevronStyle: React.CSSProperties = {
    position: 'absolute',
    right: 8,
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
        padding: isTablet ? '10px 16px' : '12px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ display: 'flex', gap: isTablet ? 8 : 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
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
        <div>
          <div style={labelStyle}>{t('common.date', 'Date Range')}</div>
          <div style={wrapperStyle}>
            <div style={{ position: 'absolute', left: 8, color: 'var(--gv-text-muted)' }}>
              <Calendar size={13} />
            </div>
            <select
              style={{ ...selectStyle, paddingLeft: 28 }}
              value={globalDateRange.preset}
              onChange={(e) => {
                const preset = e.target.value as any;
                const today = new Date().toISOString().split('T')[0];
                setDateRange({ startDate: today, endDate: today, preset });
              }}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <ChevronDown size={13} style={chevronStyle} />
          </div>
        </div>

        {!isTablet && <span style={{ color: 'var(--gv-text-muted)', fontSize: 18, marginBottom: 6, userSelect: 'none' }}>|</span>}

        {/* Location */}
        <div>
          <div style={labelStyle}>{t('filters.location')}</div>
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
            <ChevronDown size={13} style={chevronStyle} />
          </div>
        </div>

        {!isTablet && <span style={{ color: 'var(--gv-text-muted)', fontSize: 18, marginBottom: 6, userSelect: 'none' }}>›</span>}

        {/* Business Unit */}
        <div>
          <div style={labelStyle}>{t('filters.businessUnit')}</div>
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
            <ChevronDown size={13} style={chevronStyle} />
          </div>
        </div>

        {!isTablet && <span style={{ color: 'var(--gv-text-muted)', fontSize: 18, marginBottom: 6, userSelect: 'none' }}>›</span>}

        {/* Facility */}
        <div>
          <div style={labelStyle}>{t('filters.facility')}</div>
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
            <ChevronDown size={13} style={chevronStyle} />
          </div>
        </div>

        {!isTablet && <span style={{ color: 'var(--gv-text-muted)', fontSize: 18, marginBottom: 6, userSelect: 'none' }}>›</span>}

        {/* Process */}
        <div>
          <div style={labelStyle}>{t('filters.process')}</div>
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
            <ChevronDown size={13} style={chevronStyle} />
          </div>
        </div>
      </div>

      {/* Actions & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>

        {/* Language Switcher */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleLanguage}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 10,
            border: '1px solid var(--gv-border)',
            background: 'var(--gv-surface-alt)',
            color: 'var(--gv-text)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={i18n.language}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span style={{ fontSize: 18 }}>{isSpanish ? '🇲🇽' : '🇺🇸'}</span>
              <span style={{ color: 'var(--gv-text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                {isSpanish ? 'ES' : 'EN'}
              </span>
            </motion.div>
          </AnimatePresence>
        </motion.button>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl border border-[var(--gv-border)] bg-[var(--gv-surface-alt)] text-[var(--gv-text)] hover:bg-[var(--gv-border)] transition-colors"
          title={darkMode ? 'Light Mode' : 'Dark Mode'}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (notifications > 0 && !showNotifications) clearNotifications();
            }}
            className="p-2 rounded-xl border border-[var(--gv-border)] bg-[var(--gv-surface-alt)] text-[var(--gv-text)] hover:bg-[var(--gv-border)] transition-colors relative"
          >
            <Bell size={18} />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-[var(--gv-surface)]">
                {notifications}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-64 rounded-xl border border-[var(--gv-border)] bg-[var(--gv-surface)] p-4 shadow-xl z-50 backdrop-blur-xl"
                style={{
                  top: '105%',
                  right: 0,
                  padding: 10,
                  zIndex: 50,
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
              >
                <h4 className="text-sm font-bold text-[var(--gv-text-heading)] mb-2">Notifications</h4>
                <div className="text-xs text-[var(--gv-text-muted)] text-center py-4">
                  No new notifications
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-[var(--gv-border)] mx-1" />

        {/* User Profile */}
        {userSession && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-1.5 pr-3 rounded-xl border border-transparent hover:border-[var(--gv-border)] hover:bg-[var(--gv-surface-alt)] transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
                <UserIcon size={18} />
              </div>
              <div className="flex flex-col items-start hidden sm:flex">
                <span className="text-sm font-bold text-[var(--gv-text-heading)] leading-tight">{userSession.name}</span>
                <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider">{userSession.role}</span>
              </div>
              <ChevronDown size={14} className="text-[var(--gv-text-muted)] hidden sm:block ml-1" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--gv-border)] bg-[var(--gv-surface)] p-2 shadow-xl z-50 backdrop-blur-xl"
                  style={{
                    top: '105%',
                    right: 0,
                    padding: 10,
                    zIndex: 50,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  <div className="px-3 py-2 border-b border-[var(--gv-border)] mb-2" style={{ padding: 5 }}>
                    <div className="text-sm font-bold text-[var(--gv-text-heading)]">{userSession.name}</div>
                    <div className="text-[11px] text-[var(--gv-text-muted)]">{userSession.dept}</div>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <LogOut size={16} />
                    {t('user.logout', 'Sign out')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>
    </header>
  );
}
