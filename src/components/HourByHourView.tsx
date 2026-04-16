import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  TrendingDown,
  Wrench,
  ChevronDown,
  GitBranch,
  Network,
  BadgeCheck,
  ShieldAlert,
  X,
  Eye,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import type { HourRecord, FilterState, FaultRecord, ScrapRecord, ValidationStatus } from '../types';
import mttoCatalog from '../utils/Failures_MTTO.json';
import scrapCatalog from '../utils/Failures_SCRAP.json';
import type { MTTOMaquina, ScrapCatalog, ScrapDefecto } from '../types';
import FaultAnalysisDrawer from './FaultAnalysisDrawer';

const machines = mttoCatalog as MTTOMaquina[];
const catalog = scrapCatalog as ScrapCatalog;
const technologies = Object.keys(catalog);

interface HourByHourViewProps {
  filters: FilterState;
  planTarget: number;
}

/* ════════════════════════════════════════════════════ */
/*          Fault Registration Modal                  */
/* ════════════════════════════════════════════════════ */

interface FaultModalProps {
  hourRecord: HourRecord & { hour: number };
  onRegister: (fault: Omit<FaultRecord, 'id' | 'validationMtto' | 'validationQuality' | 'timestamp' | 'analysisType' | 'analysisComplete'>) => void;
  onClose: () => void;
}

function FaultRegistrationModal({ hourRecord, onRegister, onClose }: FaultModalProps) {
  const [selMachine, setSelMachine] = useState('');
  const [selCategory, setSelCategory] = useState('');
  const [selFault, setSelFault] = useState('');
  const [downtimeMin, setDowntimeMin] = useState(hourRecord.downtime || 0);

  const currentMachine = machines.find((m) => m.id_maquina === selMachine);
  const categories = currentMachine?.categorias ?? [];
  const currentCategory = categories.find((c) => c.id_cat === selCategory);
  const faults = currentCategory?.fallas ?? [];
  const currentFault = faults.find((f) => f.codigo === selFault);
  const isValid = selMachine && selCategory && selFault;

  const selectStyle: React.CSSProperties = {
    appearance: 'none', width: '100%', padding: '10px 36px 10px 14px',
    background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)',
    borderRadius: 8, color: 'var(--gv-text-heading)', fontSize: 13, fontWeight: 500,
    fontFamily: 'inherit', cursor: 'pointer',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 320 }}
        style={{ width: '100%', maxWidth: 600, background: 'var(--gv-surface)', border: '1px solid var(--gv-border)', borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.4)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--gv-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(249,115,22,0.06))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(249,115,22,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={16} color="#f97316" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--gv-text-heading)' }}>Registrar Falla — Hora {hourRecord.hour}</div>
              <div style={{ fontSize: 11, color: 'var(--gv-text-muted)' }}>La falla queda registrada en el registro operativo</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--gv-border)', background: 'var(--gv-surface-alt)', color: 'var(--gv-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Step 1 — Machine */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: selMachine ? 'var(--gv-primary)' : 'var(--gv-border)', color: selMachine ? '#fff' : 'var(--gv-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>1</span>
              Activo Fijo / Máquina
            </label>
            <div style={{ position: 'relative' }}>
              <select style={selectStyle} value={selMachine} onChange={(e) => { setSelMachine(e.target.value); setSelCategory(''); setSelFault(''); }}>
                <option value="">Seleccionar máquina...</option>
                {machines.map((m) => <option key={m.id_maquina} value={m.id_maquina}>{m.nombre} — {m.nave}</option>)}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gv-text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Step 2 — Category */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: selCategory ? 'var(--gv-primary)' : 'var(--gv-border)', color: selCategory ? '#fff' : 'var(--gv-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>2</span>
              Categoría / Subsistema
            </label>
            <div style={{ position: 'relative' }}>
              <select style={{ ...selectStyle, opacity: selMachine ? 1 : 0.4 }} value={selCategory} onChange={(e) => { setSelCategory(e.target.value); setSelFault(''); }} disabled={!selMachine}>
                <option value="">{selMachine ? 'Seleccionar categoría...' : 'Primero seleccione máquina'}</option>
                {categories.map((c) => <option key={c.id_cat} value={c.id_cat}>{c.nombre}</option>)}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gv-text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Step 3 — Fault */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: selFault ? 'var(--gv-primary)' : 'var(--gv-border)', color: selFault ? '#fff' : 'var(--gv-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>3</span>
              Falla Específica
            </label>
            <div style={{ position: 'relative' }}>
              <select style={{ ...selectStyle, opacity: selCategory ? 1 : 0.4 }} value={selFault} onChange={(e) => setSelFault(e.target.value)} disabled={!selCategory}>
                <option value="">{selCategory ? 'Seleccionar falla...' : 'Primero seleccione categoría'}</option>
                {faults.map((f) => <option key={f.codigo} value={f.codigo}>[{f.codigo}] {f.descripcion}</option>)}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gv-text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Downtime */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Clock size={12} /> Downtime (min)
            </label>
            <input type="number" min={0} value={downtimeMin} onChange={(e) => setDowntimeMin(parseInt(e.target.value) || 0)}
              style={{ width: '100%', padding: '10px 14px', background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)', borderRadius: 8, color: 'var(--gv-text-heading)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}
            />
          </div>

          {/* Preview */}
          <AnimatePresence>
            {currentFault && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12 }}
              >
                <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>Vista previa del registro:</div>
                <div style={{ color: 'var(--gv-text)', lineHeight: 1.6 }}>
                  <strong>Máquina:</strong> {currentMachine?.nombre}<br />
                  <strong>Categoría:</strong> {currentCategory?.nombre}<br />
                  <strong>Falla:</strong> [{currentFault.codigo}] {currentFault.descripcion}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--gv-border)', display: 'flex', gap: 10, justifyContent: 'flex-end', background: 'var(--gv-surface-alt)' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 7, border: '1px solid var(--gv-border)', background: 'transparent', color: 'var(--gv-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <motion.button whileHover={isValid ? { scale: 1.02 } : {}} whileTap={isValid ? { scale: 0.97 } : {}} disabled={!isValid}
            onClick={() => {
              if (!currentMachine || !currentCategory || !currentFault) return;
              onRegister({ maquinaId: currentMachine.id_maquina, maquinaNombre: currentMachine.nombre, categoriaId: currentCategory.id_cat, categoriaNombre: currentCategory.nombre, codigoFalla: currentFault.codigo, fallaDescripcion: currentFault.descripcion, downtimeMin });
              onClose();
            }}
            style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: isValid ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'var(--gv-border)', color: isValid ? '#fff' : 'var(--gv-text-muted)', fontSize: 13, fontWeight: 700, cursor: isValid ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Wrench size={14} /> Registrar Falla
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════ */
/*          Scrap Registration Modal                  */
/* ════════════════════════════════════════════════════ */

interface ScrapModalProps {
  hourNumber: number;
  onRegister: (scrap: Omit<ScrapRecord, 'id' | 'validationQuality' | 'timestamp'>) => void;
  onClose: () => void;
}

function ScrapRegistrationModal({ hourNumber, onRegister, onClose }: ScrapModalProps) {
  const [selTech, setSelTech] = useState(technologies[0]);
  const [selDefect, setSelDefect] = useState('');
  const [cantidad, setCantidad] = useState(1);

  const defects: ScrapDefecto[] = catalog[selTech] || [];
  const currentDefect = defects.find((d) => d.codigo === selDefect);
  const isValid = selTech && selDefect && cantidad > 0;

  const selectStyle: React.CSSProperties = {
    appearance: 'none', width: '100%', padding: '10px 36px 10px 14px',
    background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)',
    borderRadius: 8, color: 'var(--gv-text-heading)', fontSize: 13, fontWeight: 500,
    fontFamily: 'inherit', cursor: 'pointer',
  };

  const techColors: Record<string, string> = {
    'Inyeccion': '#3b82f6',
    'Termoformado': '#8b5cf6',
    'Corte': '#f59e0b',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 320 }}
        style={{ width: '100%', maxWidth: 560, background: 'var(--gv-surface)', border: '1px solid var(--gv-border)', borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.4)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--gv-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(236,72,153,0.06))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={16} color="#8b5cf6" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--gv-text-heading)' }}>Registrar Scrap — Hora {hourNumber}</div>
              <div style={{ fontSize: 11, color: 'var(--gv-text-muted)' }}>Piezas con defectos por tecnología y tipo de defecto</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--gv-border)', background: 'var(--gv-surface-alt)', color: 'var(--gv-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Step 1 — Technology Tabs */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: selTech ? 'var(--gv-primary)' : 'var(--gv-border)', color: selTech ? '#fff' : 'var(--gv-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>1</span>
              Tecnología
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {technologies.map((tech) => {
                const isActive = tech === selTech;
                const tc = techColors[tech] || '#64748b';
                return (
                  <motion.button key={tech} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => { setSelTech(tech); setSelDefect(''); }}
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: 8,
                      border: isActive ? `2px solid ${tc}` : '2px solid var(--gv-border)',
                      background: isActive ? `${tc}12` : 'transparent',
                      color: isActive ? tc : 'var(--gv-text-muted)',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {tech}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Step 2 — Defect */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: selDefect ? 'var(--gv-primary)' : 'var(--gv-border)', color: selDefect ? '#fff' : 'var(--gv-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>2</span>
              Tipo de Defecto
            </label>
            <div style={{ position: 'relative' }}>
              <select style={selectStyle} value={selDefect} onChange={(e) => setSelDefect(e.target.value)}>
                <option value="">Seleccionar defecto...</option>
                {defects.map((d) => <option key={d.codigo} value={d.codigo}>[{d.codigo}] {d.defecto}</option>)}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gv-text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Step 3 — Quantity */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: cantidad > 0 ? 'var(--gv-primary)' : 'var(--gv-border)', color: cantidad > 0 ? '#fff' : 'var(--gv-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>3</span>
              Cantidad de Piezas
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => setCantidad((p) => Math.max(1, p - 1))}
                style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid var(--gv-border)', background: 'var(--gv-surface-alt)', color: 'var(--gv-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, fontFamily: 'inherit' }}
              >−</motion.button>
              <input type="number" min={1} value={cantidad} onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: 80, padding: '10px', background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)', borderRadius: 8, color: 'var(--gv-text-heading)', fontSize: 20, fontWeight: 800, fontFamily: 'inherit', textAlign: 'center' }}
              />
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => setCantidad((p) => p + 1)}
                style={{ width: 40, height: 40, borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, fontFamily: 'inherit' }}
              >+</motion.button>
              <span style={{ fontSize: 13, color: 'var(--gv-text-muted)', fontWeight: 600 }}>piezas</span>
            </div>
          </div>

          {/* Preview */}
          <AnimatePresence>
            {currentDefect && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', fontSize: 12 }}
              >
                <div style={{ color: '#8b5cf6', fontWeight: 700, marginBottom: 4 }}>Vista previa del registro:</div>
                <div style={{ color: 'var(--gv-text)', lineHeight: 1.6 }}>
                  <strong>Tecnología:</strong> {selTech}<br />
                  <strong>Defecto:</strong> [{currentDefect.codigo}] {currentDefect.defecto}<br />
                  <strong>Cantidad:</strong> {cantidad} pieza{cantidad !== 1 ? 's' : ''}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--gv-border)', display: 'flex', gap: 10, justifyContent: 'flex-end', background: 'var(--gv-surface-alt)' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 7, border: '1px solid var(--gv-border)', background: 'transparent', color: 'var(--gv-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <motion.button whileHover={isValid ? { scale: 1.02 } : {}} whileTap={isValid ? { scale: 0.97 } : {}} disabled={!isValid}
            onClick={() => {
              if (!currentDefect) return;
              onRegister({ tecnologia: selTech, codigoDefecto: currentDefect.codigo, defecto: currentDefect.defecto, cantidad });
              onClose();
            }}
            style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: isValid ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'var(--gv-border)', color: isValid ? '#fff' : 'var(--gv-text-muted)', fontSize: 13, fontWeight: 700, cursor: isValid ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ShieldCheck size={14} /> Registrar Defecto
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════ */
/*       Shared Small Components                     */
/* ════════════════════════════════════════════════════ */

function ValidationPill({ status, dept }: { status: ValidationStatus; dept: 'MTTO' | 'CAL' }) {
  const cfg: Record<ValidationStatus, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
    pendiente: { label: 'Pendiente', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', icon: <Clock size={10} /> },
    validado:  { label: 'Validado',  bg: 'rgba(16,185,129,0.12)', color: '#10b981', icon: <CheckCircle2 size={10} /> },
    corregido: { label: 'Corregido', bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', icon: <BadgeCheck size={10} /> },
  };
  const c = cfg[status];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
      <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--gv-text-muted)', letterSpacing: '0.04em' }}>{dept}</div>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: c.bg, color: c.color }}>
        {c.icon} {c.label}
      </span>
    </div>
  );
}

function AnalysisBadge({ fault, onClick }: { fault: FaultRecord; onClick: () => void }) {
  if (fault.analysisComplete) {
    const isWhys = fault.analysisType === '5whys';
    return (
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClick}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, border: 'none', background: isWhys ? 'rgba(139,92,246,0.12)' : 'rgba(6,182,212,0.12)', color: isWhys ? '#8b5cf6' : '#06b6d4', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
      >
        {isWhys ? <GitBranch size={11} /> : <Network size={11} />}
        {isWhys ? '5 Porqués' : 'Ishikawa'} ✓
      </motion.button>
    );
  }
  return (
    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClick}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, border: '1px dashed rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.06)', color: '#f59e0b', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
    >
      <ShieldAlert size={11} /> Requiere RCA
    </motion.button>
  );
}

/* ════════════════════════════════════════════════════ */
/*               MAIN COMPONENT                       */
/* ════════════════════════════════════════════════════ */

export default function HourByHourView({ filters, planTarget }: HourByHourViewProps) {
  /* ── Hour Records ── */
  const [records, setRecords] = useState<HourRecord[]>(
    Array.from({ length: 4 }, (_, i) => ({
      hour: i + 1,
      target: planTarget,
      actualOK: [55, 58, 52, 60][i],
      scrap: [3, 1, 5, 2][i],
      downtime: [5, 2, 8, 0][i],
      comments: ['', 'Buen ritmo', 'Falla sensor proximidad', ''][i],
      oeeLoss: 0,
    })).map((r) => ({
      ...r,
      oeeLoss: r.target > 0 && r.actualOK < r.target
        ? parseFloat((((r.target - r.actualOK) / r.target) * 100).toFixed(1))
        : 0,
    }))
  );

  /* ── Fault state ── */
  const [faultsByHour, setFaultsByHour] = useState<Record<number, FaultRecord[]>>({
    2: [{
      id: 'F-001', maquinaId: 'PME-306', maquinaNombre: 'PRENSA DE CALENTADO (PME 306)',
      categoriaId: 'ELEC-01', categoriaNombre: 'Electrónica/Eléctrica',
      codigoFalla: 'MTTO-ERR-102', fallaDescripcion: 'FALLA EN FOTOSELDA L3',
      downtimeMin: 8, analysisType: null, analysisComplete: false,
      validationMtto: 'pendiente', validationQuality: 'pendiente', timestamp: 'Hora 3',
    }],
  });

  /* ── Scrap state ── */
  const [scrapByHour, setScrapByHour] = useState<Record<number, ScrapRecord[]>>({
    0: [
      { id: 'S-001', tecnologia: 'Inyeccion', codigoDefecto: 'QUAL-SCR-01', defecto: 'REBABA EXCESIVA', cantidad: 2, validationQuality: 'pendiente', timestamp: 'Hora 1' },
      { id: 'S-002', tecnologia: 'Inyeccion', codigoDefecto: 'QUAL-SCR-03', defecto: 'PUNTO NEGRO / CONTAMINACIÓN', cantidad: 1, validationQuality: 'validado', timestamp: 'Hora 1' },
    ],
    2: [
      { id: 'S-003', tecnologia: 'Termoformado', codigoDefecto: 'QUAL-SCR-04', defecto: 'PLIEGUE EN MATERIAL', cantidad: 3, validationQuality: 'pendiente', timestamp: 'Hora 3' },
      { id: 'S-004', tecnologia: 'Termoformado', codigoDefecto: 'QUAL-SCR-05', defecto: 'GROSOR INSUFICIENTE', cantidad: 2, validationQuality: 'pendiente', timestamp: 'Hora 3' },
    ],
  });

  /* ── UI state ── */
  const [faultModal, setFaultModal] = useState<number | null>(null);
  const [scrapModal, setScrapModal] = useState<number | null>(null);
  const [analysisDrawer, setAnalysisDrawer] = useState<FaultRecord | null>(null);
  const [validationPanel, setValidationPanel] = useState(false);

  /* ── Actions ── */
  const addRow = () => {
    setRecords((prev) => [...prev, { hour: prev.length + 1, target: planTarget, actualOK: 0, scrap: 0, downtime: 0, comments: '', oeeLoss: 0 }]);
  };

  const updateRecord = (index: number, field: keyof HourRecord, value: string) => {
    setRecords((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        let updated = { ...r };
        if (field === 'comments') updated.comments = value;
        else updated = { ...updated, [field]: parseInt(value) || 0 };
        updated.oeeLoss = updated.target > 0 && updated.actualOK < updated.target
          ? parseFloat((((updated.target - updated.actualOK) / updated.target) * 100).toFixed(1))
          : 0;
        return updated;
      })
    );
  };

  const registerFault = (
    hourIndex: number,
    payload: Omit<FaultRecord, 'id' | 'validationMtto' | 'validationQuality' | 'timestamp' | 'analysisType' | 'analysisComplete'>
  ) => {
    const newFault: FaultRecord = {
      ...payload, id: `F-${Date.now()}`, analysisType: null, analysisComplete: false,
      validationMtto: 'pendiente', validationQuality: 'pendiente',
      timestamp: `Hora ${records[hourIndex]?.hour ?? hourIndex + 1}`,
    };
    setFaultsByHour((prev) => ({ ...prev, [hourIndex]: [...(prev[hourIndex] || []), newFault] }));
    updateRecord(hourIndex, 'downtime', String(payload.downtimeMin));
  };

  const registerScrap = (
    hourIndex: number,
    payload: Omit<ScrapRecord, 'id' | 'validationQuality' | 'timestamp'>
  ) => {
    const newScrap: ScrapRecord = {
      ...payload, id: `S-${Date.now()}`, validationQuality: 'pendiente',
      timestamp: `Hora ${records[hourIndex]?.hour ?? hourIndex + 1}`,
    };
    setScrapByHour((prev) => {
      const updated = { ...prev, [hourIndex]: [...(prev[hourIndex] || []), newScrap] };
      // Auto-sum scrap for the hour
      const totalScrap = updated[hourIndex].reduce((acc, s) => acc + s.cantidad, 0);
      setTimeout(() => updateRecord(hourIndex, 'scrap', String(totalScrap)), 0);
      return updated;
    });
  };

  const updateFault = (updatedFault: FaultRecord) => {
    setFaultsByHour((prev) => {
      const next = { ...prev };
      for (const key in next) next[key] = next[key].map((f) => f.id === updatedFault.id ? updatedFault : f);
      return next;
    });
  };

  const updateValidation = (id: string, type: 'fault' | 'scrap', dept: string, status: ValidationStatus) => {
    if (type === 'fault') {
      setFaultsByHour((prev) => {
        const next = { ...prev };
        for (const key in next) next[key] = next[key].map((f) => f.id === id ? { ...f, [dept]: status } : f);
        return next;
      });
    } else {
      setScrapByHour((prev) => {
        const next = { ...prev };
        for (const key in next) next[key] = next[key].map((s) => s.id === id ? { ...s, [dept]: status } : s);
        return next;
      });
    }
  };

  /* ── Computed values ── */
  const allFaults = useMemo(() => Object.values(faultsByHour).flat(), [faultsByHour]);
  const allScrap = useMemo(() => Object.values(scrapByHour).flat(), [scrapByHour]);
  const totalScrapPieces = useMemo(() => allScrap.reduce((acc, s) => acc + s.cantidad, 0), [allScrap]);

  const totals = useMemo(() => records.reduce(
    (acc, r) => ({ target: acc.target + r.target, actualOK: acc.actualOK + r.actualOK, scrap: acc.scrap + r.scrap, downtime: acc.downtime + r.downtime, oeeLoss: acc.oeeLoss + (r.target > 0 ? Math.max(0, r.target - r.actualOK) : 0) }),
    { target: 0, actualOK: 0, scrap: 0, downtime: 0, oeeLoss: 0 }
  ), [records]);

  const efficiency = totals.target > 0 ? ((totals.actualOK / totals.target) * 100).toFixed(1) : '0.0';
  const scrapRate = totals.actualOK + totals.scrap > 0 ? ((totals.scrap / (totals.actualOK + totals.scrap)) * 100).toFixed(1) : '0.0';
  const totalOeeLossPct = totals.target > 0 ? ((totals.oeeLoss / totals.target) * 100).toFixed(1) : '0.0';

  const pendingValidation = allFaults.filter((f) => f.validationMtto === 'pendiente' || f.validationQuality === 'pendiente').length
    + allScrap.filter((s) => s.validationQuality === 'pendiente').length;

  /* ── Styles ── */
  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)', borderRadius: 6, color: 'var(--gv-text-heading)', fontSize: 13, fontFamily: "'Inter', sans-serif", fontWeight: 500, textAlign: 'center', transition: 'all 0.2s ease' };
  const thStyle: React.CSSProperties = { padding: '11px 12px', textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gv-text-muted)', borderBottom: '2px solid var(--gv-border)', background: 'var(--gv-surface-alt)', position: 'sticky', top: 0, zIndex: 10, whiteSpace: 'nowrap' };
  const tdStyle: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid var(--gv-border)', verticalAlign: 'middle' };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 22 }}
      >
        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={18} color="#f59e0b" />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--gv-text-heading)', margin: 0, letterSpacing: -0.5 }}>
                Registro Operativo — Hora x Hora
              </h1>
            </div>
            <p style={{ fontSize: 13, color: 'var(--gv-text-muted)', margin: 0, paddingLeft: 46 }}>
              {filters.location} › {filters.process} — Turno 1 (06:00 – 14:00) · Target: <strong style={{ color: 'var(--gv-primary)' }}>{planTarget} pzs/hr</strong>
            </p>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setValidationPanel((v) => !v)}
            style={{ padding: '10px 18px', borderRadius: 10, border: pendingValidation > 0 ? '1px solid rgba(245,158,11,0.4)' : '1px solid var(--gv-border)', background: pendingValidation > 0 ? 'rgba(245,158,11,0.08)' : 'var(--gv-surface)', color: pendingValidation > 0 ? '#f59e0b' : 'var(--gv-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s ease' }}
          >
            <BadgeCheck size={15} />
            Panel de Validación
            {pendingValidation > 0 && (
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#f59e0b', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingValidation}</span>
            )}
          </motion.button>
        </div>

        {/* ── KPI Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
          {[
            { label: 'Total OK', value: totals.actualOK, icon: <CheckCircle2 size={16} />, color: '#10b981' },
            { label: 'Scrap', value: `${totals.scrap} (${allScrap.length} def.)`, icon: <AlertTriangle size={16} />, color: '#ef4444' },
            { label: 'Downtime', value: `${totals.downtime} min`, icon: <Clock size={16} />, color: '#f59e0b' },
            { label: 'Eficiencia', value: `${efficiency}%`, icon: <ClipboardList size={16} />, color: parseFloat(efficiency) >= 85 ? '#10b981' : parseFloat(efficiency) >= 75 ? '#f59e0b' : '#ef4444' },
            { label: 'Fallas', value: allFaults.length, icon: <Wrench size={16} />, color: allFaults.length > 0 ? '#ef4444' : '#10b981' },
            { label: 'Scrap Rate', value: `${scrapRate}%`, icon: <Layers size={16} />, color: parseFloat(scrapRate) > 2.5 ? '#ef4444' : '#10b981' },
          ].map((item) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="glass-card"
              style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, flexShrink: 0 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--gv-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gv-text-heading)', lineHeight: 1.2 }}>{item.value}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Info Banner ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ padding: '12px 18px', borderRadius: 10, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)', display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--gv-text)' }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Eye size={14} color="var(--gv-primary)" />
          </div>
          <div>
            <strong style={{ color: 'var(--gv-text-heading)' }}>Flujo integrado:</strong>{' '}
            El operador registra <strong>fallas</strong> (MTTO) y <strong>defectos de scrap</strong> (Calidad) directamente en la tabla.
            Mantenimiento y Calidad <strong>validan y corrigen</strong> — no generan la información.
            Las fallas con downtime ≥ 10 min requieren <strong>análisis RCA</strong> (5 Porqués o Ishikawa).
          </div>
        </motion.div>

        {/* ── Main Table ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Inter', sans-serif" }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 52 }}>Hora</th>
                  <th style={{ ...thStyle, width: 70 }}>Target</th>
                  <th style={{ ...thStyle, width: 90 }}>OK</th>
                  <th style={{ ...thStyle, width: 70 }}>Scrap</th>
                  <th style={{ ...thStyle, width: 90 }}>DT (min)</th>
                  <th style={{ ...thStyle, width: 80 }}>OEE Loss</th>
                  <th style={{ ...thStyle, textAlign: 'left', minWidth: 130 }}>Comentarios</th>
                  <th style={{ ...thStyle, minWidth: 260, background: 'rgba(239,68,68,0.05)', color: '#ef4444', borderLeft: '2px solid rgba(239,68,68,0.15)' }}>Fallas Registradas</th>
                  <th style={{ ...thStyle, minWidth: 260, background: 'rgba(139,92,246,0.05)', color: '#8b5cf6', borderLeft: '2px solid rgba(139,92,246,0.15)' }}>Scrap Registrado</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => {
                  const isCurrentHour = index === records.length - 1 && record.actualOK === 0;
                  const pctOK = record.target > 0 ? record.actualOK / record.target : 0;
                  const rowFaults = faultsByHour[index] || [];
                  const rowScrap = scrapByHour[index] || [];

                  return (
                    <motion.tr key={`hour-${record.hour}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * index }}
                      style={{ background: rowFaults.length > 0 ? 'rgba(239,68,68,0.025)' : isCurrentHour ? 'rgba(59,130,246,0.04)' : 'transparent' }}
                    >
                      {/* Hour */}
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 7, fontWeight: 700, fontSize: 12,
                          color: rowFaults.length > 0 ? '#fff' : isCurrentHour ? '#fff' : 'var(--gv-text-heading)',
                          background: rowFaults.length > 0 ? 'linear-gradient(135deg, #ef4444, #f97316)' : isCurrentHour ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'var(--gv-surface-alt)',
                        }}>{record.hour}</div>
                      </td>
                      {/* Target */}
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: 'var(--gv-text-muted)', fontSize: 13 }}>{record.target}</td>
                      {/* OK */}
                      <td style={tdStyle}>
                        <input type="number" style={{ ...inputStyle, borderColor: record.actualOK > 0 ? pctOK >= 0.9 ? 'rgba(16,185,129,0.4)' : pctOK >= 0.75 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)' : 'var(--gv-border)' }}
                          value={record.actualOK || ''} onChange={(e) => updateRecord(index, 'actualOK', e.target.value)} placeholder="0" min={0} />
                      </td>
                      {/* Scrap */}
                      <td style={tdStyle}>
                        <input type="number" style={{ ...inputStyle, borderColor: record.scrap > 3 ? 'rgba(239,68,68,0.4)' : 'var(--gv-border)', color: record.scrap > 3 ? '#ef4444' : 'var(--gv-text-heading)' }}
                          value={record.scrap || ''} onChange={(e) => updateRecord(index, 'scrap', e.target.value)} placeholder="0" min={0} />
                      </td>
                      {/* Downtime */}
                      <td style={tdStyle}>
                        <input type="number" style={{ ...inputStyle, borderColor: record.downtime > 5 ? 'rgba(245,158,11,0.4)' : 'var(--gv-border)', color: record.downtime > 5 ? '#f59e0b' : 'var(--gv-text-heading)' }}
                          value={record.downtime || ''} onChange={(e) => updateRecord(index, 'downtime', e.target.value)} placeholder="0" min={0} />
                      </td>
                      {/* OEE Loss */}
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {record.oeeLoss > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700, background: record.oeeLoss > 15 ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: record.oeeLoss > 15 ? '#ef4444' : '#f59e0b' }}>
                            <TrendingDown size={11} />-{record.oeeLoss}%
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700, background: record.actualOK > 0 ? 'rgba(16,185,129,0.12)' : 'transparent', color: record.actualOK > 0 ? '#10b981' : 'var(--gv-text-muted)' }}>
                            {record.actualOK > 0 ? '✓ OK' : '—'}
                          </span>
                        )}
                      </td>
                      {/* Comments */}
                      <td style={tdStyle}>
                        <input type="text" style={{ ...inputStyle, textAlign: 'left' }} value={record.comments} onChange={(e) => updateRecord(index, 'comments', e.target.value)} placeholder="Comentario..." />
                      </td>

                      {/* ── FAULTS CELL ── */}
                      <td style={{ ...tdStyle, borderLeft: '2px solid rgba(239,68,68,0.1)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {rowFaults.map((fault) => (
                            <motion.div key={fault.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                              style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', display: 'flex', flexDirection: 'column', gap: 6 }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                <Wrench size={11} color="#ef4444" style={{ marginTop: 2, flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', letterSpacing: '0.04em' }}>{fault.codigoFalla} · {fault.downtimeMin} min</div>
                                  <div style={{ fontSize: 11, color: 'var(--gv-text-heading)', fontWeight: 600, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fault.fallaDescripcion}</div>
                                  <div style={{ fontSize: 10, color: 'var(--gv-text-muted)', marginTop: 1 }}>{fault.maquinaNombre}</div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <AnalysisBadge fault={fault} onClick={() => setAnalysisDrawer(fault)} />
                                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                  <ValidationPill status={fault.validationMtto} dept="MTTO" />
                                  <ValidationPill status={fault.validationQuality} dept="CAL" />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setFaultModal(index)}
                            style={{ padding: '5px 10px', borderRadius: 6, border: '1px dashed rgba(239,68,68,0.35)', background: 'transparent', color: 'rgba(239,68,68,0.6)', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s ease', alignSelf: 'flex-start' }}
                          >
                            <Plus size={11} /> Registrar falla
                          </motion.button>
                        </div>
                      </td>

                      {/* ── SCRAP CELL ── */}
                      <td style={{ ...tdStyle, borderLeft: '2px solid rgba(139,92,246,0.1)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {rowScrap.map((scrap) => (
                            <motion.div key={scrap.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                              style={{ padding: '6px 10px', borderRadius: 7, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                              <ShieldCheck size={11} color="#8b5cf6" style={{ flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#8b5cf6', letterSpacing: '0.04em' }}>{scrap.codigoDefecto}</div>
                                <div style={{ fontSize: 11, color: 'var(--gv-text-heading)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scrap.defecto}</div>
                              </div>
                              {/* Qty badge */}
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 26, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '0 6px', flexShrink: 0 }}>
                                {scrap.cantidad}
                              </span>
                              {/* Quality validation */}
                              <ValidationPill status={scrap.validationQuality} dept="CAL" />
                            </motion.div>
                          ))}
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setScrapModal(index)}
                            style={{ padding: '5px 10px', borderRadius: 6, border: '1px dashed rgba(139,92,246,0.35)', background: 'transparent', color: 'rgba(139,92,246,0.6)', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s ease', alignSelf: 'flex-start' }}
                          >
                            <Plus size={11} /> Registrar defecto
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>

              {/* Totals footer */}
              <tfoot>
                <tr style={{ background: 'var(--gv-surface-alt)' }}>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800, fontSize: 11, color: 'var(--gv-text-heading)', borderBottom: 'none' }}>TOTAL</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800, fontSize: 14, color: 'var(--gv-text-heading)', borderBottom: 'none' }}>{totals.target}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800, fontSize: 14, color: '#10b981', borderBottom: 'none' }}>{totals.actualOK}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800, fontSize: 14, color: '#ef4444', borderBottom: 'none' }}>{totals.scrap}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800, fontSize: 14, color: '#f59e0b', borderBottom: 'none' }}>{totals.downtime} min</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800, fontSize: 14, color: '#ef4444', borderBottom: 'none' }}>-{totalOeeLossPct}%</td>
                  <td style={{ ...tdStyle, fontSize: 12, color: 'var(--gv-text-muted)', fontWeight: 600, borderBottom: 'none' }}>
                    SR: <span style={{ color: parseFloat(scrapRate) > 2.5 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{scrapRate}%</span>
                  </td>
                  <td style={{ ...tdStyle, borderBottom: 'none', borderLeft: '2px solid rgba(239,68,68,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700 }}>
                      <Wrench size={13} color="#ef4444" />
                      <span style={{ color: '#ef4444' }}>{allFaults.length} falla{allFaults.length !== 1 ? 's' : ''}</span>
                      {allFaults.filter((f) => !f.analysisComplete).length > 0 && (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>{allFaults.filter((f) => !f.analysisComplete).length} sin RCA</span>
                      )}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, borderBottom: 'none', borderLeft: '2px solid rgba(139,92,246,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700 }}>
                      <ShieldCheck size={13} color="#8b5cf6" />
                      <span style={{ color: '#8b5cf6' }}>{totalScrapPieces} pzs</span>
                      <span style={{ fontSize: 10, color: 'var(--gv-text-muted)' }}>({allScrap.length} defectos)</span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Add Row */}
          <div style={{ padding: '12px 22px', borderTop: '1px solid var(--gv-border)' }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={addRow} disabled={records.length >= 12}
              style={{ padding: '9px 18px', borderRadius: 8, border: '1px dashed var(--gv-border)', background: 'transparent', color: records.length >= 12 ? 'var(--gv-text-muted)' : 'var(--gv-primary)', fontSize: 12, fontWeight: 600, cursor: records.length >= 12 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s ease', opacity: records.length >= 12 ? 0.4 : 1 }}
            >
              <Plus size={15} /> Añadir Fila de Hora ({records.length}/12)
            </motion.button>
          </div>
        </motion.div>

        {/* ── Validation Panel ── */}
        <AnimatePresence>
          {validationPanel && (allFaults.length > 0 || allScrap.length > 0) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35 }}
              className="glass-card" style={{ overflow: 'hidden' }}
            >
              {/* Panel header */}
              <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--gv-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(245,158,11,0.04)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gv-text-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BadgeCheck size={16} color="#f59e0b" /> Panel de Validación — MTTO & Calidad
                </h3>
                <p style={{ fontSize: 12, color: 'var(--gv-text-muted)', margin: 0 }}>
                  Los departamentos validan/corrigen la información registrada por operación
                </p>
              </div>

              {/* ─ Faults validation section ─ */}
              {allFaults.length > 0 && (
                <>
                  <div style={{ padding: '10px 22px', background: 'rgba(239,68,68,0.04)', borderBottom: '1px solid var(--gv-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Wrench size={14} color="#ef4444" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>Fallas — Validación MTTO & Calidad</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--gv-text-muted)' }}>{allFaults.length} registro{allFaults.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Inter', sans-serif" }}>
                      <thead>
                        <tr>
                          {['Hora', 'Código', 'Falla', 'Máquina', 'DT', 'RCA', 'MTTO', 'Calidad'].map((h) => (
                            <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gv-text-muted)', borderBottom: '1px solid var(--gv-border)', background: 'var(--gv-surface-alt)', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {allFaults.map((fault, fi) => (
                          <motion.tr key={fault.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: fi * 0.03 }}>
                            <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--gv-border)', fontSize: 12, fontWeight: 700, color: 'var(--gv-text-heading)' }}>{fault.timestamp}</td>
                            <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--gv-border)', fontSize: 11, fontWeight: 700, color: '#ef4444' }}>{fault.codigoFalla}</td>
                            <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--gv-border)', fontSize: 12, color: 'var(--gv-text-heading)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fault.fallaDescripcion}</td>
                            <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--gv-border)', fontSize: 11, color: 'var(--gv-text-muted)', whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{fault.maquinaNombre}</td>
                            <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--gv-border)', fontSize: 12, fontWeight: 700, color: '#f59e0b', textAlign: 'center' }}>{fault.downtimeMin}m</td>
                            <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--gv-border)' }}><AnalysisBadge fault={fault} onClick={() => setAnalysisDrawer(fault)} /></td>
                            <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--gv-border)' }}>
                              <select value={fault.validationMtto} onChange={(e) => updateValidation(fault.id, 'fault', 'validationMtto', e.target.value as ValidationStatus)}
                                style={{ appearance: 'none', padding: '5px 10px', borderRadius: 6, border: '1px solid var(--gv-border)', background: fault.validationMtto === 'validado' ? 'rgba(16,185,129,0.08)' : fault.validationMtto === 'corregido' ? 'rgba(59,130,246,0.08)' : 'rgba(245,158,11,0.08)', color: fault.validationMtto === 'validado' ? '#10b981' : fault.validationMtto === 'corregido' ? '#3b82f6' : '#f59e0b', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="validado">Validado ✓</option>
                                <option value="corregido">Corregido</option>
                              </select>
                            </td>
                            <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--gv-border)' }}>
                              <select value={fault.validationQuality} onChange={(e) => updateValidation(fault.id, 'fault', 'validationQuality', e.target.value as ValidationStatus)}
                                style={{ appearance: 'none', padding: '5px 10px', borderRadius: 6, border: '1px solid var(--gv-border)', background: fault.validationQuality === 'validado' ? 'rgba(16,185,129,0.08)' : fault.validationQuality === 'corregido' ? 'rgba(59,130,246,0.08)' : 'rgba(245,158,11,0.08)', color: fault.validationQuality === 'validado' ? '#10b981' : fault.validationQuality === 'corregido' ? '#3b82f6' : '#f59e0b', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="validado">Validado ✓</option>
                                <option value="corregido">Corregido</option>
                              </select>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ─ Scrap validation section ─ */}
              {allScrap.length > 0 && (
                <>
                  <div style={{ padding: '10px 22px', background: 'rgba(139,92,246,0.04)', borderBottom: '1px solid var(--gv-border)', borderTop: allFaults.length > 0 ? '2px solid var(--gv-border)' : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={14} color="#8b5cf6" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6' }}>Scrap — Validación Calidad</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--gv-text-muted)' }}>{allScrap.length} defecto{allScrap.length !== 1 ? 's' : ''} · {totalScrapPieces} pzs</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Inter', sans-serif" }}>
                      <thead>
                        <tr>
                          {['Hora', 'Código', 'Defecto', 'Tecnología', 'Cantidad', 'Calidad'].map((h) => (
                            <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gv-text-muted)', borderBottom: '1px solid var(--gv-border)', background: 'var(--gv-surface-alt)', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {allScrap.map((scrap, si) => (
                          <motion.tr key={scrap.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: si * 0.03 }}>
                            <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--gv-border)', fontSize: 12, fontWeight: 700, color: 'var(--gv-text-heading)' }}>{scrap.timestamp}</td>
                            <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--gv-border)', fontSize: 11, fontWeight: 700, color: '#8b5cf6' }}>{scrap.codigoDefecto}</td>
                            <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--gv-border)', fontSize: 12, color: 'var(--gv-text-heading)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scrap.defecto}</td>
                            <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--gv-border)', fontSize: 11, color: 'var(--gv-text-muted)' }}>{scrap.tecnologia}</td>
                            <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--gv-border)', fontSize: 14, fontWeight: 800, color: '#ef4444', textAlign: 'center' }}>{scrap.cantidad}</td>
                            <td style={{ padding: '8px 14px', borderBottom: '1px solid var(--gv-border)' }}>
                              <select value={scrap.validationQuality} onChange={(e) => updateValidation(scrap.id, 'scrap', 'validationQuality', e.target.value as ValidationStatus)}
                                style={{ appearance: 'none', padding: '5px 10px', borderRadius: 6, border: '1px solid var(--gv-border)', background: scrap.validationQuality === 'validado' ? 'rgba(16,185,129,0.08)' : scrap.validationQuality === 'corregido' ? 'rgba(59,130,246,0.08)' : 'rgba(245,158,11,0.08)', color: scrap.validationQuality === 'validado' ? '#10b981' : scrap.validationQuality === 'corregido' ? '#3b82f6' : '#f59e0b', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="validado">Validado ✓</option>
                                <option value="corregido">Corregido</option>
                              </select>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {faultModal !== null && (
          <FaultRegistrationModal key="fault-modal" hourRecord={records[faultModal]}
            onRegister={(payload) => registerFault(faultModal, payload)} onClose={() => setFaultModal(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {scrapModal !== null && (
          <ScrapRegistrationModal key="scrap-modal" hourNumber={records[scrapModal]?.hour ?? scrapModal + 1}
            onRegister={(payload) => registerScrap(scrapModal, payload)} onClose={() => setScrapModal(null)} />
        )}
      </AnimatePresence>

      {/* ── RCA Drawer ── */}
      <FaultAnalysisDrawer open={!!analysisDrawer} fault={analysisDrawer}
        onClose={() => setAnalysisDrawer(null)} onSave={(updated) => { updateFault(updated); setAnalysisDrawer(null); }} />
    </>
  );
}
