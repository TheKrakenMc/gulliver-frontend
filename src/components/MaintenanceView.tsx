import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Wrench,
  ChevronDown,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
  Zap,
} from 'lucide-react';
import mttoCatalog from '../utils/Failures_MTTO.json';
import type { MTTOMaquina, MTTOCategoria, MTTOFalla, WorkOrder } from '../types';

const machines = mttoCatalog as MTTOMaquina[];

export default function MaintenanceView() {
  const { t } = useTranslation();
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedFault, setSelectedFault] = useState<string>('');
  const [priority, setPriority] = useState<WorkOrder['prioridad']>('Alta');
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([
    {
      id: 'WO-001',
      maquina: 'PRENSA DE CALENTADO (PME 306)',
      categoria: 'Electrónica/Eléctrica',
      falla: 'ERROR EN PLC - PÉRDIDA DE SEÑAL',
      codigoFalla: 'MTTO-ERR-101',
      prioridad: 'Crítica',
      status: 'En Proceso',
      timestamp: '2026-04-15 08:32',
    },
    {
      id: 'WO-002',
      maquina: 'ESPUMADORA ALTA PRESIÓN (ESP 301)',
      categoria: 'Mecánica',
      falla: 'FALTA DE PRESIÓN EN BOMBA',
      codigoFalla: 'MTTO-ERR-303',
      prioridad: 'Media',
      status: 'Abierta',
      timestamp: '2026-04-15 10:15',
    },
  ]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Cascading logic
  const currentMachine = useMemo(
    () => machines.find((m) => m.id_maquina === selectedMachine),
    [selectedMachine]
  );
  const categories: MTTOCategoria[] = currentMachine?.categorias ?? [];
  const currentCategory = useMemo(
    () => categories.find((c) => c.id_cat === selectedCategory),
    [categories, selectedCategory]
  );
  const faults: MTTOFalla[] = currentCategory?.fallas ?? [];
  const currentFault = useMemo(
    () => faults.find((f) => f.codigo === selectedFault),
    [faults, selectedFault]
  );

  const handleMachineChange = (val: string) => {
    setSelectedMachine(val);
    setSelectedCategory('');
    setSelectedFault('');
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    setSelectedFault('');
  };

  const handleCreateWO = () => {
    if (!currentMachine || !currentCategory || !currentFault) return;
    const newWO: WorkOrder = {
      id: `WO-${String(workOrders.length + 1).padStart(3, '0')}`,
      maquina: currentMachine.nombre,
      categoria: currentCategory.nombre,
      falla: currentFault.descripcion,
      codigoFalla: currentFault.codigo,
      prioridad: priority,
      status: 'Abierta',
      timestamp: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
    };
    setWorkOrders((prev) => [newWO, ...prev]);
    setSelectedMachine('');
    setSelectedCategory('');
    setSelectedFault('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const isValid = selectedMachine && selectedCategory && selectedFault;

  const selectStyle: React.CSSProperties = {
    appearance: 'none',
    width: '100%',
    padding: '12px 40px 12px 16px',
    background: 'var(--gv-surface-alt)',
    border: '1px solid var(--gv-border)',
    borderRadius: 10,
    color: 'var(--gv-text-heading)',
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--gv-text-muted)',
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    'Abierta': { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
    'En Proceso': { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6' },
    'Cerrada': { bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
  };
  const prioColors: Record<string, { bg: string; text: string }> = {
    'Crítica': { bg: 'rgba(239,68,68,0.12)', text: '#ef4444' },
    'Alta': { bg: 'rgba(249,115,22,0.12)', text: '#f97316' },
    'Media': { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
    'Baja': { bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
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
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(239,68,68,0.15))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Wrench size={18} color="#f97316" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--gv-text-heading)', margin: 0, letterSpacing: -0.5 }}>
            {t('maintenance.title')}
          </h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--gv-text-muted)', margin: 0, paddingLeft: 46 }}>
          {t('maintenance.subtitle')}
        </p>
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            style={{
              padding: '14px 20px',
              borderRadius: 10,
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: '#10b981',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={18} />
            {t('maintenance.success_msg')}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cascade Selectors */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card"
        style={{ padding: '28px' }}
      >
        <h3 style={{
          fontSize: 15, fontWeight: 700, color: 'var(--gv-text-heading)', margin: '0 0 20px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Zap size={16} color="var(--gv-primary)" />
          {t('maintenance.new_wo')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Step 1: Machine */}
          <div>
            <div style={labelStyle}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                background: selectedMachine ? 'var(--gv-primary)' : 'var(--gv-border)',
                color: selectedMachine ? '#fff' : 'var(--gv-text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800,
              }}>1</span>
              {t('maintenance.machine')}
            </div>
            <div style={{ position: 'relative' }}>
              <select
                style={selectStyle}
                value={selectedMachine}
                onChange={(e) => handleMachineChange(e.target.value)}
              >
                <option value="">Seleccionar máquina...</option>
                {machines.map((m) => (
                  <option key={m.id_maquina} value={m.id_maquina}>
                    {m.nombre} — {m.nave}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gv-text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Step 2: Category */}
          <div>
            <div style={labelStyle}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                background: selectedCategory ? 'var(--gv-primary)' : 'var(--gv-border)',
                color: selectedCategory ? '#fff' : 'var(--gv-text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800,
              }}>2</span>
              {t('maintenance.category')}
            </div>
            <div style={{ position: 'relative' }}>
              <select
                style={{
                  ...selectStyle,
                  opacity: selectedMachine ? 1 : 0.4,
                  pointerEvents: selectedMachine ? 'auto' : 'none',
                }}
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                disabled={!selectedMachine}
              >
                <option value="">
                  {selectedMachine ? 'Seleccionar categoría...' : 'Primero seleccione máquina'}
                </option>
                {categories.map((c) => (
                  <option key={c.id_cat} value={c.id_cat}>{c.nombre}</option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gv-text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Step 3: Specific Fault */}
          <div>
            <div style={labelStyle}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                background: selectedFault ? 'var(--gv-primary)' : 'var(--gv-border)',
                color: selectedFault ? '#fff' : 'var(--gv-text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800,
              }}>3</span>
              {t('maintenance.fault')}
            </div>
            <div style={{ position: 'relative' }}>
              <select
                style={{
                  ...selectStyle,
                  opacity: selectedCategory ? 1 : 0.4,
                  pointerEvents: selectedCategory ? 'auto' : 'none',
                }}
                value={selectedFault}
                onChange={(e) => setSelectedFault(e.target.value)}
                disabled={!selectedCategory}
              >
                <option value="">
                  {selectedCategory ? 'Seleccionar falla...' : 'Primero seleccione categoría'}
                </option>
                {faults.map((f) => (
                  <option key={f.codigo} value={f.codigo}>
                    [{f.codigo}] {f.descripcion}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gv-text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Priority (Spans 2 columns on medium/large devices) */}
          <div className="col-span-1 md:col-span-2">
            <div style={labelStyle}>
              <AlertCircle size={12} />
              {t('maintenance.priority')}
            </div>
            <div style={{ display: 'flex', gap: 8, height: 44 }}>
              {(['Crítica', 'Alta', 'Media', 'Baja'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  style={{
                    flex: 1,
                    height: '100%',
                    padding: '8px 4px',
                    borderRadius: 8,
                    border: `1px solid ${priority === p ? prioColors[p].text : 'var(--gv-border)'}`,
                    background: priority === p ? prioColors[p].bg : 'transparent',
                    color: priority === p ? prioColors[p].text : 'var(--gv-text-muted)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Submit button (Spans 1 column) */}
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
            <motion.button
              whileHover={isValid ? { scale: 1.02 } : {}}
              whileTap={isValid ? { scale: 0.97 } : {}}
              onClick={handleCreateWO}
              disabled={!isValid}
              style={{
                width: '100%',
                height: 44,
                borderRadius: 8,
                border: 'none',
                background: isValid
                  ? 'linear-gradient(135deg, #f97316, #ef4444)'
                  : 'var(--gv-border)',
                color: isValid ? '#fff' : 'var(--gv-text-muted)',
                fontSize: 14,
                fontWeight: 700,
                cursor: isValid ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
              }}
            >
              <FileText size={16} />
              {t('maintenance.btn_open_wo')}
            </motion.button>
          </div>
        </div>

        {/* Preview of selection */}
        <AnimatePresence>
          {currentFault && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                marginTop: 20,
                padding: '16px 20px',
                borderRadius: 10,
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.15)',
                fontSize: 13,
                color: 'var(--gv-text)',
                display: 'flex',
                gap: 32,
              }}
            >
              <div>
                <span style={{ color: 'var(--gv-text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Máquina</span>
                <div style={{ fontWeight: 700, color: 'var(--gv-text-heading)', marginTop: 2 }}>{currentMachine?.nombre}</div>
              </div>
              <div>
                <span style={{ color: 'var(--gv-text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Categoría</span>
                <div style={{ fontWeight: 700, color: 'var(--gv-text-heading)', marginTop: 2 }}>{currentCategory?.nombre}</div>
              </div>
              <div>
                <span style={{ color: 'var(--gv-text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Falla</span>
                <div style={{ fontWeight: 700, color: 'var(--gv-text-heading)', marginTop: 2 }}>[{currentFault.codigo}] {currentFault.descripcion}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Work Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card"
        style={{ overflow: 'hidden' }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gv-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gv-text-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="var(--gv-primary)" />
            {t('maintenance.recent_wo')}
          </h3>
          <span style={{ fontSize: 12, color: 'var(--gv-text-muted)', fontWeight: 600 }}>{workOrders.length} registros</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Inter', sans-serif" }}>
            <thead>
              <tr>
                {[
                  { label: t('maintenance.col_id'), minW: 90 },
                  { label: t('maintenance.col_machine'), minW: 240 },
                  { label: t('maintenance.col_category'), minW: 160 },
                  { label: t('maintenance.col_fault'), minW: 220 },
                  { label: t('maintenance.col_priority'), minW: 110 },
                  { label: t('maintenance.col_status'), minW: 110 },
                  { label: t('maintenance.col_date'), minW: 130 }
                ].map(({ label, minW }) => (
                  <th key={label} style={{
                    padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gv-text-muted)',
                    borderBottom: '1px solid var(--gv-border)', background: 'var(--gv-surface-alt)',
                    minWidth: minW,
                  }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workOrders.map((wo, i) => (
                <motion.tr
                  key={wo.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ transition: 'background 0.15s ease' }}
                >
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--gv-border)', fontWeight: 700, color: 'var(--gv-primary)', fontSize: 13 }}>{wo.id}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--gv-border)', fontSize: 13, color: 'var(--gv-text-heading)', fontWeight: 600 }}>{wo.maquina}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--gv-border)', fontSize: 13, color: 'var(--gv-text)' }}>{wo.categoria}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--gv-border)', fontSize: 12, color: 'var(--gv-text)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wo.falla}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--gv-border)' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 5,
                      background: prioColors[wo.prioridad]?.bg, color: prioColors[wo.prioridad]?.text,
                    }}>
                      {wo.prioridad}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--gv-border)' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 5,
                      background: statusColors[wo.status]?.bg, color: statusColors[wo.status]?.text,
                    }}>
                      {wo.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--gv-border)', fontSize: 12, color: 'var(--gv-text-muted)' }}>{wo.timestamp}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
