import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  ShieldCheck,
  Lightbulb,
  Truck,
  Menu,
  Cog,
  Settings,
  Sun,
  Moon,
  User as UserIcon,
  Bell,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useGlobalStore } from '../store/globalStore';
import type { ViewId } from '../types';

interface SidebarProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const navItems: { id: ViewId; translationKey: string; icon: ReactNode; sectionKey?: string; adminOnly?: boolean }[] = [
  { id: 'dashboard', translationKey: 'dashboard', icon: <LayoutDashboard size={24} />, sectionKey: 'section_production' },
  { id: 'hourByHour', translationKey: 'hourByHour', icon: <ClipboardList size={24} /> },
  { id: 'logistics', translationKey: 'logistics', icon: <Truck size={24} />, sectionKey: 'section_planning' },
  // TODO: Rollback - Descomentar los siguientes elementos para restaurar las secciones de Ingeniería y Soporte
  // { id: 'engineering', translationKey: 'engineering', icon: <Cog size={24} />, sectionKey: 'section_engineering' },
  // { id: 'maintenance', translationKey: 'maintenance', icon: <Wrench size={24} />, sectionKey: 'section_support' },
  // { id: 'quality', translationKey: 'quality', icon: <ShieldCheck size={24} /> },
  // { id: 'pdca', translationKey: 'pdca', icon: <Lightbulb size={24} /> },
  { id: 'configuration', translationKey: 'configuration', icon: <Settings size={24} />, sectionKey: 'section_settings', adminOnly: true },
];


export default function Sidebar({ activeView, onNavigate, darkMode, onToggleDarkMode }: SidebarProps) {
  const { sidebarCollapsed: collapsed, toggleSidebar, isMobileDrawerOpen, setMobileDrawerOpen, userSession, logout, notifications, clearNotifications } = useGlobalStore();
  const { t, i18n } = useTranslation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isSpanish = i18n.language === 'es';

  const toggleLanguage = () => {
    const newLang = isSpanish ? 'en' : 'es';
    i18n.changeLanguage(newLang);
    localStorage.setItem('gv_language', newLang);
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

  const handleNavClick = (viewId: ViewId) => {
    onNavigate(viewId);
    if (isTablet) {
      setMobileDrawerOpen(false);
    }
  };

  let lastSection = '';

  if (isTablet) {
    return (
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(4px)',
                zIndex: 99,
              }}
            />
            {/* Slide-out Navigation Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                background: 'var(--gv-sidebar)',
                borderRight: '1px solid var(--gv-border)',
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                width: 280,
                zIndex: 100,
                overflow: 'hidden',
                boxShadow: 'var(--gv-shadow-lg)',
              }}
            >
              {/* Drawer Header */}
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  justifyContent: 'space-between',
                  minHeight: 72,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  <img src="/apg.png" width={36} height={36} alt="Logo" />
                </div>
                
                <div style={{ flex: 1 }}>
                  <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 18, letterSpacing: -0.5 }}>
                    Gulliver
                  </span>
                </div>

                <motion.button
                  whileHover={{ background: 'rgba(255,255,255,0.08)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMobileDrawerOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--gv-sidebar-text)',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={t('common.close', 'Close')}
                >
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--gv-sidebar-text)' }}>✕</span>
                </motion.button>
              </div>

              {/* User Profile Section Mobile */}
              {userSession && (
                <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex' }}>
                  <div className="relative w-full flex justify-center">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-3 p-1.5 rounded-xl border border-transparent hover:bg-[rgba(255,255,255,0.08)] transition-all w-full justify-start"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-md relative shrink-0">
                        <UserIcon size={20} />
                        {notifications > 0 && (
                          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white shadow-sm ring-2 ring-[var(--gv-sidebar)]">
                            {notifications}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-start flex-1" style={{ overflow: 'hidden' }}>
                        <span className="text-[15px] font-bold text-[#f1f5f9] leading-tight truncate w-full text-left">{userSession.name}</span>
                        <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">{userSession.role}</span>
                      </div>
                      <ChevronDown size={16} className="text-[var(--gv-sidebar-text)] ml-1" />
                    </button>

                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute mt-2 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[var(--gv-sidebar)] p-2 shadow-xl z-50 backdrop-blur-xl"
                          style={{
                            top: '105%',
                            left: 0,
                            right: 0,
                            padding: 10,
                            zIndex: 100,
                          }}
                        >
                          <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.1)] mb-2" style={{ padding: 5 }}>
                            <div className="text-sm font-bold text-[#f1f5f9]">{userSession.name}</div>
                            <div className="text-[11px] text-[var(--gv-sidebar-text)]">{userSession.dept}</div>
                          </div>
                          
                          {/* Notifications inside menu */}
                          <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.1)] mb-2" style={{ padding: 5 }}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-[#f1f5f9] flex items-center gap-2">
                                <Bell size={14} /> Notifications
                              </span>
                              {notifications > 0 && (
                                <button onClick={(e) => { e.stopPropagation(); clearNotifications(); }} className="text-[10px] text-blue-400 hover:underline">Clear</button>
                              )}
                            </div>
                            <div className="text-[11px] text-[var(--gv-sidebar-text)] text-center py-2">
                              {notifications > 0 ? `You have ${notifications} new notification${notifications > 1 ? 's' : ''}` : 'No new notifications'}
                            </div>
                          </div>
                          <button
                            onClick={logout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <LogOut size={16} />
                            {t('user.logout', 'Sign out')}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Drawer Navigation */}
              <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
                {navItems.map((item) => {
                  if (item.adminOnly && userSession?.role !== 'Administrador' && userSession?.role !== 'Gerente') return null;
                  
                  const isActive = item.id === activeView;
                  const sectionLabel = item.sectionKey ? t(`sidebar.${item.sectionKey}`) : undefined;
                  const showSection = sectionLabel && sectionLabel !== lastSection;
                  if (sectionLabel) lastSection = sectionLabel;

                  return (
                    <div key={item.id}>
                      {showSection && (
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: '#475569',
                            padding: '16px 20px 6px',
                            userSelect: 'none',
                          }}
                        >
                          {sectionLabel}
                        </div>
                      )}

                      <motion.button
                        onClick={() => handleNavClick(item.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '14px 20px',
                          justifyContent: 'flex-start',
                          borderRadius: 10,
                          border: 'none',
                          cursor: 'pointer',
                          width: '100%',
                          background: isActive ? 'var(--gv-sidebar-active)' : 'transparent',
                          color: isActive ? 'var(--gv-sidebar-active-text)' : 'var(--gv-sidebar-text)',
                          fontSize: 16,
                          fontWeight: isActive ? 600 : 400,
                          transition: 'all 0.2s ease',
                          fontFamily: 'inherit',
                          position: 'relative',
                        }}
                      >
                        {isActive && (
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: 3,
                              height: 22,
                              borderRadius: 2,
                              background: 'var(--gv-primary)',
                            }}
                          />
                        )}
                        <span style={{ flexShrink: 0 }}>{item.icon}</span>
                        <span style={{ whiteSpace: 'nowrap' }}>
                          {t(`sidebar.${item.translationKey}`)}
                        </span>
                      </motion.button>
                    </div>
                  );
                })}
              </nav>

              {/* Bottom Actions Drawer */}
              <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={onToggleDarkMode}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
                    borderRadius: 10, border: 'none', background: 'transparent',
                    color: 'var(--gv-sidebar-text)', cursor: 'pointer', width: '100%',
                    fontSize: 16, fontWeight: 500, transition: 'all 0.2s ease', fontFamily: 'inherit'
                  }}
                >
                  {darkMode ? <Sun size={24} /> : <Moon size={24} />}
                  <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button
                  onClick={toggleLanguage}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
                    borderRadius: 10, border: 'none', background: 'transparent',
                    color: 'var(--gv-sidebar-text)', cursor: 'pointer', width: '100%',
                    fontSize: 16, fontWeight: 500, transition: 'all 0.2s ease', fontFamily: 'inherit'
                  }}
                >
                  <span style={{ fontSize: 22, width: 24, textAlign: 'center' }}>{isSpanish ? '🇲🇽' : '🇺🇸'}</span>
                  <span>{isSpanish ? 'ES' : 'EN'}</span>
                </button>
              </div>

            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 84 : 280 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{
        background: 'var(--gv-sidebar)',
        borderRight: '1px solid var(--gv-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Logo Section */}
      <div
        style={{
          padding: collapsed ? '20px 0' : '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          justifyContent: collapsed ? 'center' : 'flex-start',
          minHeight: 72,
          flexDirection: collapsed ? 'column' : 'row'
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          <img src="/apg.png" width={36} height={36} alt="Logo" />
        </div>
        
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1 }}
            >
              <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 18, letterSpacing: -0.5 }}>
                Gulliver
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ background: 'rgba(255,255,255,0.08)' }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleSidebar}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--gv-sidebar-text)',
            cursor: 'pointer',
            padding: 6,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: collapsed ? 8 : 0
          }}
          title={collapsed ? t('common.expand') : t('common.collapse')}
        >
          <Menu size={24} />
        </motion.button>
      </div>

      {/* User Profile Section Desktop */}
      {userSession && (
        <div style={{ padding: collapsed ? '16px 0' : '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <div className="relative w-full flex justify-center">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-1.5 rounded-xl border border-transparent hover:bg-[rgba(255,255,255,0.08)] transition-all w-full"
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-md relative shrink-0">
                <UserIcon size={20} />
                {notifications > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white shadow-sm ring-2 ring-[var(--gv-sidebar)]">
                    {notifications}
                  </span>
                )}
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                    className="flex flex-col items-start flex-1"
                  >
                    <span className="text-[15px] font-bold text-[#f1f5f9] leading-tight truncate w-full text-left">{userSession.name}</span>
                    <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">{userSession.role}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={16} className="text-[var(--gv-sidebar-text)] ml-1" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute mt-2 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[var(--gv-sidebar)] p-2 shadow-xl z-50 backdrop-blur-xl"
                  style={{
                    top: '105%',
                    left: collapsed ? 0 : 'auto',
                    right: collapsed ? 'auto' : 0,
                    width: collapsed ? 240 : '100%',
                    padding: 10,
                    zIndex: 100,
                  }}
                >
                  <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.1)] mb-2" style={{ padding: 5 }}>
                    <div className="text-sm font-bold text-[#f1f5f9]">{userSession.name}</div>
                    <div className="text-[11px] text-[var(--gv-sidebar-text)]">{userSession.dept}</div>
                  </div>
                  
                  {/* Notifications inside menu */}
                  <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.1)] mb-2" style={{ padding: 5 }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[#f1f5f9] flex items-center gap-2">
                        <Bell size={14} /> Notifications
                      </span>
                      {notifications > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); clearNotifications(); }} className="text-[10px] text-blue-400 hover:underline">Clear</button>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--gv-sidebar-text)] text-center py-2">
                      {notifications > 0 ? `You have ${notifications} new notification${notifications > 1 ? 's' : ''}` : 'No new notifications'}
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <LogOut size={16} />
                    {t('user.logout', 'Sign out')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {navItems.map((item) => {
          if (item.adminOnly && userSession?.role !== 'Administrador' && userSession?.role !== 'Gerente') return null;

          const isActive = item.id === activeView;
          const sectionLabel = item.sectionKey ? t(`sidebar.${item.sectionKey}`) : undefined;
          const showSection = sectionLabel && sectionLabel !== lastSection;
          if (sectionLabel) lastSection = sectionLabel;

          return (
            <div key={item.id}>
              {/* Section divider */}
              {showSection && !collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#475569',
                    padding: '16px 20px 6px',
                    userSelect: 'none',
                  }}
                >
                  {sectionLabel}
                </motion.div>
              )}
              {showSection && collapsed && (
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 12px' }} />
              )}

              <motion.button
                onClick={() => handleNavClick(item.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: collapsed ? '14px 0' : '14px 20px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  background: isActive ? 'var(--gv-sidebar-active)' : 'transparent',
                  color: isActive ? 'var(--gv-sidebar-active-text)' : 'var(--gv-sidebar-text)',
                  fontSize: 16,
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                  position: 'relative',
                }}
                title={collapsed ? t(`sidebar.${item.translationKey}`) : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: 22,
                      borderRadius: 2,
                      background: 'var(--gv-primary)',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}
                    >
                      {t(`sidebar.${item.translationKey}`)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          );
        })}
      </nav>

      {/* Bottom Actions Desktop */}
      <div style={{ padding: collapsed ? '16px 0' : '16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 8, alignItems: collapsed ? 'center' : 'stretch' }}>
        <button
          onClick={onToggleDarkMode}
          title={darkMode ? 'Light Mode' : 'Dark Mode'}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: collapsed ? '14px 0' : '14px 20px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 10, border: 'none', background: 'transparent',
            color: 'var(--gv-sidebar-text)', cursor: 'pointer', width: '100%',
            fontSize: 16, fontWeight: 500, transition: 'all 0.2s ease', fontFamily: 'inherit'
          }}
        >
          {darkMode ? <Sun size={24} style={{ flexShrink: 0 }} /> : <Moon size={24} style={{ flexShrink: 0 }} />}
          {!collapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button
          onClick={toggleLanguage}
          title={isSpanish ? 'Cambiar a Inglés' : 'Switch to Spanish'}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: collapsed ? '14px 0' : '14px 20px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 10, border: 'none', background: 'transparent',
            color: 'var(--gv-sidebar-text)', cursor: 'pointer', width: '100%',
            fontSize: 16, fontWeight: 500, transition: 'all 0.2s ease', fontFamily: 'inherit'
          }}
        >
          <span style={{ fontSize: 22, width: 24, textAlign: 'center', flexShrink: 0 }}>{isSpanish ? '🇲🇽' : '🇺🇸'}</span>
          {!collapsed && <span>{isSpanish ? 'ES' : 'EN'}</span>}
        </button>
      </div>

    </motion.aside>
  );
}
