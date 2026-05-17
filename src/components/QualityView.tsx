import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Plus, Minus, RotateCcw, AlertTriangle } from 'lucide-react';
import scrapCatalog from '../utils/Failures_SCRAP.json';
import type { ScrapCatalog, ScrapDefecto } from '../types';

const catalog = scrapCatalog as ScrapCatalog;
const technologies = Object.keys(catalog);

export default function QualityView() {
  const { t } = useTranslation();
  const [activeTech, setActiveTech] = useState<string>(technologies[0]);
  const [defectCounts, setDefectCounts] = useState<Record<string, number>>({});

  const defects = useMemo(() => {
    return (catalog[activeTech] || []).map((d: ScrapDefecto) => ({
      ...d,
      count: defectCounts[d.codigo] || 0,
    }));
  }, [activeTech, defectCounts]);

  const totalScrap = useMemo(
    () => Object.values(defectCounts).reduce((acc, v) => acc + v, 0),
    [defectCounts]
  );

  const updateCount = (codigo: string, delta: number) => {
    setDefectCounts((prev) => {
      const updated = { ...prev };
      const current = updated[codigo] || 0;
      updated[codigo] = Math.max(0, current + delta);
      return updated;
    });
  };

  const resetAll = () => setDefectCounts({});

  const handleTechChange = (tech: string) => {
    setActiveTech(tech);
    // Don't reset counts — they persist per session
  };

  const techColors: Record<string, { gradient: string; color: string }> = {
    'Inyeccion': { gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#3b82f6' },
    'Termoformado': { gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#8b5cf6' },
    'Corte': { gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#f59e0b' },
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
              background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(249,115,22,0.15))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldCheck size={18} color="#ef4444" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--gv-text-heading)', margin: 0, letterSpacing: -0.5 }}>
              {t('quality.title')}
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--gv-text-muted)', margin: 0, paddingLeft: 46 }}>
            {t('quality.subtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="glass-card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={16} color={totalScrap > 10 ? '#ef4444' : totalScrap > 5 ? '#f59e0b' : '#10b981'} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gv-text-muted)', textTransform: 'uppercase' }}>{t('quality.total_scrap')}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: totalScrap > 10 ? '#ef4444' : totalScrap > 5 ? '#f59e0b' : '#10b981', lineHeight: 1 }}>{totalScrap}</div>
            </div>
          </div>
          <button
            onClick={resetAll}
            style={{
              padding: '10px 16px', borderRadius: 8, border: '1px solid var(--gv-border)',
              background: 'var(--gv-surface-alt)', color: 'var(--gv-text)', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            <RotateCcw size={14} /> {t('quality.reset')}
          </button>
        </div>
      </div>

      {/* Technology Tabs */}
      <div style={{ display: 'flex', gap: 12 }}>
        {technologies.map((tech) => {
          const isActive = tech === activeTech;
          const tc = techColors[tech] || { gradient: 'linear-gradient(135deg, #64748b, #475569)', color: '#64748b' };
          const techDefectCount = (catalog[tech] || []).reduce((acc: number, d: ScrapDefecto) => acc + (defectCounts[d.codigo] || 0), 0);

          return (
            <motion.button
              key={tech}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleTechChange(tech)}
              style={{
                padding: '16px 28px',
                borderRadius: 12,
                border: isActive ? `2px solid ${tc.color}` : '2px solid var(--gv-border)',
                background: isActive ? `${tc.color}12` : 'var(--gv-surface)',
                color: isActive ? tc.color : 'var(--gv-text-muted)',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                position: 'relative',
              }}
            >
              {tech}
              {techDefectCount > 0 && (
                <span style={{
                  background: tc.gradient,
                  color: '#fff',
                  borderRadius: 6,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 800,
                }}>
                  {techDefectCount}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Defect Buttons Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <AnimatePresence mode="wait">
          {defects.map((defect, index) => {
            const tc = techColors[activeTech] || { gradient: 'linear-gradient(135deg, #64748b, #475569)', color: '#64748b' };
            return (
              <motion.div
                key={defect.codigo}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card"
                style={{
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  borderLeft: defect.count > 0 ? `3px solid ${tc.color}` : '3px solid transparent',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: tc.color,
                    letterSpacing: '0.06em', marginBottom: 4,
                  }}>
                    {defect.codigo}
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 700, color: 'var(--gv-text-heading)',
                    lineHeight: 1.3,
                  }}>
                    {defect.defecto}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => updateCount(defect.codigo, -1)}
                    style={{
                      width: 36, height: 36, borderRadius: 8,
                      border: '1px solid var(--gv-border)', background: 'var(--gv-surface-alt)',
                      color: 'var(--gv-text-muted)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s ease', opacity: defect.count > 0 ? 1 : 0.3,
                    }}
                    disabled={defect.count === 0}
                  >
                    <Minus size={16} />
                  </motion.button>

                  <motion.div
                    key={defect.count}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    style={{
                      fontSize: 22, fontWeight: 800, width: 48, textAlign: 'center',
                      color: defect.count > 0 ? '#ef4444' : 'var(--gv-text-muted)',
                    }}
                  >
                    {defect.count}
                  </motion.div>

                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => updateCount(defect.codigo, 1)}
                    style={{
                      width: 36, height: 36, borderRadius: 8,
                      border: 'none', background: tc.gradient,
                      color: '#fff', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Plus size={16} />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
