import { motion } from 'framer-motion';
import type { OEELine } from '../types';

interface OEEChartProps {
  data: OEELine[];
}

export default function OEEChart({ data }: OEEChartProps) {
  const maxValue = 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="glass-card"
      style={{ padding: '28px' }}
    >
      {/* Chart header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gv-text-heading)', margin: 0 }}>
            OEE por Línea de Producción
          </h3>
          <p style={{ fontSize: 13, color: 'var(--gv-text-muted)', margin: '4px 0 0' }}>
            Comparativa del turno actual vs target global
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }} />
            <span style={{ color: 'var(--gv-text-muted)' }}>OEE Actual</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 3, borderRadius: 2, background: '#ef4444' }} />
            <span style={{ color: 'var(--gv-text-muted)' }}>Target 85%</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ position: 'relative' }}>
        {/* Y-axis labels + grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[100, 80, 60, 40, 20, 0].map((val) => (
            <div
              key={val}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: val === 0 ? 'auto' : 40,
              }}
            >
              <span style={{ fontSize: 11, color: 'var(--gv-text-muted)', width: 32, textAlign: 'right', marginRight: 12, flexShrink: 0 }}>
                {val}%
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--gv-border)', opacity: val === 0 ? 0 : 0.5 }} />
            </div>
          ))}
        </div>

        {/* Bars container */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 44,
            right: 0,
            bottom: 20,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            paddingBottom: 1,
          }}
        >
          {data.map((item, index) => {
            const barHeight = (item.oee / maxValue) * 200;
            const isAboveTarget = item.oee >= item.target;

            return (
              <div
                key={item.line}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  flex: 1,
                }}
              >
                {/* Value label */}
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: isAboveTarget ? '#10b981' : '#ef4444',
                  }}
                >
                  {item.oee}%
                </motion.span>

                {/* Bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: barHeight }}
                  transition={{
                    duration: 0.8,
                    delay: 0.3 + index * 0.1,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  style={{
                    width: '60%',
                    maxWidth: 48,
                    borderRadius: '6px 6px 2px 2px',
                    background: isAboveTarget
                      ? 'linear-gradient(180deg, #10b981, #059669)'
                      : 'linear-gradient(180deg, #3b82f6, #2563eb)',
                    position: 'relative',
                    minHeight: 4,
                  }}
                >
                  {/* Target line on each bar */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: (item.target / maxValue) * 200 - barHeight + barHeight,
                      left: -4,
                      right: -4,
                      height: 2,
                      background: '#ef4444',
                      borderRadius: 1,
                      display: item.oee < item.target ? 'block' : 'none',
                    }}
                  />
                </motion.div>

                {/* Line label */}
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gv-text-muted)' }}>
                  {item.line}
                </span>
              </div>
            );
          })}
        </div>

        {/* Target line across chart */}
        <div
          style={{
            position: 'absolute',
            left: 44,
            right: 0,
            bottom: `${20 + (85 / maxValue) * 200}px`,
            height: 2,
            background: 'rgba(239, 68, 68, 0.3)',
            borderTop: '2px dashed rgba(239, 68, 68, 0.5)',
          }}
        />
      </div>

      {/* Bar spacing placeholder */}
      <div style={{ height: 230 }} />
    </motion.div>
  );
}
