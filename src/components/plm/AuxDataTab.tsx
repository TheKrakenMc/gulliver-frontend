import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Pencil, Check, X, ChevronRight } from 'lucide-react';
import type { IOperation, ITechnology, IProcessVariable } from '../../types/engineering';

interface AuxDataTabProps {
  operations: IOperation[];
  technologies: ITechnology[];
  processVariables: IProcessVariable[];
  onUpdateOperations: (ops: IOperation[]) => void;
  onUpdateTechnologies: (techs: ITechnology[]) => void;
  onUpdateProcessVariables: (pvs: IProcessVariable[]) => void;
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px', background: 'none', border: 'none',
          borderBottom: open ? '1px solid var(--gv-border)' : 'none',
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gv-text-heading)', display: 'flex', gap: 8, alignItems: 'center' }}>
          {title}
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--gv-surface-alt)', color: 'var(--gv-text-muted)', fontWeight: 600 }}>
            {count}
          </span>
        </span>
        <motion.div animate={{ rotate: open ? 90 : 0 }}>
          <ChevronRight size={16} color="var(--gv-text-muted)" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '7px 10px', background: 'var(--gv-surface-alt)',
  border: '1px solid var(--gv-border)', borderRadius: 7,
  color: 'var(--gv-text-heading)', fontSize: 12,
  fontFamily: 'inherit', width: '100%',
};

export default function AuxDataTab({
  operations, technologies, processVariables,
  onUpdateOperations, onUpdateTechnologies, onUpdateProcessVariables,
}: AuxDataTabProps) {
  const { t } = useTranslation();

  /* ── Operations CRUD ── */
  const [editingOpId, setEditingOpId] = useState<string | null>(null);
  const [editOp, setEditOp] = useState<Partial<IOperation>>({});
  const [newOp, setNewOp] = useState(false);
  const [opDraft, setOpDraft] = useState<Partial<IOperation>>({ sequence: 10, name: '', technologyId: '', description: '' });

  const saveOp = () => {
    if (!editOp.name) return;
    onUpdateOperations(operations.map(o => o.id === editingOpId ? { ...o, ...editOp } as IOperation : o));
    setEditingOpId(null);
  };
  const addOp = () => {
    if (!opDraft.name) return;
    onUpdateOperations([...operations, { id: `OP-${Date.now()}`, sequence: opDraft.sequence ?? 10, name: opDraft.name ?? '', technologyId: opDraft.technologyId ?? '', description: opDraft.description ?? '' }]);
    setNewOp(false);
    setOpDraft({ sequence: 10, name: '', technologyId: '', description: '' });
  };

  /* ── Technologies CRUD ── */
  const [editingTechId, setEditingTechId] = useState<string | null>(null);
  const [editTech, setEditTech] = useState<Partial<ITechnology>>({});
  const [newTech, setNewTech] = useState(false);
  const [techDraft, setTechDraft] = useState<Partial<ITechnology>>({ name: '', category: '', description: '' });

  const saveTech = () => {
    if (!editTech.name) return;
    onUpdateTechnologies(technologies.map(t => t.id === editingTechId ? { ...t, ...editTech } as ITechnology : t));
    setEditingTechId(null);
  };
  const addTech = () => {
    if (!techDraft.name) return;
    onUpdateTechnologies([...technologies, { id: `TECH-${Date.now()}`, name: techDraft.name ?? '', category: techDraft.category ?? '', description: techDraft.description ?? '' }]);
    setNewTech(false);
    setTechDraft({ name: '', category: '', description: '' });
  };

  /* ── Process Variables CRUD ── */
  const [editingPvId, setEditingPvId] = useState<string | null>(null);
  const [editPv, setEditPv] = useState<Partial<IProcessVariable>>({});
  const [newPv, setNewPv] = useState(false);
  const [pvDraft, setPvDraft] = useState<Partial<IProcessVariable>>({ name: '', unit: '', nominalValue: 0, toleranceMin: 0, toleranceMax: 0, technologyId: '' });

  const savePv = () => {
    if (!editPv.name) return;
    onUpdateProcessVariables(processVariables.map(p => p.id === editingPvId ? { ...p, ...editPv } as IProcessVariable : p));
    setEditingPvId(null);
  };
  const addPv = () => {
    if (!pvDraft.name) return;
    onUpdateProcessVariables([...processVariables, { id: `PV-${Date.now()}`, name: pvDraft.name ?? '', unit: pvDraft.unit ?? '', nominalValue: pvDraft.nominalValue ?? 0, toleranceMin: pvDraft.toleranceMin ?? 0, toleranceMax: pvDraft.toleranceMax ?? 0, technologyId: pvDraft.technologyId ?? '' }]);
    setNewPv(false);
    setPvDraft({ name: '', unit: '', nominalValue: 0, toleranceMin: 0, toleranceMax: 0, technologyId: '' });
  };

  const thStyle: React.CSSProperties = {
    padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gv-text-muted)',
    borderBottom: '1px solid var(--gv-border)', background: 'var(--gv-surface-alt)',
  };
  const tdStyle: React.CSSProperties = { padding: '9px 14px', borderBottom: '1px solid var(--gv-border)', fontSize: 12, color: 'var(--gv-text)', verticalAlign: 'middle' };
  const actionBtn = (color: string, bg: string): React.CSSProperties => ({
    width: 28, height: 28, borderRadius: 7, border: `1px solid ${color}30`,
    background: bg, color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Operations ── */}
      <Section title={t('plm.operations')} count={operations.length}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['Seq', t('plm.product_name'), t('plm.technologies'), t('plm.description'), ''].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              <AnimatePresence>
                {operations.map(op => (
                  <motion.tr key={op.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {editingOpId === op.id ? (
                      <>
                        <td style={tdStyle}><input style={{ ...inputStyle, width: 60 }} type="number" value={editOp.sequence ?? op.sequence} onChange={e => setEditOp(p => ({ ...p, sequence: +e.target.value }))} /></td>
                        <td style={tdStyle}><input style={inputStyle} value={editOp.name ?? op.name} onChange={e => setEditOp(p => ({ ...p, name: e.target.value }))} /></td>
                        <td style={tdStyle}>
                          <select style={inputStyle} value={editOp.technologyId ?? op.technologyId} onChange={e => setEditOp(p => ({ ...p, technologyId: e.target.value }))}>
                            <option value="">—</option>
                            {technologies.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </td>
                        <td style={tdStyle}><input style={inputStyle} value={editOp.description ?? op.description} onChange={e => setEditOp(p => ({ ...p, description: e.target.value }))} /></td>
                        <td style={tdStyle}><div style={{ display: 'flex', gap: 4 }}>
                          <button style={actionBtn('#10b981', 'rgba(16,185,129,0.1)')} onClick={saveOp}><Check size={12} /></button>
                          <button style={actionBtn('#ef4444', 'rgba(239,68,68,0.1)')} onClick={() => setEditingOpId(null)}><X size={12} /></button>
                        </div></td>
                      </>
                    ) : (
                      <>
                        <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--gv-accent)' }}>{op.sequence}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--gv-text-heading)' }}>{op.name}</td>
                        <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: 'rgba(59,130,246,0.1)', color: 'var(--gv-primary)' }}>{technologies.find(t => t.id === op.technologyId)?.name || op.technologyId}</span></td>
                        <td style={{ ...tdStyle, color: 'var(--gv-text-muted)' }}>{op.description}</td>
                        <td style={tdStyle}><div style={{ display: 'flex', gap: 4 }}>
                          <button style={actionBtn('#3b82f6', 'rgba(59,130,246,0.1)')} onClick={() => { setEditingOpId(op.id); setEditOp(op); }}><Pencil size={11} /></button>
                          <button style={actionBtn('#ef4444', 'rgba(239,68,68,0.1)')} onClick={() => onUpdateOperations(operations.filter(o => o.id !== op.id))}><Trash2 size={11} /></button>
                        </div></td>
                      </>
                    )}
                  </motion.tr>
                ))}
                {newOp && (
                  <tr>
                    <td style={tdStyle}><input style={{ ...inputStyle, width: 60 }} type="number" value={opDraft.sequence} onChange={e => setOpDraft(p => ({ ...p, sequence: +e.target.value }))} /></td>
                    <td style={tdStyle}><input style={inputStyle} placeholder="Nombre" value={opDraft.name} onChange={e => setOpDraft(p => ({ ...p, name: e.target.value }))} /></td>
                    <td style={tdStyle}><select style={inputStyle} value={opDraft.technologyId} onChange={e => setOpDraft(p => ({ ...p, technologyId: e.target.value }))}>
                      <option value="">—</option>
                      {technologies.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select></td>
                    <td style={tdStyle}><input style={inputStyle} placeholder={t('plm.description')} value={opDraft.description} onChange={e => setOpDraft(p => ({ ...p, description: e.target.value }))} /></td>
                    <td style={tdStyle}><div style={{ display: 'flex', gap: 4 }}>
                      <button style={actionBtn('#10b981', 'rgba(16,185,129,0.1)')} onClick={addOp}><Check size={12} /></button>
                      <button style={actionBtn('#ef4444', 'rgba(239,68,68,0.1)')} onClick={() => setNewOp(false)}><X size={12} /></button>
                    </div></td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--gv-border)' }}>
          <button onClick={() => setNewOp(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 7, border: '1px dashed var(--gv-border)', background: 'transparent', color: 'var(--gv-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={14} /> {t('plm.btn_add')}
          </button>
        </div>
      </Section>

      {/* ── Technologies ── */}
      <Section title={t('plm.technologies')} count={technologies.length}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {[t('plm.product_name'), t('plm.category'), t('plm.description'), ''].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              <AnimatePresence>
                {technologies.map(tech => (
                  <motion.tr key={tech.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {editingTechId === tech.id ? (
                      <>
                        <td style={tdStyle}><input style={inputStyle} value={editTech.name ?? tech.name} onChange={e => setEditTech(p => ({ ...p, name: e.target.value }))} /></td>
                        <td style={tdStyle}><input style={inputStyle} value={editTech.category ?? tech.category} onChange={e => setEditTech(p => ({ ...p, category: e.target.value }))} /></td>
                        <td style={tdStyle}><input style={inputStyle} value={editTech.description ?? tech.description} onChange={e => setEditTech(p => ({ ...p, description: e.target.value }))} /></td>
                        <td style={tdStyle}><div style={{ display: 'flex', gap: 4 }}>
                          <button style={actionBtn('#10b981', 'rgba(16,185,129,0.1)')} onClick={saveTech}><Check size={12} /></button>
                          <button style={actionBtn('#ef4444', 'rgba(239,68,68,0.1)')} onClick={() => setEditingTechId(null)}><X size={12} /></button>
                        </div></td>
                      </>
                    ) : (
                      <>
                        <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--gv-text-heading)' }}>{tech.name}</td>
                        <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: 'rgba(6,182,212,0.1)', color: 'var(--gv-accent)' }}>{tech.category}</span></td>
                        <td style={{ ...tdStyle, color: 'var(--gv-text-muted)' }}>{tech.description}</td>
                        <td style={tdStyle}><div style={{ display: 'flex', gap: 4 }}>
                          <button style={actionBtn('#3b82f6', 'rgba(59,130,246,0.1)')} onClick={() => { setEditingTechId(tech.id); setEditTech(tech); }}><Pencil size={11} /></button>
                          <button style={actionBtn('#ef4444', 'rgba(239,68,68,0.1)')} onClick={() => onUpdateTechnologies(technologies.filter(t => t.id !== tech.id))}><Trash2 size={11} /></button>
                        </div></td>
                      </>
                    )}
                  </motion.tr>
                ))}
                {newTech && (
                  <tr>
                    <td style={tdStyle}><input style={inputStyle} placeholder="Nombre" value={techDraft.name} onChange={e => setTechDraft(p => ({ ...p, name: e.target.value }))} /></td>
                    <td style={tdStyle}><input style={inputStyle} placeholder={t('plm.category')} value={techDraft.category} onChange={e => setTechDraft(p => ({ ...p, category: e.target.value }))} /></td>
                    <td style={tdStyle}><input style={inputStyle} placeholder={t('plm.description')} value={techDraft.description} onChange={e => setTechDraft(p => ({ ...p, description: e.target.value }))} /></td>
                    <td style={tdStyle}><div style={{ display: 'flex', gap: 4 }}>
                      <button style={actionBtn('#10b981', 'rgba(16,185,129,0.1)')} onClick={addTech}><Check size={12} /></button>
                      <button style={actionBtn('#ef4444', 'rgba(239,68,68,0.1)')} onClick={() => setNewTech(false)}><X size={12} /></button>
                    </div></td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--gv-border)' }}>
          <button onClick={() => setNewTech(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 7, border: '1px dashed var(--gv-border)', background: 'transparent', color: 'var(--gv-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={14} /> {t('plm.btn_add')}
          </button>
        </div>
      </Section>

      {/* ── Process Variables ── */}
      <Section title={t('plm.process_variables')} count={processVariables.length}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {[t('plm.product_name'), t('plm.unit'), t('plm.nominal_value'), t('plm.tolerance_min'), t('plm.tolerance_max'), t('plm.technologies'), ''].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              <AnimatePresence>
                {processVariables.map(pv => (
                  <motion.tr key={pv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {editingPvId === pv.id ? (
                      <>
                        <td style={tdStyle}><input style={inputStyle} value={editPv.name ?? pv.name} onChange={e => setEditPv(p => ({ ...p, name: e.target.value }))} /></td>
                        <td style={tdStyle}><input style={inputStyle} value={editPv.unit ?? pv.unit} onChange={e => setEditPv(p => ({ ...p, unit: e.target.value }))} /></td>
                        <td style={tdStyle}><input style={{ ...inputStyle, width: 80 }} type="number" value={editPv.nominalValue ?? pv.nominalValue} onChange={e => setEditPv(p => ({ ...p, nominalValue: +e.target.value }))} /></td>
                        <td style={tdStyle}><input style={{ ...inputStyle, width: 80 }} type="number" value={editPv.toleranceMin ?? pv.toleranceMin} onChange={e => setEditPv(p => ({ ...p, toleranceMin: +e.target.value }))} /></td>
                        <td style={tdStyle}><input style={{ ...inputStyle, width: 80 }} type="number" value={editPv.toleranceMax ?? pv.toleranceMax} onChange={e => setEditPv(p => ({ ...p, toleranceMax: +e.target.value }))} /></td>
                        <td style={tdStyle}><select style={inputStyle} value={editPv.technologyId ?? pv.technologyId} onChange={e => setEditPv(p => ({ ...p, technologyId: e.target.value }))}>
                          <option value="">—</option>
                          {technologies.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select></td>
                        <td style={tdStyle}><div style={{ display: 'flex', gap: 4 }}>
                          <button style={actionBtn('#10b981', 'rgba(16,185,129,0.1)')} onClick={savePv}><Check size={12} /></button>
                          <button style={actionBtn('#ef4444', 'rgba(239,68,68,0.1)')} onClick={() => setEditingPvId(null)}><X size={12} /></button>
                        </div></td>
                      </>
                    ) : (
                      <>
                        <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--gv-text-heading)' }}>{pv.name}</td>
                        <td style={tdStyle}><span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>{pv.unit}</span></td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--gv-primary)', textAlign: 'center' }}>{pv.nominalValue}</td>
                        <td style={{ ...tdStyle, color: '#10b981', textAlign: 'center' }}>{pv.toleranceMin}</td>
                        <td style={{ ...tdStyle, color: '#ef4444', textAlign: 'center' }}>{pv.toleranceMax}</td>
                        <td style={tdStyle}><span style={{ fontSize: 11, color: 'var(--gv-text-muted)' }}>{technologies.find(t => t.id === pv.technologyId)?.name || '—'}</span></td>
                        <td style={tdStyle}><div style={{ display: 'flex', gap: 4 }}>
                          <button style={actionBtn('#3b82f6', 'rgba(59,130,246,0.1)')} onClick={() => { setEditingPvId(pv.id); setEditPv(pv); }}><Pencil size={11} /></button>
                          <button style={actionBtn('#ef4444', 'rgba(239,68,68,0.1)')} onClick={() => onUpdateProcessVariables(processVariables.filter(p => p.id !== pv.id))}><Trash2 size={11} /></button>
                        </div></td>
                      </>
                    )}
                  </motion.tr>
                ))}
                {newPv && (
                  <tr>
                    <td style={tdStyle}><input style={inputStyle} placeholder="Nombre" value={pvDraft.name} onChange={e => setPvDraft(p => ({ ...p, name: e.target.value }))} /></td>
                    <td style={tdStyle}><input style={inputStyle} placeholder={t('plm.unit')} value={pvDraft.unit} onChange={e => setPvDraft(p => ({ ...p, unit: e.target.value }))} /></td>
                    <td style={tdStyle}><input style={{ ...inputStyle, width: 80 }} type="number" value={pvDraft.nominalValue} onChange={e => setPvDraft(p => ({ ...p, nominalValue: +e.target.value }))} /></td>
                    <td style={tdStyle}><input style={{ ...inputStyle, width: 80 }} type="number" value={pvDraft.toleranceMin} onChange={e => setPvDraft(p => ({ ...p, toleranceMin: +e.target.value }))} /></td>
                    <td style={tdStyle}><input style={{ ...inputStyle, width: 80 }} type="number" value={pvDraft.toleranceMax} onChange={e => setPvDraft(p => ({ ...p, toleranceMax: +e.target.value }))} /></td>
                    <td style={tdStyle}><select style={inputStyle} value={pvDraft.technologyId} onChange={e => setPvDraft(p => ({ ...p, technologyId: e.target.value }))}>
                      <option value="">—</option>
                      {technologies.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select></td>
                    <td style={tdStyle}><div style={{ display: 'flex', gap: 4 }}>
                      <button style={actionBtn('#10b981', 'rgba(16,185,129,0.1)')} onClick={addPv}><Check size={12} /></button>
                      <button style={actionBtn('#ef4444', 'rgba(239,68,68,0.1)')} onClick={() => setNewPv(false)}><X size={12} /></button>
                    </div></td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--gv-border)' }}>
          <button onClick={() => setNewPv(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 7, border: '1px dashed var(--gv-border)', background: 'transparent', color: 'var(--gv-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={14} /> {t('plm.btn_add')}
          </button>
        </div>
      </Section>

    </div>
  );
}
