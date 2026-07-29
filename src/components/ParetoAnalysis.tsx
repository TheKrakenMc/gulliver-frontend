/**
 * ParetoAnalysis.tsx — Componente principal del Pareto Multinivel
 *
 * Orquesta la obtención de datos, cálculo del motor Pareto,
 * y renderizado de la tabla corporativa con selector de foco.
 */
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BarChart3, AlertTriangle, Clock, Wrench, Activity } from 'lucide-react';
import { useGlobalStore } from '../store/globalStore';
import { useProductionStore } from '../store/productionStore';
import { baseDataApi } from '../api/baseDataApi';
import { computePareto } from '../utils/paretoEngine';
import type { AnalysisFocus } from '../utils/paretoEngine';
import type { FilterState, BaseMachine, BaseMaintenanceFault, BaseAssetFault } from '../types';
import ParetoTable from './ParetoTable';

interface ParetoAnalysisProps {
  filters: FilterState;
}

const FOCUS_OPTIONS: { key: AnalysisFocus; icon: React.ReactNode; color: string }[] = [
  { key: 'SCRAP', icon: <AlertTriangle size={16} />, color: '#ef4444' },
  { key: 'DOWNTIME', icon: <Clock size={16} />, color: '#f59e0b' },
  { key: 'MTTR', icon: <Wrench size={16} />, color: '#8b5cf6' },
  { key: 'MTBF', icon: <Activity size={16} />, color: '#3b82f6' },
];

export default function ParetoAnalysis({ filters }: ParetoAnalysisProps) {
  const { t } = useTranslation();
  const { globalDateRange, hierarchy } = useGlobalStore();
  const { fetchPlans, fetchHourRecords, fetchFaults, fetchScrap, fetchDowntime } =
    useProductionStore();

  const [focus, setFocus] = useState<AnalysisFocus>('DOWNTIME');
  const [isLoading, setIsLoading] = useState(true);

  // Raw data
  const [faults, setFaults] = useState<any[]>([]);
  const [scrap, setScrap] = useState<any[]>([]);
  const [downtime, setDowntime] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [hours, setHours] = useState<any[]>([]);
  const [machines, setMachines] = useState<BaseMachine[]>([]);
  const [maintenanceFaults, setMaintenanceFaults] = useState<BaseMaintenanceFault[]>([]);
  const [assetFaults, setAssetFaults] = useState<BaseAssetFault[]>([]);

  // Fetch all data on mount / date change
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const [p, h, f, s, d] = await Promise.all([
          fetchPlans(globalDateRange.startDate, globalDateRange.endDate),
          fetchHourRecords(globalDateRange.startDate, globalDateRange.endDate),
          fetchFaults(globalDateRange.startDate, globalDateRange.endDate),
          fetchScrap(globalDateRange.startDate, globalDateRange.endDate),
          fetchDowntime(globalDateRange.startDate, globalDateRange.endDate),
        ]);

        // Get machines (use cache if available)
        let machineList = baseDataApi.getCachedMachines();
        if (!machineList) {
          machineList = await baseDataApi.getMachines();
        }

        // Get maintenance & asset faults
        const faultsList = await baseDataApi.getMaintenanceFaults();
        const assetFaultsList = await baseDataApi.getAssetFaults();

        if (isMounted) {
          setPlans(p);
          setHours(h);
          setFaults(f);
          setScrap(s);
          setDowntime(d);
          setMachines(machineList || []);
          setMaintenanceFaults(faultsList || []);
          setAssetFaults(assetFaultsList || []);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('ParetoAnalysis: Failed to fetch data', err);
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [globalDateRange.startDate, globalDateRange.endDate]);

  // Compute Pareto levels
  const levels = useMemo(() => {
    if (isLoading || plans.length === 0) return [];
    return computePareto({
      faults,
      scrap,
      downtime,
      plans,
      hours,
      machines,
      maintenanceFaults,
      assetFaults,
      hierarchy,
      focus,
    });
  }, [faults, scrap, downtime, plans, hours, machines, maintenanceFaults, assetFaults, hierarchy, focus, isLoading]);

  // Count total incidents for the header
  const totalIncidents = useMemo(() => {
    if (levels.length === 0) return 0;
    const level1 = levels.find((l) => l.level === 1);
    return level1 ? level1.total : 0;
  }, [levels]);

  const dateLabel = `${globalDateRange.startDate} — ${globalDateRange.endDate}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className="glass-card"
      style={{
        padding: '40px',
        background: 'var(--gv-surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <BarChart3 size={28} color="#1d4ed8" />
            <h3
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: 'var(--gv-text-heading)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              {t('pareto.title')}
            </h3>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              paddingLeft: 44,
              fontSize: 14,
              color: 'var(--gv-text-muted)',
              fontWeight: 500,
            }}
          >
            {/* <span>{t('pareto.subtitle')}</span> */}
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 6,
                background: 'var(--gv-surface-alt)',
                border: '1px solid var(--gv-border)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {t('pareto.date_label')}: {dateLabel}
            </span>
          </div>
        </div>

        {/* Total incidents badge */}
        {totalIncidents > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 4,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--gv-text-muted)',
                letterSpacing: '0.05em',
              }}
            >
              Total {t(`pareto.focus_${focus.toLowerCase()}`)}
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: 'var(--gv-text-heading)',
                lineHeight: 1,
              }}
            >
              {Math.round(totalIncidents)}
            </div>
          </div>
        )}
      </div>

      {/* ── Focus Selector ── */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        {FOCUS_OPTIONS.map((opt) => {
          const isActive = focus === opt.key;
          return (
            <motion.button
              key={opt.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFocus(opt.key)}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                border: `1.5px solid ${isActive ? opt.color : 'var(--gv-border)'}`,
                background: isActive ? `${opt.color}10` : 'transparent',
                color: isActive ? opt.color : 'var(--gv-text-muted)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                letterSpacing: '0.03em',
              }}
            >
              {opt.icon}
              {t(`pareto.focus_${opt.key.toLowerCase()}`)}
            </motion.button>
          );
        })}
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200,
            color: 'var(--gv-text-muted)',
            fontSize: 16,
            fontWeight: 500,
          }}
        >
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {t('pareto.subtitle')}...
          </motion.div>
        </div>
      ) : (
        <ParetoTable levels={levels} focus={focus} />
      )}
    </motion.div>
  );
}
