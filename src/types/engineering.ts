// ─── PLM — Engineering & Product Management Types ───────────────────────────

/* Document Lifecycle States (IATF compliant flow) */
export type DocumentState = 'Draft' | 'Pending' | 'Series' | 'Archived';

/* IATF-required document types */
export type TechnicalDocType = 'PFMEA' | 'ControlPlan' | 'Flowchart' | 'SetupSheet';

/* Technical Document (DMS entry) */
export interface ITechnicalDoc {
  id: string;
  type: TechnicalDocType;
  title: string;
  url: string;
  version: number;
  state: DocumentState;
  createdAt: string;
  updatedAt: string;
  author: string;
}

/* Product Master Data */
export interface IProduct {
  id: string;
  gpn: string;       // Global Part Number
  name: string;
  version: string;
  state: DocumentState;
  facility: string;  // filters by global FilterState.facility
  specs: {
    dimensions: string;
    weight: number;     // kg
    technologies: string[]; // ITechnology IDs
  };
  performance: {
    cycleTime: number;   // seconds
    ratePerHour: number; // installed capacity
  };
  documentation: ITechnicalDoc[];
  createdAt: string;
  updatedAt: string;
}

/* Version change history entry */
export interface IVersionHistoryEntry {
  id: string;
  productId: string;
  fromState: DocumentState | null;
  toState: DocumentState;
  changedBy: string;
  changedAt: string;
  comment: string;
}

/* Manufacturing Operation */
export interface IOperation {
  id: string;
  sequence: number;
  name: string;
  technologyId: string;
  description: string;
}

/* Technology catalog */
export interface ITechnology {
  id: string;
  name: string;
  category: string;
  description: string;
}

/* Process Variable */
export interface IProcessVariable {
  id: string;
  name: string;
  unit: string;
  nominalValue: number;
  toleranceMin: number;
  toleranceMax: number;
  technologyId: string;
}