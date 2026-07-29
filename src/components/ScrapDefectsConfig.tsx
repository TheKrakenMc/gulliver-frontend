import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, Edit2, AlertTriangle, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { baseDataApi } from '../api/baseDataApi';
import type { BaseScrapDefect, BaseProcess } from '../types';
import Toast, { type ToastType } from './Toast';

interface Props {
  processes: BaseProcess[];
}

export default function ScrapDefectsConfig({ processes }: Props) {
  const { t } = useTranslation();
  const [defects, setDefects] = useState<BaseScrapDefect[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [confirmDeleteCode, setConfirmDeleteCode] = useState<string | null>(null);
  
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formProcessId, setFormProcessId] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean } | null>(null);

  useEffect(() => {
    loadDefects();
  }, []);

  const loadDefects = async () => {
    setLoading(true);
    try {
      const data = await baseDataApi.getScrapDefects();
      setDefects(data);
    } catch (e) {
      console.error("Failed to load scrap defects", e);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormProcessId('');
    setEditingCode(null);
    setIsAdding(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formProcessId) return;
    setIsSaving(true);
    try {
      if (editingCode) {
        await baseDataApi.updateScrapDefect(editingCode, {
          name: formName,
          description: formDesc || undefined,
          process_id: formProcessId
        });
      } else {
        const generatedCode = `SCRAP-${Date.now().toString().slice(-4)}`;
        await baseDataApi.createScrapDefect({
          code: generatedCode,
          name: formName,
          description: formDesc || undefined,
          process_id: formProcessId
        });
      }
      await loadDefects();
      resetForm();
      setToast({ message: t('config.success_save', 'Guardado exitosamente'), type: 'success', visible: true });
      setTimeout(() => setToast(null), 4000);
    } catch (e: any) {
      console.error(e);
      setToast({ message: e?.response?.data?.detail || t('config.error_save', 'Error al guardar'), type: 'error', visible: true });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (code: string) => {
    try {
      await baseDataApi.deleteScrapDefect(code);
      await loadDefects();
      setConfirmDeleteCode(null);
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail || 'Error');
    }
  };

  const startEdit = (defect: BaseScrapDefect) => {
    setEditingCode(defect.code);
    setFormName(defect.name);
    setFormDesc(defect.description || '');
    setFormProcessId(defect.process_id);
    setIsAdding(true);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: 'var(--gv-surface)', border: '1px solid var(--gv-border)',
    borderRadius: 10, color: 'var(--gv-text-heading)',
    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  };

  const labelSt: React.CSSProperties = {
    display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--gv-text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast?.visible && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--gv-text-heading)' }}>
          {t('config.list_scrap_defects', 'Defectos de Scrap')}
        </h3>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { resetForm(); setIsAdding(true); }}
          style={{
            padding: '8px 18px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #dc2626, #991b1b)',
            color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <Plus size={16} />
          {t('config.btn_add_defect', 'Agregar Defecto')}
        </motion.button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {loading && <div style={{ color: 'var(--gv-text-muted)', fontSize: 13 }}>Cargando...</div>}
        {!loading && defects.length === 0 && <div style={{ color: 'var(--gv-text-muted)', fontSize: 13 }}>No hay defectos registrados.</div>}
        
        {!loading && processes.map(process => {
          const processDefects = defects.filter(d => d.process_id === process.id);
          if (processDefects.length === 0) return null;

          return (
            <div key={process.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h4 style={{ margin: 0, color: 'var(--gv-text-heading)', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={16} color="#06b6d4" />
                {process.name}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {processDefects.map((d, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    key={d.code}
                    onClick={() => startEdit(d)}
                    style={{
                      padding: '16px 18px', borderRadius: 10,
                      background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)',
                      display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, background: 'rgba(220,38,38,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <AlertTriangle size={20} color="#dc2626" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 6px', borderRadius: 4,
                        background: 'var(--gv-surface)', border: '1px solid var(--gv-border)',
                        fontSize: 10, fontWeight: 700, color: 'var(--gv-text-muted)', marginBottom: 4
                      }}>{d.code}</span>
                      <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--gv-text-heading)' }}>{d.name}</h3>
                      {d.description && <p style={{ fontSize: 11, color: 'var(--gv-text-muted)', margin: '4px 0 0' }}>{d.description}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                      {confirmDeleteCode === d.code ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <motion.button onClick={() => handleDelete(d.code)}
                            style={{ background: '#ef4444', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 6, color: '#fff' }}
                          >✓</motion.button>
                          <motion.button onClick={() => setConfirmDeleteCode(null)}
                            style={{ background: 'var(--gv-surface)', border: '1px solid var(--gv-border)', cursor: 'pointer', padding: '6px 10px', borderRadius: 6 }}
                          ><X size={14} /></motion.button>
                        </div>
                      ) : (
                        <motion.button whileHover={{ scale: 1.1 }} onClick={() => setConfirmDeleteCode(d.code)}
                          style={{ background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 6, color: '#ef4444' }}
                        ><Trash2 size={18} /></motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={resetForm}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: 'var(--gv-surface)', border: '1px solid var(--gv-border)', borderRadius: 16, padding: '28px 32px', width: '100%', maxWidth: 500 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--gv-text-heading)' }}>
                  {editingCode ? t('config.btn_update', 'Actualizar') : t('config.btn_add_new', 'Agregar Nuevo')}
                </h3>
                <button type="button" onClick={resetForm} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gv-text-muted)' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelSt}>{t('config.lbl_name', 'Nombre del Defecto')}</label>
                  <input required value={formName} onChange={e => setFormName(e.target.value)} style={inputStyle} placeholder="Ej: Ralladura" />
                </div>
                <div>
                  <label style={labelSt}>{t('config.lbl_process', 'Tecnología (Proceso)')}</label>
                  <select required value={formProcessId} onChange={e => setFormProcessId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Seleccionar proceso...</option>
                    {processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelSt}>{t('config.lbl_description', 'Descripción (Opcional)')}</label>
                  <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Opcional..." />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                  <button type="button" onClick={resetForm} style={{ padding: '10px 20px', borderRadius: 8, background: 'transparent', color: 'var(--gv-text-muted)', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                    {t('config.btn_cancel', 'Cancelar')}
                  </button>
                  <button type="submit" disabled={isSaving} style={{ padding: '10px 20px', borderRadius: 8, background: '#10b981', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: isSaving ? 0.7 : 1 }}>
                    {isSaving ? '...' : t('config.btn_save', 'Guardar')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
