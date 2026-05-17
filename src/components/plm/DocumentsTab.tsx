import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FileText, GitBranch, BarChart2, Settings,
  Filter, Download, Eye, ChevronDown, CheckCircle, AlertCircle, Archive, Clock,
} from 'lucide-react';
import type { IProduct, ITechnicalDoc, TechnicalDocType, DocumentState } from '../../types/engineering';

interface DocumentsTabProps {
  products: IProduct[];
}

const DOC_CONFIG: Record<TechnicalDocType, { label: string; color: string; bg: string; gradient: string; icon: React.ReactNode; description: string }> = {
  PFMEA: {
    label: 'PFMEA',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(139,92,246,0.08))',
    icon: <BarChart2 size={24} />,
    description: 'Process Failure Mode & Effects Analysis',
  },
  ControlPlan: {
    label: 'Control Plan',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    gradient: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(16,185,129,0.08))',
    icon: <FileText size={24} />,
    description: 'Plan de Control de Proceso',
  },
  Flowchart: {
    label: 'Flowchart',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.08)',
    gradient: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(59,130,246,0.08))',
    icon: <GitBranch size={24} />,
    description: 'Diagrama de Flujo de Proceso',
  },
  SetupSheet: {
    label: 'Setup Sheet',
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.08)',
    gradient: 'linear-gradient(135deg, rgba(251,146,60,0.2), rgba(249,115,22,0.08))',
    icon: <Settings size={24} />,
    description: 'Process & Setup Sheet',
  },
};

const STATE_CONFIG: Record<DocumentState, { label_es: string; label_en: string; color: string; icon: React.ReactNode }> = {
  Draft:    { label_es: 'Borrador', label_en: 'Draft', color: '#64748b', icon: <Clock size={10} /> },
  Pending:  { label_es: 'Pendiente', label_en: 'Pending', color: '#f59e0b', icon: <AlertCircle size={10} /> },
  Series:   { label_es: 'Serie', label_en: 'Series', color: '#10b981', icon: <CheckCircle size={10} /> },
  Archived: { label_es: 'Archivado', label_en: 'Archived', color: '#ef4444', icon: <Archive size={10} /> },
};

interface FlatDoc extends ITechnicalDoc {
  productName: string;
  productGpn: string;
  productFacility: string;
}

export default function DocumentsTab({ products }: DocumentsTabProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const [filterType, setFilterType] = useState<TechnicalDocType | 'all'>('all');
  const [filterState, setFilterState] = useState<DocumentState | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDoc, setSelectedDoc] = useState<FlatDoc | null>(null);

  // Flatten all documents from all products
  const allDocs: FlatDoc[] = products.flatMap(p =>
    p.documentation.map(doc => ({
      ...doc,
      productName: p.name,
      productGpn: p.gpn,
      productFacility: p.facility,
    }))
  );

  const filtered = allDocs.filter(d =>
    (filterType === 'all' || d.type === filterType) &&
    (filterState === 'all' || d.state === filterState)
  );

  // Stats per doc type
  const stats = (['PFMEA', 'ControlPlan', 'Flowchart', 'SetupSheet'] as TechnicalDocType[]).map(type => ({
    type,
    total: allDocs.filter(d => d.type === type).length,
    series: allDocs.filter(d => d.type === type && d.state === 'Series').length,
    pending: allDocs.filter(d => d.type === type && d.state === 'Pending').length,
    draft: allDocs.filter(d => d.type === type && d.state === 'Draft').length,
  }));

  const selectStyle: React.CSSProperties = {
    appearance: 'none', padding: '8px 32px 8px 12px',
    background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)',
    borderRadius: 8, color: 'var(--gv-text-heading)', fontSize: 12,
    fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Document Type Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {stats.map(stat => {
          const cfg = DOC_CONFIG[stat.type];
          return (
            <motion.div
              key={stat.type}
              whileHover={{ y: -2, boxShadow: 'var(--gv-shadow-md)' }}
              onClick={() => setFilterType(filterType === stat.type ? 'all' : stat.type)}
              className="glass-card"
              style={{
                padding: 16, cursor: 'pointer',
                border: filterType === stat.type ? `1px solid ${cfg.color}` : undefined,
                background: filterType === stat.type ? cfg.bg : undefined,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: cfg.gradient, color: cfg.color,
                }}>
                  {cfg.icon}
                </div>
                <span style={{
                  fontSize: 22, fontWeight: 900, color: cfg.color, lineHeight: 1,
                }}>{stat.total}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gv-text-heading)', marginBottom: 2 }}>
                {cfg.label}
              </div>
              <div style={{ fontSize: 10, color: 'var(--gv-text-muted)', marginBottom: 10 }}>
                {cfg.description}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { count: stat.series, color: '#10b981', label: lang === 'es' ? 'Serie' : 'Series' },
                  { count: stat.pending, color: '#f59e0b', label: lang === 'es' ? 'Pend.' : 'Pend.' },
                  { count: stat.draft, color: '#64748b', label: lang === 'es' ? 'Draft' : 'Draft' },
                ].map(({ count, color, label }) => (
                  <span key={label} style={{ fontSize: 10, fontWeight: 700, color, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontSize: 12 }}>{count}</span>
                    <span style={{ color: 'var(--gv-text-muted)', fontWeight: 400 }}>{label}</span>
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filters & View Toggle */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={14} color="var(--gv-text-muted)" />

        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <select style={selectStyle} value={filterType} onChange={e => setFilterType(e.target.value as TechnicalDocType | 'all')}>
            <option value="all">{lang === 'es' ? 'Todos los tipos' : 'All types'}</option>
            <option value="PFMEA">PFMEA</option>
            <option value="ControlPlan">Control Plan</option>
            <option value="Flowchart">Flowchart</option>
            <option value="SetupSheet">Setup Sheet</option>
          </select>
          <ChevronDown size={12} style={{ position: 'absolute', right: 10, pointerEvents: 'none', color: 'var(--gv-text-muted)' }} />
        </div>

        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <select style={selectStyle} value={filterState} onChange={e => setFilterState(e.target.value as DocumentState | 'all')}>
            <option value="all">{lang === 'es' ? 'Todos los estados' : 'All states'}</option>
            <option value="Draft">{lang === 'es' ? 'Borrador' : 'Draft'}</option>
            <option value="Pending">{lang === 'es' ? 'Pendiente' : 'Pending'}</option>
            <option value="Series">{lang === 'es' ? 'Serie' : 'Series'}</option>
            <option value="Archived">{lang === 'es' ? 'Archivado' : 'Archived'}</option>
          </select>
          <ChevronDown size={12} style={{ position: 'absolute', right: 10, pointerEvents: 'none', color: 'var(--gv-text-muted)' }} />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2, background: 'var(--gv-surface-alt)', borderRadius: 8, padding: 3 }}>
          {(['grid', 'list'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: 11,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                background: viewMode === mode ? 'var(--gv-surface)' : 'transparent',
                color: viewMode === mode ? 'var(--gv-text-heading)' : 'var(--gv-text-muted)',
                boxShadow: viewMode === mode ? 'var(--gv-shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {mode === 'grid' ? '⊞ Grid' : '☰ List'}
            </button>
          ))}
        </div>

        <span style={{ fontSize: 12, color: 'var(--gv-text-muted)' }}>
          {filtered.length} {lang === 'es' ? 'documentos' : 'documents'}
        </span>
      </div>

      {/* Documents Display */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          <AnimatePresence>
            {filtered.map((doc, i) => {
              const cfg = DOC_CONFIG[doc.type];
              const stCfg = STATE_CONFIG[doc.state];
              return (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ y: -3, boxShadow: 'var(--gv-shadow-md)' }}
                  className="glass-card"
                  style={{ padding: 16, cursor: 'pointer' }}
                  onClick={() => setSelectedDoc(doc)}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 9,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: cfg.gradient, color: cfg.color,
                    }}>{cfg.icon}</div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                      color: stCfg.color, background: `${stCfg.color}18`,
                    }}>
                      {stCfg.icon}
                      {lang === 'es' ? stCfg.label_es : stCfg.label_en}
                    </span>
                  </div>

                  <div style={{ fontSize: 11, fontWeight: 800, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    {cfg.label}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gv-text-heading)', lineHeight: 1.4, marginBottom: 8 }}>
                    {doc.title}
                  </div>

                  <div style={{ fontSize: 10, color: 'var(--gv-text-muted)', lineHeight: 1.6 }}>
                    <div style={{ fontFamily: 'monospace', color: 'var(--gv-primary)', fontWeight: 700 }}>{doc.productGpn}</div>
                    <div>{doc.productFacility}</div>
                  </div>

                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--gv-border)',
                  }}>
                    <span style={{ fontSize: 10, color: 'var(--gv-text-muted)', fontWeight: 600 }}>
                      v{doc.version} · {doc.updatedAt}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
                        borderRadius: 6, border: '1px solid var(--gv-border)',
                        background: 'var(--gv-surface-alt)', color: 'var(--gv-text-muted)',
                        fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                      }}
                    >
                      <Download size={10} />
                      PDF
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* List view */
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[
                  { label: 'Tipo', minW: 120 },
                  { label: 'Título', minW: 240 },
                  { label: 'Producto', minW: 130 },
                  { label: 'Versión', minW: 80 },
                  { label: 'Estado', minW: 110 },
                  { label: 'Actualizado', minW: 120 },
                  { label: 'Autor', minW: 110 },
                  { label: '', minW: 60 }
                ].map(({ label, minW }) => (
                  <th key={label} style={{
                    padding: '12px 16px', textAlign: 'left', fontSize: 10,
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: 'var(--gv-text-muted)', borderBottom: '2px solid var(--gv-border)',
                    background: 'var(--gv-surface-alt)',
                    minWidth: minW,
                  }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => {
                const cfg = DOC_CONFIG[doc.type];
                const stCfg = STATE_CONFIG[doc.state];
                return (
                  <tr key={doc.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedDoc(doc)}>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--gv-border)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: cfg.color }}>
                        {cfg.icon}
                        <span style={{ fontSize: 11, fontWeight: 700 }}>{cfg.label}</span>
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--gv-border)', fontSize: 12, color: 'var(--gv-text-heading)', maxWidth: 260 }}>
                      {doc.title}
                    </td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--gv-border)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gv-primary)', fontFamily: 'monospace' }}>{doc.productGpn}</div>
                      <div style={{ fontSize: 10, color: 'var(--gv-text-muted)' }}>{doc.productFacility}</div>
                    </td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--gv-border)', fontSize: 12, fontFamily: 'monospace', color: 'var(--gv-accent)' }}>
                      v{doc.version}
                    </td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--gv-border)' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                        color: stCfg.color, background: `${stCfg.color}18`,
                      }}>
                        {stCfg.icon}
                        {lang === 'es' ? stCfg.label_es : stCfg.label_en}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--gv-border)', fontSize: 12, color: 'var(--gv-text-muted)' }}>
                      {doc.updatedAt}
                    </td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--gv-border)', fontSize: 12, color: 'var(--gv-text-muted)' }}>
                      {doc.author}
                    </td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--gv-border)' }}>
                      <button style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
                        borderRadius: 6, border: '1px solid var(--gv-border)',
                        background: 'var(--gv-surface-alt)', color: 'var(--gv-text-muted)',
                        fontSize: 10, cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        <Eye size={10} /> Ver
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Document Preview Overlay */}
      <AnimatePresence>
        {selectedDoc && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedDoc(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, backdropFilter: 'blur(6px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{
                position: 'fixed', inset: '10%', zIndex: 101,
                background: 'var(--gv-surface)', borderRadius: 16,
                border: '1px solid var(--gv-border)', boxShadow: 'var(--gv-shadow-lg)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '20px 24px', borderBottom: '1px solid var(--gv-border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: DOC_CONFIG[selectedDoc.type].gradient,
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ color: DOC_CONFIG[selectedDoc.type].color }}>
                    {DOC_CONFIG[selectedDoc.type].icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: DOC_CONFIG[selectedDoc.type].color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {DOC_CONFIG[selectedDoc.type].label}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--gv-text-heading)' }}>
                      {selectedDoc.title}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedDoc(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gv-text-muted)' }}>
                  ✕
                </button>
              </div>
              {/* PDF Placeholder */}
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--gv-surface-alt)',
                flexDirection: 'column', gap: 16, color: 'var(--gv-text-muted)',
              }}>
                <div style={{ fontSize: 64 }}>📄</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {selectedDoc.title}
                </div>
                <div style={{ fontSize: 12 }}>
                  v{selectedDoc.version} · {selectedDoc.updatedAt} · {selectedDoc.author}
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px',
                    borderRadius: 8, border: 'none',
                    background: `linear-gradient(135deg, ${DOC_CONFIG[selectedDoc.type].color}, ${DOC_CONFIG[selectedDoc.type].color}99)`,
                    color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                    marginTop: 8,
                  }}
                >
                  <Download size={14} />
                  {lang === 'es' ? 'Descargar PDF' : 'Download PDF'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
