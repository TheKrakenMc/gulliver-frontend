/**
 * paretoEngine.ts — Motor de cálculo Pareto multinivel (4-5 niveles)
 *
 * Procesa datos crudos de faults, scrap y downtime cruzándolos con la
 * jerarquía organizacional para producir niveles de Pareto dinámicos
 * adaptados a cada tipo de análisis (DOWNTIME, MTTR, MTBF, SCRAP).
 *
 * Jerarquías por focus:
 *   DOWNTIME: Planta → Nave → Línea/Máquina → Falla
 *   MTTR    : Planta → Nave → Máquina       → Falla
 *   MTBF    : Planta → Nave → Línea         → Máquina → Falla
 *   SCRAP   : Planta → Nave → Material      → Causa del defecto
 */
import type {
  PlanRecord,
  HourRecord,
  HierarchyLocation,
  BaseMachine,
  BaseMaintenanceFault,
  BaseAssetFault,
} from '../types';

/* ─── Types ─── */
export type AnalysisFocus = 'SCRAP' | 'DOWNTIME' | 'MTTR' | 'MTBF';

export const PARETO_THRESHOLD = 0.80;

export interface ParetoRow {
  label: string;
  value: number;
  relativePercent: number;
  absolutePercent: number;
  isAboveThreshold: boolean;
}

export interface ParetoLevel {
  level: number;
  title: string;       // i18n key
  parentLabel: string;
  rows: ParetoRow[];
  total: number;
  average?: number;     // para MTTR/MTBF — promedio del grupo
  totalLabel?: string;  // i18n key para la fila de total: "total_sum" | "total_avg"
}

export interface ParetoInput {
  faults: any[];
  scrap: any[];
  downtime: any[];
  plans: PlanRecord[];
  hours: HourRecord[];
  machines: BaseMachine[];
  maintenanceFaults?: BaseMaintenanceFault[];
  assetFaults?: BaseAssetFault[];
  hierarchy: HierarchyLocation[];
  focus: AnalysisFocus;
}

/* ─── Level title keys por focus ─── */
// Cada focus define sus propios títulos de nivel (claves i18n)
interface LevelTitles {
  l1: string; // Nivel 1 (Planta)
  l2: string; // Nivel 2 (Nave)
  l3: string; // Nivel 3
  l4: string; // Nivel 4
  l5?: string; // Nivel 5 (solo MTBF)
}

const LEVEL_TITLES: Record<AnalysisFocus, LevelTitles> = {
  DOWNTIME: { l1: 'level_planta', l2: 'level_naves',    l3: 'level_maquinas',       l4: 'level_fallas' },
  MTTR:     { l1: 'level_planta', l2: 'level_naves',    l3: 'level_maquinas',       l4: 'level_fallas' },
  MTBF:     { l1: 'level_planta', l2: 'level_naves',    l3: 'level_linea',          l4: 'level_maquinas', l5: 'level_fallas' },
  SCRAP:    { l1: 'level_planta', l2: 'level_nave',     l3: 'level_material',       l4: 'level_causa_defecto' },
};

// Total label keys por focus y por si es suma o promedio
const TOTAL_LABEL: Record<AnalysisFocus, (level: number) => string> = {
  DOWNTIME: ()    => 'total_sum',
  MTTR:     ()    => 'total_avg',
  MTBF:     (lvl) => lvl <= 2 ? 'total_sum' : 'total_avg',
  SCRAP:    ()    => 'total_sum',
};

/* ─── Internal resolved incident shape ─── */
interface ResolvedIncident {
  planta: string;
  nave: string;
  linea: string;            // nombre del proceso logístico (plan.linea)
  machine: string;          // nombre de la máquina (fault: machine.name, downtime: machine.name si existe)
  material: string;         // tecnologia/SKU (SCRAP solamente)
  detailCode: string;
  detailDescription: string;
  value: number;            // minutos de downtime o cantidad de scrap
  // Para MTBF: uptime en minutos del grupo, para dividir entre conteo
  uptimeMin?: number;
}

/* ─── Helpers ─── */

/** Lookup: hourRecord.id → PlanRecord */
function buildHourToPlanMap(hours: HourRecord[], plans: PlanRecord[]): Map<string, PlanRecord> {
  const planById = new Map<string, PlanRecord>();
  plans.forEach((p) => planById.set(p.id_plan, p));

  const map = new Map<string, PlanRecord>();
  hours.forEach((h) => {
    if (h.id && h.plan_id) {
      const plan = planById.get(h.plan_id);
      if (plan) map.set(h.id, plan);
    }
  });
  return map;
}

/** Lookup: machine.id → BaseMachine */
function buildMachineMap(machines: BaseMachine[]): Map<string, BaseMachine> {
  const map = new Map<string, BaseMachine>();
  machines.forEach((m) => map.set(m.id, m));
  return map;
}

/** Lookup: processName → nave (primer máquina del proceso) */
function buildLineaToNaveMap(machines: BaseMachine[], hierarchy: HierarchyLocation[]): Map<string, string> {
  const processIdToName = new Map<string, string>();
  hierarchy.forEach((loc) => {
    loc.business_units.forEach((bu) => {
      bu.processes.forEach((proc) => {
        processIdToName.set(proc.id, proc.name);
      });
    });
  });

  const map = new Map<string, string>();
  machines.forEach((m) => {
    const pName = processIdToName.get(m.process_id);
    if (pName && !map.has(pName)) {
      map.set(pName, m.nave);
    }
  });
  return map;
}

/** Uptime total (minutos) por plan_id → sumado del plan */
function buildPlanUptimeMap(hours: HourRecord[]): Map<string, number> {
  const map = new Map<string, number>();
  hours.forEach((h) => {
    if (!h.plan_id) return;
    const uptime = Math.max(0, 60 - (h.downtime || 0));
    map.set(h.plan_id, (map.get(h.plan_id) || 0) + uptime);
  });
  return map;
}

/** Convertir raw aggregation map → sorted ParetoRows */
function toSortedParetoRows(aggregation: Map<string, number>): ParetoRow[] {
  const entries = Array.from(aggregation.entries())
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (total === 0) return [];

  let cumulative = 0;
  return entries.map(([label, value]) => {
    const relativePercent = (value / total) * 100;
    cumulative += relativePercent;
    return {
      label,
      value: Math.round(value * 100) / 100,
      relativePercent: Math.round(relativePercent * 10) / 10,
      absolutePercent: Math.round(cumulative * 10) / 10,
      isAboveThreshold: cumulative - relativePercent < PARETO_THRESHOLD * 100,
    };
  });
}

/**
 * Agregación para MTTR: acumula suma y conteo por clave, luego calcula promedio.
 * Retorna ParetoRows con valor = promedio (minutos → horas).
 */
function toSortedParetoRowsMTTR(
  sumMap: Map<string, number>,
  countMap: Map<string, number>,
  toHours: boolean,
): ParetoRow[] {
  const avgMap = new Map<string, number>();
  sumMap.forEach((sum, key) => {
    const count = countMap.get(key) || 1;
    const avg = sum / count;
    avgMap.set(key, toHours ? avg / 60 : avg);
  });
  return toSortedParetoRows(avgMap);
}

/**
 * Agregación para MTBF: MTBF = uptime_total / count_fallas.
 * Retorna ParetoRows con valor = MTBF en horas.
 */
function toSortedParetoRowsMTBF(
  uptimeMap: Map<string, number>,   // uptime total en minutos por key
  countMap: Map<string, number>,    // conteo de fallas por key
): ParetoRow[] {
  const mtbfMap = new Map<string, number>();
  countMap.forEach((count, key) => {
    const uptime = uptimeMap.get(key) || 0;
    const mtbfHrs = count > 0 ? (uptime / 60) / count : 0;
    mtbfMap.set(key, mtbfHrs);
  });
  return toSortedParetoRows(mtbfMap);
}

function totalFromRows(rows: ParetoRow[]): number {
  return rows.reduce((s, r) => s + r.value, 0);
}

function averageFromRows(rows: ParetoRow[]): number {
  if (rows.length === 0) return 0;
  return totalFromRows(rows) / rows.length;
}

function qualifyingLabels(rows: ParetoRow[]): string[] {
  return rows.filter((r) => r.isAboveThreshold).map((r) => r.label);
}

/* ─── Incident Resolvers ─── */

function resolveFaults(
  faults: any[],
  hourToPlan: Map<string, PlanRecord>,
  machineMap: Map<string, BaseMachine>,
  lineaToNave: Map<string, string>,
  planUptimeMap: Map<string, number>,
  faultCodeToDesc: Map<string, string>,
): ResolvedIncident[] {
  return faults
    .map((f) => {
      const plan = f.hour_record_id ? hourToPlan.get(f.hour_record_id) : null;
      const machine = f.machine_id ? machineMap.get(f.machine_id) : null;
      if (!plan) return null;

      const nave = machine?.nave || lineaToNave.get(plan.linea) || 'Sin nave';
      
      // Use machine code + name if available, otherwise linea.
      const machineName = machine ? `[${machine.code}] ${machine.name}` : plan.linea;
      
      const uptimeMin = plan.id_plan ? (planUptimeMap.get(plan.id_plan) || 0) : 0;
      
      // Map the fault_code to the description if we have it in the catalog.
      const rawFaultCode = f.fault_code || 'UNKNOWN';
      const faultCodeKey = rawFaultCode.trim().toUpperCase();
      const faultDesc = faultCodeToDesc.get(faultCodeKey) || rawFaultCode || 'Sin descripción';

      return {
        planta: plan.planta,
        nave,
        linea: plan.linea,
        machine: machineName,
        material: '',
        detailCode: rawFaultCode,
        detailDescription: faultDesc,
        value: f.downtime_min || 0,
        uptimeMin,
      };
    })
    .filter(Boolean) as ResolvedIncident[];
}

function resolveScrap(
  scrap: any[],
  hourToPlan: Map<string, PlanRecord>,
  machines: BaseMachine[],
): ResolvedIncident[] {
  const processIdToNave = new Map<string, string>();
  machines.forEach((m) => {
    if (!processIdToNave.has(m.process_id)) {
      processIdToNave.set(m.process_id, m.nave);
    }
  });

  return scrap
    .map((s) => {
      const plan = s.hour_record_id ? hourToPlan.get(s.hour_record_id) : null;
      if (!plan) return null;

      const nave = s.process_id
        ? processIdToNave.get(s.process_id) || 'Sin nave'
        : 'Sin nave';

      // material = tecnologia (SKU del material) — Level 3 para SCRAP
      const material = s.tecnologia || s.sku || plan.sku || 'Sin tecnología';

      return {
        planta: plan.planta,
        nave,
        linea: plan.linea,
        machine: plan.linea, // no aplica para SCRAP
        material,
        detailCode: s.codigo_defecto || 'UNKNOWN',
        detailDescription: s.defecto || s.codigo_defecto || 'Sin descripción',
        value: s.cantidad || 0,
        uptimeMin: 0,
      };
    })
    .filter(Boolean) as ResolvedIncident[];
}

function resolveDowntime(
  downtime: any[],
  hourToPlan: Map<string, PlanRecord>,
  machines: BaseMachine[],
  lineaToNave: Map<string, string>,
): ResolvedIncident[] {
  // Para downtime, el machine_id no existe directamente.
  // Usamos la línea del plan como agrupador principal (Nivel 3).
  // Si el reason menciona un código de máquina que coincide con el código
  // de una máquina del catálogo, lo usamos; de lo contrario, usamos la línea.
  const codeToMachine = new Map<string, BaseMachine>();
  machines.forEach((m) => {
    if (m.code) codeToMachine.set(m.code.toUpperCase(), m);
  });

  return downtime
    .map((dt) => {
      const plan = dt.hour_record_id ? hourToPlan.get(dt.hour_record_id) : null;
      if (!plan) return null;

      const nave = lineaToNave.get(plan.linea) || 'Sin nave';

      // Intentar detectar si el reason contiene un código de máquina
      const rawReason = (dt.reason || '').trim();
      let machineName = plan.linea; // default: nombre del proceso

      // Verificar si algún código de máquina aparece en el reason
      for (const [code, machine] of codeToMachine) {
        if (rawReason.toUpperCase().includes(code)) {
          machineName = machine.name || machine.code;
          break;
        }
      }

      // Eliminar el prefijo de código [CODIGO] del reason para mostrar solo la descripción
      // Patrón: "[CODIGO-123] Descripción" → "Descripción"
      const reason = rawReason.replace(/^\[[\w\-]+\]\s*/i, '').trim() || rawReason || 'Sin razón especificada';

      return {
        planta: plan.planta,
        nave,
        linea: plan.linea,
        machine: machineName,
        material: '',
        detailCode: rawReason || 'OTHER',
        detailDescription: reason,
        value: dt.duration_min || 0,
        uptimeMin: 0,
      };
    })
    .filter(Boolean) as ResolvedIncident[];
}

/* ─── Main Pareto Computation ─── */

export function computePareto(input: ParetoInput): ParetoLevel[] {
  const { faults, scrap, downtime, plans, hours, machines, maintenanceFaults, assetFaults, hierarchy, focus } = input;

  const hourToPlan = buildHourToPlanMap(hours, plans);
  const machineMap = buildMachineMap(machines);
  const lineaToNave = buildLineaToNaveMap(machines, hierarchy);
  const planUptimeMap = buildPlanUptimeMap(hours);
  
  const faultCodeToDesc = new Map<string, string>();
  if (maintenanceFaults) {
    maintenanceFaults.forEach(mf => faultCodeToDesc.set(mf.code.trim().toUpperCase(), mf.description));
  }
  if (assetFaults) {
    assetFaults.forEach(af => faultCodeToDesc.set(af.code.trim().toUpperCase(), af.description));
  }

  const titles = LEVEL_TITLES[focus];
  const levels: ParetoLevel[] = [];

  /* ══════════════════════════════════════════════
     SCRAP — 4 niveles: Planta → Nave → Material → Causa
  ══════════════════════════════════════════════ */
  if (focus === 'SCRAP') {
    const incidents = resolveScrap(scrap, hourToPlan, machines);
    if (incidents.length === 0) return [];

    // Nivel 1 — Planta
    const l1 = aggregate(incidents, 'planta');
    const l1Rows = toSortedParetoRows(l1);
    if (l1Rows.length === 0) return [];
    levels.push({
      level: 1,
      title: titles.l1,
      parentLabel: '',
      rows: l1Rows,
      total: totalFromRows(l1Rows),
      totalLabel: TOTAL_LABEL[focus](1),
    });

    const qualPlantas = qualifyingLabels(l1Rows);

    // Nivel 2 — Nave
    qualPlantas.forEach((planta) => {
      const sub = incidents.filter((i) => i.planta === planta);
      const rows = toSortedParetoRows(aggregate(sub, 'nave'));
      if (rows.length > 0) {
        levels.push({
          level: 2,
          title: titles.l2,
          parentLabel: planta,
          rows,
          total: totalFromRows(rows),
          totalLabel: TOTAL_LABEL[focus](2),
        });
      }
    });

    // Nivel 3 — Material
    const qualNaves = collectQualified(levels, 2);
    qualNaves.forEach(({ planta, nave }) => {
      const sub = incidents.filter((i) => i.planta === planta && i.nave === nave);
      const rows = toSortedParetoRows(aggregate(sub, 'material'));
      if (rows.length > 0) {
        levels.push({
          level: 3,
          title: titles.l3,
          parentLabel: nave,
          rows,
          total: totalFromRows(rows),
          totalLabel: TOTAL_LABEL[focus](3),
        });
      }
    });

    // Nivel 4 — Causa del defecto
    const qualMaterials = collectQualifiedFromLevel(levels, 3);
    qualMaterials.forEach(({ parentLabel: nave, label: material }) => {
      const ctx = qualNaves.find((q) => q.nave === nave);
      if (!ctx) return;
      const sub = incidents.filter(
        (i) => i.planta === ctx.planta && i.nave === nave && i.material === material,
      );
      const rows = toSortedParetoRows(aggregate(sub, 'detailDescription'));
      if (rows.length > 0) {
        levels.push({
          level: 4,
          title: titles.l4,
          parentLabel: material,
          rows,
          total: totalFromRows(rows),
          totalLabel: TOTAL_LABEL[focus](4),
        });
      }
    });

    return levels;
  }

  /* ══════════════════════════════════════════════
     DOWNTIME — 4 niveles: Planta → Nave → Línea → Falla
  ══════════════════════════════════════════════ */
  if (focus === 'DOWNTIME') {
    const dtIncidents = resolveDowntime(downtime, hourToPlan, machines, lineaToNave);
    const faultIncidents = resolveFaults(faults, hourToPlan, machineMap, lineaToNave, planUptimeMap, faultCodeToDesc);
    const incidents = [...dtIncidents, ...faultIncidents];
    if (incidents.length === 0) return [];

    // Nivel 1 — Planta (suma minutos)
    const l1Rows = toSortedParetoRows(aggregate(incidents, 'planta'));
    if (l1Rows.length === 0) return [];
    levels.push({
      level: 1,
      title: titles.l1,
      parentLabel: '',
      rows: l1Rows,
      total: totalFromRows(l1Rows),
      totalLabel: 'total_sum',
    });

    const qualPlantas = qualifyingLabels(l1Rows);

    // Nivel 2 — Nave
    qualPlantas.forEach((planta) => {
      const sub = incidents.filter((i) => i.planta === planta);
      const rows = toSortedParetoRows(aggregate(sub, 'nave'));
      if (rows.length > 0) {
        levels.push({
          level: 2,
          title: titles.l2,
          parentLabel: planta,
          rows,
          total: totalFromRows(rows),
          totalLabel: 'total_sum',
        });
      }
    });

    // Nivel 3 — Línea/Máquina (machine como agrupador de "quién causó el DT")
    const qualNaves = collectQualified(levels, 2);
    qualNaves.forEach(({ planta, nave }) => {
      const sub = incidents.filter((i) => i.planta === planta && i.nave === nave);
      const rows = toSortedParetoRows(aggregate(sub, 'machine'));
      if (rows.length > 0) {
        levels.push({
          level: 3,
          title: titles.l3,
          parentLabel: nave,
          rows,
          total: totalFromRows(rows),
          totalLabel: 'total_sum',
        });
      }
    });

    // Nivel 4 — Falla/Causa
    const qualLines = collectQualifiedFromLevel(levels, 3);
    qualLines.forEach(({ parentLabel: nave, label: machine }) => {
      const ctx = qualNaves.find((q) => q.nave === nave);
      if (!ctx) return;
      const sub = incidents.filter(
        (i) => i.planta === ctx.planta && i.nave === nave && i.machine === machine,
      );
      const rows = toSortedParetoRows(aggregate(sub, 'detailDescription'));
      if (rows.length > 0) {
        levels.push({
          level: 4,
          title: titles.l4,
          parentLabel: machine,
          rows,
          total: totalFromRows(rows),
          totalLabel: 'total_sum',
        });
      }
    });

    return levels;
  }

  /* ══════════════════════════════════════════════
     MTTR — 4 niveles: Planta → Nave → Máquina → Falla
     Valor = promedio (sum_downtime / count_faults), en horas
  ══════════════════════════════════════════════ */
  if (focus === 'MTTR') {
    const incidents = resolveFaults(faults, hourToPlan, machineMap, lineaToNave, planUptimeMap, faultCodeToDesc);
    if (incidents.length === 0) return [];

    // Nivel 1 — Planta (promedio MTTR)
    const { sumMap: l1Sum, cntMap: l1Cnt } = aggregateSumCount(incidents, 'planta');
    const l1Rows = toSortedParetoRowsMTTR(l1Sum, l1Cnt, true);
    if (l1Rows.length === 0) return [];
    levels.push({
      level: 1,
      title: titles.l1,
      parentLabel: '',
      rows: l1Rows,
      total: totalFromRows(l1Rows),
      average: averageFromRows(l1Rows),
      totalLabel: 'total_avg',
    });

    const qualPlantas = qualifyingLabels(l1Rows);

    // Nivel 2 — Nave
    qualPlantas.forEach((planta) => {
      const sub = incidents.filter((i) => i.planta === planta);
      const { sumMap, cntMap } = aggregateSumCount(sub, 'nave');
      const rows = toSortedParetoRowsMTTR(sumMap, cntMap, true);
      if (rows.length > 0) {
        levels.push({
          level: 2,
          title: titles.l2,
          parentLabel: planta,
          rows,
          total: totalFromRows(rows),
          average: averageFromRows(rows),
          totalLabel: 'total_avg',
        });
      }
    });

    // Nivel 3 — Máquina
    const qualNaves = collectQualified(levels, 2);
    qualNaves.forEach(({ planta, nave }) => {
      const sub = incidents.filter((i) => i.planta === planta && i.nave === nave);
      const { sumMap, cntMap } = aggregateSumCount(sub, 'machine');
      const rows = toSortedParetoRowsMTTR(sumMap, cntMap, true);
      if (rows.length > 0) {
        levels.push({
          level: 3,
          title: titles.l3,
          parentLabel: nave,
          rows,
          total: totalFromRows(rows),
          average: averageFromRows(rows),
          totalLabel: 'total_avg',
        });
      }
    });

    // Nivel 4 — Falla
    const qualMachines = collectQualifiedFromLevel(levels, 3);
    qualMachines.forEach(({ parentLabel: nave, label: machine }) => {
      const ctx = qualNaves.find((q) => q.nave === nave);
      if (!ctx) return;
      const sub = incidents.filter(
        (i) => i.planta === ctx.planta && i.nave === nave && i.machine === machine,
      );
      const { sumMap, cntMap } = aggregateSumCount(sub, 'detailDescription');
      const rows = toSortedParetoRowsMTTR(sumMap, cntMap, true);
      if (rows.length > 0) {
        levels.push({
          level: 4,
          title: titles.l4,
          parentLabel: machine,
          rows,
          total: totalFromRows(rows),
          average: averageFromRows(rows),
          totalLabel: 'total_avg',
        });
      }
    });

    return levels;
  }

  /* ══════════════════════════════════════════════
     MTBF — 5 niveles: Planta → Nave → Línea → Máquina → Falla
     Valor = uptime_hrs / count_faults por grupo
  ══════════════════════════════════════════════ */
  if (focus === 'MTBF') {
    const incidents = resolveFaults(faults, hourToPlan, machineMap, lineaToNave, planUptimeMap, faultCodeToDesc);
    if (incidents.length === 0) return [];

    // Para MTBF necesitamos el uptime por cada agrupación.
    // El uptime lo sumamos de los incidentes (cada incidente lleva el uptime de su plan).

    // Nivel 1 — Planta (MTBF hrs)
    const { cntMap: l1Cnt, uptimeMap: l1Up } = aggregateCountUptime(incidents, 'planta');
    const l1Rows = toSortedParetoRowsMTBF(l1Up, l1Cnt);
    if (l1Rows.length === 0) return [];
    levels.push({
      level: 1,
      title: titles.l1,
      parentLabel: '',
      rows: l1Rows,
      total: totalFromRows(l1Rows),
      average: averageFromRows(l1Rows),
      totalLabel: 'total_sum',
    });

    const qualPlantas = qualifyingLabels(l1Rows);

    // Nivel 2 — Nave
    qualPlantas.forEach((planta) => {
      const sub = incidents.filter((i) => i.planta === planta);
      const { cntMap, uptimeMap } = aggregateCountUptime(sub, 'nave');
      const rows = toSortedParetoRowsMTBF(uptimeMap, cntMap);
      if (rows.length > 0) {
        levels.push({
          level: 2,
          title: titles.l2,
          parentLabel: planta,
          rows,
          total: totalFromRows(rows),
          average: averageFromRows(rows),
          totalLabel: 'total_sum',
        });
      }
    });

    // Nivel 3 — Línea
    const qualNaves = collectQualified(levels, 2);
    qualNaves.forEach(({ planta, nave }) => {
      const sub = incidents.filter((i) => i.planta === planta && i.nave === nave);
      const { cntMap, uptimeMap } = aggregateCountUptime(sub, 'linea');
      const rows = toSortedParetoRowsMTBF(uptimeMap, cntMap);
      if (rows.length > 0) {
        levels.push({
          level: 3,
          title: titles.l3,
          parentLabel: nave,
          rows,
          total: totalFromRows(rows),
          average: averageFromRows(rows),
          totalLabel: 'total_avg',
        });
      }
    });

    // Nivel 4 — Máquina
    const qualLines = collectQualifiedFromLevel(levels, 3);
    qualLines.forEach(({ parentLabel: nave, label: linea }) => {
      const ctx = qualNaves.find((q) => q.nave === nave);
      if (!ctx) return;
      const sub = incidents.filter(
        (i) => i.planta === ctx.planta && i.nave === nave && i.linea === linea,
      );
      const { cntMap, uptimeMap } = aggregateCountUptime(sub, 'machine');
      const rows = toSortedParetoRowsMTBF(uptimeMap, cntMap);
      if (rows.length > 0) {
        levels.push({
          level: 4,
          title: titles.l4,
          parentLabel: linea,
          rows,
          total: totalFromRows(rows),
          average: averageFromRows(rows),
          totalLabel: 'total_avg',
        });
      }
    });

    // Nivel 5 — Fallas (en minutos, para contexto)
    const qualMachines = collectQualifiedFromLevel(levels, 4);
    qualMachines.forEach(({ parentLabel: linea, label: machine }) => {
      const ctx2 = qualLines.find((q) => q.label === linea);
      const ctxNave = ctx2 ? qualNaves.find((q) => q.nave === ctx2.parentLabel) : null;
      const sub = incidents.filter(
        (i) => i.machine === machine && i.linea === linea,
      );
      // Nivel 5 muestra suma de downtime en minutos de cada falla
      const l5Agg = new Map<string, number>();
      sub.forEach((inc) => {
        const key = inc.detailDescription;
        l5Agg.set(key, (l5Agg.get(key) || 0) + inc.value);
      });
      const rows = toSortedParetoRows(l5Agg);
      if (rows.length > 0 && titles.l5) {
        levels.push({
          level: 5,
          title: titles.l5,
          parentLabel: machine,
          rows,
          total: totalFromRows(rows),
          totalLabel: 'total_sum',
        });
      }
    });

    return levels;
  }

  return [];
}

/* ─── Internal Aggregation Utilities ─── */

type IncidentKey = keyof ResolvedIncident;

function aggregate(incidents: ResolvedIncident[], key: IncidentKey): Map<string, number> {
  const map = new Map<string, number>();
  incidents.forEach((inc) => {
    const k = String(inc[key] ?? 'UNKNOWN');
    map.set(k, (map.get(k) || 0) + inc.value);
  });
  return map;
}

function aggregateSumCount(
  incidents: ResolvedIncident[],
  key: IncidentKey,
): { sumMap: Map<string, number>; cntMap: Map<string, number> } {
  const sumMap = new Map<string, number>();
  const cntMap = new Map<string, number>();
  incidents.forEach((inc) => {
    const k = String(inc[key] ?? 'UNKNOWN');
    sumMap.set(k, (sumMap.get(k) || 0) + inc.value);
    cntMap.set(k, (cntMap.get(k) || 0) + 1);
  });
  return { sumMap, cntMap };
}

function aggregateCountUptime(
  incidents: ResolvedIncident[],
  key: IncidentKey,
): { cntMap: Map<string, number>; uptimeMap: Map<string, number> } {
  const cntMap = new Map<string, number>();
  const uptimeMap = new Map<string, number>();
  incidents.forEach((inc) => {
    const k = String(inc[key] ?? 'UNKNOWN');
    cntMap.set(k, (cntMap.get(k) || 0) + 1);
    uptimeMap.set(k, (uptimeMap.get(k) || 0) + (inc.uptimeMin || 0));
  });
  return { cntMap, uptimeMap };
}

/**
 * Extrae los pares (planta, nave) que calificaron en el nivel 2.
 */
function collectQualified(
  levels: ParetoLevel[],
  levelNum: number,
): { planta: string; nave: string }[] {
  const result: { planta: string; nave: string }[] = [];
  levels
    .filter((l) => l.level === levelNum)
    .forEach((l) => {
      qualifyingLabels(l.rows).forEach((label) => {
        if (levelNum === 2) {
          result.push({ planta: l.parentLabel, nave: label });
        }
      });
    });
  return result;
}

/**
 * Extrae las filas calificadas de un nivel dado, con su parentLabel.
 */
function collectQualifiedFromLevel(
  levels: ParetoLevel[],
  levelNum: number,
): { parentLabel: string; label: string }[] {
  const result: { parentLabel: string; label: string }[] = [];
  levels
    .filter((l) => l.level === levelNum)
    .forEach((l) => {
      qualifyingLabels(l.rows).forEach((label) => {
        result.push({ parentLabel: l.parentLabel, label });
      });
    });
  return result;
}

/** Get the unit label key for a given focus */
export function getUnitLabelKey(focus: AnalysisFocus): string {
  switch (focus) {
    case 'SCRAP':   return 'unit_count';
    case 'DOWNTIME': return 'unit_minutes';
    case 'MTTR':    return 'unit_hrs';
    case 'MTBF':    return 'unit_hrs';
  }
}
