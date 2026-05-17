import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Clock, CheckCircle, AlertCircle, Archive, FileText, ArrowRight } from 'lucide-react';
import type { IProduct, DocumentState, IVersionHistoryEntry } from '../../types/engineering';

interface VersionControlTabProps {
  products: IProduct[];
  onUpdateProducts: (products: IProduct[]) => void;
  history: IVersionHistoryEntry[];
  onAddHistory: (entry: IVersionHistoryEntry) => void;
}

const STATES: DocumentState[] = ['Draft', 'Pending', 'Series', 'Archived'];

const STATE_CONFIG: Record<DocumentState, {
  label_es: string; label_en: string;
  color: string; bg: string; border: string;
  icon: React.ReactNode;
  description_es: string; description_en: string;
}> = {
  Draft: {
    label_es: 'Borrador', label_en: 'Draft',
    color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.25)',
    icon: <FileText size={14} />,
    description_es: 'Documento en elaboración', description_en: 'Document in progress',
  },
  Pending: {
    label_es: 'Pendiente', label_en: 'Pending',
    color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)',
    icon: <AlertCircle size={14} />,
    description_es: 'En revisión / aprobación', description_en: 'Under review / approval',
  },
  Series: {
    label_es: 'Serie', label_en: 'Series',
    color: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.30)',
    icon: <CheckCircle size={14} />,
    description_es: 'Aprobado en producción', description_en: 'Approved for production',
  },
  Archived: {
    label_es: 'Archivado', label_en: 'Archived',
    color: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.25)',
    icon: <Archive size={14} />,
    description_es: 'Producto descontinuado', description_en: 'Discontinued product',
  },
};

const NEXT_STATE: Partial<Record<DocumentState, DocumentState>> = {
  Draft: 'Pending',
  Pending: 'Series',
  Series: 'Archived',
};

export default function VersionControlTab({ products, onUpdateProducts, history, onAddHistory }: VersionControlTabProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [confirmModal, setConfirmModal] = useState<{ product: IProduct; nextState: DocumentState } | null>(null);
  const [comment, setComment] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const handleAdvance = () => {
    if (!confirmModal) return;
    const { product, nextState } = confirmModal;

    const updated = products.map(p =>
      p.id === product.id ? { ...p, state: nextState, updatedAt: new Date().toISOString().slice(0, 10) } : p
    );
    onUpdateProducts(updated);

    onAddHistory({
      id: `VH-${Date.now()}`,
      productId: product.id,
      fromState: product.state,
      toState: nextState,
      changedBy: 'Usuario Actual',
      changedAt: new Date().toISOString().slice(0, 10),
      comment: comment || (lang === 'es' ? 'Avance de estado' : 'State advance'),
    });

    setConfirmModal(null);
    setComment('');
  };

  const productHistory = selectedProductId
    ? history.filter(h => h.productId === selectedProductId).sort((a, b) => b.changedAt.localeCompare(a.changedAt))
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Lifecycle Legend */}
      <div className="glass-card" style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gv-text-muted)', marginBottom: 12 }}>
          {lang === 'es' ? 'Flujo de Ciclo de Vida — IATF 16949' : 'Lifecycle Flow — IATF 16949'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {STATES.map((state, i) => {
            const cfg = STATE_CONFIG[state];
            return (
              <div key={state} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 99,
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                  color: cfg.color, fontSize: 12, fontWeight: 700,
                }}>
                  {cfg.icon}
                  {lang === 'es' ? cfg.label_es : cfg.label_en}
                </div>
                {i < STATES.length - 1 && <ArrowRight size={16} color="var(--gv-text-muted)" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Products State Matrix */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {products.map((product) => {
          const currentStateIndex = STATES.indexOf(product.state);
          const nextState = NEXT_STATE[product.state];
          const cfg = STATE_CONFIG[product.state];

          return (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card"
              style={{ padding: '16px 20px', cursor: 'pointer' }}
              onClick={() => setSelectedProductId(selectedProductId === product.id ? null : product.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                {/* Product Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 800, color: 'var(--gv-primary)' }}>
                      {product.gpn}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--gv-text-muted)' }}>·</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--gv-accent)' }}>v{product.version}</span>
                    <span style={{ fontSize: 10, color: 'var(--gv-text-muted)' }}>{product.facility}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gv-text-heading)', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {product.name}
                  </div>

                  {/* Progress Stepper */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    {STATES.map((state, i) => {
                      const sCfg = STATE_CONFIG[state];
                      const isDone = STATES.indexOf(state) < currentStateIndex;
                      const isCurrent = state === product.state;
                      const isFuture = STATES.indexOf(state) > currentStateIndex;

                      return (
                        <div key={state} style={{ display: 'flex', alignItems: 'center', flex: i < STATES.length - 1 ? 1 : 'none' }}>
                          {/* Dot */}
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isCurrent ? sCfg.color : isDone ? sCfg.color + '40' : 'var(--gv-surface-alt)',
                            border: `2px solid ${isCurrent ? sCfg.color : isDone ? sCfg.color + '60' : 'var(--gv-border)'}`,
                            transition: 'all 0.3s ease',
                          }}>
                            {isDone
                              ? <CheckCircle size={14} color={sCfg.color} />
                              : isCurrent
                                ? <span style={{ color: '#fff', display: 'flex' }}>{sCfg.icon}</span>
                                : <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gv-border)' }} />
                            }
                          </div>
                          {/* Label */}
                          <span style={{
                            fontSize: 9, fontWeight: isCurrent ? 800 : 500,
                            color: isCurrent ? sCfg.color : isFuture ? 'var(--gv-text-muted)' : sCfg.color + 'bb',
                            marginLeft: 4, marginRight: 4, whiteSpace: 'nowrap',
                          }}>
                            {lang === 'es' ? sCfg.label_es : sCfg.label_en}
                          </span>
                          {/* Line */}
                          {i < STATES.length - 1 && (
                            <div style={{
                              flex: 1, height: 2, minWidth: 12,
                              background: isDone ? sCfg.color + '40' : 'var(--gv-border)',
                              transition: 'background 0.3s ease',
                            }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                    color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
                  }}>
                    {cfg.icon}
                    {lang === 'es' ? cfg.label_es : cfg.label_en}
                  </span>
                  {nextState && product.state !== 'Archived' && (
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={e => { e.stopPropagation(); setConfirmModal({ product, nextState }); setComment(''); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 14px', borderRadius: 8, border: 'none',
                        background: `linear-gradient(135deg, ${STATE_CONFIG[nextState].color}, ${STATE_CONFIG[nextState].color}aa)`,
                        color: '#fff', fontSize: 11, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {t('plm.btn_advance_state')}
                      <ChevronRight size={12} />
                      {lang === 'es' ? STATE_CONFIG[nextState].label_es : STATE_CONFIG[nextState].label_en}
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Expandable History */}
              <AnimatePresence>
                {selectedProductId === product.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--gv-border)' }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                      {t('plm.history')}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {productHistory.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--gv-text-muted)' }}>
                          {lang === 'es' ? 'Sin historial disponible' : 'No history available'}
                        </div>
                      ) : productHistory.map(entry => (
                        <div key={entry.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{
                            width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                            background: STATE_CONFIG[entry.toState].color,
                          }} />
                          <div>
                            <div style={{ fontSize: 11, color: 'var(--gv-text)', lineHeight: 1.5 }}>
                              {entry.fromState ? (
                                <span>
                                  <span style={{ color: STATE_CONFIG[entry.fromState].color, fontWeight: 700 }}>
                                    {lang === 'es' ? STATE_CONFIG[entry.fromState].label_es : STATE_CONFIG[entry.fromState].label_en}
                                  </span>
                                  {' → '}
                                </span>
                              ) : null}
                              <span style={{ color: STATE_CONFIG[entry.toState].color, fontWeight: 700 }}>
                                {lang === 'es' ? STATE_CONFIG[entry.toState].label_es : STATE_CONFIG[entry.toState].label_en}
                              </span>
                              {' · '}
                              <span style={{ color: 'var(--gv-text)' }}>{entry.comment}</span>
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--gv-text-muted)', display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                              <Clock size={9} /> {entry.changedAt} · {entry.changedBy}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                zIndex: 201, width: 'min(460px, 92vw)',
                background: 'var(--gv-surface)', borderRadius: 16,
                border: '1px solid var(--gv-border)', boxShadow: 'var(--gv-shadow-lg)',
                padding: 28,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--gv-text-heading)', margin: '0 0 6px' }}>
                {t('plm.btn_advance_state')}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--gv-text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                {confirmModal.product.name}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 16px', background: 'var(--gv-surface-alt)', borderRadius: 10 }}>
                <span style={{ color: STATE_CONFIG[confirmModal.product.state].color, fontWeight: 700, fontSize: 13 }}>
                  {lang === 'es' ? STATE_CONFIG[confirmModal.product.state].label_es : STATE_CONFIG[confirmModal.product.state].label_en}
                </span>
                <ArrowRight size={16} color="var(--gv-text-muted)" />
                <span style={{ color: STATE_CONFIG[confirmModal.nextState].color, fontWeight: 700, fontSize: 13 }}>
                  {lang === 'es' ? STATE_CONFIG[confirmModal.nextState].label_es : STATE_CONFIG[confirmModal.nextState].label_en}
                </span>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gv-text-muted)', marginBottom: 6 }}>
                  {lang === 'es' ? 'Comentario (opcional)' : 'Comment (optional)'}
                </div>
                <textarea
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)',
                    borderRadius: 8, color: 'var(--gv-text-heading)', fontSize: 13,
                    fontFamily: 'inherit', resize: 'vertical',
                  }}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder={lang === 'es' ? 'Motivo del cambio de estado...' : 'Reason for state change...'}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setConfirmModal(null)}
                  style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--gv-border)', background: 'none', color: 'var(--gv-text)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                  {t('plm.btn_cancel')}
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleAdvance}
                  style={{
                    padding: '9px 24px', borderRadius: 8, border: 'none',
                    background: `linear-gradient(135deg, ${STATE_CONFIG[confirmModal.nextState].color}, ${STATE_CONFIG[confirmModal.nextState].color}bb)`,
                    color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                  }}
                >
                  {t('plm.btn_advance_state')}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
