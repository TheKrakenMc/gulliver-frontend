export type ViewId = 'dashboard' | 'hourByHour' | 'maintenance' | 'quality' | 'logistics' | 'pdca' | 'engineering' | 'operativeRecord';

export interface FilterState {
  location: string;
  businessUnit: string;
  facility: string;
  process: string;
}

export interface HourRecord {
  hour: number;
  target: number;
  actualOK: number;
  scrap: number;
  downtime: number;
  comments: string;
  oeeLoss: number; // auto-calculated
  deviationNotified?: boolean;
}

export interface PDCACard {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  dueDate: string;
}

export interface KPIData {
  label: string;
  value: number | string;
  unit: string;
  target?: number;
  trend?: 'up' | 'down' | 'flat';
  status: 'good' | 'warning' | 'critical';
}

export interface OEELine {
  line: string;
  oee: number;
  target: number;
}

/* ─── Maintenance (MTTO) Catalog types ─── */
export interface MTTOFalla {
  codigo: string;
  descripcion: string;
}

export interface MTTOCategoria {
  id_cat: string;
  nombre: string;
  fallas: MTTOFalla[];
}

export interface MTTOMaquina {
  id_maquina: string;
  nombre: string;
  nave: string;
  categorias: MTTOCategoria[];
}

/* ─── Quality (Scrap) Catalog types ─── */
export interface ScrapDefecto {
  codigo: string;
  defecto: string;
  count?: number; // for tracking in the UI
}

export type ScrapCatalog = Record<string, ScrapDefecto[]>;

/* ─── Logistics Planning types ─── */
export type TurnoType = 'Matutino' | 'Vespertino' | 'Nocturno' | 'Mixto' | '12x12_Dia' | '12x12_Noche';

export interface TimeSlot {
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

export interface PlanRecord {
  id_plan: string;
  fecha: string;         // ISO date "YYYY-MM-DD"
  planta: string;        // from FilterState.facility
  linea: string;
  turno: TurnoType;
  slot: TimeSlot;        // computed from turno, but editable for Mixto
  sku: string;
  target_hr: number;
  creado_por: string;
  created_at: string;    // ISO timestamp
  status: 'draft' | 'published' | 'cancelled';
}

export interface OverlapResult {
  hasOverlap: boolean;
  conflictingPlans: PlanRecord[];
  message?: string;
}

/* ─── Work Order (Maintenance) ─── */
export interface WorkOrder {
  id: string;
  maquina: string;
  categoria: string;
  falla: string;
  codigoFalla: string;
  prioridad: 'Crítica' | 'Alta' | 'Media' | 'Baja';
  status: 'Abierta' | 'En Proceso' | 'Cerrada';
  timestamp: string;
}

/* ─── Fault Registration & Root-Cause Analysis (RCA) ─── */
export type AnalysisType = 'ishikawa' | '5whys' | 'pdca';
export type ValidationStatus = 'pendiente' | 'validado' | 'corregido';

export interface FiveWhysData {
  whys: [string, string, string, string, string];
  rootCause: string;
  correctiveAction: string;
}

export interface IshikawaCause {
  id: string;
  text: string;
}

export interface IshikawaData {
  manoDeObra: IshikawaCause[];
  maquina: IshikawaCause[];
  metodo: IshikawaCause[];
  material: IshikawaCause[];
  medicion: IshikawaCause[];
  medioAmbiente: IshikawaCause[];
  effect: string;
  rootCause: string;
  correctiveAction: string;
}

export interface FaultRecord {
  id: string;
  maquinaId: string;
  maquinaNombre: string;
  categoriaId: string;
  categoriaNombre: string;
  codigoFalla: string;
  fallaDescripcion: string;
  downtimeMin: number;
  analysisType: AnalysisType | null;
  analysisComplete: boolean;
  fiveWhys?: FiveWhysData;
  ishikawa?: IshikawaData;
  validationMtto: ValidationStatus;
  validationQuality: ValidationStatus;
  timestamp: string;
}

export interface ScrapRecord {
  id: string;
  tecnologia: string;
  codigoDefecto: string;
  defecto: string;
  cantidad: number;
  analysisType?: AnalysisType | null;
  analysisComplete?: boolean;
  fiveWhys?: FiveWhysData;
  ishikawa?: IshikawaData;
  validationQuality: ValidationStatus;
  timestamp: string;
}

/* ─── Operative Record (MROperativo) ─── */
export interface SkillsMatrix {
  isCertified: boolean;
  level: 1 | 2 | 3 | 4;
}

export interface PPE {
  hasSafetyGlasses: boolean;
  hasSteelToeBoots: boolean;
  hasEarProtection: boolean;
  hasGloves: boolean;
}

export interface Operator {
  id: string;
  name: string;
  skills: SkillsMatrix;
  ppe: PPE;
}

export interface DeviationRecord {
  id: string;
  timestamp: string;
  type: 'skills_not_met' | 'hours_discrepancy' | 'other';
  comment: string;
  operatorId?: string;
  supervisorNotified: boolean;
}

export interface DowntimeRecord {
  id: string;
  reason: string;
  durationMin: number;
  timestamp: string;
}

export interface OperativeRecord {
  id: string;
  date: string;
  shift: TurnoType;
  operatorId: string;
  plannedHours: number;
  actualHours: number;
  deviations: DeviationRecord[];
  faults: FaultRecord[];
  scrap: ScrapRecord[];
  downtimes: DowntimeRecord[];
}
