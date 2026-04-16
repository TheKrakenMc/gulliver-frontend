import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Plus, Trash2, ChevronDown, Save, CheckCircle2 } from 'lucide-react';
import type { PlanRecord } from '../types';

const availableLines = ['HMP-1', 'HMP-2', 'HMP-3', 'INJ-1', 'INJ-2', 'ASM-1', 'ASM-2', 'PNT-1'];
const availableTurnos: PlanRecord['turno'][] = ['Matutino', 'Vespertino', 'Nocturno'];
const turnoHours: Record<string, string> = {
  'Matutino': '06:00 – 14:00',
  'Vespertino': '14:00 – 22:00',
  'Nocturno': '22:00 – 06:00',
};
const availableSKUs = [
  'DASH-INNER-001',
  'DASH-OUTER-002',
  'DOOR-PNL-003',
  'CONSOLE-004',
  'IP-CARRIER-005',
  'TRUNK-TRIM-006',
];

interface LogisticsViewProps {
  planRecords: PlanRecord[];
  onUpdatePlanRecords: (records: PlanRecord[]) => void;
}

export default function LogisticsView({ planRecords, onUpdatePlanRecords }: LogisticsViewProps) {
  const [showSaved, setShowSaved] = useState(false);

  const addRow = () => {
    const newRecord: PlanRecord = {
      id_plan: `PLAN-${Date.now()}`,
      linea: availableLines[0],
      turno: 'Matutino',
      sku: availableSKUs[0],
      target_hr: 45,
    };
    onUpdatePlanRecords([...planRecords, newRecord]);
  };

  const updateRow = (index: number, field: keyof PlanRecord, value: string | number) => {
    const updated = planRecords.map((r, i) => {
      if (i !== index) return r;
      if (field === 'target_hr') return { ...r, [field]: parseInt(value as string) || 0 };
      return { ...r, [field]: value };
    });
    onUpdatePlanRecords(updated);
  };

  const removeRow = (index: number) => {
    onUpdatePlanRecords(planRecords.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const totalTarget = planRecords.reduce((acc, r) => acc + r.target_hr * 8, 0);

  const selectStyle: React.CSSProperties = {
    appearance: 'none',
    padding: '10px 32px 10px 14px',
    background: 'var(--gv-surface-alt)',
    border: '1px solid var(--gv-border)',
    borderRadius: 8,
    color: 'var(--gv-text-heading)',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.2s ease',
  };

  const thStyle: React.CSSProperties = {
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--gv-text-muted)',
    borderBottom: '2px solid var(--gv-border)',
    background: 'var(--gv-surface-alt)',
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderBottom: '1px solid var(--gv-border)',
    verticalAlign: 'middle',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 28 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(59,130,246,0.15))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Truck size={18} color="#06b6d4" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--gv-text-heading)', margin: 0, letterSpacing: -0.5 }}>
              Logística — Master Schedule
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--gv-text-muted)', margin: 0, paddingLeft: 46 }}>
            Los targets definidos aquí alimentan automáticamente la vista Hora x Hora
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="glass-card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gv-text-muted)', textTransform: 'uppercase' }}>Target Turno (8h)</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gv-primary)', lineHeight: 1 }}>{totalTarget} pzs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Saved toast */}
      <AnimatePresence>
        {showSaved && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            style={{
              padding: '14px 20px', borderRadius: 10,
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', gap: 10,
              color: '#10b981', fontSize: 14, fontWeight: 600,
            }}
          >
            <CheckCircle2 size={18} />
            Planeación guardada — Targets inyectados a Registro Operativo
          </motion.div>
        )}
      </AnimatePresence>

      {/* Master Schedule Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card"
        style={{ overflow: 'hidden' }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Inter', sans-serif" }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 50 }}>#</th>
                <th style={thStyle}>Línea</th>
                <th style={thStyle}>Turno</th>
                <th style={thStyle}>Horario</th>
                <th style={thStyle}>No. Parte (SKU)</th>
                <th style={{ ...thStyle, width: 130 }}>Target / Hora</th>
                <th style={{ ...thStyle, width: 130 }}>Target Turno (8h)</th>
                <th style={{ ...thStyle, width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {planRecords.map((record, index) => (
                  <motion.tr
                    key={record.id_plan}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28, borderRadius: 7,
                        background: 'var(--gv-surface-alt)', fontWeight: 700, fontSize: 12,
                        color: 'var(--gv-text-muted)',
                      }}>
                        {index + 1}
                      </span>
                    </td>
                    {/* Línea */}
                    <td style={tdStyle}>
                      <div style={{ position: 'relative' }}>
                        <select
                          style={selectStyle}
                          value={record.linea}
                          onChange={(e) => updateRow(index, 'linea', e.target.value)}
                        >
                          {availableLines.map((l) => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gv-text-muted)', pointerEvents: 'none' }} />
                      </div>
                    </td>
                    {/* Turno */}
                    <td style={tdStyle}>
                      <div style={{ position: 'relative' }}>
                        <select
                          style={selectStyle}
                          value={record.turno}
                          onChange={(e) => updateRow(index, 'turno', e.target.value)}
                        >
                          {availableTurnos.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gv-text-muted)', pointerEvents: 'none' }} />
                      </div>
                    </td>
                    {/* Horario */}
                    <td style={{ ...tdStyle, fontSize: 12, color: 'var(--gv-text-muted)', fontWeight: 500 }}>
                      {turnoHours[record.turno]}
                    </td>
                    {/* SKU */}
                    <td style={tdStyle}>
                      <div style={{ position: 'relative' }}>
                        <select
                          style={selectStyle}
                          value={record.sku}
                          onChange={(e) => updateRow(index, 'sku', e.target.value)}
                        >
                          {availableSKUs.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gv-text-muted)', pointerEvents: 'none' }} />
                      </div>
                    </td>
                    {/* Target / hr */}
                    <td style={tdStyle}>
                      <input
                        type="number"
                        style={{
                          width: '100%', padding: '10px 14px',
                          background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)',
                          borderRadius: 8, color: 'var(--gv-primary)', fontSize: 15,
                          fontWeight: 800, fontFamily: "'Inter', sans-serif", textAlign: 'center',
                          transition: 'all 0.2s ease',
                        }}
                        value={record.target_hr || ''}
                        onChange={(e) => updateRow(index, 'target_hr', e.target.value)}
                        min={0}
                      />
                    </td>
                    {/* Target turno */}
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800, fontSize: 15, color: 'var(--gv-text-heading)' }}>
                      {record.target_hr * 8}
                    </td>
                    {/* Delete */}
                    <td style={tdStyle}>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeRow(index)}
                        style={{
                          width: 32, height: 32, borderRadius: 7,
                          border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)',
                          color: '#ef4444', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Add Row + Save */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--gv-border)',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={addRow}
            style={{
              padding: '10px 22px', borderRadius: 8,
              border: '1px dashed var(--gv-border)', background: 'transparent',
              color: 'var(--gv-primary)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            <Plus size={16} /> Agregar Línea
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            style={{
              padding: '10px 24px', borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s ease',
            }}
          >
            <Save size={16} /> Guardar y Publicar Targets
          </motion.button>
        </div>
      </motion.div>

      {/* Info callout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          padding: '16px 20px',
          borderRadius: 10,
          background: 'rgba(6,182,212,0.06)',
          border: '1px solid rgba(6,182,212,0.15)',
          fontSize: 13,
          color: 'var(--gv-text)',
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: 'var(--gv-primary)' }}>💡 Integración automática:</strong>{' '}
        Los valores de <strong>Target / Hora</strong> definidos en este módulo se inyectan directamente como 
        el target en la vista <strong>Registro Operativo (Hora x Hora)</strong>. El primer registro de este 
        módulo define el target por defecto del turno actual.
      </motion.div>
    </motion.div>
  );
}
