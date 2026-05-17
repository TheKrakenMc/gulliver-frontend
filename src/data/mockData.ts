import type { HourRecord, PDCACard, KPIData, OEELine, PlanRecord } from '../types';

/* ─── Filter Options ─── */
export const filterOptions = {
  locations: ['Planta Puebla', 'Planta Pachuca', 'Planta Saltillo'],
  businessUnits: ['Unidad 1', 'Unidad 2', 'Unidad 3'],
  facilities: ['Nave 1', 'Nave 2', 'Nave 3', 'Nave 4'],
  processes: ['Inner Dash', 'Outer Dash', 'Door Panel', 'Console', 'IP Carrier'],
};

/* ─── KPI Cards ─── */
export const kpiData: KPIData[] = [
  {
    label: 'OEE',
    value: 72.4,
    unit: '%',
    target: 85,
    trend: 'down',
    status: 'critical',
  },
  {
    label: 'MTTR',
    value: 28,
    unit: 'min',
    target: 20,
    trend: 'up',
    status: 'warning',
  },
  {
    label: 'MTBF',
    value: 4.2,
    unit: 'hrs',
    target: 6,
    trend: 'down',
    status: 'warning',
  },
  {
    label: 'Scrap Rate',
    value: 3.8,
    unit: '%',
    target: 2.5,
    trend: 'up',
    status: 'critical',
  },
];

/* ─── OEE by Line ─── */
export const oeeByLine: OEELine[] = [
  { line: 'HMP-1', oee: 88, target: 85 },
  { line: 'HMP-2', oee: 76, target: 85 },
  { line: 'HMP-3', oee: 69, target: 85 },
  { line: 'INJ-1', oee: 91, target: 85 },
  { line: 'INJ-2', oee: 82, target: 85 },
  { line: 'ASM-1', oee: 65, target: 85 },
  { line: 'ASM-2', oee: 78, target: 85 },
  { line: 'PNT-1', oee: 84, target: 85 },
];

/* ─── Hour by Hour Default Records ─── */
export const defaultHourRecords: HourRecord[] = Array.from({ length: 8 }, (_, i) => ({
  hour: i + 1,
  target: 60,
  actualOK: 0,
  scrap: 0,
  downtime: 0,
  comments: '',
  oeeLoss: 0,
}));

/* ─── PDCA Cards ─── */
export const pdcaCards: Record<string, PDCACard[]> = {
  plan: [
    {
      id: 'plan-1',
      title: 'Ajuste de sensor en HMP3',
      description: 'Calibrar sensor de proximidad para reducir paros no programados en línea HMP-3.',
      priority: 'high',
      assignee: 'Ing. García',
      dueDate: '2026-04-20',
    },
    {
      id: 'plan-2',
      title: 'Revisión de material de Inyección',
      description: 'Evaluar cambio de proveedor de resina para reducir defectos de apariencia.',
      priority: 'medium',
      assignee: 'Ing. López',
      dueDate: '2026-04-25',
    },
    {
      id: 'plan-3',
      title: 'Análisis de paros ASM-1',
      description: 'Realizar análisis de causa raíz para los paros recurrentes en la línea de ensamble.',
      priority: 'high',
      assignee: 'Ing. Martínez',
      dueDate: '2026-04-18',
    },
  ],
  do: [
    {
      id: 'do-1',
      title: 'Implementar Poka-Yoke PNT-1',
      description: 'Instalar dispositivo anti-error en estación de pintura para prevenir defectos de tono.',
      priority: 'high',
      assignee: 'Téc. Hernández',
      dueDate: '2026-04-17',
    },
    {
      id: 'do-2',
      title: 'Reemplazo de banda INJ-2',
      description: 'Cambiar banda transportadora desgastada que genera micro-paros.',
      priority: 'medium',
      assignee: 'Téc. Ramírez',
      dueDate: '2026-04-19',
    },
  ],
  check: [
    {
      id: 'check-1',
      title: 'Verificar OEE post-ajuste HMP-1',
      description: 'Monitorear métricas de eficiencia 5 días después del ajuste de velocidad.',
      priority: 'medium',
      assignee: 'Ing. García',
      dueDate: '2026-04-22',
    },
    {
      id: 'check-2',
      title: 'Auditoría visual Console',
      description: 'Revisar estándares de calidad visual en estación de consolas tras cambio de material.',
      priority: 'low',
      assignee: 'QA Torres',
      dueDate: '2026-04-23',
    },
  ],
  act: [
    {
      id: 'act-1',
      title: 'Estandarizar setup en INJ-1',
      description: 'Documentar y replicar nuevo procedimiento de setup rápido (SMED) validado.',
      priority: 'high',
      assignee: 'Ing. López',
      dueDate: '2026-04-24',
    },
    {
      id: 'act-2',
      title: 'Actualizar plan de mantenimiento',
      description: 'Incorporar frecuencias preventivas basadas en datos de MTBF actualizados.',
      priority: 'medium',
      assignee: 'Mtto. Díaz',
      dueDate: '2026-04-26',
    },
  ],
};

/* ─── Plan History Mock Data ─── */
export const mockPlanHistory: PlanRecord[] = [
  {
    id_plan: 'PLAN-HIST-01',
    fecha: new Date().toISOString().split('T')[0],
    planta: filterOptions.facilities[0],
    linea: 'HMP-1',
    turno: 'Matutino',
    slot: { start: '06:00', end: '14:00' },
    sku: 'DASH-INNER-001',
    target_hr: 45,
    creado_por: 'Ing. García',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    status: 'published'
  },
  {
    id_plan: 'PLAN-HIST-02',
    fecha: new Date().toISOString().split('T')[0],
    planta: filterOptions.facilities[0],
    linea: 'HMP-1',
    turno: 'Vespertino',
    slot: { start: '14:00', end: '22:00' },
    sku: 'DASH-OUTER-002',
    target_hr: 40,
    creado_por: 'Ing. López',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    status: 'draft'
  },
  {
    id_plan: 'PLAN-HIST-03',
    fecha: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    planta: filterOptions.facilities[0],
    linea: 'INJ-1',
    turno: '12x12_Dia',
    slot: { start: '06:00', end: '18:00' },
    sku: 'CONSOLE-004',
    target_hr: 60,
    creado_por: 'Ing. Martínez',
    created_at: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    status: 'published'
  },
  {
    id_plan: 'PLAN-HIST-04',
    fecha: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    planta: filterOptions.facilities[1], // Different facility
    linea: 'ASM-1',
    turno: 'Mixto',
    slot: { start: '09:00', end: '15:00' },
    sku: 'DOOR-PNL-003',
    target_hr: 50,
    creado_por: 'Ing. García',
    created_at: new Date(Date.now() - 86400000 * 1.1).toISOString(),
    status: 'cancelled'
  }
];
