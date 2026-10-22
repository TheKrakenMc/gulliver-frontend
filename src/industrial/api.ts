import axios from 'axios';
import type { Bootstrap, Plan, Shift, Prepared, Operation, Summary, User } from './types';

const configured = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
export const origin = configured.replace(/\/api\/v[12]\/?$/, '');
export const api = axios.create({ baseURL: origin + '/api/v2', timeout: 15000 });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('gulliver_token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail: unknown = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (error.response?.status === 409) return 'El registro cambió en otro dispositivo. Revisa el conflicto.';
    if (error.response?.status === 422) return 'Revisa cantidades, intervalos y motivos antes de reintentar.';
    if (error.response?.status === 401) return 'La sesión venció. Inicia sesión para continuar el envío.';
    if (error.response?.status === 403) return 'No tienes permiso para esta acción. Solicita revisión al supervisor.';
    if (!error.response) return 'No hay respuesta del servidor. La captura permanece en este dispositivo.';
    return 'El servidor no pudo completar la solicitud. Reintenta e indica el identificador ' + (error.response.headers['x-request-id'] || '');
  }
  return error instanceof Error ? error.message : 'No se pudo completar la acción.';
}
export async function allPages<T>(path: string, params: Record<string, string> = {}): Promise<T[]> {
  const result: T[] = [];
  let cursor: string | null = null;
  do {
    const response: { data: { items: T[]; next_cursor: string | null } } = await api.get(path, { params: { ...params, limit: 500, ...(cursor ? { cursor } : {}) } });
    result.push(...response.data.items);
    cursor = response.data.next_cursor;
  } while (cursor);
  return result;
}
export const bootstrap = () => api.get<Bootstrap>('/bootstrap').then(r => r.data);
export const plans = (lineId: string) => allPages<Plan>('/plans', { line_id: lineId });
export const shifts = (lineId: string) => allPages<Shift>('/shifts', { line_id: lineId });
export const prepare = (id: string) => api.post<Prepared>('/plans/' + id + '/prepare').then(r => r.data);
export const readShift = (id: string) => api.get<Shift>('/shifts/' + id).then(r => r.data);
export const operate = (shiftId: string, operation: Operation) => api.post<{ operation_id: string; shift: Shift }>('/shifts/' + shiftId + '/operations', operation).then(r => r.data);
export const summary = (lineId?: string, shiftId?: string, plantId?: string) => api.get<Summary>('/analytics/summary', { params: { line_id: lineId, shift_id: shiftId, plant_id: plantId } }).then(r => r.data);
export async function signIn(employee_number: string, password: string): Promise<User> {
  if (!navigator.onLine) throw new Error('El cambio de usuario requiere conexión.');
  const action = async () => {
  const { data } = await axios.post<{ access_token: string; user: User }>(origin + '/api/v1/auth/login', { employee_number, password }, { timeout: 15000 });
  localStorage.setItem('gulliver_token', data.access_token);
  localStorage.setItem('gulliver_auth_session', JSON.stringify(data.user));
  return data.user;
  };
  return navigator.locks ? navigator.locks.request('gulliver-outbox-v2', action) : action();
}
export async function signOut(): Promise<void> {
  if (!navigator.onLine) throw new Error('Conéctate para cerrar sesión y cambiar de usuario.');
  try { await axios.post(origin + '/api/v1/auth/logout', undefined, { headers: { Authorization: 'Bearer ' + localStorage.getItem('gulliver_token') }, timeout: 15000 }); } catch(error) { if(!axios.isAxiosError(error) || error.response?.status!==401) throw error; }
  localStorage.removeItem('gulliver_token');
  localStorage.removeItem('gulliver_auth_session');
}
