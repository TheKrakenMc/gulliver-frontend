/**
 * ParetoTable.tsx — Tabla corporativa de Pareto con barras CSS
 *
 * Renderiza los niveles del Pareto en formato tabular idéntico
 * al formato mandatorio corporativo (Hoja de Análisis por Paretos).
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { ParetoLevel, AnalysisFocus } from '../utils/paretoEngine';
import { PARETO_THRESHOLD, getUnitLabelKey } from '../utils/paretoEngine';

interface ParetoTableProps {
  levels: ParetoLevel[];
  focus: AnalysisFocus;
}

const LEVEL_COLORS: Record<number, string> = {
  1: '#1e40af', // Deep blue
  2: '#1d4ed8',
  3: '#2563eb',
  4: '#3b82f6',
  5: '#60a5fa',
};

const LEVEL_BG: Record<number, string> = {
  1: 'rgba(30, 64, 175, 0.06)',
  2: 'rgba(29, 78, 216, 0.04)',
  3: 'rgba(37, 99, 235, 0.03)',
  4: 'rgba(59, 130, 246, 0.02)',
  5: 'rgba(96, 165, 250, 0.02)',
};

export default function ParetoTable({ levels, focus }: ParetoTableProps) {
  const { t } = useTranslation();
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  if (levels.length === 0) {
    return (
      <div
        style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: 'var(--gv-text-muted)',
          fontSize: 18,
          fontStyle: 'italic',
        }}
      >
        {t('pareto.no_incidents')}
      </div>
    );
  }

  const unitLabel = t(`pareto.${getUnitLabelKey(focus)}`);

  // Format a numeric value: show decimals for MTTR/MTBF, round for others
  const fmtValue = (v: number) => {
    if (focus === 'MTTR' || focus === 'MTBF') return v.toFixed(2);
    return Math.round(v).toLocaleString();
  };

  // Table header styles
  const thStyle: React.CSSProperties = {
    padding: '14px 12px',
    textAlign: 'left',
    fontSize: 14,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--gv-text-muted)',
    borderBottom: '2px solid var(--gv-border)',
    background: 'var(--gv-surface-alt)',
    whiteSpace: 'nowrap',
  };

  const thRightStyle: React.CSSProperties = {
    ...thStyle,
    textAlign: 'right',
  };

  const tdBase: React.CSSProperties = {
    padding: '10px 12px',
    borderBottom: '1px solid var(--gv-border)',
    verticalAlign: 'middle',
    fontSize: 15,
    color: 'var(--gv-text)',
  };

  const tdRight: React.CSSProperties = {
    ...tdBase,
    textAlign: 'right',
    fontFamily: "'Inter', monospace",
    fontWeight: 600,
  };

  // Build flat rows for the table
  interface FlatRow {
    type: 'header' | 'data' | 'total' | 'average';
    level: number;
    parentLabel: string;
    label: string;
    value: number;
    relativePercent: number;
    absolutePercent: number;
    isAboveThreshold: boolean;
    total: number;
    average?: number;
    totalLabel?: string;
  }

  const flatRows: FlatRow[] = [];

  levels.forEach((lvl) => {
    // Level header row
    flatRows.push({
      type: 'header',
      level: lvl.level,
      parentLabel: lvl.parentLabel,
      label: t(`pareto.${lvl.title}`),
      value: 0,
      relativePercent: 0,
      absolutePercent: 0,
      isAboveThreshold: false,
      total: lvl.total,
    });

    // Data rows
    lvl.rows.forEach((row) => {
      flatRows.push({
        type: 'data',
        level: lvl.level,
        parentLabel: lvl.parentLabel,
        label: row.label,
        value: row.value,
        relativePercent: row.relativePercent,
        absolutePercent: row.absolutePercent,
        isAboveThreshold: row.isAboveThreshold,
        total: 0,
      });
    });

    // Total row — label adapts to totalLabel (sum vs average)
    const totalKey = lvl.totalLabel || 'total_sum';
    const totalLabelText = `${t(`pareto.${totalKey}`)} ${lvl.parentLabel || t(`pareto.${lvl.title}`)}`;
    flatRows.push({
      type: 'total',
      level: lvl.level,
      parentLabel: lvl.parentLabel,
      label: totalLabelText,
      value: lvl.total,
      relativePercent: 100,
      absolutePercent: 0,
      isAboveThreshold: false,
      total: lvl.total,
      totalLabel: totalKey,
    });

    // Average row — only shown for MTTR/MTBF when average is present
    if (lvl.average !== undefined && (focus === 'MTTR' || focus === 'MTBF')) {
      flatRows.push({
        type: 'average',
        level: lvl.level,
        parentLabel: lvl.parentLabel,
        label: `${t('pareto.total_avg')} ${lvl.parentLabel || t(`pareto.${lvl.title}`)}`,
        value: lvl.average,
        relativePercent: 0,
        absolutePercent: 0,
        isAboveThreshold: false,
        total: lvl.total,
        average: lvl.average,
      });
    }
  });

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: "'Inter', sans-serif",
          minWidth: 800,
        }}
      >
        <thead>
          <tr>
            <th style={{ ...thStyle, width: 70, textAlign: 'center' }}>
              {t('pareto.col_level')}
            </th>
            <th style={{ ...thStyle, minWidth: 220 }}>
              {t('pareto.col_description')}
            </th>
            <th style={{ ...thRightStyle, width: 110 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <span>{t('pareto.col_values')}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#fff',
                    background: LEVEL_COLORS[1],
                    padding: '1px 6px',
                    borderRadius: 4,
                    lineHeight: 1.4,
                  }}
                >
                  {unitLabel}
                </span>
              </div>
            </th>
            <th style={{ ...thRightStyle, width: 100 }}>
              {t('pareto.col_relative')}
            </th>
            <th style={{ ...thRightStyle, width: 100 }}>
              {t('pareto.col_absolute')}
            </th>
            <th style={{ ...thStyle, width: 260 }}>
              {t('pareto.col_bar')}
            </th>
          </tr>
        </thead>
        <tbody>
          {flatRows.map((row, idx) => {
            const isHighlighted = hoveredLabel && (row.label === hoveredLabel || row.parentLabel === hoveredLabel);

            if (row.type === 'header') {
              return (
                <motion.tr
                  key={`h-${idx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  onMouseEnter={() => setHoveredLabel(row.parentLabel)}
                  onMouseLeave={() => setHoveredLabel(null)}
                  style={{
                    background: isHighlighted ? 'rgba(167, 243, 208, 0.4)' : (LEVEL_BG[row.level] || 'transparent'),
                    transition: 'background 0.2s ease',
                  }}
                >
                  <td
                    style={{
                      ...tdBase,
                      textAlign: 'center',
                      borderBottom: '2px solid var(--gv-border)',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: LEVEL_COLORS[row.level] || '#64748b',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: 14,
                      }}
                    >
                      {row.level}
                    </span>
                  </td>
                  <td
                    colSpan={5}
                    style={{
                      ...tdBase,
                      fontWeight: 800,
                      fontSize: 16,
                      color: 'var(--gv-text-heading)',
                      borderBottom: '2px solid var(--gv-border)',
                    }}
                  >
                    <span>{row.label}</span>
                    {row.parentLabel && (
                      <span
                        style={{
                          marginLeft: 12,
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--gv-text-muted)',
                          background: 'var(--gv-surface-alt)',
                          padding: '3px 10px',
                          borderRadius: 6,
                        }}
                      >
                        {row.parentLabel}
                      </span>
                    )}
                  </td>
                </motion.tr>
              );
            }

            if (row.type === 'total' || row.type === 'average') {
              const isAvg = row.type === 'average';
              return (
                <tr
                  key={`t-${idx}`}
                  onMouseEnter={() => setHoveredLabel(row.parentLabel)}
                  onMouseLeave={() => setHoveredLabel(null)}
                  style={{
                    background: isHighlighted ? 'rgba(167, 243, 208, 0.4)' : (isAvg ? 'var(--gv-surface)' : 'var(--gv-surface-alt)'),
                    transition: 'background 0.2s ease',
                  }}
                >
                  <td style={{ ...tdBase, textAlign: 'center' }}></td>
                  <td
                    style={{
                      ...tdBase,
                      fontWeight: 800,
                      fontSize: 14,
                      color: 'var(--gv-text-heading)',
                      textAlign: 'right',
                      paddingRight: 20,
                      fontStyle: isAvg ? 'italic' : 'normal',
                    }}
                  >
                    {row.label}
                  </td>
                  <td style={{ ...tdRight, fontWeight: 800 }}>
                    {fmtValue(row.value)}
                  </td>
                  <td style={{ ...tdRight, fontWeight: 800 }}>{isAvg ? '' : '100%'}</td>
                  <td style={tdRight}></td>
                  <td style={tdBase}></td>
                </tr>
              );
            }

            // Data row
            const barWidthPercent = row.relativePercent;
            const barColor = row.isAboveThreshold
              ? 'linear-gradient(90deg, #4A7EC7, #6B9BD2)'
              : 'linear-gradient(90deg, #94a3b8, #b0bec5)';
            const barOpacity = row.isAboveThreshold ? 1 : 0.5;

            let rowBg = 'transparent';
            if (isHighlighted) {
              rowBg = 'rgba(167, 243, 208, 0.4)';
            } else if (row.isAboveThreshold) {
              rowBg = 'rgba(74, 126, 199, 0.03)';
            }

            return (
              <motion.tr
                key={`d-${idx}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02, duration: 0.3 }}
                onMouseEnter={() => setHoveredLabel(row.label)}
                onMouseLeave={() => setHoveredLabel(null)}
                style={{
                  background: rowBg,
                  transition: 'background 0.2s ease',
                }}
              >
                <td style={{ ...tdBase, textAlign: 'center' }}>
                  {row.parentLabel && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--gv-text-muted)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {/* Show parent label abbreviation for context */}
                    </span>
                  )}
                </td>
                <td
                  style={{
                    ...tdBase,
                    fontWeight: row.isAboveThreshold ? 700 : 500,
                    color: row.isAboveThreshold
                      ? 'var(--gv-text-heading)'
                      : 'var(--gv-text)',
                    paddingLeft: 20 + (row.level - 1) * 8,
                  }}
                >
                  {row.label}
                </td>
                <td style={tdRight}>{fmtValue(row.value)}</td>
                <td style={tdRight}>{row.relativePercent.toFixed(1)}%</td>
                <td
                  style={{
                    ...tdRight,
                    color: row.isAboveThreshold
                      ? LEVEL_COLORS[row.level] || '#3b82f6'
                      : 'var(--gv-text-muted)',
                    fontWeight: row.isAboveThreshold ? 700 : 500,
                  }}
                >
                  {row.absolutePercent.toFixed(1)}%
                </td>
                <td style={{ ...tdBase, paddingRight: 16 }}>
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: 20,
                      background: 'var(--gv-surface-alt)',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    {/* 80% threshold marker */}
                    <div
                      style={{
                        position: 'absolute',
                        left: `${PARETO_THRESHOLD * 100}%`,
                        top: 0,
                        bottom: 0,
                        width: 2,
                        background: 'rgba(239, 68, 68, 0.35)',
                        zIndex: 2,
                      }}
                    />
                    {/* Bar */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidthPercent}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.02, ease: 'easeOut' }}
                      style={{
                        height: '100%',
                        background: barColor,
                        borderRadius: 3,
                        opacity: barOpacity,
                        position: 'relative',
                        zIndex: 1,
                      }}
                    />
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '16px 12px 4px',
          fontSize: 13,
          color: 'var(--gv-text-muted)',
          fontWeight: 500,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              background: 'linear-gradient(90deg, #4A7EC7, #6B9BD2)',
            }}
          />
          <span>{t('pareto.threshold_label')} (≤ 80%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              background: 'linear-gradient(90deg, #94a3b8, #b0bec5)',
              opacity: 0.5,
            }}
          />
          <span>&gt; 80%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 2,
              height: 14,
              background: 'rgba(239, 68, 68, 0.5)',
            }}
          />
          <span>80%</span>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600 }}>
          {t('pareto.col_values')}: {unitLabel}
        </div>
      </div>
    </div>
  );
}
