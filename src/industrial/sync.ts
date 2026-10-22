import axios from 'axios';
import { operate, errorMessage } from './api';
import { pending, unresolved, setOperation, confirm } from './offline';
import type { Pending, Shift, Operation } from './types';

type Transport = (shiftId: string, operation: Operation) => Promise<{ operation_id: string; shift: Shift }>;
export async function processQueue(userId: number, transport: Transport = operate, authenticated: () => boolean = () => true) {
  const queue = await pending(userId);
  const blocked = new Set<string>();
  for (const item of queue) {
    if (!authenticated()) break;
    if (!unresolved(item) || blocked.has(item.shiftId)) continue;
    if (['error', 'conflict', 'auth'].includes(item.status) || item.nextAttempt > Date.now()) {
      blocked.add(item.shiftId); continue;
    }
    const sending: Pending = { ...item, status: 'sending', attempts: item.attempts + 1 };
    await setOperation(sending);
    try {
      const result = await transport(item.shiftId, item.operation);
      if (result.operation_id !== item.id) throw new Error('El servidor no confirmó la operación enviada.');
      await confirm(userId, sending, result.shift);
    } catch (error: unknown) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const state = status === 401 ? 'auth' : status === 409 ? 'conflict' : status && status >= 400 && status < 500 && status !== 429 ? 'error' : 'pending';
      await setOperation({ ...sending, status: state, error: errorMessage(error),
        nextAttempt: state === 'pending' ? Date.now() + Math.min(60000, 1000 * 2 ** Math.min(sending.attempts, 6)) : 0 });
      blocked.add(item.shiftId);
    }
  }
}
export function startSync(userId: number) {
  let stopped = false;
  let running = false;
  const sameUser = () => {
    try { return JSON.parse(localStorage.getItem('gulliver_auth_session') || 'null')?.id === userId; }
    catch { return false; }
  };
  const wake = async () => {
    if (stopped || running || !navigator.onLine || !sameUser() || !navigator.locks) return;
    running = true;
    try {
      await navigator.locks.request('gulliver-outbox-v2', { ifAvailable: true }, async lock => {
        if (lock && !stopped && sameUser()) await processQueue(userId, operate, () => !stopped && sameUser());
      });
    } catch (error) {
      console.error('Unable to open the local outbox', error);
    } finally { running = false; }
  };
  window.addEventListener('online', wake);
  window.addEventListener('gulliver-data', wake);
  const timer = window.setInterval(wake, 5000);
  void wake();
  return () => {
    stopped = true;
    clearInterval(timer);
    window.removeEventListener('online', wake);
    window.removeEventListener('gulliver-data', wake);
  };
}
