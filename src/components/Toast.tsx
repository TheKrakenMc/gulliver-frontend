import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'info', visible, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  const config = {
    success: { icon: <CheckCircle2 size={18} color="var(--gv-success)" />, borderColor: 'var(--gv-success)' },
    error: { icon: <AlertCircle size={18} color="var(--gv-danger)" />, borderColor: 'var(--gv-danger)' },
    info: { icon: <Info size={18} color="var(--gv-primary)" />, borderColor: 'var(--gv-primary)' }
  };

  const active = config[type];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: 'var(--gv-sidebar)',
              border: '1px solid var(--gv-border)',
              borderLeft: `4px solid ${active.borderColor}`,
              borderRadius: 'var(--gv-radius)',
              boxShadow: 'var(--gv-shadow-lg)',
              color: 'var(--gv-sidebar-text)',
            }}
          >
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              {active.icon}
            </div>
            <p style={{ fontSize: 14, fontWeight: 500, margin: 0, marginRight: 24, fontFamily: 'inherit' }}>
              {message}
            </p>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--gv-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
                flexShrink: 0,
                outline: 'none'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
