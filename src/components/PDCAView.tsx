import { motion } from 'framer-motion';
import { Lightbulb, User, CalendarDays, Flag } from 'lucide-react';
import { pdcaCards } from '../data/mockData';
import type { PDCACard } from '../types';

const columns = [
  { key: 'plan', label: 'PLAN', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', description: 'Identificar y planificar' },
  { key: 'do', label: 'DO', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', description: 'Ejecutar acciones' },
  { key: 'check', label: 'CHECK', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', description: 'Verificar resultados' },
  { key: 'act', label: 'ACT', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)', description: 'Estandarizar mejoras' },
];

const priorityColors = {
  high: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)', label: 'Alta' },
  medium: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)', label: 'Media' },
  low: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)', label: 'Baja' },
};

function PDCACardItem({ card, colIndex, cardIndex }: { card: PDCACard; colIndex: number; cardIndex: number }) {
  const priority = priorityColors[card.priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 * cardIndex + 0.1 * colIndex }}
      whileHover={{
        y: -4,
        boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.15)',
        transition: { duration: 0.2 },
      }}
      style={{
        background: 'var(--gv-surface)',
        border: '1px solid var(--gv-border)',
        borderRadius: 10,
        padding: '18px',
        cursor: 'pointer',
        transition: 'border-color 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Priority badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '3px 8px',
            borderRadius: 4,
            background: priority.bg,
            color: priority.text,
            border: `1px solid ${priority.border}`,
          }}
        >
          {priority.label}
        </span>
        <Flag size={12} color={priority.text} />
      </div>

      {/* Title */}
      <h4 style={{
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--gv-text-heading)',
        margin: 0,
        lineHeight: 1.4,
      }}>
        {card.title}
      </h4>

      {/* Description */}
      <p style={{
        fontSize: 12,
        color: 'var(--gv-text-muted)',
        margin: 0,
        lineHeight: 1.5,
      }}>
        {card.description}
      </p>

      {/* Meta */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTop: '1px solid var(--gv-border)',
        fontSize: 11,
        color: 'var(--gv-text-muted)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <User size={11} />
          <span>{card.assignee}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <CalendarDays size={11} />
          <span>{new Date(card.dueDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function PDCAView() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}
    >
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(16,185,129,0.15))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lightbulb size={18} color="#8b5cf6" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--gv-text-heading)', margin: 0, letterSpacing: -0.5 }}>
            PDCA Activities — Mejora Continua
          </h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--gv-text-muted)', margin: 0, paddingLeft: 46 }}>
          Tablero de seguimiento de actividades de mejora continua IATF 16949
        </p>
      </div>

      {/* PDCA Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 20,
        flex: 1,
        minHeight: 0,
      }}>
        {columns.map((col, colIndex) => (
          <motion.div
            key={col.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: colIndex * 0.1 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              borderRadius: 14,
              background: 'var(--gv-surface-alt)',
              border: '1px solid var(--gv-border)',
              padding: '4px',
              overflow: 'hidden',
            }}
          >
            {/* Column header */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: '10px 10px 6px 6px',
                background: col.gradient,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '0.05em' }}>
                  {col.label}
                </h3>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '2px 0 0', fontWeight: 500 }}>
                  {col.description}
                </p>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.2)',
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#fff',
                }}
              >
                {pdcaCards[col.key]?.length || 0}
              </div>
            </div>

            {/* Cards */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              padding: '8px 10px 12px',
              flex: 1,
              overflowY: 'auto',
            }}>
              {pdcaCards[col.key]?.map((card, cardIndex) => (
                <PDCACardItem
                  key={card.id}
                  card={card}
                  colIndex={colIndex}
                  cardIndex={cardIndex}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
