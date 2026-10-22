import { useEffect, useState } from 'react';
import { api, plans, errorMessage } from './api';
import { plantTime, possibleInstants } from './time';
import type { Bootstrap, Plan } from './types';

export default function Planning({context,lineId,onChanged}:{context:Bootstrap;lineId:string;onChanged:()=>Promise<void>}) {
  const [list,setList]=useState<Plan[]>([]);
  const [sku,setSku]=useState('');
  const [name,setName]=useState('');
  const [start,setStart]=useState('');
  const [end,setEnd]=useState('');
  const [startOccurrence,setStartOccurrence]=useState('0');
  const [endOccurrence,setEndOccurrence]=useState('0');
  const [target,setTarget]=useState('');
  const [editing,setEditing]=useState<Plan>();
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const plant=context.plants.find(p=>p.id===context.lines.find(l=>l.id===lineId)?.plant_id);
  const zone=plant?.timezone || 'UTC';
  const starts=possibleInstants(start,zone), ends=possibleInstants(end,zone);
  async function load() { if(lineId) setList(await plans(lineId)); }
  useEffect(()=>{
    let alive=true;
    if(lineId) void plans(lineId).then(items=>{if(alive)setList(items);}).catch(e=>setError(errorMessage(e)));
    return ()=>{alive=false;};
  },[lineId]);
  async function save(event:React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if(!lineId || !starts.length || !ends.length) throw new Error('Selecciona una línea y horarios válidos en la zona de la planta. La hora indicada puede no existir por cambio de horario.');
      const body={line_id:lineId,sku,shift_name:name,starts_at:starts[Number(startOccurrence)],ends_at:ends[Number(endOccurrence)],target_per_hour:Number(target)};
      if(editing) await api.put('/plans/'+editing.id,{...body,expected_version:editing.version,status:editing.status});
      else await api.post('/plans',body);
      setMessage('Plan publicado. Los operadores asignados ya pueden preparar el turno.');
      setEditing(undefined); setSku(''); setName(''); setStart(''); setEnd(''); setTarget('');
      await load(); await onChanged();
    } catch(e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  }
  async function cancel(plan:Plan) {
    try {
      const {line_id,sku,shift_name,starts_at,ends_at,target_per_hour}=plan;
      await api.put('/plans/'+plan.id,{line_id,sku,shift_name,starts_at,ends_at,target_per_hour,expected_version:plan.version,status:'cancelled'});
      await load();
    } catch(e) {setError(errorMessage(e));}
  }
  function edit(plan:Plan) {
    setEditing(plan); setSku(plan.sku); setName(plan.shift_name); setTarget(String(plan.target_per_hour));
    const local=(value:string)=>new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value)).replace(' ','T');
    const localStart=local(plan.starts_at), localEnd=local(plan.ends_at);
    setStart(localStart);setEnd(localEnd);
    setStartOccurrence(String(possibleInstants(localStart,zone).findIndex(v=>Date.parse(v)===Date.parse(plan.starts_at))));
    setEndOccurrence(String(possibleInstants(localEnd,zone).findIndex(v=>Date.parse(v)===Date.parse(plan.ends_at))));
  }
  return <section><h1>Planeación de producción</h1><p>{plant?plant.name+' · '+zone:'Selecciona planta y línea para planear.'}</p>
    {error&&<p role="alert" className="notice error">{error}</p>}{message&&<p role="status" className="notice">{message}</p>}
    <form onSubmit={save}><fieldset disabled={!lineId||busy}><legend>{editing?'Editar plan':'Publicar un turno'}</legend>
      <div className="form-grid"><label>Producto / SKU<input required maxLength={160} value={sku} onChange={e=>setSku(e.target.value)}/></label>
        <label>Nombre del turno<input required maxLength={80} value={name} onChange={e=>setName(e.target.value)}/></label>
        <label>Inicio, hora de planta<input type="datetime-local" required value={start} onChange={e=>{setStart(e.target.value);setStartOccurrence('0');}}/></label>
        <label>Fin, hora de planta<input type="datetime-local" required value={end} onChange={e=>{setEnd(e.target.value);setEndOccurrence('0');}}/></label>
        {starts.length>1&&<label>La hora de inicio se repite<select value={startOccurrence} onChange={e=>setStartOccurrence(e.target.value)}>{starts.map((s,i)=><option key={s} value={i}>{plantTime(s,zone)} · ocurrencia {i+1}</option>)}</select></label>}
        {ends.length>1&&<label>La hora de fin se repite<select value={endOccurrence} onChange={e=>setEndOccurrence(e.target.value)}>{ends.map((s,i)=><option key={s} value={i}>{plantTime(s,zone)} · ocurrencia {i+1}</option>)}</select></label>}
        <label>Meta por hora<input type="number" required inputMode="numeric" min={0} max={1000000} step={1} value={target} onChange={e=>setTarget(e.target.value)}/></label></div>
      <button className="primary">{busy?'Guardando…':editing?'Guardar revisión del plan':'Publicar turno'}</button>
      {editing&&<button type="button" onClick={()=>setEditing(undefined)}>Cancelar edición</button>}
    </fieldset></form>
    <h2>Planes de esta línea</h2>{list.length?<div className="table-scroll"><table><thead><tr><th>Turno</th><th>Producto</th><th>Inicio</th><th>Meta/h</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{list.map(p=><tr key={p.id}><td>{p.shift_name}</td><td>{p.sku}</td><td>{plantTime(p.starts_at,zone)}</td><td>{p.target_per_hour}</td><td>{p.status==='published'?'Publicado':'Cancelado'}</td><td><button onClick={()=>edit(p)}>Editar</button>{p.status==='published'&&<button onClick={()=>cancel(p)}>Cancelar plan</button>}</td></tr>)}</tbody></table></div>:<p>No hay planes publicados en esta línea.</p>}
  </section>;
}
