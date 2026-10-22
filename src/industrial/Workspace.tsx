import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, LogOut, ClipboardCheck, Factory } from 'lucide-react';
import type { Bootstrap, Document, Pending, Plan, Shift, User } from './types';
import * as api from './api';
import * as local from './offline';
import { startSync } from './sync';
import { exportPending } from './export';
import { plantTime } from './time';
import Capture from './Capture';
import './industrial.css';

const Planning = lazy(() => import('./Planning'));
const Administration = lazy(() => import('./Administration'));
const Report = lazy(() => import('./Report'));
const Demonstration = lazy(() => import('../LegacyApp'));

import { shiftLabel } from './types';

export default function Workspace({ user, onLogout }: { user: User; onLogout: () => Promise<void> }) {
  const [context, setContext] = useState<Bootstrap>();
  const [docs, setDocs] = useState<Document[]>([]);
  const [queue, setQueue] = useState<Pending[]>([]);
  const [lineId, setLineId] = useState('');
  const [plantId, setPlantId] = useState('');
  const [planList, setPlanList] = useState<Plan[]>([]);
  const [shiftList, setShiftList] = useState<Shift[]>([]);
  const [selected, setSelected] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [tab, setTab] = useState(user.role === 'Gerente' ? 'report' : user.role === 'Coordinador' ? 'planning' : user.role === 'Administrador' ? 'admin' : user.role === 'Supervisor' ? 'review' : 'capture');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const canCapture = ['Operador', 'Líder de Línea', 'Supervisor', 'Administrador'].includes(user.role);
  const canReview = ['Supervisor', 'Administrador'].includes(user.role);
  const canPlan = ['Coordinador', 'Administrador'].includes(user.role);

  const reloadLocal = useCallback(async () => {
    const [documents, operations] = await Promise.all([local.documents(user.id), local.pending(user.id)]);
    setDocs(documents); setQueue(operations);
  }, [user.id]);
  useEffect(() => {
    let alive = true;
    void local.readBootstrap(user.id).then(data => { if (alive && data) setContext(data); }).catch(e => setError(api.errorMessage(e)));
    const reload = () => { void reloadLocal().catch(e => setError(api.errorMessage(e))); };
    reload();
    const unsubscribe = local.subscribe(reload);
    const connection = () => setOnline(navigator.onLine);
    window.addEventListener('online', connection);
    window.addEventListener('offline', connection);
    const stop = startSync(user.id);
    return () => { alive = false; unsubscribe(); stop(); window.removeEventListener('online', connection); window.removeEventListener('offline', connection); };
  }, [user.id, reloadLocal]);

  const refresh = useCallback(async () => {
    setError(''); setBusy(true);
    try {
      const data = await api.bootstrap();
      if (data.user_id !== user.id) throw new Error('La identidad de la sesión cambió. Vuelve a iniciar sesión.');
      await local.cacheBootstrap(data);
      setContext(data);
      const chosen = data.lines.find(l => l.id === lineId) || data.lines[0];
      if (chosen && (lineId || ['Operador','Supervisor','Líder de Línea'].includes(user.role))) { setPlantId(chosen.plant_id); setLineId(chosen.id); }
      await local.retryAuthentication(user.id);
    } catch (e) { setError(api.errorMessage(e)); }
    finally { setBusy(false); }
  }, [user.id, user.role, lineId]);
  useEffect(() => {
    if (navigator.onLine) void refresh();
    // Initial refresh only; later refreshes are deliberate or reconnection events.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const reconnect = () => { void refresh(); };
    window.addEventListener('online', reconnect);
    return () => window.removeEventListener('online', reconnect);
  }, [refresh]);
  useEffect(() => {
    if (!lineId || !online) return;
    let alive = true;
    void Promise.all([api.plans(lineId), api.shifts(lineId)]).then(([plans, shifts]) => {
      if (alive) { setPlanList(plans); setShiftList(shifts); }
    }).catch(e => { if (alive) setError(api.errorMessage(e)); });
    return () => { alive = false; };
  }, [lineId, online, busy]);

  const lines = context?.lines.filter(l => !plantId || l.plant_id === plantId) || [];
  const visibleDocs = docs.filter(d => (!lineId || d.data.line.id === lineId) && (!plantId || d.data.plant.id === plantId));
  const active = visibleDocs.find(d => d.data.shift.id === selected) || visibleDocs[0];
  const pending = queue.filter(local.unresolved);
  const authExpired = pending.some(o => o.status === 'auth');

  async function prepare(planId: string) {
    setBusy(true); setError('');
    try {
      if (!online) throw new Error('La preparación requiere conexión. Puedes continuar los turnos ya preparados.');
      const prepared = await api.prepare(planId);
      await local.savePrepared(user.id, prepared);
      const durable = await local.requestDurability();
      if (!durable) setError('El navegador no concedió almacenamiento persistente. No borres los datos del dispositivo mientras existan pendientes.');
      setSelected(prepared.shift.id);
      if (context) { setPlantId(prepared.plant.id); setLineId(prepared.line.id); }
    } catch(e) { setError(api.errorMessage(e)); }
    finally { setBusy(false); }
  }
  async function logout() {
    setError('');
    try {
      if (!navigator.locks) throw new Error('Este navegador requiere Web Locks para cambiar de usuario con seguridad.');
      await navigator.locks.request('gulliver-outbox-v2', async () => { await onLogout(); });
    } catch(e) { setError(api.errorMessage(e)); }
  }
  const tabs = [
    ...(canCapture ? [{ id:'capture', label:'Captura' }] : []),
    ...(canReview ? [{ id:'review', label:'Revisión de turnos' }] : []),
    ...(canPlan ? [{ id:'planning', label:'Planeación' }] : []),
    { id:'report', label:'Resultados' },
    ...(user.role === 'Administrador' ? [{ id:'admin', label:'Administración' }, { id:'demo', label:'Demostración anterior' }] : []),
  ];
  return <div className="industrial">
    <a className="skip-link" href="#operation-main">Ir al contenido</a>
    <header className="operation-header">
      <div className="brand"><Factory size={26} aria-hidden="true"/><strong>Gulliver</strong></div>
      <div className="connection" role="status">{online ? <Wifi size={20}/> : <WifiOff size={20}/>} {online ? 'Con conexión' : 'Sin conexión'} · {pending.length} pendientes</div>
      <div className="identity"><span>{user.name}<small>{user.role}</small></span><button onClick={logout} aria-label="Cerrar sesión"><LogOut size={20}/></button></div>
      {active && (tab==='capture' || tab==='review') && <div className="header-context">{active.data.plant.name} / {active.data.line.name} · {active.data.shift.plan_snapshot.shift_name}</div>}
    </header>
    <nav className="operation-nav" aria-label="Navegación principal">{tabs.map(t => <button key={t.id} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>{t.label}</button>)}</nav>
    <div className="operation-context" role="region" aria-label="Planta y línea">
      <label>Planta<select value={plantId} onChange={e => { setPlantId(e.target.value); setLineId(''); setSelected(''); }}>
        <option value="">Todas las plantas asignadas</option>{context?.plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select></label>
      <label>Línea<select value={lineId} onChange={e => { setLineId(e.target.value); setSelected(''); }}>
        <option value="">Todas las líneas asignadas</option>{lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select></label>
      <button onClick={refresh} disabled={busy || !online}><RefreshCw size={18}/>{busy ? 'Actualizando…' : 'Actualizar'}</button>
    </div>
    <main id="operation-main" className="operation-main">
      {error && <div className="notice error" role="alert">{error}<button onClick={() => setError('')}>Entendido</button></div>}
      {!navigator.locks && <p role="alert" className="notice error">Usa un navegador compatible con Web Locks para sincronizar sin envíos concurrentes.</p>}
      {authExpired && <p role="alert" className="notice error">Tu sesión venció. Las capturas están conservadas. Cierra sesión e inicia con la misma cuenta para enviarlas.</p>}
      {!context && <p className="empty">Conéctate y actualiza para cargar tus asignaciones. Los turnos preparados en este dispositivo siguen disponibles abajo.</p>}
      <button onClick={()=>exportPending(user.id).catch(e=>setError(api.errorMessage(e)))}>Exportar pendientes de esta cuenta</button>
      <Suspense fallback={<p role="status">Cargando vista…</p>}>
        {(tab === 'capture' || tab === 'review') && <>
          <div className="section-heading"><h1>{tab === 'capture' ? 'Registro de producción' : 'Revisión y cierre'}</h1><span>{tab === 'capture' ? 'Captura local con confirmación del servidor' : 'Verifica cantidades y autoriza la entrega'}</span></div>
          <section aria-labelledby="available-shifts"><h2 id="available-shifts">Turnos disponibles</h2>
            <div className="shift-picker">
              <label>Turno en este dispositivo<select value={active?.data.shift.id || ''} onChange={e => setSelected(e.target.value)}>
                {!visibleDocs.length && <option value="">No hay turnos preparados</option>}
                {visibleDocs.map(d => <option key={d.key} value={d.data.shift.id}>{d.data.line.name} · {d.data.shift.plan_snapshot.shift_name} · {d.data.shift.operational_date} · {shiftLabel(d.data.shift.status)}</option>)}
              </select></label>
              <label>{tab === 'capture' ? 'Preparar plan publicado' : 'Consultar turno del servidor'}<select defaultValue="" disabled={!online || busy || !lineId} onChange={e => { if(e.target.value) void prepare(e.target.value); e.target.value=''; }}>
                <option value="">Selecciona un turno</option>
                {(tab === 'capture' ? planList.filter(p => p.line_id===lineId && p.status === 'published') : planList.filter(p => p.line_id===lineId && shiftList.some(s => s.plan_id === p.id))).map(p =>
                  <option key={p.id} value={p.id}>{p.shift_name} · {p.sku} · {plantTime(p.starts_at, context?.plants.find(x=>x.id===plantId)?.timezone || 'UTC')}</option>)}
              </select></label>
            </div>
            {!lineId && <p>Selecciona una línea para consultar sus planes y turnos.</p>}
          </section>
          {active ? <Capture key={active.key} user={user} doc={active} queue={queue.filter(q=>q.shiftId===active.data.shift.id)} online={online} onRefresh={()=>prepare(active.data.shift.plan_id)}/> :
            <div className="empty"><ClipboardCheck size={32}/><p>Prepara un turno con conexión. Su plan y catálogos quedarán disponibles para capturar sin red.</p></div>}
        </>}
        {tab === 'planning' && context && <Planning context={context} lineId={lineId} onChanged={refresh}/>}
        {tab === 'admin' && context && <Administration context={context} onChanged={refresh}/>}
        {tab === 'report' && <Report lineId={lineId} plantId={plantId}/>}
        {tab === 'demo' && <><p className="notice">Demostración anterior: puede contener datos simulados. La captura productiva se realiza en la pestaña Captura.</p><Demonstration/></>}
      </Suspense>
    </main>
  </div>;
}
