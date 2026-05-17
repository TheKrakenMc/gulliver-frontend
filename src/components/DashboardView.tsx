import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Activity, BarChart3, Calendar, Gauge } from 'lucide-react';
import KPICard from './KPICard';
import OEEChart from './OEEChart';
import { kpiData, oeeByLine } from '../data/mockData';
import type { FilterState } from '../types';

/* ─── Waterfall / Bridge Chart ─── */
function BridgeChart() {
  const { t } = useTranslation();
  const segments = [
    { label: t('dashboard.capacity_ideal'), value: 100, color: '#3b82f6', type: 'start' as const },
    { label: t('dashboard.loss_availability'), value: -12, color: '#ef4444', type: 'loss' as const },
    { label: t('dashboard.loss_performance'), value: -8, color: '#f59e0b', type: 'loss' as const },
    { label: t('dashboard.loss_quality'), value: -7.6, color: '#8b5cf6', type: 'loss' as const },
    { label: t('dashboard.final_oee'), value: 72.4, color: '#10b981', type: 'end' as const },
  ];

  let runningTotal = 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="glass-card"
      style={{ padding: '28px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gv-text-heading)', margin: 0 }}>
            {t('dashboard.bridge_title')}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--gv-text-muted)', margin: '4px 0 0' }}>
            {t('dashboard.bridge_desc')}
          </p>
        </div>
      </div>

      {/* Chart area */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around',
        height: 240, position: 'relative', paddingBottom: 40, top: 60
      }}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((val) => (
          <div key={val} style={{
            position: 'absolute', left: 0, right: 0,
            bottom: 40 + (val / 100) * 180,
            borderTop: '1px dashed var(--gv-border)',
            opacity: 0.5, zIndex: 0,
          }}>
            <span style={{
              position: 'absolute', left: -4, top: -8,
              fontSize: 10, color: 'var(--gv-text-muted)', fontWeight: 600,
            }}>
              {val}%
            </span>
          </div>
        ))}

        {segments.map((seg, index) => {
          let barHeight: number;
          let barBottom: number;

          if (seg.type === 'start') {
            barHeight = (seg.value / 100) * 180;
            barBottom = 40;
            runningTotal = seg.value;
          } else if (seg.type === 'loss') {
            barHeight = (Math.abs(seg.value) / 100) * 180;
            const newTotal = runningTotal + seg.value;
            barBottom = 40 + (newTotal / 100) * 180;
            runningTotal = newTotal;
          } else {
            barHeight = (seg.value / 100) * 180;
            barBottom = 40;
          }

          return (
            <div key={seg.label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              flex: 1, position: 'relative', zIndex: 1,
            }}>
              {/* Value label */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                style={{
                  position: 'absolute',
                  bottom: barBottom + barHeight + 6,
                  fontSize: 13,
                  fontWeight: 800,
                  color: seg.color,
                }}
              >
                {seg.type === 'loss' ? seg.value : seg.value}%
              </motion.div>

              {/* Bar */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: barHeight }}
                transition={{ duration: 0.7, delay: 0.3 + index * 0.12, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  position: 'absolute',
                  bottom: barBottom,
                  width: '55%',
                  maxWidth: 64,
                  borderRadius: seg.type === 'loss' ? '2px 2px 6px 6px' : '6px 6px 2px 2px',
                  background: seg.type === 'loss'
                    ? `repeating-linear-gradient(135deg, ${seg.color}, ${seg.color} 3px, ${seg.color}cc 3px, ${seg.color}cc 6px)`
                    : `linear-gradient(180deg, ${seg.color}, ${seg.color}cc)`,
                  boxShadow: `0 0 12px ${seg.color}30`,
                }}
              />

              {/* Label */}
              <div style={{
                position: 'absolute', bottom: 0, fontSize: 10, fontWeight: 600,
                color: 'var(--gv-text-muted)', textAlign: 'center', width: '100%',
                lineHeight: 1.3, padding: '0 4px',
              }}>
                {seg.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Connector lines (visual bridges) */}
      <div style={{
        marginTop: 16, display: 'flex', justifyContent: 'center', gap: 24, fontSize: 11,
        color: 'var(--gv-text-muted)',
      }}>
        {[
          { label: t('dashboard.availability'), value: '88.0%', color: '#ef4444' },
          { label: t('dashboard.performance'), value: '92.0%', color: '#f59e0b' },
          { label: t('dashboard.quality'), value: '89.4%', color: '#8b5cf6' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color }} />
            <span>{item.label}: <strong style={{ color: item.color }}>{item.value}</strong></span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Traffic Light KPI ─── */
function TrafficLightCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  const { t } = useTranslation();
  const getColor = (v: number) => {
    if (v < 75) return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', label: t('dashboard.red') };
    if (v < 85) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: t('dashboard.yellow') };
    return { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', label: t('dashboard.green') };
  };
  const tc = getColor(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card"
      style={{
        padding: '24px',
        textAlign: 'center',
        borderTop: `3px solid ${tc.color}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Semáforo glow */}
      <div style={{
        position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
        width: 100, height: 60,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${tc.color}20, transparent)`,
      }} />

      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, position: 'relative' }}>
        {label}
      </div>

      {/* Semáforo dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
        {['#ef4444', '#f59e0b', '#10b981'].map((c) => (
          <div key={c} style={{
            width: 14, height: 14, borderRadius: '50%',
            background: c === tc.color ? c : 'var(--gv-surface-alt)',
            border: `2px solid ${c === tc.color ? c : 'var(--gv-border)'}`,
            boxShadow: c === tc.color ? `0 0 10px ${c}50` : 'none',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <span style={{ fontSize: 38, fontWeight: 800, color: tc.color, lineHeight: 1, letterSpacing: -1 }}>
          {value.toFixed(1)}
        </span>
        <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--gv-text-muted)', marginLeft: 4 }}>{unit}</span>
      </div>
      <div style={{
        marginTop: 10, fontSize: 10, fontWeight: 800, color: tc.color,
        padding: '3px 10px', borderRadius: 4,
        background: tc.bg, display: 'inline-block',
      }}>
        {tc.label}
      </div>
    </motion.div>
  );
}

/* ─── Main Dashboard ─── */
interface DashboardViewProps {
  filters: FilterState;
}

export default function DashboardView({ filters }: DashboardViewProps) {
  const { t, i18n } = useTranslation();
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 28 }}
    >
      {/* View header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(6,182,212,0.15))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <BarChart3 size={18} color="var(--gv-primary)" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--gv-text-heading)', margin: 0, letterSpacing: -0.5 }}>
              {t('dashboard.executive_scorecard')}
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--gv-text-muted)', margin: 0, paddingLeft: 46 }}>
            {filters.location} › {filters.businessUnit} › {filters.facility} › {filters.process}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
            background: 'var(--gv-surface)', border: '1px solid var(--gv-border)',
            fontSize: 12, color: 'var(--gv-text-muted)', fontWeight: 500,
          }}>
            <Calendar size={14} />
            <span>{t('dashboard.current_shift')} — {new Date().toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
            background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
            fontSize: 12, color: '#10b981', fontWeight: 600,
          }}>
            <Activity size={14} />
            <span>{t('dashboard.in_production')}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiData.map((kpi, index) => (
          <KPICard key={kpi.label} data={kpi} index={index} />
        ))}
      </div>

      {/* Traffic Light Semáforo Cards */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Gauge size={16} color="var(--gv-primary)" />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gv-text-heading)', margin: 0 }}>
            {t('dashboard.performance_traffic_light')}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <TrafficLightCard label="OEE" value={72.4} unit="%" />
          <TrafficLightCard label={t('dashboard.availability')} value={88.0} unit="%" />
          <TrafficLightCard label={t('dashboard.quality')} value={89.4} unit="%" />
        </div>
      </div>

      {/* Bridge / Waterfall Chart */}
      <BridgeChart />

      {/* OEE by Line Chart */}
      <OEEChart data={oeeByLine} />
    </motion.div>
  );
}
