import type {
  IProduct,
  ITechnology,
  IOperation,
  IProcessVariable,
  IVersionHistoryEntry,
} from '../types/engineering';

/* ─── Technologies ─────────────────────────────────────────────── */
export const mockTechnologies: ITechnology[] = [
  { id: 'TECH-INJ', name: 'Inyección de Plástico', category: 'Transformación', description: 'Proceso de moldeo por inyección termoplástica' },
  { id: 'TECH-HMP', name: 'Hot Melt Pressing', category: 'Ensamble', description: 'Ensamble por presión con adhesivo termofusible' },
  { id: 'TECH-ASM', name: 'Ensamble Manual', category: 'Ensamble', description: 'Operaciones de ensamble manual controlado' },
  { id: 'TECH-PNT', name: 'Pintura UV', category: 'Acabado', description: 'Aplicación de recubrimiento con curado UV' },
  { id: 'TECH-VIB', name: 'Soldadura por Vibración', category: 'Unión', description: 'Unión de termoplásticos por fricción vibratoria' },
];

/* ─── Operations ───────────────────────────────────────────────── */
export const mockOperations: IOperation[] = [
  { id: 'OP-001', sequence: 10, name: 'Inyección de substrato', technologyId: 'TECH-INJ', description: 'Moldeo de substrato PP+EPDM en prensa de 850T' },
  { id: 'OP-002', sequence: 20, name: 'Aplicación adhesivo HMA', technologyId: 'TECH-HMP', description: 'Aplicación de hotmelt Jowat 286.00 a 160°C' },
  { id: 'OP-003', sequence: 30, name: 'Laminado de piel', technologyId: 'TECH-HMP', description: 'Prensado de piel soft-touch sobre substrato' },
  { id: 'OP-004', sequence: 40, name: 'Corte y perfilado', technologyId: 'TECH-ASM', description: 'Recorte de excedentes y perfilado de bordes' },
  { id: 'OP-005', sequence: 50, name: 'Ensamble de clips y retenes', technologyId: 'TECH-ASM', description: 'Instalación de herrajes plásticos de sujeción' },
  { id: 'OP-006', sequence: 60, name: 'Inspección visual 100%', technologyId: 'TECH-ASM', description: 'Control visual bajo estándar CCC-Borramiento' },
  { id: 'OP-007', sequence: 70, name: 'Aplicación de recubrimiento UV', technologyId: 'TECH-PNT', description: 'Pintura clear coat con curado de lámpara 80W/cm²' },
  { id: 'OP-008', sequence: 80, name: 'Soldadura lateral console', technologyId: 'TECH-VIB', description: 'Unión de semipartes de consola por vibración 240Hz' },
];

/* ─── Process Variables ────────────────────────────────────────── */
export const mockProcessVariables: IProcessVariable[] = [
  { id: 'PV-001', name: 'Temperatura de Barril', unit: '°C', nominalValue: 230, toleranceMin: 220, toleranceMax: 245, technologyId: 'TECH-INJ' },
  { id: 'PV-002', name: 'Presión de Inyección', unit: 'bar', nominalValue: 650, toleranceMin: 600, toleranceMax: 700, technologyId: 'TECH-INJ' },
  { id: 'PV-003', name: 'Tiempo de Enfriamiento', unit: 's', nominalValue: 28, toleranceMin: 24, toleranceMax: 35, technologyId: 'TECH-INJ' },
  { id: 'PV-004', name: 'Temperatura HMA', unit: '°C', nominalValue: 160, toleranceMin: 150, toleranceMax: 170, technologyId: 'TECH-HMP' },
  { id: 'PV-005', name: 'Presión de Laminado', unit: 'kN', nominalValue: 80, toleranceMin: 70, toleranceMax: 95, technologyId: 'TECH-HMP' },
  { id: 'PV-006', name: 'Frecuencia de Vibración', unit: 'Hz', nominalValue: 240, toleranceMin: 230, toleranceMax: 250, technologyId: 'TECH-VIB' },
  { id: 'PV-007', name: 'Amplitud de Vibración', unit: 'mm', nominalValue: 0.9, toleranceMin: 0.7, toleranceMax: 1.1, technologyId: 'TECH-VIB' },
  { id: 'PV-008', name: 'Intensidad de Lámpara UV', unit: 'W/cm²', nominalValue: 80, toleranceMin: 72, toleranceMax: 90, technologyId: 'TECH-PNT' },
];

/* ─── Products ─────────────────────────────────────────────────── */
export const mockProducts: IProduct[] = [
  {
    id: 'PRD-001',
    gpn: 'IP-DASH-INNER-00142',
    name: 'Panel Interior Tablero — Volkswagen Jetta A8',
    version: '3.2',
    state: 'Series',
    facility: 'Nave 1',
    specs: {
      dimensions: '1420 × 340 × 58 mm',
      weight: 1.85,
      technologies: ['TECH-INJ', 'TECH-HMP', 'TECH-ASM'],
    },
    performance: { cycleTime: 72, ratePerHour: 48 },
    documentation: [
      {
        id: 'DOC-001-PFMEA', type: 'PFMEA', title: 'PFMEA — IP-DASH-INNER-00142 v3.2',
        url: '/docs/pfmea-001.pdf', version: 5, state: 'Series',
        createdAt: '2025-08-10', updatedAt: '2026-01-15', author: 'Ing. García'
      },
      {
        id: 'DOC-001-CP', type: 'ControlPlan', title: 'Plan de Control — IP-DASH-INNER-00142 v3.2',
        url: '/docs/cp-001.pdf', version: 5, state: 'Series',
        createdAt: '2025-08-10', updatedAt: '2026-01-15', author: 'Ing. Martínez'
      },
      {
        id: 'DOC-001-FC', type: 'Flowchart', title: 'Flowchart — IP-DASH-INNER-00142 v3.2',
        url: '/docs/fc-001.pdf', version: 4, state: 'Series',
        createdAt: '2025-08-10', updatedAt: '2025-12-20', author: 'Ing. García'
      },
      {
        id: 'DOC-001-SS', type: 'SetupSheet', title: 'Process & Setup Sheet — IP-DASH-INNER-00142',
        url: '/docs/ss-001.pdf', version: 3, state: 'Series',
        createdAt: '2025-09-01', updatedAt: '2026-02-01', author: 'Ing. López'
      },
    ],
    createdAt: '2024-03-01', updatedAt: '2026-01-15',
  },
  {
    id: 'PRD-002',
    gpn: 'CONSOLE-CTR-00289',
    name: 'Consola Central — Nissan Kicks 2025',
    version: '1.4',
    state: 'Series',
    facility: 'Nave 2',
    specs: {
      dimensions: '320 × 210 × 145 mm',
      weight: 0.94,
      technologies: ['TECH-INJ', 'TECH-VIB', 'TECH-ASM'],
    },
    performance: { cycleTime: 58, ratePerHour: 60 },
    documentation: [
      {
        id: 'DOC-002-PFMEA', type: 'PFMEA', title: 'PFMEA — CONSOLE-CTR-00289 v1.4',
        url: '/docs/pfmea-002.pdf', version: 2, state: 'Series',
        createdAt: '2025-06-15', updatedAt: '2026-02-20', author: 'Ing. Ramírez'
      },
      {
        id: 'DOC-002-CP', type: 'ControlPlan', title: 'Plan de Control — CONSOLE-CTR-00289 v1.4',
        url: '/docs/cp-002.pdf', version: 2, state: 'Series',
        createdAt: '2025-06-15', updatedAt: '2026-02-20', author: 'Ing. Ramírez'
      },
      {
        id: 'DOC-002-FC', type: 'Flowchart', title: 'Flowchart — CONSOLE-CTR-00289 v1.4',
        url: '/docs/fc-002.pdf', version: 2, state: 'Series',
        createdAt: '2025-06-15', updatedAt: '2026-02-10', author: 'Ing. Torres'
      },
      {
        id: 'DOC-002-SS', type: 'SetupSheet', title: 'Process & Setup Sheet — CONSOLE-CTR-00289',
        url: '/docs/ss-002.pdf', version: 1, state: 'Series',
        createdAt: '2025-07-01', updatedAt: '2025-12-15', author: 'Ing. Torres'
      },
    ],
    createdAt: '2025-06-01', updatedAt: '2026-02-20',
  },
  {
    id: 'PRD-003',
    gpn: 'DOOR-PNL-FRONT-00078',
    name: 'Panel de Puerta Delantera — Audi A3',
    version: '2.0',
    state: 'Pending',
    facility: 'Nave 1',
    specs: {
      dimensions: '980 × 620 × 42 mm',
      weight: 2.10,
      technologies: ['TECH-INJ', 'TECH-HMP', 'TECH-PNT'],
    },
    performance: { cycleTime: 95, ratePerHour: 36 },
    documentation: [
      {
        id: 'DOC-003-PFMEA', type: 'PFMEA', title: 'PFMEA — DOOR-PNL-FRONT-00078 v2.0',
        url: '/docs/pfmea-003.pdf', version: 1, state: 'Pending',
        createdAt: '2026-03-01', updatedAt: '2026-04-10', author: 'Ing. García'
      },
      {
        id: 'DOC-003-CP', type: 'ControlPlan', title: 'Plan de Control — DOOR-PNL-FRONT-00078 v2.0',
        url: '/docs/cp-003.pdf', version: 1, state: 'Draft',
        createdAt: '2026-03-01', updatedAt: '2026-03-15', author: 'Ing. Martínez'
      },
      {
        id: 'DOC-003-FC', type: 'Flowchart', title: 'Flowchart — DOOR-PNL-FRONT-00078 v2.0',
        url: '/docs/fc-003.pdf', version: 1, state: 'Draft',
        createdAt: '2026-03-01', updatedAt: '2026-03-12', author: 'Ing. García'
      },
      {
        id: 'DOC-003-SS', type: 'SetupSheet', title: 'Process & Setup Sheet — DOOR-PNL-FRONT-00078',
        url: '/docs/ss-003.pdf', version: 1, state: 'Pending',
        createdAt: '2026-03-15', updatedAt: '2026-04-08', author: 'Ing. López'
      },
    ],
    createdAt: '2026-03-01', updatedAt: '2026-04-10',
  },
  {
    id: 'PRD-004',
    gpn: 'IP-CARRIER-00355',
    name: 'Carrier de Tablero — Toyota Camry 2026',
    version: '0.8',
    state: 'Draft',
    facility: 'Nave 3',
    specs: {
      dimensions: '1380 × 180 × 95 mm',
      weight: 3.20,
      technologies: ['TECH-INJ', 'TECH-ASM'],
    },
    performance: { cycleTime: 110, ratePerHour: 32 },
    documentation: [
      {
        id: 'DOC-004-PFMEA', type: 'PFMEA', title: 'PFMEA — IP-CARRIER-00355 v0.8',
        url: '/docs/pfmea-004.pdf', version: 1, state: 'Draft',
        createdAt: '2026-04-01', updatedAt: '2026-04-18', author: 'Ing. Sánchez'
      },
      {
        id: 'DOC-004-CP', type: 'ControlPlan', title: 'Plan de Control — IP-CARRIER-00355 v0.8',
        url: '/docs/cp-004.pdf', version: 1, state: 'Draft',
        createdAt: '2026-04-01', updatedAt: '2026-04-16', author: 'Ing. Sánchez'
      },
      {
        id: 'DOC-004-FC', type: 'Flowchart', title: 'Flowchart — IP-CARRIER-00355 v0.8',
        url: '/docs/fc-004.pdf', version: 1, state: 'Draft',
        createdAt: '2026-04-01', updatedAt: '2026-04-15', author: 'Ing. Torres'
      },
      {
        id: 'DOC-004-SS', type: 'SetupSheet', title: 'Process & Setup Sheet — IP-CARRIER-00355',
        url: '/docs/ss-004.pdf', version: 1, state: 'Draft',
        createdAt: '2026-04-05', updatedAt: '2026-04-20', author: 'Ing. López'
      },
    ],
    createdAt: '2026-04-01', updatedAt: '2026-04-20',
  },
  {
    id: 'PRD-005',
    gpn: 'TRUNK-TRIM-00132',
    name: 'Trim de Cajuela — VW Tiguan 2024',
    version: '4.1',
    state: 'Archived',
    facility: 'Nave 2',
    specs: {
      dimensions: '1200 × 480 × 28 mm',
      weight: 1.42,
      technologies: ['TECH-INJ', 'TECH-ASM'],
    },
    performance: { cycleTime: 48, ratePerHour: 72 },
    documentation: [
      {
        id: 'DOC-005-PFMEA', type: 'PFMEA', title: 'PFMEA — TRUNK-TRIM-00132 v4.1',
        url: '/docs/pfmea-005.pdf', version: 8, state: 'Archived',
        createdAt: '2022-01-10', updatedAt: '2025-11-30', author: 'Ing. García'
      },
      {
        id: 'DOC-005-CP', type: 'ControlPlan', title: 'Plan de Control — TRUNK-TRIM-00132 v4.1',
        url: '/docs/cp-005.pdf', version: 7, state: 'Archived',
        createdAt: '2022-01-10', updatedAt: '2025-11-30', author: 'Ing. Martínez'
      },
      {
        id: 'DOC-005-FC', type: 'Flowchart', title: 'Flowchart — TRUNK-TRIM-00132 v4.1',
        url: '/docs/fc-005.pdf', version: 6, state: 'Archived',
        createdAt: '2022-01-10', updatedAt: '2025-10-01', author: 'Ing. García'
      },
      {
        id: 'DOC-005-SS', type: 'SetupSheet', title: 'Process & Setup Sheet — TRUNK-TRIM-00132',
        url: '/docs/ss-005.pdf', version: 5, state: 'Archived',
        createdAt: '2022-02-01', updatedAt: '2025-09-15', author: 'Ing. López'
      },
    ],
    createdAt: '2022-01-01', updatedAt: '2025-11-30',
  },
  {
    id: 'PRD-006',
    gpn: 'DASH-OUTER-00510',
    name: 'Panel Exterior Tablero — Stellantis Ram 1500',
    version: '1.1',
    state: 'Pending',
    facility: 'Nave 4',
    specs: {
      dimensions: '1540 × 280 × 62 mm',
      weight: 2.65,
      technologies: ['TECH-INJ', 'TECH-HMP', 'TECH-PNT', 'TECH-ASM'],
    },
    performance: { cycleTime: 88, ratePerHour: 40 },
    documentation: [
      {
        id: 'DOC-006-PFMEA', type: 'PFMEA', title: 'PFMEA — DASH-OUTER-00510 v1.1',
        url: '/docs/pfmea-006.pdf', version: 1, state: 'Pending',
        createdAt: '2026-02-10', updatedAt: '2026-04-05', author: 'Ing. Ramírez'
      },
      {
        id: 'DOC-006-CP', type: 'ControlPlan', title: 'Plan de Control — DASH-OUTER-00510 v1.1',
        url: '/docs/cp-006.pdf', version: 1, state: 'Pending',
        createdAt: '2026-02-10', updatedAt: '2026-04-05', author: 'Ing. Ramírez'
      },
      {
        id: 'DOC-006-FC', type: 'Flowchart', title: 'Flowchart — DASH-OUTER-00510 v1.1',
        url: '/docs/fc-006.pdf', version: 1, state: 'Pending',
        createdAt: '2026-02-10', updatedAt: '2026-04-01', author: 'Ing. Torres'
      },
      {
        id: 'DOC-006-SS', type: 'SetupSheet', title: 'Process & Setup Sheet — DASH-OUTER-00510',
        url: '/docs/ss-006.pdf', version: 1, state: 'Pending',
        createdAt: '2026-02-15', updatedAt: '2026-04-10', author: 'Ing. López'
      },
    ],
    createdAt: '2026-02-10', updatedAt: '2026-04-10',
  },
];

/* ─── Version History ──────────────────────────────────────────── */
export const mockVersionHistory: IVersionHistoryEntry[] = [
  { id: 'VH-001', productId: 'PRD-001', fromState: null, toState: 'Draft', changedBy: 'Ing. García', changedAt: '2024-03-01', comment: 'Creación inicial del producto' },
  { id: 'VH-002', productId: 'PRD-001', fromState: 'Draft', toState: 'Pending', changedBy: 'Ing. García', changedAt: '2024-04-10', comment: 'Documentación completa, en revisión de ingeniería' },
  { id: 'VH-003', productId: 'PRD-001', fromState: 'Pending', toState: 'Series', changedBy: 'Ing. Martínez', changedAt: '2024-05-20', comment: 'Aprobado por comité técnico. Lanzamiento a serie.' },
  { id: 'VH-004', productId: 'PRD-001', fromState: 'Series', toState: 'Series', changedBy: 'Ing. López', changedAt: '2026-01-15', comment: 'Actualización v3.2 — cambio de adhesivo por requerimiento de cliente' },
  { id: 'VH-005', productId: 'PRD-002', fromState: null, toState: 'Draft', changedBy: 'Ing. Ramírez', changedAt: '2025-06-01', comment: 'Nuevo proyecto Nissan Kicks 2025' },
  { id: 'VH-006', productId: 'PRD-002', fromState: 'Draft', toState: 'Pending', changedBy: 'Ing. Ramírez', changedAt: '2025-08-15', comment: 'Primera revisión técnica completa' },
  { id: 'VH-007', productId: 'PRD-002', fromState: 'Pending', toState: 'Series', changedBy: 'Ing. Torres', changedAt: '2025-10-01', comment: 'Aprobado PPAP nivel 3. En producción.' },
  { id: 'VH-008', productId: 'PRD-003', fromState: null, toState: 'Draft', changedBy: 'Ing. García', changedAt: '2026-03-01', comment: 'Inicio ECN — Cambio de tecnología de acabado' },
  { id: 'VH-009', productId: 'PRD-003', fromState: 'Draft', toState: 'Pending', changedBy: 'Ing. García', changedAt: '2026-04-10', comment: 'PFMEA y Setup Sheet listos. Flowchart y CP en revisión.' },
  { id: 'VH-010', productId: 'PRD-004', fromState: null, toState: 'Draft', changedBy: 'Ing. Sánchez', changedAt: '2026-04-01', comment: 'Nuevo proyecto Toyota Camry 2026 — fase APQP' },
  { id: 'VH-011', productId: 'PRD-005', fromState: null, toState: 'Draft', changedBy: 'Ing. García', changedAt: '2022-01-01', comment: 'Inicio proyecto VW Tiguan' },
  { id: 'VH-012', productId: 'PRD-005', fromState: 'Draft', toState: 'Series', changedBy: 'Ing. Martínez', changedAt: '2022-05-01', comment: 'Aprobado. En serie.' },
  { id: 'VH-013', productId: 'PRD-005', fromState: 'Series', toState: 'Archived', changedBy: 'Ing. López', changedAt: '2025-11-30', comment: 'Fin de vida del producto. Modelo 2024 descontinuado.' },
  { id: 'VH-014', productId: 'PRD-006', fromState: null, toState: 'Draft', changedBy: 'Ing. Ramírez', changedAt: '2026-02-10', comment: 'Nuevo proyecto Stellantis Ram 1500' },
  { id: 'VH-015', productId: 'PRD-006', fromState: 'Draft', toState: 'Pending', changedBy: 'Ing. Ramírez', changedAt: '2026-04-10', comment: 'Documentación IATF enviada a revisión cliente' },
];
