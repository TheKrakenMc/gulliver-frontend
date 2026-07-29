export type ViewId = 'dashboard' | 'hourByHour' | 'maintenance' | 'quality' | 'logistics' | 'pdca' | 'engineering' | 'operativeRecord' | 'configuration';

export interface FilterState {
  location: string;
  businessUnit: string;
  process: string;
}

export interface BaseLocation {
  id: string;
  name: string;
}

export interface BaseBusinessUnit {
  id: string;
  name: string;
  location_id: string;
}

export interface BaseProcess {
  id: string;
  name: string;
  business_unit_id: string;
}

export interface BaseSector {
  id: string;
  name: string;
  description?: string;
}

export interface BaseClient {
  id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  sector_id?: string;
}

export interface ClientWithSector extends BaseClient {
  sector?: BaseSector;
}

export interface BaseProduct {
  id: string;
  sku: string;
  name: string;
  description?: string;
  client_id?: string;
  rate_per_hour?: number;
  process_ids: string[];
}

export interface HierarchyProduct {
  id: string;
  sku: string;
  name: string;
  description?: string;
  client_id?: string;
  rate_per_hour?: number;
}

export interface BaseMaintenanceFault {
  code: string;
  description: string;
  category_id: string;
}

export interface BaseMaintenanceCategory {
  id: string;
  name: string;
  faults?: BaseMaintenanceFault[];
}

export interface BaseScrapDefect {
  code: string;
  name: string;
  description?: string;
  process_id: string;
}

export interface BaseAssetFault {
  code: string;
  name: string;
  description: string;
  family_id: string;
}

export interface BaseAssetFamily {
  id: string;
  name: string;
  faults?: BaseAssetFault[];
}

export interface BaseMachine {
  id: string;
  name: string;
  code: string;
  nave: string;
  process_id: string;
  family_ids?: string[];
}

export interface HierarchyMachine extends BaseMachine {}

export interface HierarchyProcess extends BaseProcess {
  products: HierarchyProduct[];
  machines: HierarchyMachine[];
}

export interface HierarchyBusinessUnit extends BaseBusinessUnit {
  processes: HierarchyProcess[];
}

export interface HierarchyLocation extends BaseLocation {
  business_units: HierarchyBusinessUnit[];
}

export interface HourRecord {
  id?: string;
  plan_id?: string;
  record_date?: string;
  hour: number;
  target: number;
  actualOK: number;
  scrap: number;
  downtime: number;
  comments: string;
  oeeLoss: number; // auto-calculated
  deviationNotified?: boolean;
  pending?: boolean; // Frontend only: is optimistic/pending
  isOffline?: boolean; // Frontend only: failed to sync and is in offline queue
  plannedDowntime?: number; // Frontend only: duration of planned DT
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

/* ─── Downtime Catalog types ─── */
export interface DowntimeMotivo {
  codigo: string;
  descripcion: string;
}

export interface DowntimeCategoria {
  categoria: string;
  motivos: DowntimeMotivo[];
}

export type DowntimeCatalog = DowntimeCategoria[];

/* ─── Logistics Planning types ─── */
export type TurnoType = 'Matutino' | 'Vespertino' | 'Nocturno' | 'Mixto' | '12x12_Dia' | '12x12_Noche';

export interface TimeSlot {
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

export interface PlanRecord {
  id_plan: string;
  fecha: string;         // ISO date "YYYY-MM-DD"
  planta: string;        // from FilterState
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
  comments?: string;
  timestamp: string;
}

export interface ScrapRecord {
  id: string;
  tecnologia: string;
  process_id?: string;
  codigoDefecto: string;
  defecto: string;
  cantidad: number;
  analysisType?: AnalysisType | null;
  analysisComplete?: boolean;
  fiveWhys?: FiveWhysData;
  ishikawa?: IshikawaData;
  validationQuality: ValidationStatus;
  comments?: string;
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
  comments?: string;
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
