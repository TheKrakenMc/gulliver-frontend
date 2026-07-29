import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { KPIData } from '../types';

interface KPICardProps {
  data: KPIData;
  index: number;
}

export default function KPICard({ data, index }: KPICardProps) {
  const { t } = useTranslation();

  const statusColors = {
    good: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: '#10b981' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: '#f59e0b' },
    critical: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444' },
  };

  const colors = statusColors[data.status];

  const TrendIcon = data.trend === 'up' ? TrendingUp : data.trend === 'down' ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
      className="glass-card"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Status glow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 80,
          height: 80,
          borderRadius: '0 12px 0 80px',
          background: `radial-gradient(circle at top right, ${colors.bg}, transparent)`,
          opacity: 0.8,
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {data.label}
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            borderRadius: 6,
            background: colors.bg,
            border: `1px solid ${colors.border}`,
          }}
        >
          <TrendIcon size={12} color={colors.text} />
          <span style={{ fontSize: 11, fontWeight: 600, color: colors.text }}>
            {data.status === 'good' ? t('kpi.on_target') : data.status === 'warning' ? t('kpi.warning') : t('kpi.below_target')}
          </span>
        </div>
      </div>

      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--gv-text-heading)', lineHeight: 1, letterSpacing: -1 }}>
          {typeof data.value === 'number' ? data.value.toFixed(1) : data.value}
        </span>
        {typeof data.value === 'number' && (
          <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--gv-text-muted)' }}>{data.unit}</span>
        )}
      </div>

      {/* Target bar */}
      {data.target && typeof data.value === 'number' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, color: 'var(--gv-text-muted)' }}>
            <span>{t('kpi.actual')}</span>
            <span>{t('kpi.target')}: {data.target}{data.unit}</span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: 'var(--gv-surface-alt)',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((data.value / data.target) * 100, 100)}%` }}
              transition={{ duration: 1.2, delay: index * 0.15, ease: [0.4, 0, 0.2, 1] }}
              style={{
                height: '100%',
                borderRadius: 3,
                background: `linear-gradient(90deg, ${colors.text}, ${colors.text}dd)`,
              }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
