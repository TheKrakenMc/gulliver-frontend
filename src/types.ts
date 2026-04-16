export type ViewId = 'dashboard' | 'hourByHour' | 'maintenance' | 'quality' | 'logistics' | 'pdca';

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
export interface PlanRecord {
  id_plan: string;
  linea: string;
  turno: 'Matutino' | 'Vespertino' | 'Nocturno';
  sku: string;
  target_hr: number;
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
export type AnalysisType = '5whys' | 'ishikawa';
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
  validationQuality: ValidationStatus;
  timestamp: string;
}
