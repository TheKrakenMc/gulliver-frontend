import { openDB } from 'idb';
import type { DBSchema } from 'idb';
import type { Bootstrap, Document, Operation, Pending, Prepared, Shift, Interval } from './types';

interface Database extends DBSchema {
  documents: { key: string; value: Document };
  operations: { key: string; value: Pending };
  bootstrap: { key: number; value: Bootstrap };
  forms: { key: string; value: { key: string; userId: number; value: unknown } };
}
const dbPromise = openDB<Database>('gulliver-operational-v2', 2, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('documents')) db.createObjectStore('documents', { keyPath: 'key' });
    if (!db.objectStoreNames.contains('operations')) db.createObjectStore('operations', { keyPath: 'id' });
    if (!db.objectStoreNames.contains('bootstrap')) db.createObjectStore('bootstrap', { keyPath: 'user_id' });
    if (!db.objectStoreNames.contains('forms')) db.createObjectStore('forms', { keyPath: 'key' });
  },
});
const docKey = (userId: number, shiftId: string) => userId + ':' + shiftId;
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('gulliver-data-v2') : null;
export function announce() {
  channel?.postMessage('changed');
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('gulliver-data'));
}
export function subscribe(listener: () => void) {
  channel?.addEventListener('message', listener);
  window.addEventListener('gulliver-data', listener);
  return () => {
    channel?.removeEventListener('message', listener);
    window.removeEventListener('gulliver-data', listener);
  };
}
export async function cacheBootstrap(data: Bootstrap) { await (await dbPromise).put('bootstrap', data); }
export async function readBootstrap(userId: number) { return (await dbPromise).get('bootstrap', userId); }
export async function documents(userId: number) { return (await (await dbPromise).getAll('documents')).filter(d => d.userId === userId); }
export async function pending(userId: number) {
  return (await (await dbPromise).getAll('operations')).filter(o => o.userId === userId).sort((a, b) => a.order - b.order);
}
export const unresolved = (op: Pending) => !['confirmed', 'superseded'].includes(op.status);
export async function savePrepared(userId: number, data: Prepared) {
  if (data.prepared_by !== userId) throw new Error('El turno no pertenece a esta preparación.');
  const db = await dbPromise;
  const tx = db.transaction(['documents', 'operations', 'forms'], 'readwrite');
  const key = docKey(userId, data.shift.id);
  const ops = await tx.objectStore('operations').getAll();
  if (ops.some(o => o.userId === userId && o.shiftId === data.shift.id && unresolved(o))) {
    await tx.done;
    throw new Error('Hay capturas pendientes. Sincronízalas o resuelve el conflicto antes de actualizar el turno.');
  }
  const existing = await tx.objectStore('documents').get(key);
  await tx.objectStore('documents').put({ key, userId, data, confirmed: data.shift, nextOrder: existing?.nextOrder || 1 });
  await tx.done;
  announce();
}
function optimistic(shift: Shift, operation: Operation): Shift {
  const intervals = [...shift.intervals];
  if (operation.interval) {
    const previous = intervals.find(i => i.id === operation.interval?.id);
    const row: Interval = { ...operation.interval, version: (previous?.version || 0) + 1,
      actor_id: previous?.actor_id || 0, captured_at: operation.captured_at,
      device_id: operation.device_id, received_at: previous?.received_at || '' };
    const index = intervals.findIndex(i => i.id === row.id);
    if (index >= 0) intervals[index] = row;
    else intervals.push(row);
  }
  return { ...shift, intervals, version: shift.version + 1,
    status: operation.kind === 'submit' ? 'submitted' : operation.kind === 'close' ? 'closed' : operation.kind === 'return' ? 'open' : shift.status };
}
export async function enqueue(userId: number, shiftId: string, operation: Operation) {
  const db = await dbPromise;
  const tx = db.transaction(['documents', 'operations', 'forms'], 'readwrite');
  const doc = await tx.objectStore('documents').get(docKey(userId, shiftId));
  if (!doc || doc.data.shift.version !== operation.expected_version) {
    await tx.done;
    throw new Error('El turno cambió en otra pestaña. Recarga la captura antes de guardar.');
  }
  const queue = await tx.objectStore('operations').getAll();
  if (queue.some(o => o.userId === userId && o.shiftId === shiftId && ['error', 'conflict', 'auth'].includes(o.status))) {
    await tx.done;
    throw new Error('Resuelve los envíos detenidos antes de agregar otra captura.');
  }
  if (['return', 'close', 'correct'].includes(operation.kind) && (!navigator.onLine || queue.some(o => o.userId === userId && o.shiftId === shiftId && unresolved(o)))) {
    await tx.done;
    throw new Error('La revisión requiere conexión y no debe tener envíos pendientes.');
  }
  if (await tx.objectStore('operations').get(operation.id)) {
    await tx.done;
    throw new Error('Esta operación ya está registrada.');
  }
  await tx.objectStore('operations').add({ id: operation.id, userId, shiftId, operation, order: doc.nextOrder,
    status: 'pending', attempts: 0, nextAttempt: 0, createdAt: Date.now() });
  if(operation.interval) await tx.objectStore('forms').delete(userId+':'+shiftId+':'+operation.interval.starts_at);
  doc.nextOrder += 1;
  doc.data.shift = optimistic(doc.data.shift, operation);
  await tx.objectStore('documents').put(doc);
  await tx.done;
  announce();
}
export async function setOperation(item: Pending) {
  await (await dbPromise).put('operations', item);
  announce();
}
export async function confirm(userId: number, op: Pending, shift: Shift) {
  const db = await dbPromise;
  const tx = db.transaction(['documents', 'operations', 'forms'], 'readwrite');
  await tx.objectStore('operations').put({ ...op, status: 'confirmed', error: undefined });
  const doc = await tx.objectStore('documents').get(docKey(userId, op.shiftId));
  if (doc) {
    doc.confirmed = shift;
    const remaining = (await tx.objectStore('operations').getAll())
      .filter(o => o.userId === userId && o.shiftId === shift.id && unresolved(o)).sort((a,b) => a.order-b.order);
    doc.data.shift = remaining.reduce((state, item) => optimistic(state, item.operation), shift);
    await tx.objectStore('documents').put(doc);
  }
  await tx.done;
  announce();
}
/** Explicit resolution retains the original operations and the operator's reason locally. */
export async function resolve(userId: number, shiftId: string, server: Shift, reapply: boolean, reason: string) {
  if (reason.trim().length < 5) throw new Error('Indica un motivo de al menos cinco caracteres.');
  const db = await dbPromise;
  const tx = db.transaction(['documents', 'operations', 'forms'], 'readwrite');
  const doc = await tx.objectStore('documents').get(docKey(userId, shiftId));
  if (!doc) { await tx.done; throw new Error('No se encontró la preparación.'); }
  const ops = (await tx.objectStore('operations').getAll()).filter(o => o.userId === userId && o.shiftId === shiftId && unresolved(o)).sort((a,b) => a.order-b.order);
  if (ops.some(o => o.status === 'sending')) { await tx.done; throw new Error('Espera a que termine el envío.'); }
  let next = server;
  for (const item of ops) {
    await tx.objectStore('operations').put({ ...item, status: 'superseded', error: reason });
    if (reapply) {
      const operation = { ...item.operation, id: crypto.randomUUID(), expected_version: next.version, reason: reason + ' / ' + item.operation.reason };
      await tx.objectStore('operations').add({ ...item, id: operation.id, operation, order: doc.nextOrder++, status: 'pending', attempts: 0, nextAttempt: 0, error: undefined });
      next = optimistic(next, operation);
    }
  }
  doc.confirmed = server;
  doc.data.shift = next;
  await tx.objectStore('documents').put(doc);
  await tx.done;
  announce();
}
export async function retryAuthentication(userId: number) {
  const db = await dbPromise;
  const tx = db.transaction('operations', 'readwrite');
  for (const op of await tx.store.getAll()) {
    if (op.userId === userId && op.status === 'auth') await tx.store.put({ ...op, status: 'pending', nextAttempt: 0 });
  }
  await tx.done;
  announce();
}
export async function requestDurability() {
  return navigator.storage?.persist ? navigator.storage.persist() : false;
}

export async function saveForm(key: string, userId: number, value: unknown) { await (await dbPromise).put('forms', { key, userId, value }); }
export async function readForm(key: string) { return (await (await dbPromise).get('forms', key))?.value; }
export async function removeForm(key: string) { await (await dbPromise).delete('forms', key); }

export async function forms(userId: number) { return (await (await dbPromise).getAll('forms')).filter(f=>f.userId===userId); }
