import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Cog, Package, FileText, GitBranch, Database } from 'lucide-react';
import type { FilterState } from '../../types';
import type { IProduct, IOperation, ITechnology, IProcessVariable, IVersionHistoryEntry } from '../../types/engineering';
import {
  mockProducts, mockOperations, mockTechnologies,
  mockProcessVariables, mockVersionHistory,
} from '../../data/plmMockData';
import ProductsTab from './ProductsTab';
import DocumentsTab from './DocumentsTab';
import VersionControlTab from './VersionControlTab';
import AuxDataTab from './AuxDataTab';

interface PLMViewProps {
  filters: FilterState;
}

type TabId = 'products' | 'documents' | 'versions' | 'auxdata';

const TABS: { id: TabId; labelKey: string; icon: React.ReactNode }[] = [
  { id: 'products',  labelKey: 'plm.tab_products',  icon: <Package size={15} /> },
  { id: 'documents', labelKey: 'plm.tab_documents',  icon: <FileText size={15} /> },
  { id: 'versions',  labelKey: 'plm.tab_versions',   icon: <GitBranch size={15} /> },
  { id: 'auxdata',   labelKey: 'plm.tab_aux_data',   icon: <Database size={15} /> },
];

export default function PLMView({ filters }: PLMViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>('products');

  const [products, setProducts] = useState<IProduct[]>(mockProducts);
  const [operations, setOperations] = useState<IOperation[]>(mockOperations);
  const [technologies, setTechnologies] = useState<ITechnology[]>(mockTechnologies);
  const [processVariables, setProcessVariables] = useState<IProcessVariable[]>(mockProcessVariables);
  const [versionHistory, setVersionHistory] = useState<IVersionHistoryEntry[]>(mockVersionHistory);

  const addHistory = (entry: IVersionHistoryEntry) => {
    setVersionHistory(h => [entry, ...h]);
  };

  /* KPI summary counts */
  const totalProducts = products.length;
  const inSeries = products.filter(p => p.state === 'Series').length;
  const inPending = products.filter(p => p.state === 'Pending').length;
  const inDraft   = products.filter(p => p.state === 'Draft').length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.15))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Cog size={20} color="#8b5cf6" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--gv-text-heading)', margin: 0, letterSpacing: -0.5 }}>
              {t('plm.title')}
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--gv-text-muted)', margin: 0, paddingLeft: 48 }}>
            {t('plm.subtitle')}
          </p>
        </div>

        {/* KPI Pills */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: t('plm.state'), value: totalProducts, color: 'var(--gv-primary)', sub: 'Total' },
            { label: t('plm.state_series'), value: inSeries, color: '#10b981', sub: 'Serie' },
            { label: t('plm.state_pending'), value: inPending, color: '#f59e0b', sub: 'Pendiente' },
            { label: t('plm.state_draft'), value: inDraft, color: '#64748b', sub: 'Borrador' },
          ].map(kpi => (
            <div key={kpi.sub} className="glass-card" style={{ padding: '10px 16px', textAlign: 'center', minWidth: 72 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
              <div style={{ fontSize: 10, color: 'var(--gv-text-muted)', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{kpi.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter info banner */}
      {filters.facility && (
        <div style={{
          padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500,
          background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)',
          color: 'var(--gv-primary)', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          📍 {t('filters.facility')}: <strong>{filters.facility}</strong>
          {' · '}
          {t('filters.process')}: <strong>{filters.process}</strong>
        </div>
      )}

      {/* Sub-Tab Navigation */}
      <div style={{ position: 'relative', display: 'flex', gap: 4, background: 'var(--gv-surface-alt)', borderRadius: 12, padding: 4 }}>
        {TABS.map(tab => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '9px 16px', borderRadius: 9, border: 'none',
                background: isActive ? 'var(--gv-surface)' : 'transparent',
                color: isActive ? 'var(--gv-text-heading)' : 'var(--gv-text-muted)',
                fontSize: 13, fontWeight: isActive ? 700 : 500,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: isActive ? 'var(--gv-shadow)' : 'none',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="plm-tab-indicator"
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 9,
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.06))',
                    border: '1px solid rgba(139,92,246,0.15)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {tab.icon}
                <span className="hidden sm:inline">{t(tab.labelKey)}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          {activeTab === 'products' && (
            <ProductsTab products={products} onUpdateProducts={setProducts} filters={filters} />
          )}
          {activeTab === 'documents' && (
            <DocumentsTab products={products} />
          )}
          {activeTab === 'versions' && (
            <VersionControlTab
              products={products}
              onUpdateProducts={setProducts}
              history={versionHistory}
              onAddHistory={addHistory}
            />
          )}
          {activeTab === 'auxdata' && (
            <AuxDataTab
              operations={operations}
              technologies={technologies}
              processVariables={processVariables}
              onUpdateOperations={setOperations}
              onUpdateTechnologies={setTechnologies}
              onUpdateProcessVariables={setProcessVariables}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
