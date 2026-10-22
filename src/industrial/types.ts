export interface Plant { id: string; name: string; timezone: string }
export interface Line { id: string; plant_id: string; name: string }
export interface CatalogItem { id: string; kind: 'scrap' | 'downtime' | 'fault'; name: string; version: number; active: boolean }
export interface Plan { id: string; line_id: string; sku: string; shift_name: string; starts_at: string; ends_at: string; target_per_hour: number; status: 'published' | 'cancelled'; version: number; operational_date: string }
export interface Detail { catalog_id: string; kind: CatalogItem['kind']; quantity: number; duration_min: number; comment: string; catalog_name?: string; catalog_version?: number }
export interface IntervalInput { id: string; starts_at: string; ends_at: string; good: number; scrap: number; downtime_min: number; details: Detail[]; comments: string; voided: boolean }
export interface Interval extends IntervalInput { version: number; actor_id: number; device_id: string; captured_at: string; received_at: string }
export interface Shift { id: string; plan_id: string; line_id: string; owner_id: number; operational_date: string; status: 'open' | 'submitted' | 'closed'; version: number; plan_snapshot: Plan; updated_at: string; intervals: Interval[] }
export interface Prepared { shift: Shift; plant: Plant; line: Line; catalog: CatalogItem[]; prepared_by: number; prepared_at: string }
export interface Bootstrap { plants: Plant[]; lines: Line[]; catalog: CatalogItem[]; catalog_version: number; user_id: number; role: string }
export interface Operation { id: string; expected_version: number; kind: 'capture' | 'submit' | 'return' | 'close' | 'correct'; device_id: string; captured_at: string; reason: string; interval?: IntervalInput }
export type QueueStatus = 'pending' | 'sending' | 'confirmed' | 'conflict' | 'error' | 'auth' | 'superseded';
export interface Pending { id: string; userId: number; shiftId: string; order: number; operation: Operation; status: QueueStatus; attempts: number; nextAttempt: number; createdAt: number; error?: string }
export interface Document { key: string; userId: number; data: Prepared; confirmed: Shift; nextOrder: number }
export interface Summary { good: number; scrap: number; downtime_min: number; target: number; compliance_pct: number | null; provisional_intervals: number; intervals: number; oee_status: string }
export interface User { id: number; name: string; role: string; employee_number: string; email: string | null; dept: string | null }

export const shiftLabel = (status: string) => ({ open: 'Abierto', submitted: 'Enviado a revisión', closed: 'Cerrado' }[status] || status);

export interface AuditEntry { sequence: number; actor_name: string; action: string; reason: string; occurred_at: string; before: Shift | null; after: Shift | null }
