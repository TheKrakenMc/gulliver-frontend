import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  X,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  GitBranch,
  Network,
  Save,
  Users,
  Cog,
  BookOpen,
  Package,
  Ruler,
  Leaf,
} from 'lucide-react';
import type { FaultRecord, ScrapRecord, AnalysisType, FiveWhysData, IshikawaData, IshikawaCause } from '../types';

interface FaultAnalysisDrawerProps {
  open: boolean;
  fault: FaultRecord | ScrapRecord | null;
  onClose: () => void;
  onSave: (updatedFault: any) => void;
}

const emptyFiveWhys: FiveWhysData = {
  whys: ['', '', '', '', ''],
  rootCause: '',
  correctiveAction: '',
};

const emptyIshikawa: IshikawaData = {
  manoDeObra: [],
  maquina: [],
  metodo: [],
  material: [],
  medicion: [],
  medioAmbiente: [],
  effect: '',
  rootCause: '',
  correctiveAction: '',
};

const ishikawaCategories: {
  key: keyof Omit<IshikawaData, 'effect' | 'rootCause' | 'correctiveAction'>;
  label: string;
  color: string;
  icon: React.ReactNode;
}[] = [
  { key: 'manoDeObra', label: 'Mano de Obra', color: '#3b82f6', icon: <Users size={14} /> },
  { key: 'maquina', label: 'Máquina', color: '#f97316', icon: <Cog size={14} /> },
  { key: 'metodo', label: 'Método', color: '#8b5cf6', icon: <BookOpen size={14} /> },
  { key: 'material', label: 'Material', color: '#10b981', icon: <Package size={14} /> },
  { key: 'medicion', label: 'Medición', color: '#06b6d4', icon: <Ruler size={14} /> },
  { key: 'medioAmbiente', label: 'Medio Ambiente', color: '#14b8a6', icon: <Leaf size={14} /> },
];

export default function FaultAnalysisDrawer({ open, fault, onClose, onSave }: FaultAnalysisDrawerProps) {
  const { t } = useTranslation();
  const [analysisType, setAnalysisType] = useState<AnalysisType>('ishikawa');
  const [fiveWhys, setFiveWhys] = useState<FiveWhysData>(emptyFiveWhys);
  const [ishikawa, setIshikawa] = useState<IshikawaData>(emptyIshikawa);
  const [newCauseText, setNewCauseText] = useState<Record<string, string>>({});

  useEffect(() => {
    if (fault) {
      const isFault = 'maquinaNombre' in fault;
      const desc = isFault ? fault.fallaDescripcion : (fault as ScrapRecord).defecto;
      setAnalysisType(fault.analysisType || 'ishikawa');
      setFiveWhys(fault.fiveWhys || { ...emptyFiveWhys, whys: [...emptyFiveWhys.whys] as [string,string,string,string,string] });
      setIshikawa(fault.ishikawa || { ...emptyIshikawa, effect: desc });
    }
  }, [fault]);

  if (!fault) return null;

  const handleSave = () => {
    const hasContent = analysisType === '5whys'
      ? fiveWhys.whys.some((w) => w.trim() !== '')
      : Object.values(ishikawa).some((v) => Array.isArray(v) && v.length > 0);

    const updated = {
      ...fault,
      analysisType,
      analysisComplete: hasContent,
      fiveWhys: analysisType === '5whys' ? fiveWhys : fault.fiveWhys,
      ishikawa: analysisType === 'ishikawa' ? ishikawa : fault.ishikawa,
    };
    onSave(updated);
    onClose();
  };

  const updateWhy = (index: number, value: string) => {
    setFiveWhys((prev) => {
      const newWhys = [...prev.whys] as [string, string, string, string, string];
      newWhys[index] = value;
      return { ...prev, whys: newWhys };
    });
  };

  const addCause = (categoryKey: keyof Omit<IshikawaData, 'effect' | 'rootCause' | 'correctiveAction'>) => {
    const text = newCauseText[categoryKey]?.trim();
    if (!text) return;
    const newCause: IshikawaCause = { id: `${categoryKey}-${Date.now()}`, text };
    setIshikawa((prev) => ({
      ...prev,
      [categoryKey]: [...(prev[categoryKey] as IshikawaCause[]), newCause],
    }));
    setNewCauseText((prev) => ({ ...prev, [categoryKey]: '' }));
  };

  const removeCause = (categoryKey: keyof Omit<IshikawaData, 'effect' | 'rootCause' | 'correctiveAction'>, causeId: string) => {
    setIshikawa((prev) => ({
      ...prev,
      [categoryKey]: (prev[categoryKey] as IshikawaCause[]).filter((c) => c.id !== causeId),
    }));
  };

  const totalCauses = ishikawaCategories.reduce(
    (acc, cat) => acc + (ishikawa[cat.key] as IshikawaCause[]).length,
    0
  );

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--gv-surface-alt)',
    border: '1px solid var(--gv-border)',
    borderRadius: 8,
    color: 'var(--gv-text-heading)',
    fontSize: 13,
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    transition: 'all 0.2s ease',
    resize: 'none' as const,
  };

  const isFault = fault && 'maquinaNombre' in fault;
  const itemMachine = isFault ? fault.maquinaNombre : fault?.tecnologia;
  const itemCode = isFault ? fault.codigoFalla : fault?.codigoDefecto;
  const itemDesc = isFault ? fault.fallaDescripcion : fault?.defecto;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 9998,
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '72vw',
              maxWidth: 960,
              background: 'var(--gv-bg)',
              borderLeft: '1px solid var(--gv-border)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-20px 0 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 28px',
                borderBottom: '1px solid var(--gv-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--gv-surface)',
                flexShrink: 0,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(249,115,22,0.15))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AlertTriangle size={16} color="#ef4444" />
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--gv-text-heading)', margin: 0 }}>
                    {t('rca.title')}
                  </h2>
                </div>
                <p style={{ fontSize: 12, color: 'var(--gv-text-muted)', margin: 0, paddingLeft: 42 }}>
                  {itemMachine} — [{itemCode}] {itemDesc}
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: '1px solid var(--gv-border)',
                  background: 'var(--gv-surface-alt)',
                  color: 'var(--gv-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Analysis Type Tabs */}
            <div
              style={{
                padding: '12px 28px',
                display: 'flex',
                gap: 8,
                borderBottom: '1px solid var(--gv-border)',
                background: 'var(--gv-surface)',
                flexShrink: 0,
              }}
            >
              {([
                { key: 'ishikawa' as AnalysisType, label: t('rca.tab_ishikawa'), icon: <Network size={14} /> },
                { key: '5whys' as AnalysisType, label: t('rca.tab_5whys'), icon: <GitBranch size={14} /> },
                { key: 'pdca' as AnalysisType, label: t('rca.tab_pdca'), icon: <Save size={14} /> },
              ]).map((tab) => (
                <motion.button
                  key={tab.key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setAnalysisType(tab.key)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 8,
                    border: analysisType === tab.key ? '2px solid var(--gv-primary)' : '2px solid var(--gv-border)',
                    background: analysisType === tab.key ? 'rgba(59,130,246,0.08)' : 'transparent',
                    color: analysisType === tab.key ? 'var(--gv-primary)' : 'var(--gv-text-muted)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </motion.button>
              ))}
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
              <AnimatePresence mode="wait">
                {analysisType === '5whys' ? (
                  <motion.div
                    key="5whys"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}
                  >
                    {/* Problem statement */}
                    <div
                      className="glass-card"
                      style={{
                        width: '100%',
                        maxWidth: 620,
                        padding: '18px 22px',
                        borderLeft: '4px solid #ef4444',
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#ef4444',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          marginBottom: 6,
                        }}
                      >
                        {t('rca.problem')}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gv-text-heading)' }}>
                        [{itemCode}] {itemDesc}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gv-text-muted)', marginTop: 4 }}>
                        {itemMachine} {isFault && `— Downtime: ${(fault as FaultRecord).downtimeMin} min`}
                      </div>
                    </div>

                    {/* Whys chain */}
                    {fiveWhys.whys.map((why, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 620 }}>
                        {/* Connector arrow */}
                        <div
                          style={{
                            width: 2,
                            height: 24,
                            background: `linear-gradient(180deg, ${why ? 'var(--gv-primary)' : 'var(--gv-border)'}, ${why ? 'var(--gv-primary)' : 'var(--gv-border)'})`,
                            position: 'relative',
                          }}
                        >
                          <ChevronDown
                            size={14}
                            style={{
                              position: 'absolute',
                              bottom: -6,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              color: why ? 'var(--gv-primary)' : 'var(--gv-border)',
                            }}
                          />
                        </div>

                        {/* Why card */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.08 }}
                          className="glass-card"
                          style={{
                            width: '100%',
                            padding: '16px 20px',
                            borderLeft: `3px solid ${why ? 'var(--gv-primary)' : 'var(--gv-border)'}`,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <span
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                background: why
                                  ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                                  : 'var(--gv-surface-alt)',
                                color: why ? '#fff' : 'var(--gv-text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 800,
                                flexShrink: 0,
                              }}
                            >
                              {i + 1}
                            </span>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: why ? 'var(--gv-text-heading)' : 'var(--gv-text-muted)',
                              }}
                            >
                              {t('rca.why_label')}
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            style={{ ...inputStyle }}
                            placeholder={i === 0
                              ? t('rca.why_placeholder_1')
                              : t('rca.why_placeholder_n', { prev: fiveWhys.whys[i - 1]?.toLowerCase().slice(0, 50) || '...' })
                            }
                            value={why}
                            onChange={(e) => updateWhy(i, e.target.value)}
                          />
                        </motion.div>
                      </div>
                    ))}

                    {/* Connector to Root Cause */}
                    <div style={{ width: 2, height: 24, background: 'var(--gv-border)', position: 'relative' }}>
                      <ChevronDown
                        size={14}
                        style={{
                          position: 'absolute',
                          bottom: -6,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          color: '#10b981',
                        }}
                      />
                    </div>

                    {/* Root Cause */}
                    <div
                      className="glass-card"
                      style={{
                        width: '100%',
                        maxWidth: 620,
                        padding: '18px 22px',
                        borderLeft: '4px solid #10b981',
                        background: 'rgba(16,185,129,0.04)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#10b981',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          marginBottom: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <CheckCircle2 size={12} /> {t('rca.root_cause')}
                      </div>
                      <textarea
                        rows={2}
                        style={inputStyle}
                        placeholder={t('rca.root_cause_placeholder_5w')}
                        value={fiveWhys.rootCause}
                        onChange={(e) => setFiveWhys((p) => ({ ...p, rootCause: e.target.value }))}
                      />
                    </div>

                    {/* Corrective Action */}
                    <div style={{ width: 2, height: 20, background: 'var(--gv-border)' }} />
                    <div
                      className="glass-card"
                      style={{
                        width: '100%',
                        maxWidth: 620,
                        padding: '18px 22px',
                        borderLeft: '4px solid var(--gv-primary)',
                        marginBottom: 20,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: 'var(--gv-primary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          marginBottom: 8,
                        }}
                      >
                        🔧 {t('rca.corrective_action')}
                      </div>
                      <textarea
                        rows={2}
                        style={inputStyle}
                        placeholder={t('rca.corrective_action_placeholder')}
                        value={fiveWhys.correctiveAction}
                        onChange={(e) => setFiveWhys((p) => ({ ...p, correctiveAction: e.target.value }))}
                      />
                    </div>
                  </motion.div>
                ) : analysisType === 'ishikawa' ? (
                  /* ─── Ishikawa ─── */
                  <motion.div
                    key="ishikawa"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
                  >
                    {/* Fishbone SVG Visualization */}
                    <div
                      className="glass-card"
                      style={{ padding: '16px 20px', overflow: 'hidden' }}
                    >
                      <svg
                        viewBox="0 0 820 260"
                        style={{ width: '100%', height: 180 }}
                      >
                        {/* Main spine */}
                        <line x1="40" y1="130" x2="680" y2="130" stroke="var(--gv-border-hover)" strokeWidth="2.5" />
                        <polygon points="680,123 700,130 680,137" fill="var(--gv-border-hover)" />

                        {/* Effect box */}
                        <rect x="705" y="100" width="105" height="60" rx="10" fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1.5" />
                        <text x="757" y="126" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif">
                          {t('rca.effect')}
                        </text>
                        <text x="757" y="146" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="500" fontFamily="Inter, sans-serif" opacity="0.7">
                          {t('rca.effect_sub')}
                        </text>

                        {/* Top branches */}
                        {[
                          { x: 160, label: t('rca.cat_manpower'), color: '#3b82f6', count: ishikawa.manoDeObra.length },
                          { x: 360, label: t('rca.cat_machine'), color: '#f97316', count: ishikawa.maquina.length },
                          { x: 560, label: t('rca.cat_method'), color: '#8b5cf6', count: ishikawa.metodo.length },
                        ].map((b) => (
                          <g key={b.label}>
                            <line x1={b.x} y1="130" x2={b.x - 70} y2="35" stroke={b.color} strokeWidth="1.5" opacity="0.6" />
                            <rect x={b.x - 115} y="10" width="90" height="30" rx="6" fill={`${b.color}18`} stroke={b.color} strokeWidth="1" opacity="0.8" />
                            <text x={b.x - 70} y="30" textAnchor="middle" fill={b.color} fontSize="9" fontWeight="700" fontFamily="Inter, sans-serif">
                              {b.label}
                            </text>
                            {b.count > 0 && (
                              <g>
                                <circle cx={b.x - 30} cy="25" r="9" fill={b.color} />
                                <text x={b.x - 30} y="29" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="800" fontFamily="Inter">
                                  {b.count}
                                </text>
                              </g>
                            )}
                            {/* Sub-branches for causes */}
                            {(b.label === t('rca.cat_manpower') ? ishikawa.manoDeObra :
                              b.label === t('rca.cat_machine') ? ishikawa.maquina :
                              ishikawa.metodo).slice(0, 3).map((cause: IshikawaCause, ci: number) => {
                                const fraction = (ci + 1) / 4;
                                const branchX = b.x - fraction * 70;
                                const branchY = 130 - fraction * 95;
                                return (
                                  <line key={cause.id} x1={branchX} y1={branchY} x2={branchX - 20} y2={branchY - 15}
                                    stroke={b.color} strokeWidth="1" opacity="0.4" />
                                );
                              })}
                          </g>
                        ))}

                        {/* Bottom branches */}
                        {[
                          { x: 160, label: t('rca.cat_material'), color: '#10b981', count: ishikawa.material.length },
                          { x: 360, label: t('rca.cat_measurement'), color: '#06b6d4', count: ishikawa.medicion.length },
                          { x: 560, label: t('rca.cat_environment_short'), color: '#14b8a6', count: ishikawa.medioAmbiente.length },
                        ].map((b) => (
                          <g key={b.label}>
                            <line x1={b.x} y1="130" x2={b.x - 70} y2="225" stroke={b.color} strokeWidth="1.5" opacity="0.6" />
                            <rect x={b.x - 115} y="220" width="90" height="30" rx="6" fill={`${b.color}18`} stroke={b.color} strokeWidth="1" opacity="0.8" />
                            <text x={b.x - 70} y="240" textAnchor="middle" fill={b.color} fontSize="9" fontWeight="700" fontFamily="Inter, sans-serif">
                              {b.label}
                            </text>
                            {b.count > 0 && (
                              <g>
                                <circle cx={b.x - 30} cy="235" r="9" fill={b.color} />
                                <text x={b.x - 30} y="239" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="800" fontFamily="Inter">
                                  {b.count}
                                </text>
                              </g>
                            )}
                            {(b.label === t('rca.cat_material') ? ishikawa.material :
                              b.label === t('rca.cat_measurement') ? ishikawa.medicion :
                              ishikawa.medioAmbiente).slice(0, 3).map((cause: IshikawaCause, ci: number) => {
                                const fraction = (ci + 1) / 4;
                                const branchX = b.x - fraction * 70;
                                const branchY = 130 + fraction * 95;
                                return (
                                  <line key={cause.id} x1={branchX} y1={branchY} x2={branchX - 20} y2={branchY + 15}
                                    stroke={b.color} strokeWidth="1" opacity="0.4" />
                                );
                              })}
                          </g>
                        ))}
                      </svg>
                    </div>

                    {/* Effect / Problem statement */}
                    <div
                      className="glass-card"
                      style={{
                        padding: '14px 20px',
                        borderLeft: '4px solid #ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <AlertTriangle size={16} color="#ef4444" />
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {t('rca.effect_problem')}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gv-text-heading)', marginTop: 2 }}>
                          [{itemCode}] {itemDesc}
                        </div>
                      </div>
                      <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--gv-text-muted)' }}>
                        {totalCauses} {t('rca.causes_registered')}
                      </div>
                    </div>

                    {/* 6M Category Cards Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                      {ishikawaCategories.map((cat) => {
                        const causes = ishikawa[cat.key] as IshikawaCause[];
                        const catLabelKeys: Record<string, string> = { manoDeObra: 'cat_manpower', maquina: 'cat_machine', metodo: 'cat_method', material: 'cat_material', medicion: 'cat_measurement', medioAmbiente: 'cat_environment' };
                        return (
                          <motion.div
                            key={cat.key}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card"
                            style={{
                              padding: '14px 16px',
                              borderTop: `3px solid ${cat.color}`,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 12,
                                fontWeight: 700,
                                color: cat.color,
                              }}
                            >
                              <span
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 6,
                                  background: `${cat.color}18`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {cat.icon}
                              </span>
                              {t(`rca.${catLabelKeys[cat.key]}`)}
                              {causes.length > 0 && (
                                <span
                                  style={{
                                    marginLeft: 'auto',
                                    fontSize: 10,
                                    fontWeight: 800,
                                    padding: '2px 7px',
                                    borderRadius: 4,
                                    background: `${cat.color}18`,
                                  }}
                                >
                                  {causes.length}
                                </span>
                              )}
                            </div>

                            {/* Cause list */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 40 }}>
                              {causes.length === 0 && (
                                <div style={{ fontSize: 11, color: 'var(--gv-text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                                  {t('rca.no_causes')}
                                </div>
                              )}
                              {causes.map((cause) => (
                                <motion.div
                                  key={cause.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '6px 8px',
                                    borderRadius: 6,
                                    background: 'var(--gv-surface-alt)',
                                    fontSize: 12,
                                    color: 'var(--gv-text)',
                                  }}
                                >
                                  <span
                                    style={{
                                      width: 5,
                                      height: 5,
                                      borderRadius: '50%',
                                      background: cat.color,
                                      flexShrink: 0,
                                    }}
                                  />
                                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {cause.text}
                                  </span>
                                  <button
                                    onClick={() => removeCause(cat.key, cause.id)}
                                    style={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: 4,
                                      border: 'none',
                                      background: 'transparent',
                                      color: 'var(--gv-text-muted)',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                      transition: 'color 0.15s',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--gv-text-muted)')}
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </motion.div>
                              ))}
                            </div>

                            {/* Add cause input */}
                            <div style={{ display: 'flex', gap: 6 }}>
                              <input
                                type="text"
                                style={{ ...inputStyle, padding: '7px 10px', fontSize: 12 }}
                                placeholder={t('rca.add_cause')}
                                value={newCauseText[cat.key] || ''}
                                onChange={(e) => setNewCauseText((p) => ({ ...p, [cat.key]: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && addCause(cat.key)}
                              />
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => addCause(cat.key)}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 6,
                                  border: 'none',
                                  background: `${cat.color}25`,
                                  color: cat.color,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <Plus size={14} />
                              </motion.button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Root Cause + Corrective Action */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div
                        className="glass-card"
                        style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#10b981',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            marginBottom: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <CheckCircle2 size={12} /> {t('rca.root_cause')}
                        </div>
                        <textarea
                          rows={3}
                          style={inputStyle}
                          placeholder={t('rca.root_cause_placeholder')}
                          value={ishikawa.rootCause}
                          onChange={(e) => setIshikawa((p) => ({ ...p, rootCause: e.target.value }))}
                        />
                      </div>
                      <div
                        className="glass-card"
                        style={{ padding: '16px 20px', borderLeft: '4px solid var(--gv-primary)' }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: 'var(--gv-primary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            marginBottom: 8,
                          }}
                        >
                          🔧 {t('rca.corrective_action')}
                        </div>
                        <textarea
                          rows={3}
                          style={inputStyle}
                          placeholder={t('rca.corrective_action_placeholder')}
                          value={ishikawa.correctiveAction}
                          onChange={(e) => setIshikawa((p) => ({ ...p, correctiveAction: e.target.value }))}
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* ─── PDCA ─── */
                  <motion.div
                    key="pdca"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
                  >
                    <div className="glass-card" style={{ width: '100%', maxWidth: 620, padding: '24px', textAlign: 'center', color: 'var(--gv-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Save size={32} color="#8b5cf6" style={{ marginBottom: 12, opacity: 0.8 }} />
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gv-text-heading)' }}>
                        Gestión PDCA
                      </div>
                      <p style={{ marginTop: 8, fontSize: 13 }}>
                        El plan de acción será gestionado por el equipo multidisciplinario desde el módulo de PDCA.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '16px 28px',
                borderTop: '1px solid var(--gv-border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12,
                background: 'var(--gv-surface)',
                flexShrink: 0,
              }}
            >
              <button
                onClick={onClose}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: '1px solid var(--gv-border)',
                  background: 'transparent',
                  color: 'var(--gv-text)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancelar
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                style={{
                  padding: '10px 28px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                }}
              >
                <Save size={15} />
                Guardar Análisis
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
