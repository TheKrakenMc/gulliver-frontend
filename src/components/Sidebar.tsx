import { useState } from 'react';
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
  Factory,
} from 'lucide-react';
import SidebarUserSection from './SidebarUserSection';
import type { ViewId } from '../types';

interface SidebarProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  user: { name: string; dept: string; role: string } | null;
  onLogout: () => void;
}

const navItems: { id: ViewId; translationKey: string; icon: React.ReactNode; sectionKey?: string }[] = [
  { id: 'dashboard', translationKey: 'dashboard', icon: <LayoutDashboard size={20} />, sectionKey: 'section_production' },
  { id: 'hourByHour', translationKey: 'hourByHour', icon: <ClipboardList size={20} /> },
  { id: 'logistics', translationKey: 'logistics', icon: <Truck size={20} />, sectionKey: 'section_planning' },
  { id: 'maintenance', translationKey: 'maintenance', icon: <Wrench size={20} />, sectionKey: 'section_support' },
  { id: 'quality', translationKey: 'quality', icon: <ShieldCheck size={20} /> },
  { id: 'pdca', translationKey: 'pdca', icon: <Lightbulb size={20} /> },
];

export default function Sidebar({ activeView, onNavigate, user, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { t, i18n } = useTranslation();

  let lastSection = '';

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
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
          onClick={() => setCollapsed(!collapsed)}
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
          <Menu size={20} />
        </motion.button>
      </div>

      {/* User Session Section */}
      {user && (
        <SidebarUserSection 
          user={user} 
          onLogout={onLogout} 
          collapsed={collapsed} 
        />
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {navItems.map((item) => {
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
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#475569',
                    padding: '14px 16px 6px',
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
                onClick={() => onNavigate(item.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: collapsed ? '11px 0' : '11px 16px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  background: isActive ? 'var(--gv-sidebar-active)' : 'transparent',
                  color: isActive ? 'var(--gv-sidebar-active-text)' : 'var(--gv-sidebar-text)',
                  fontSize: 13,
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




    </motion.aside>
  );
}
