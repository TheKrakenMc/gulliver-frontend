import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Search, Plus, X, ChevronRight,
  Package, Clock, Gauge, Tag, Layers,
  FileText, CheckCircle, AlertCircle, Archive,
} from 'lucide-react';
import type { IProduct, DocumentState, ITechnicalDoc, TechnicalDocType } from '../../types/engineering';
import type { FilterState } from '../../types';
import { mockTechnologies } from '../../data/plmMockData';

interface ProductsTabProps {
  products: IProduct[];
  onUpdateProducts: (products: IProduct[]) => void;
  filters: FilterState;
}

const STATE_CONFIG: Record<DocumentState, { label_es: string; label_en: string; color: string; bg: string; icon: React.ReactNode }> = {
  Draft:    { label_es: 'Borrador',  label_en: 'Draft',    color: '#64748b', bg: 'rgba(100,116,139,0.12)', icon: <FileText size={10} /> },
  Pending:  { label_es: 'Pendiente', label_en: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: <AlertCircle size={10} /> },
  Series:   { label_es: 'Serie',     label_en: 'Series',   color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: <CheckCircle size={10} /> },
  Archived: { label_es: 'Archivado', label_en: 'Archived', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: <Archive size={10} /> },
};

const DOC_LABELS: Record<TechnicalDocType, string> = {
  PFMEA: 'PFMEA', ControlPlan: 'Control Plan', Flowchart: 'Flowchart', SetupSheet: 'Setup Sheet',
};

const EMPTY_PRODUCT: Omit<IProduct, 'id' | 'createdAt' | 'updatedAt'> = {
  gpn: '', name: '', version: '1.0', state: 'Draft', facility: 'Nave 1',
  specs: { dimensions: '', weight: 0, technologies: [] },
  performance: { cycleTime: 60, ratePerHour: 60 },
  documentation: [],
};

function StateBadge({ state, lang }: { state: DocumentState; lang: string }) {
  const cfg = STATE_CONFIG[state];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30`,
    }}>
      {cfg.icon}
      {lang === 'es' ? cfg.label_es : cfg.label_en}
    </span>
  );
}

function DocTypeBadge({ type }: { type: TechnicalDocType }) {
  const colors: Record<TechnicalDocType, { c: string; bg: string }> = {
    PFMEA:       { c: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
    ControlPlan: { c: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    Flowchart:   { c: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
    SetupSheet:  { c: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  };
  const c = colors[type];
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
      color: c.c, background: c.bg,
    }}>{DOC_LABELS[type]}</span>
  );
}

export default function ProductsTab({ products, onUpdateProducts, filters }: ProductsTabProps) {
  const { i18n } = useTranslation();
  const { t } = useTranslation();
  const lang = i18n.language;

  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ ...EMPTY_PRODUCT });
  const [expandedDocs, setExpandedDocs] = useState(false);

  const filtered = products.filter(p => {
    const matchesFacility = !filters.facility || p.facility === filters.facility;
    const matchesSearch = !search ||
      p.gpn.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase());
    return matchesFacility && matchesSearch;
  });

  const handleAdd = () => {
    const created: IProduct = {
      ...newProduct,
      id: `PRD-${Date.now()}`,
      documentation: (['PFMEA', 'ControlPlan', 'Flowchart', 'SetupSheet'] as TechnicalDocType[]).map(type => ({
        id: `DOC-${Date.now()}-${type}`,
        type, title: `${DOC_LABELS[type]} — ${newProduct.gpn}`,
        url: '', version: 1, state: 'Draft' as DocumentState,
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
        author: 'Nuevo',
      } as ITechnicalDoc)),
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    onUpdateProducts([created, ...products]);
    setShowNewForm(false);
    setNewProduct({ ...EMPTY_PRODUCT });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)',
    borderRadius: 8, color: 'var(--gv-text-heading)', fontSize: 13,
    fontFamily: 'inherit', transition: 'border-color 0.2s ease',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.06em', color: 'var(--gv-text-muted)', marginBottom: 4,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gv-text-muted)' }} />
          <input
            style={{ ...inputStyle, paddingLeft: 36 }}
            placeholder={t('plm.search_placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowNewForm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 20px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}
        >
          <Plus size={15} /> {t('plm.new_product')}
        </motion.button>
      </div>

      {/* New Product Form */}
      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="glass-card"
            style={{ padding: 24, overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--gv-text-heading)' }}>
                {t('plm.new_product')}
              </span>
              <button onClick={() => setShowNewForm(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gv-text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: t('plm.gpn'), field: 'gpn', type: 'text' },
                { label: t('plm.product_name'), field: 'name', type: 'text' },
                { label: t('plm.version'), field: 'version', type: 'text' },
              ].map(({ label, field, type }) => (
                <div key={field}>
                  <div style={labelStyle}>{label}</div>
                  <input
                    style={inputStyle} type={type}
                    value={(newProduct as Record<string, unknown>)[field] as string}
                    onChange={e => setNewProduct(p => ({ ...p, [field]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <div style={labelStyle}>{t('plm.cycle_time')} (s)</div>
                <input style={inputStyle} type="number"
                  value={newProduct.performance.cycleTime}
                  onChange={e => setNewProduct(p => ({ ...p, performance: { ...p.performance, cycleTime: +e.target.value } }))}
                />
              </div>
              <div>
                <div style={labelStyle}>{t('plm.rate_per_hour')}</div>
                <input style={inputStyle} type="number"
                  value={newProduct.performance.ratePerHour}
                  onChange={e => setNewProduct(p => ({ ...p, performance: { ...p.performance, ratePerHour: +e.target.value } }))}
                />
              </div>
              <div>
                <div style={labelStyle}>{t('plm.weight')} (kg)</div>
                <input style={inputStyle} type="number" step="0.01"
                  value={newProduct.specs.weight}
                  onChange={e => setNewProduct(p => ({ ...p, specs: { ...p.specs, weight: +e.target.value } }))}
                />
              </div>
              <div>
                <div style={labelStyle}>{t('plm.dimensions')}</div>
                <input style={inputStyle} type="text" placeholder="L × W × H mm"
                  value={newProduct.specs.dimensions}
                  onChange={e => setNewProduct(p => ({ ...p, specs: { ...p.specs, dimensions: e.target.value } }))}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowNewForm(false)}
                style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--gv-border)', background: 'none', color: 'var(--gv-text)', cursor: 'pointer', fontFamily: 'inherit' }}>
                {t('plm.btn_cancel')}
              </button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={handleAdd}
                disabled={!newProduct.gpn || !newProduct.name}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: newProduct.gpn && newProduct.name ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : 'var(--gv-border)',
                  color: '#fff', fontWeight: 700, cursor: newProduct.gpn && newProduct.name ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                }}>
                {t('plm.btn_save')}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Inter', sans-serif" }}>
            <thead>
              <tr>
                {[
                  { k: 'plm.gpn', w: 160 },
                  { k: 'plm.product_name', w: 180 },
                  { k: 'plm.version', w: 80 },
                  { k: 'plm.state', w: 120 },
                  { k: 'plm.technologies', w: 200 },
                  { k: 'plm.cycle_time', w: 110 },
                  { k: 'plm.rate_per_hour', w: 110 },
                ].map(({ k, w }) => (
                  <th key={k} style={{
                    padding: '12px 16px', textAlign: 'left', fontSize: 10,
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: 'var(--gv-text-muted)', borderBottom: '2px solid var(--gv-border)',
                    background: 'var(--gv-surface-alt)', minWidth: w,
                  }}>{t(k)}</th>
                ))}
                <th style={{ minWidth: 48, background: 'var(--gv-surface-alt)', borderBottom: '2px solid var(--gv-border)' }} />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--gv-text-muted)', fontSize: 13 }}>
                      {t('plm.no_products')}
                    </td>
                  </tr>
                ) : filtered.map((product, i) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: i * 0.03 }}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--gv-border)' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gv-primary)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {product.gpn}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--gv-border)', fontSize: 13, fontWeight: 500, color: 'var(--gv-text-heading)', maxWidth: 280 }}>
                      {product.name}
                      <div style={{ fontSize: 11, color: 'var(--gv-text-muted)', marginTop: 1 }}>{product.facility}</div>
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--gv-border)', fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--gv-accent)' }}>
                      v{product.version}
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--gv-border)' }}>
                      <StateBadge state={product.state} lang={lang} />
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--gv-border)' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {product.specs.technologies.map(tid => {
                          const tech = mockTechnologies.find(t => t.id === tid);
                          return tech ? (
                            <span key={tid} style={{
                              padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 600,
                              background: 'rgba(59,130,246,0.10)', color: 'var(--gv-primary)',
                            }}>{tech.name.split(' ')[0]}</span>
                          ) : null;
                        })}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--gv-border)', textAlign: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', color: 'var(--gv-text)', fontSize: 13 }}>
                        <Clock size={12} color="var(--gv-text-muted)" />
                        {product.performance.cycleTime}s
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--gv-border)', textAlign: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', color: 'var(--gv-text)', fontSize: 13 }}>
                        <Gauge size={12} color="var(--gv-text-muted)" />
                        {product.performance.ratePerHour}/h
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--gv-border)' }}>
                      <ChevronRight size={14} color="var(--gv-text-muted)" />
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Detail Drawer */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 101,
                width: 'min(520px, 95vw)',
                background: 'var(--gv-surface)',
                borderLeft: '1px solid var(--gv-border)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: 'var(--gv-shadow-lg)',
              }}
            >
              {/* Drawer Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--gv-border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gv-text-muted)', marginBottom: 4 }}>
                    {t('plm.product_detail')}
                  </div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--gv-text-heading)', margin: 0 }}>
                    {selectedProduct.name}
                  </h2>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gv-primary)', fontWeight: 700 }}>
                      {selectedProduct.gpn}
                    </span>
                    <span style={{ color: 'var(--gv-text-muted)', fontSize: 12 }}>·</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gv-accent)' }}>v{selectedProduct.version}</span>
                    <StateBadge state={selectedProduct.state} lang={lang} />
                  </div>
                </div>
                <button onClick={() => setSelectedProduct(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gv-text-muted)', padding: 4 }}>
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Specs */}
                <section>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                    <Package size={14} color="var(--gv-primary)" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gv-text-heading)' }}>{t('plm.dimensions')} & Specs</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { icon: <Layers size={12} />, label: t('plm.dimensions'), value: selectedProduct.specs.dimensions },
                      { icon: <Tag size={12} />, label: t('plm.weight'), value: `${selectedProduct.specs.weight} kg` },
                      { icon: <Clock size={12} />, label: t('plm.cycle_time'), value: `${selectedProduct.performance.cycleTime}s` },
                      { icon: <Gauge size={12} />, label: t('plm.rate_per_hour'), value: `${selectedProduct.performance.ratePerHour} pz/hr` },
                    ].map(({ icon, label, value }) => (
                      <div key={label} style={{
                        padding: '12px 14px', borderRadius: 10,
                        background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)',
                      }}>
                        <div style={{ display: 'flex', gap: 5, color: 'var(--gv-text-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                          {icon} {label}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--gv-text-heading)' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Technologies */}
                <section>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                    <Layers size={14} color="var(--gv-primary)" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gv-text-heading)' }}>{t('plm.technologies')}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedProduct.specs.technologies.map(tid => {
                      const tech = mockTechnologies.find(t => t.id === tid);
                      return tech ? (
                        <span key={tid} style={{
                          padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: 'rgba(59,130,246,0.10)', color: 'var(--gv-primary)',
                          border: '1px solid rgba(59,130,246,0.20)',
                        }}>{tech.name}</span>
                      ) : null;
                    })}
                  </div>
                </section>

                {/* Documentation */}
                <section>
                  <button
                    onClick={() => setExpandedDocs(!expandedDocs)}
                    style={{
                      display: 'flex', gap: 8, alignItems: 'center',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 10px',
                      width: '100%', textAlign: 'left',
                    }}
                  >
                    <FileText size={14} color="var(--gv-primary)" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gv-text-heading)', flex: 1 }}>
                      {t('plm.linked_docs')} ({selectedProduct.documentation.length})
                    </span>
                    <motion.div animate={{ rotate: expandedDocs ? 90 : 0 }}>
                      <ChevronRight size={14} color="var(--gv-text-muted)" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {expandedDocs && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}
                      >
                        {selectedProduct.documentation.map(doc => (
                          <div key={doc.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 14px', borderRadius: 8,
                            background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)',
                          }}>
                            <div>
                              <DocTypeBadge type={doc.type} />
                              <div style={{ fontSize: 12, color: 'var(--gv-text)', marginTop: 3 }}>{doc.title}</div>
                              <div style={{ fontSize: 10, color: 'var(--gv-text-muted)', marginTop: 2 }}>
                                v{doc.version} · {doc.updatedAt} · {doc.author}
                              </div>
                            </div>
                            <StateBadge state={doc.state} lang={lang} />
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {/* Metadata */}
                <div style={{ borderTop: '1px solid var(--gv-border)', paddingTop: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--gv-text-muted)', display: 'flex', gap: 12 }}>
                    <span>{t('plm.created_at')}: {selectedProduct.createdAt}</span>
                    <span>·</span>
                    <span>{t('plm.updated_at')}: {selectedProduct.updatedAt}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Counter */}
      <div style={{ fontSize: 12, color: 'var(--gv-text-muted)', textAlign: 'right' }}>
        {filtered.length} / {products.length} productos
      </div>
    </div>
  );
}
