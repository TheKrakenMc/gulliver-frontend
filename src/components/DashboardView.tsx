import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Activity, BarChart3, TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle, PackageX } from 'lucide-react';
import { useGlobalStore } from '../store/globalStore';
import { getLogisticPlans, getHourRecords, getFaultRecords, getScrapRecords } from '../api/productionService';
import type { FilterState, PlanRecord, HourRecord } from '../types';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, ComposedChart, Cell, ReferenceLine, LabelList
} from 'recharts';
import { parseISO, format, subDays, differenceInDays } from 'date-fns';
import { Day24hTimeline } from './Day24hTimeline';
import ParetoAnalysis from './ParetoAnalysis';

/* ─── Modern KPI Card ─── */
interface ModernKPICardProps {
  title: string;
  value: string | number;
  unit: string;
  trend?: number; // percentage difference
  trendLabel?: string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}

function ModernKPICard({ title, value, unit, trend, trendLabel, icon, color, delay = 0 }: ModernKPICardProps) {
  const isPositive = trend && trend >= 0;
  const isNegative = trend && trend < 0;
  
  // Map our generic color to a status
  const statusColors: Record<string, { bg: string, border: string, text: string }> = {
    '#3b82f6': { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: '#3b82f6' }, // Blue
    '#10b981': { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: '#10b981' }, // Green
    '#f59e0b': { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: '#f59e0b' }, // Yellow
    '#8b5cf6': { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)', text: '#8b5cf6' }, // Purple
    '#ef4444': { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444' }, // Red
    '#f43f5e': { bg: 'rgba(244, 63, 94, 0.1)', border: 'rgba(244, 63, 94, 0.3)', text: '#f43f5e' }, // Rose
  };
  
  const colors = statusColors[color] || { bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.3)', text: 'var(--gv-text-muted)' };
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
      className="glass-card"
      style={{
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        position: 'relative',
        background: 'var(--gv-surface)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: colors.text }}>{icon}</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--gv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </span>
        </div>
        
        {trend !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.text }}>
            <TrendIcon size={20} strokeWidth={3} />
            <span style={{ fontSize: 16, fontWeight: 800 }}>
              {isPositive ? '+' : ''}{trend.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 64, fontWeight: 900, color: 'var(--gv-text-heading)', lineHeight: 1, letterSpacing: -2 }}>
          {value}
        </span>
        <span style={{ fontSize: 24, fontWeight: 600, color: 'var(--gv-text-muted)' }}>{unit}</span>
      </div>

      {/* Footer Trend text */}
      {trendLabel && (
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--gv-text-muted)', marginTop: 'auto', paddingTop: 8 }}>
          {trendLabel}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Main Dashboard ─── */
interface DashboardViewProps {
  filters: FilterState;
}

export default function DashboardView({ filters }: DashboardViewProps) {
  const { t } = useTranslation();
  const { setGlobalLoading, globalDateRange, hierarchy } = useGlobalStore();
  
  // States for processed data
  const [metrics, setMetrics] = useState({
    oee: 0, availability: 0, performance: 0, quality: 0, downtime: 0, scrap: 0, totalTarget: 0, totalOK: 0
  });
  const [prevMetrics, setPrevMetrics] = useState({
    oee: 0, availability: 0, performance: 0, quality: 0, downtime: 0, scrap: 0
  });
  const [rawChartPlans, setRawChartPlans] = useState<PlanRecord[]>([]);
  const [rawChartHours, setRawChartHours] = useState<HourRecord[]>([]);
  const [activeProcesses, setActiveProcesses] = useState<string[]>([]);
  const [activeShifts, setActiveShifts] = useState<string[]>([]);
  const [selectedChartProcesses, setSelectedChartProcesses] = useState<string[]>([]);
  const [selectedChartShifts, setSelectedChartShifts] = useState<string[]>([]);

  // Get all processes for the selected Business Unit
  const validProcesses = useMemo(() => {
    const loc = hierarchy.find(l => l.name === filters.location);
    const bu = loc?.business_units.find(b => b.name === filters.businessUnit);
    return bu ? bu.processes.map(p => p.name) : [];
  }, [hierarchy, filters.location, filters.businessUnit]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setGlobalLoading(true, "Procesando datos corporativos...");
      try {
        const start = parseISO(globalDateRange.startDate);
        const end = parseISO(globalDateRange.endDate);
        const diff = differenceInDays(end, start) + 1;
        
        const prevStart = format(subDays(start, diff), 'yyyy-MM-dd');
        const prevEnd = format(subDays(end, diff), 'yyyy-MM-dd');

        // Fetch current period
        const plans = await getLogisticPlans(globalDateRange.startDate, globalDateRange.endDate);
        const hours = await getHourRecords(globalDateRange.startDate, globalDateRange.endDate);
        
        // Fetch previous period for comparisons
        const prevPlans = await getLogisticPlans(prevStart, prevEnd);
        const prevHours = await getHourRecords(prevStart, prevEnd);

        // Filter plans by valid processes and not cancelled
        const filterPlans = (planList: PlanRecord[]) => planList.filter(p => validProcesses.includes(p.linea) && p.status !== 'cancelled');
        
        const currentPlansFiltered = filterPlans(plans);
        const prevPlansFiltered = filterPlans(prevPlans);

        const currentPlanIds = currentPlansFiltered.map(p => p.id_plan);
        const prevPlanIds = prevPlansFiltered.map(p => p.id_plan);

        const currentHoursFiltered = hours.filter(h => currentPlanIds.includes(h.plan_id!));
        const prevHoursFiltered = prevHours.filter(h => prevPlanIds.includes(h.plan_id!));

        const calculateKPIs = (hoursList: HourRecord[]) => {
          let target = 0, ok = 0, scrap = 0, dt = 0;
          hoursList.forEach(h => {
            target += h.target;
            ok += h.actualOK;
            scrap += h.scrap;
            dt += h.downtime;
          });
          const scheduledMin = hoursList.length * 60;
          const uptime = Math.max(0, scheduledMin - dt);
          
          const availability = scheduledMin > 0 ? (uptime / scheduledMin) * 100 : 0;
          const performance = target > 0 ? Math.min(100, ((ok + scrap) / target) * 100) : 0;
          const totalPieces = ok + scrap;
          const quality = totalPieces > 0 ? (ok / totalPieces) * 100 : 0;
          const oee = (availability / 100) * (performance / 100) * (quality / 100) * 100;

          return { oee, availability, performance, quality, downtime: dt, scrap, totalTarget: target, totalOK: ok };
        };

        const currKpi = calculateKPIs(currentHoursFiltered);
        const prevKpi = calculateKPIs(prevHoursFiltered);

        if (isMounted) {
          setMetrics(currKpi);
          setPrevMetrics(prevKpi);

          // Store raw data for interactive Hourly Chart
          setRawChartPlans(currentPlansFiltered);
          setRawChartHours(currentHoursFiltered);

          // Calculate active processes and shifts (those with data)
          const procSet = new Set<string>();
          const shiftSet = new Set<string>();
          currentPlansFiltered.forEach(p => {
             if (currentHoursFiltered.some(h => h.plan_id === p.id_plan)) {
                 procSet.add(p.linea);
                 shiftSet.add(p.turno);
             }
          });
          
          const procs = Array.from(procSet);
          const shifts = Array.from(shiftSet);
          setActiveProcesses(procs);
          setSelectedChartProcesses(procs); // select all by default
          setActiveShifts(shifts);
          setSelectedChartShifts(shifts); // select all by default

          setGlobalLoading(false);
        }
      } catch (err) {
        console.error("Dashboard fetch error", err);
        if (isMounted) setGlobalLoading(false);
      }
    };
    
    fetchData();
    return () => { isMounted = false; };
  }, [globalDateRange, validProcesses]);

  const dailyData = useMemo(() => {
    const dailyMap: Record<string, HourRecord[]> = {};
    rawChartPlans.forEach(p => {
       if (selectedChartProcesses.includes(p.linea) && selectedChartShifts.includes(p.turno)) {
          const planHours = rawChartHours.filter(h => h.plan_id === p.id_plan);
          if (!dailyMap[p.fecha]) dailyMap[p.fecha] = [];
          dailyMap[p.fecha].push(...planHours);
       }
    });

    const calculateKPIs = (hoursList: HourRecord[]) => {
      let target = 0, ok = 0, scrap = 0, dt = 0;
      hoursList.forEach(h => {
        target += h.target;
        ok += h.actualOK;
        scrap += h.scrap;
        dt += h.downtime;
      });
      const scheduledMin = hoursList.length * 60;
      const uptime = Math.max(0, scheduledMin - dt);
      
      const availability = scheduledMin > 0 ? (uptime / scheduledMin) * 100 : 0;
      const performance = target > 0 ? Math.min(100, ((ok + scrap) / target) * 100) : 0;
      const totalPieces = ok + scrap;
      const quality = totalPieces > 0 ? (ok / totalPieces) * 100 : 0;
      const oee = (availability / 100) * (performance / 100) * (quality / 100) * 100;

      return { oee, availability, performance, quality };
    };

    return Object.keys(dailyMap).sort().map(date => {
      const k = calculateKPIs(dailyMap[date]);
      return {
        date: format(parseISO(date), 'MMM dd'),
        OEE: parseFloat(k.oee.toFixed(1)),
        Eficiencia: parseFloat(k.performance.toFixed(1)),
        Calidad: parseFloat(k.quality.toFixed(1)),
        Disponibilidad: parseFloat(k.availability.toFixed(1))
      };
    });
  }, [rawChartPlans, rawChartHours, selectedChartProcesses, selectedChartShifts]);

  // Dynamically compute the hourly data based on selected processes and shifts
  const hourlyData = useMemo(() => {
    const map: Record<number, { ok: number, scrap: number, target: number }> = {};
    for (let i = 1; i <= 24; i++) map[i] = { ok: 0, scrap: 0, target: 0 };
    
    rawChartHours.forEach(h => {
       const plan = rawChartPlans.find(p => p.id_plan === h.plan_id);
       if (plan && selectedChartProcesses.includes(plan.linea) && selectedChartShifts.includes(plan.turno)) {
          map[h.hour].ok += h.actualOK;
          map[h.hour].scrap += h.scrap;
          map[h.hour].target += h.target;
       }
    });

    return Object.keys(map).map(hr => ({
      hour: `H${hr}`,
      OK: map[parseInt(hr)].ok,
      Scrap: map[parseInt(hr)].scrap,
      Target: map[parseInt(hr)].target
    })).filter(h => h.Target > 0 || h.OK > 0 || h.Scrap > 0);
  }, [rawChartPlans, rawChartHours, selectedChartProcesses, selectedChartShifts]);

  // Dynamically compute daily data for the bar chart if range > 1 day
  const dailyBarData = useMemo(() => {
    const map: Record<string, { ok: number, scrap: number, target: number }> = {};
    
    rawChartHours.forEach(h => {
       const plan = rawChartPlans.find(p => p.id_plan === h.plan_id);
       if (plan && selectedChartProcesses.includes(plan.linea) && selectedChartShifts.includes(plan.turno)) {
          if (!map[plan.fecha]) map[plan.fecha] = { ok: 0, scrap: 0, target: 0 };
          map[plan.fecha].ok += h.actualOK;
          map[plan.fecha].scrap += h.scrap;
          map[plan.fecha].target += h.target;
       }
    });

    return Object.keys(map).sort().map(date => ({
      label: format(parseISO(date), 'MMM dd'),
      OK: map[date].ok,
      Scrap: map[date].scrap,
      Target: map[date].target
    }));
  }, [rawChartPlans, rawChartHours, selectedChartProcesses, selectedChartShifts]);

  const heatmapData = useMemo(() => {
    const dateMap: Record<string, Record<number, any>> = {};

    // Pre-fill planned stops
    rawChartPlans.forEach(plan => {
       if (selectedChartProcesses.includes(plan.linea) && selectedChartShifts.includes(plan.turno)) {
          if (plan.target_hr === 0) {
              const startHourStr = plan.slot.start.split(':')[0];
              const endHourStr = plan.slot.end.split(':')[0];
              const startHour = parseInt(startHourStr, 10);
              let endHour = parseInt(endHourStr, 10);
              
              if (endHour <= startHour) endHour += 24;
              
              for (let h = 0; h < (endHour - startHour); h++) {
                 let calculatedDate = plan.fecha;
                 if (startHour + h >= 24) {
                    const d = new Date(`${plan.fecha}T00:00:00Z`);
                    d.setUTCDate(d.getUTCDate() + 1);
                    calculatedDate = d.toISOString().split('T')[0];
                 }
                 
                 const absoluteHour = (startHour + h) % 24;
                 
                 if (!dateMap[calculatedDate]) {
                    dateMap[calculatedDate] = {};
                    for (let i = 0; i < 24; i++) {
                       dateMap[calculatedDate][i] = { target: 0, ok: 0, scrap: 0, downtime: 0, plannedDowntime: 0, hasData: false, isPlannedStop: false, sku: new Set<string>() };
                    }
                 }
                 
                 dateMap[calculatedDate][absoluteHour].isPlannedStop = true;
                 dateMap[calculatedDate][absoluteHour].hasData = true; 
                 dateMap[calculatedDate][absoluteHour].sku.add(plan.sku);
              }
          }
       }
    });
    
    rawChartHours.forEach(h => {
       const plan = rawChartPlans.find(p => p.id_plan === h.plan_id);
       if (plan && selectedChartProcesses.includes(plan.linea) && selectedChartShifts.includes(plan.turno)) {
          const startHourStr = plan.slot.start.split(':')[0];
          const startHour = parseInt(startHourStr, 10);
          const absoluteHour = (startHour + (h.hour - 1)) % 24;
          
          let calculatedDate = plan.fecha;
          if (startHour + (h.hour - 1) >= 24) {
             const d = new Date(`${plan.fecha}T00:00:00Z`);
             d.setUTCDate(d.getUTCDate() + 1);
             calculatedDate = d.toISOString().split('T')[0];
          }
          
          const date = h.record_date || calculatedDate;

          if (!dateMap[date]) {
             dateMap[date] = {};
             for (let i = 0; i < 24; i++) {
                dateMap[date][i] = { target: 0, ok: 0, scrap: 0, downtime: 0, plannedDowntime: 0, hasData: false, isPlannedStop: false, sku: new Set<string>() };
             }
          }
          
          dateMap[date][absoluteHour].target += h.target;
          dateMap[date][absoluteHour].ok += h.actualOK;
          dateMap[date][absoluteHour].scrap += h.scrap;
          dateMap[date][absoluteHour].downtime += h.downtime;
          dateMap[date][absoluteHour].plannedDowntime += (h.plannedDowntime || 0);
          dateMap[date][absoluteHour].hasData = true;
          dateMap[date][absoluteHour].sku.add(plan.sku);
       }
    });

    const timelineDays = Object.keys(dateMap).sort().map(dateStr => {
      const dayMap = dateMap[dateStr];
      const hours = Object.keys(dayMap).map(hr => {
        const d = dayMap[parseInt(hr)];
        
        // Calculate KPIs for this hour block
        const uptime = Math.max(0, 60 - d.downtime);
        const availability = (uptime / 60) * 100;
        const totalPieces = d.ok + d.scrap;
        const performance = d.target > 0 ? Math.min(100, (totalPieces / d.target) * 100) : 0;
        const quality = totalPieces > 0 ? (d.ok / totalPieces) * 100 : 0;
        const oee = (availability / 100) * (performance / 100) * (quality / 100) * 100;

        return {
          hour: parseInt(hr),
          target: d.target,
          actualOK: d.ok,
          scrap: d.scrap,
          downtime: d.downtime,
          plannedDowntime: d.plannedDowntime,
          hasData: d.hasData,
          isPlannedStop: d.isPlannedStop,
          sku: Array.from(d.sku).join(', '),
          kpis: { oee, availability, performance, quality }
        };
      });
      const shortDate = format(parseISO(dateStr), 'MMM dd');
      return { date: shortDate, fullDate: dateStr, hours };
    });

    return timelineDays;
  }, [rawChartPlans, rawChartHours, selectedChartProcesses, selectedChartShifts]);

  const calcTrend = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  const trendText = t('dashboard.vs_prior', { days: differenceInDays(parseISO(globalDateRange.endDate), parseISO(globalDateRange.startDate)) + 1 });
  
  const isMultiDay = differenceInDays(parseISO(globalDateRange.endDate), parseISO(globalDateRange.startDate)) > 0;

  // Custom Tooltip Styles for Recharts
  const tooltipStyle = {
    backgroundColor: 'var(--gv-surface)',
    border: '1px solid var(--gv-border)',
    borderRadius: '8px',
    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
    color: 'var(--gv-text-heading)',
    padding: '12px'
  };

  const CustomDailyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const oee = data.OEE || 0;
      const efficiency = data.Eficiencia || 0;
      const quality = data.Calidad || 0;
      const availability = data.Disponibilidad || 0;

      const getKpiColor = (val: number) => {
        if (val >= 90) return "#10b981";
        if (val >= 75) return "#f59e0b";
        return "#ef4444";
      };

      return (
        <div style={{
          ...tooltipStyle,
          padding: '16px',
          width: 240,
        }}>
          {/* Header */}
          <div className="flex justify-between items-center mb-3 pb-2 border-b" style={{ borderColor: "var(--gv-border)" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--gv-text-heading)", textTransform: "uppercase" }}>
              {label}
            </span>
          </div>
          
          {/* KPIs Grid */}
          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gv-text-muted)", textTransform: "uppercase" }}>{t('dashboard.performance')}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: getKpiColor(efficiency) }}>{efficiency.toFixed(1)}%</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gv-text-muted)", textTransform: "uppercase" }}>{t('dashboard.availability')}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: getKpiColor(availability) }}>{availability.toFixed(1)}%</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gv-text-muted)", textTransform: "uppercase" }}>{t('dashboard.quality')}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: getKpiColor(quality) }}>{quality.toFixed(1)}%</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gv-text-muted)", textTransform: "uppercase" }}>{t('dashboard.kpi_oee')}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: getKpiColor(oee) }}>{oee.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        width: '100%',
        maxWidth: 1500,
        margin: '0 auto',
        padding: '40px 60px 100px 60px',
        display: 'flex',
        flexDirection: 'column',
        gap: '48px'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-5 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
              <Activity size={28} />
            </div>
            <h1 style={{ fontSize: 48, fontWeight: 800, color: 'var(--gv-text-heading)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {t('dashboard.executive_scorecard')}
            </h1>
          </div>
          <p style={{ fontSize: 18, fontWeight: 500, color: 'var(--gv-text-muted)', marginLeft: 76 }}>
            {filters.location} › {filters.businessUnit} • {t('dashboard.active_lines', { count: validProcesses.length })}
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <ModernKPICard 
          title={t('dashboard.kpi_oee')} value={metrics.oee.toFixed(1)} unit="%" 
          trend={metrics.oee - prevMetrics.oee} trendLabel={trendText}
          icon={<BarChart3 size={28} />} color="#3b82f6" delay={0.1}
        />
        <ModernKPICard 
          title={t('dashboard.availability')} value={metrics.availability.toFixed(1)} unit="%" 
          trend={metrics.availability - prevMetrics.availability} trendLabel={trendText}
          icon={<Clock size={28} />} color="#10b981" delay={0.2}
        />
        <ModernKPICard 
          title={t('dashboard.performance')} value={metrics.performance.toFixed(1)} unit="%" 
          trend={metrics.performance - prevMetrics.performance} trendLabel={trendText}
          icon={<Activity size={28} />} color="#f59e0b" delay={0.3}
        />
        <ModernKPICard 
          title={t('dashboard.quality')} value={metrics.quality.toFixed(1)} unit="%" 
          trend={metrics.quality - prevMetrics.quality} trendLabel={trendText}
          icon={<CheckCircle size={28} />} color="#8b5cf6" delay={0.4}
        />
        <ModernKPICard 
          title={t('dashboard.downtime_total')} value={metrics.downtime} unit="min" 
          trend={calcTrend(metrics.downtime, prevMetrics.downtime)} trendLabel={trendText}
          icon={<AlertTriangle size={28} />} color="#ef4444" delay={0.5}
        />
        <ModernKPICard 
          title={t('dashboard.scrap_total')} value={metrics.scrap} unit={t('hourByHour.pcs')} 
          trend={calcTrend(metrics.scrap, prevMetrics.scrap)} trendLabel={trendText}
          icon={<PackageX size={28} />} color="#f43f5e" delay={0.6}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Interactive Process Selector for both charts */}
        {activeProcesses.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.65 }} 
            className="glass-card flex items-center justify-between flex-wrap gap-4"
            style={{ padding: '24px 40px', background: 'var(--gv-surface)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Activity size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--gv-text-heading)', margin: 0, lineHeight: 1.2 }}>
                  Filtros de Gráficos
                </h3>
                <p style={{ fontSize: 13, color: 'var(--gv-text-muted)', margin: 0, marginTop: 4 }}>
                  Selecciona los procesos para visualizar
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Process Selectors */}
              {activeProcesses.map(proc => {
                const isSelected = selectedChartProcesses.includes(proc);
                return (
                  <button
                    key={proc}
                    onClick={() => {
                      if (isSelected && selectedChartProcesses.length > 1) {
                        setSelectedChartProcesses(prev => prev.filter(p => p !== proc));
                      } else if (!isSelected) {
                        setSelectedChartProcesses(prev => [...prev, proc]);
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 20,
                      border: `1px solid ${isSelected ? '#3b82f6' : 'var(--gv-border)'}`,
                      background: isSelected ? 'rgba(59,130,246,0.1)' : 'transparent',
                      color: isSelected ? '#3b82f6' : 'var(--gv-text-muted)',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                    title={isSelected ? 'Ocultar proceso' : 'Mostrar proceso'}
                  >
                    {proc}
                  </button>
                )
              })}

              {/* Divider */}
              {activeProcesses.length > 0 && activeShifts.length > 0 && (
                <div style={{ width: 1, height: 24, background: 'var(--gv-border)', margin: '0 8px' }} />
              )}

              {/* Shift Selectors */}
              {activeShifts.map(shift => {
                const isSelected = selectedChartShifts.includes(shift);
                return (
                  <button
                    key={shift}
                    onClick={() => {
                      if (isSelected && selectedChartShifts.length > 1) {
                        setSelectedChartShifts(prev => prev.filter(p => p !== shift));
                      } else if (!isSelected) {
                        setSelectedChartShifts(prev => [...prev, shift]);
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 20,
                      border: `1px solid ${isSelected ? '#8b5cf6' : 'var(--gv-border)'}`,
                      background: isSelected ? 'rgba(139,92,246,0.1)' : 'transparent',
                      color: isSelected ? '#8b5cf6' : 'var(--gv-text-muted)',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                    title={isSelected ? 'Ocultar turno' : 'Mostrar turno'}
                  >
                    {shift}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Trend Timeline */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.7 }} 
          className="glass-card"
          style={{ padding: '40px', background: 'var(--gv-surface)', display: 'flex', flexDirection: 'column', gap: '32px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <TrendingUp size={28} color="#3b82f6" />
            <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gv-text-heading)', margin: 0, letterSpacing: '-0.02em' }}>
              Tendencia Diaria de OEE
            </h3>
          </div>
          {dailyData.length > 0 ? (
            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 35, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gv-border)" />
                  <XAxis dataKey="date" stroke="var(--gv-text-muted)" fontSize={18} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="var(--gv-text-muted)" fontSize={18} tickLine={false} axisLine={false} domain={[0, 100]} dx={-10} />
                  <Tooltip content={<CustomDailyTooltip />} cursor={{ fill: 'var(--gv-surface-alt)', opacity: 0.4 }} />
                  
                  <Bar dataKey="OEE" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    <LabelList dataKey="OEE" position="top" formatter={(val: number) => `${val}%`} fill="var(--gv-text-heading)" fontSize={14} fontWeight={600} />
                    {dailyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.OEE >= 85 ? '#10b981' : entry.OEE >= 75 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                  <ReferenceLine y={85} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'Target 85%', fill: '#f59e0b', fontSize: 18, fontWeight: 'bold', style: { filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.3))' } }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', color: 'var(--gv-text-muted)', fontStyle: 'italic' }}>
              {t('dashboard.no_data_selected_range')}
            </div>
          )}
        </motion.div>

        {/* OEE Heatmap */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.75 }} 
          className="glass-card"
          style={{ padding: '40px', background: 'var(--gv-surface)', display: 'flex', flexDirection: 'column', gap: '32px' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Clock size={28} color="#10b981" />
              <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gv-text-heading)', margin: 0, letterSpacing: '-0.02em' }}>
                Mapa de calor de OEE - Hora por hora
              </h3>
            </div>
          </div>
          
          <Day24hTimeline days={heatmapData} />
        </motion.div>

        {/* Hourly Summary (Hidden by user request) */}
        {false && (
          <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.8 }} 
          className="glass-card"
          style={{ padding: '40px', background: 'var(--gv-surface)', display: 'flex', flexDirection: 'column', gap: '32px' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Clock size={28} color="#f59e0b" />
              <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gv-text-heading)', margin: 0, letterSpacing: '-0.02em' }}>
                {isMultiDay ? "Resumen Diario (OK pcs vs Target)" : t('dashboard.hourly_summary_title')}
              </h3>
            </div>
          </div>
          {(isMultiDay ? dailyBarData : hourlyData).length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={isMultiDay ? dailyBarData : hourlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gv-border)" />
                  <XAxis dataKey={isMultiDay ? "label" : "hour"} stroke="var(--gv-text-muted)" fontSize={16} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="var(--gv-text-muted)" fontSize={16} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--gv-surface-alt)', opacity: 0.4 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '18px', paddingTop: '20px' }} />
                  <Bar dataKey="OK" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {(isMultiDay ? dailyBarData : hourlyData).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.OK >= entry.Target && entry.Target > 0 ? '#10b981' : '#3b82f6'} />
                    ))}
                  </Bar>
                  <Bar dataKey="Scrap" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Line type="step" dataKey="Target" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', color: 'var(--gv-text-muted)', fontStyle: 'italic' }}>
              {t('dashboard.no_data_selected_range')}
            </div>
          )}
        </motion.div>
        )}

        {/* Pareto Analysis replacing OEE By Line */}
        <ParetoAnalysis filters={filters} />

      </div>
    </motion.div>
  );
}
