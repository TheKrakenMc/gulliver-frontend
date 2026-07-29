import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export interface SPCDataPoint {
  label: string; // "Hr 1", "06:00"
  value: number; // 0-100
}

interface SPCChartProps {
  data: SPCDataPoint[];
}

export default function SPCChart({ data }: SPCChartProps) {
  const { t } = useTranslation();

  const { mean, stdDev, ucl, lcl } = useMemo(() => {
    if (data.length === 0) return { mean: 0, stdDev: 0, ucl: 0, lcl: 0 };
    
    const sum = data.reduce((acc, pt) => acc + pt.value, 0);
    const meanVal = sum / data.length;
    
    // Population standard deviation
    const variance = data.reduce((acc, pt) => acc + Math.pow(pt.value - meanVal, 2), 0) / data.length;
    const stdDevVal = Math.sqrt(variance);
    
    return {
      mean: meanVal,
      stdDev: stdDevVal,
      ucl: meanVal + 3 * stdDevVal,
      lcl: Math.max(0, meanVal - 3 * stdDevVal), // don't go below 0 for compliance
    };
  }, [data]);

  const yMax = Math.max(100, ucl + 10, ...data.map(d => d.value)) + 5;
  const yMin = 0;

  // Chart dimensions
  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Coordinate mappers
  const getX = (index: number) => padding.left + (index / (Math.max(1, data.length - 1))) * innerWidth;
  const getY = (val: number) => padding.top + innerHeight - ((val - yMin) / (yMax - yMin)) * innerHeight;

  // Path data
  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`).join(' ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="glass-card"
      style={{ padding: '28px', width: '100%', overflowX: 'auto' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gv-text-heading)', margin: 0 }}>
            {t('dashboard.spc_chart_title', 'Estabilidad del Proceso (SPC)')}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--gv-text-muted)', margin: '4px 0 0' }}>
            {t('dashboard.spc_chart_subtitle', 'Distribución del cumplimiento horario con límites de control natural (±3σ)')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 3, background: '#ef4444', opacity: 0.7 }} />
            <span style={{ color: 'var(--gv-text-muted)' }}>{t('dashboard.ucl', 'Límite Superior (UCL)')}: {ucl.toFixed(1)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 3, background: '#3b82f6', borderStyle: 'dashed' }} />
            <span style={{ color: 'var(--gv-text-muted)' }}>{t('dashboard.average', 'Promedio')}: {mean.toFixed(1)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 3, background: '#ef4444', opacity: 0.7 }} />
            <span style={{ color: 'var(--gv-text-muted)' }}>{t('dashboard.lcl', 'Límite Inferior (LCL)')}: {lcl.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gv-text-muted)', fontSize: 14 }}>
          {t('dashboard.no_data_for_shift', 'Sin datos para graficar')}
        </div>
      ) : (
        <div style={{ width: '100%', minWidth: 600 }}>
          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
            {/* Y-Axis labels */}
            {[0, yMax/4, yMax/2, (yMax*3)/4, yMax].map((val, i) => {
              const y = getY(val);
              return (
                <g key={i}>
                  <text x={padding.left - 10} y={y} fill="var(--gv-text-muted)" fontSize={11} textAnchor="end" dominantBaseline="middle">
                    {Math.round(val)}%
                  </text>
                  <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--gv-border)" strokeWidth={1} opacity={0.5} strokeDasharray="4 4" />
                </g>
              );
            })}

            {/* Control Limits Zone (Shaded) */}
            <rect
              x={padding.left}
              y={getY(ucl)}
              width={innerWidth}
              height={getY(lcl) - getY(ucl)}
              fill="rgba(16, 185, 129, 0.05)"
            />

            {/* UCL Line */}
            <line x1={padding.left} y1={getY(ucl)} x2={width - padding.right} y2={getY(ucl)} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="6 4" opacity={0.8} />
            
            {/* LCL Line */}
            <line x1={padding.left} y1={getY(lcl)} x2={width - padding.right} y2={getY(lcl)} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="6 4" opacity={0.8} />

            {/* Mean Line */}
            <line x1={padding.left} y1={getY(mean)} x2={width - padding.right} y2={getY(mean)} stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.8} />

            {/* Data Line Path */}
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              d={linePath}
              fill="none"
              stroke="#10b981"
              strokeWidth={3}
            />

            {/* Data Points */}
            {data.map((d, i) => {
              const isOutlier = d.value > ucl || d.value < lcl;
              return (
                <g key={i}>
                  {/* X-axis label */}
                  <text x={getX(i)} y={height - padding.bottom + 20} fill="var(--gv-text-muted)" fontSize={11} textAnchor="middle">
                    {d.label}
                  </text>
                  {/* Point */}
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.5 + i * 0.05, type: "spring" }}
                    cx={getX(i)}
                    cy={getY(d.value)}
                    r={isOutlier ? 5 : 4}
                    fill={isOutlier ? '#ef4444' : '#10b981'}
                    stroke="var(--gv-surface)"
                    strokeWidth={2}
                  />
                  {/* Value Label above point */}
                  <motion.text
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8 + i * 0.05 }}
                    x={getX(i)}
                    y={getY(d.value) - 12}
                    fill={isOutlier ? '#ef4444' : 'var(--gv-text-heading)'}
                    fontSize={10}
                    fontWeight={600}
                    textAnchor="middle"
                  >
                    {Math.round(d.value)}%
                  </motion.text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </motion.div>
  );
}
