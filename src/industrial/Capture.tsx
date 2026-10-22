import { useEffect, useState } from 'react';
import type { Document, Pending, User, Operation, IntervalInput, Detail, AuditEntry } from './types';
import { enqueue, unresolved, resolve, readForm, saveForm, removeForm } from './offline';
import { readShift, errorMessage } from './api';
import { intervalsFor, plantTime } from './time';
import { shiftLabel } from './types';

function deviceId() {
  let value = localStorage.getItem('gulliver_device_id');
  if (!value) { value = crypto.randomUUID(); localStorage.setItem('gulliver_device_id', value); }
  return value;
}
export default function Capture({ user, doc, queue, online, onRefresh }: { user: User; doc: Document; queue: Pending[]; online: boolean; onRefresh: ()=>Promise<void> }) {
  const shift = doc.data.shift;
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [comparison, setComparison] = useState<Awaited<ReturnType<typeof readShift>>>();
  const [history, setHistory] = useState<AuditEntry[]>();
  const [confirmedAction, setConfirmedAction] = useState(false);
  const supervisor = ['Supervisor', 'Administrador'].includes(user.role);
  const canCapture = supervisor || (['Operador','Líder de Línea'].includes(user.role) && shift.owner_id === user.id);
  const remaining = queue.filter(unresolved);
  const blocked = remaining.some(o=>['error','conflict','auth'].includes(o.status));
  const slots = intervalsFor(shift);
  const slot = slots[selected] || slots[0];
  const interval = shift.intervals.find(i=>Date.parse(i.starts_at)===Date.parse(slot?.starts_at || ''));
  async function queueAction(kind: Operation['kind'], item?: IntervalInput, expectedVersion=shift.version) {
    setError(''); setBusy(true);
    try {
      await enqueue(user.id, shift.id, { id:crypto.randomUUID(), expected_version:expectedVersion, kind, device_id:deviceId(),
        captured_at:new Date().toISOString(), reason, ...(item?{interval:item}:{}) });
      setMessage('Guardado en este dispositivo. Pendiente de confirmación del servidor.');
      setReason(''); setConfirmedAction(false);
      return true;
    } catch(e) { setError(errorMessage(e)); return false; }
    finally { setBusy(false); }
  }
  async function compare() {
    setError('');
    try { setComparison(await readShift(shift.id)); }
    catch(e) { setError(errorMessage(e)); }
  }
  async function resolveConflict(reapply: boolean) {
    if (!comparison) return;
    setError('');
    try {
      if (!navigator.locks) throw new Error('Se requiere Web Locks.');
      await navigator.locks.request('gulliver-outbox-v2', async () => {
        await resolve(user.id, shift.id, comparison, reapply, reason);
      });
      setComparison(undefined); setReason('');
    } catch(e) { setError(errorMessage(e)); }
  }
  async function loadHistory() {
    try {
      const { api } = await import('./api');
      const items: AuditEntry[] = [];
      let cursor: number | null = 0;
      while (cursor !== null) {
        const response: { data: { items: AuditEntry[]; next_cursor: number | null } } = await api.get('/shifts/'+shift.id+'/audit', { params:{ cursor, limit:500 } });
        items.push(...response.data.items); cursor = response.data.next_cursor;
      }
      setHistory(items);
    } catch(e) { setError(errorMessage(e)); }
  }
  return <section className="capture-section" aria-labelledby="shift-heading">
    <div className="section-heading"><div><h2 id="shift-heading">{doc.data.plant.name} / {doc.data.line.name}</h2><p>{shift.plan_snapshot.shift_name} · {shift.operational_date} · {shift.plan_snapshot.sku}</p></div>
      <span className="status">{shiftLabel(shift.status)}{remaining.length ? ' · '+remaining.length+' envíos pendientes' : ' · Confirmado por servidor'}</span></div>
    <p>Horario de planta: {doc.data.plant.timezone}. Meta: {shift.plan_snapshot.target_per_hour} piezas/hora. Plan versión {shift.plan_snapshot.version}.</p>
    <div className="intervals" role="group" aria-label="Intervalos del turno">{slots.map((s,index)=>{
      const row = shift.intervals.find(i=>Date.parse(i.starts_at)===Date.parse(s.starts_at));
      return <button key={s.starts_at} aria-pressed={selected===index} onClick={()=>setSelected(index)}>
        {plantTime(s.starts_at,doc.data.plant.timezone)}<small>{row ? row.voided ? 'Anulado' : row.good+' buenas' : 'Sin capturar'}</small>
      </button>;
    })}</div>
    {error && <p role="alert" className="notice error">{error}</p>}
    {message && <p role="status" className="notice">{remaining.length ? message : 'Todos los envíos de este turno están confirmados por el servidor.'}</p>}
    {remaining.length>0 && <details open={blocked}><summary>Estado de {remaining.length} envíos · más antiguo hace {Math.max(0,Math.floor((Date.now()-Math.min(...remaining.map(q=>q.createdAt)))/60000))} min</summary><ul>{remaining.map(q=><li key={q.id}>{q.operation.kind} · {q.status} · {q.error || 'Pendiente de confirmación'}</li>)}</ul></details>}
    {blocked && online && <div className="conflict">
      <h3>Revisar envíos detenidos</h3><p>Los datos locales se conservan. Compara con el servidor antes de elegir los valores que continuarán.</p>
      <button onClick={compare}>Comparar con servidor</button>
      {comparison && <><div className="comparison"><div><h4>Este dispositivo</h4><p>{shiftLabel(shift.status)} · {shift.intervals.reduce((n,i)=>n+i.good,0)} buenas</p></div>
        <div><h4>Servidor</h4><p>{shiftLabel(comparison.status)} · {comparison.intervals.reduce((n,i)=>n+i.good,0)} buenas · revisión {comparison.version}</p></div></div>
        <label>Motivo de resolución<textarea value={reason} minLength={5} onChange={e=>setReason(e.target.value)}/></label>
        <button disabled={reason.trim().length<5 || comparison.status!=='open'} onClick={()=>resolveConflict(true)}>Reaplicar mis capturas sobre esta revisión</button>
        <button disabled={reason.trim().length<5} onClick={()=>resolveConflict(false)}>Conservar valores del servidor y archivar pendientes locales</button>
      </>}
    </div>}
    {slot && <IntervalEditor key={shift.id+':'+selected+':'+shift.version} userId={user.id} shiftId={shift.id}
      initial={interval} shiftVersion={shift.version} slot={slot} catalog={doc.data.catalog} editable={canCapture && !blocked && (shift.status==='open' || (shift.status==='closed' && supervisor && online && !remaining.length))}
      correction={shift.status==='closed'} busy={busy} onSave={(item,version)=>queueAction(shift.status==='closed'?'correct':'capture',item,version)} reason={reason} onReason={setReason}/>}
    <div className="shift-actions">
      {shift.status==='open' && canCapture && <><label className="check"><input type="checkbox" checked={confirmedAction} onChange={e=>setConfirmedAction(e.target.checked)}/>Verifiqué los intervalos y las cantidades del turno.</label>
        <button className="primary" disabled={busy || blocked || !confirmedAction || slots.some(s=>!shift.intervals.some(i=>!i.voided && Date.parse(i.starts_at)===Date.parse(s.starts_at)))} onClick={()=>queueAction('submit')}>Enviar turno a revisión{online?'':' al recuperar conexión'}</button></>}
      {shift.status==='submitted' && supervisor && <><label>Motivo de devolución<textarea value={reason} onChange={e=>setReason(e.target.value)} /></label>
        <button disabled={!online || remaining.length>0 || busy || reason.trim().length<5} onClick={()=>queueAction('return')}>Devolver al operador</button>
        <label className="check"><input type="checkbox" checked={confirmedAction} onChange={e=>setConfirmedAction(e.target.checked)}/>Revisé la captura completa y autorizo el cierre.</label>
        <button className="primary" disabled={!online || remaining.length>0 || busy || !confirmedAction} onClick={()=>queueAction('close')}>Autorizar cierre definitivo</button></>}
      <button disabled={!online || remaining.length>0 || busy} onClick={onRefresh}>Actualizar turno del servidor</button>
      <button disabled={!online} onClick={loadHistory}>Consultar historial de cambios</button>
    </div>
    {history && <details open><summary>Historial de cambios</summary><div className="table-scroll"><table><thead><tr><th>Hora</th><th>Persona</th><th>Acción</th><th>Antes</th><th>Después</th><th>Motivo</th></tr></thead><tbody>{history.map(entry=><tr key={entry.sequence}><td>{plantTime(entry.occurred_at,doc.data.plant.timezone)}</td><td>{entry.actor_name}</td><td>{{prepared:'Preparación',capture:'Captura',submit:'Envío',return:'Devolución',close:'Cierre',correct:'Corrección'}[entry.action] || entry.action}</td><td>{historyTotals(entry.before)}</td><td>{historyTotals(entry.after)}</td><td>{entry.reason || '—'}</td></tr>)}</tbody></table></div></details>}
  </section>;
}

interface Values { good: string; comments: string; details: Detail[]; voided: boolean }
function IntervalEditor({ userId, shiftId, initial, shiftVersion, slot, catalog, editable, correction, busy, onSave, reason, onReason }: {
  userId:number; shiftId:string; initial?: IntervalInput; shiftVersion:number; slot:{starts_at:string;ends_at:string}; catalog:Document['data']['catalog']; editable:boolean;
  correction:boolean; busy:boolean; onSave:(item:IntervalInput,version:number)=>Promise<boolean>; reason:string; onReason:(value:string)=>void;
}) {
  const key = userId+':'+shiftId+':'+slot.starts_at;
  const [values,setValues] = useState<Values>({ good:initial?String(initial.good):'', comments:initial?.comments || '', details:initial?.details.map(d=>({
    catalog_id:d.catalog_id, kind:d.kind, quantity:d.quantity, duration_min:d.duration_min, comment:d.comment,
  })) || [], voided:initial?.voided || false });
  const [error,setError] = useState('');
  const [baseVersion,setBaseVersion] = useState(shiftVersion);
  const [restored,setRestored] = useState(false);
  useEffect(()=>{
    let alive=true;
    void readForm(key).then(draft=>{
      if(alive && draft) { const saved=draft as {values:Values;version:number}; if(saved.values){setValues(saved.values);setBaseVersion(saved.version);} }
    }).catch(e=>setError(errorMessage(e))).finally(()=>{if(alive)setRestored(true);});
    return ()=>{alive=false;};
  },[key]);
  async function change(next:Values) {
    setValues(next);
    try { await saveForm(key,userId,{values:next,version:baseVersion}); }
    catch(e) { setError('No se pudo guardar el borrador local: '+errorMessage(e)); }
  }
  async function submit(event:React.FormEvent) {
    event.preventDefault(); setError('');
    const good=Number(values.good);
    if(values.good==='' || !Number.isInteger(good) || good<0) { setError('Ingresa una cantidad entera, incluido cero si no hubo producción.'); return; }
    const scrap=values.details.reduce((n,d)=>n+d.quantity,0);
    const downtime=values.details.reduce((n,d)=>n+d.duration_min,0);
    if(downtime>(Date.parse(slot.ends_at)-Date.parse(slot.starts_at))/60000) { setError('Los paros exceden la duración del intervalo.'); return; }
    if(await onSave({id:initial?.id || crypto.randomUUID(), ...slot, good, scrap, downtime_min:downtime, details:values.details,comments:values.comments,voided:values.voided},baseVersion)) await removeForm(key);
  }
  const scrap=values.details.reduce((n,d)=>n+d.quantity,0);
  const downtime=values.details.reduce((n,d)=>n+d.duration_min,0);
  return <form className="interval-form" onSubmit={submit}>
    <h3>{correction?'Corrección supervisada del intervalo':'Captura del intervalo'}</h3>
    {!editable && <p>Este intervalo es de consulta. El turno enviado o cerrado requiere revisión del supervisor.</p>}
    <fieldset disabled={!editable || busy || !restored}>
      <div className="form-grid"><label>Piezas buenas<input type="number" inputMode="numeric" required min={0} max={1000000} step={1} value={values.good} onChange={e=>change({...values,good:e.target.value})}/></label>
        <div className="reconciliation"><span>Scrap: <strong>{scrap}</strong></span><span>Paros y fallas: <strong>{downtime} min</strong></span></div></div>
      <h4>Scrap, paros y fallas</h4>
      {values.details.map((detail,index)=><div className="detail-row" key={index}>
        <label>Motivo<select required value={detail.catalog_id} onChange={e=>{
          const item=catalog.find(c=>c.id===e.target.value);
          if(item) void change({...values,details:values.details.map((d,i)=>i===index?{...d,catalog_id:item.id,kind:item.kind,quantity:item.kind==='scrap'?1:0,duration_min:item.kind==='scrap'?0:1}:d)});
        }}><option value="">Selecciona un motivo</option>{catalog.map(c=><option key={c.id} value={c.id}>{c.kind==='scrap'?'Scrap':c.kind==='fault'?'Falla':'Paro'} · {c.name}</option>)}</select></label>
        <label>{detail.kind==='scrap'?'Piezas':'Minutos'}<input type="number" required min={1} max={detail.kind==='scrap'?1000000:60} step={1} inputMode="numeric" value={detail.kind==='scrap'?detail.quantity:detail.duration_min} onChange={e=>change({...values,details:values.details.map((d,i)=>i===index?{...d,[d.kind==='scrap'?'quantity':'duration_min']:Number(e.target.value)}:d)})}/></label>
        <button type="button" onClick={()=>change({...values,details:values.details.filter((_,i)=>i!==index)})}>Quitar motivo {index+1}</button>
      </div>)}
      <button type="button" disabled={catalog.length===0} onClick={()=>change({...values,details:[...values.details,{catalog_id:'',kind:'scrap',quantity:1,duration_min:0,comment:''}]})}>Agregar scrap, paro o falla</button>
      {!catalog.length && <p>Solicita al administrador configurar el catálogo antes de registrar pérdidas.</p>}
      <label>Observaciones<textarea maxLength={2000} value={values.comments} onChange={e=>change({...values,comments:e.target.value})}/></label>
      {correction && <><label>Motivo de corrección<textarea required minLength={5} value={reason} onChange={e=>onReason(e.target.value)}/></label>
        <label className="check"><input type="checkbox" checked={values.voided} onChange={e=>change({...values,voided:e.target.checked})}/>Anular este intervalo conservando su historial</label></>}
      <button className="primary" type="submit" disabled={baseVersion!==shiftVersion || (correction && reason.trim().length<5)}>{busy?'Guardando…':correction?'Guardar corrección auditada':'Guardar captura en este dispositivo'}</button>
    </fieldset>
    {baseVersion!==shiftVersion && <div className="notice error" role="alert"><p>El turno cambió mientras editabas. Tu borrador se conserva. Revisa las cantidades actuales antes de aplicarlo.</p><p>Registro actual: {initial?.good ?? 'Sin captura'} buenas, {initial?.scrap ?? 0} scrap y {initial?.downtime_min ?? 0} minutos.</p><button type="button" onClick={()=>{setBaseVersion(shiftVersion);void saveForm(key,userId,{values,version:shiftVersion});}}>Revisé el cambio; conservar mi borrador sobre esta revisión</button></div>}
    {error && <p role="alert" className="notice error">{error}</p>}
  </form>;
}

function historyTotals(shift: import('./types').Shift | null) {
  if(!shift) return 'Sin registro';
  const rows=shift.intervals.filter(i=>!i.voided);
  return shiftLabel(shift.status)+' · '+rows.reduce((n,i)=>n+i.good,0)+' buenas / '+rows.reduce((n,i)=>n+i.scrap,0)+' scrap / '+rows.reduce((n,i)=>n+i.downtime_min,0)+' min';
}
