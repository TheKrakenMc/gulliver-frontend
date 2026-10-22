import { useEffect, useState } from 'react';
import axios from 'axios';
import { api, origin, errorMessage } from './api';
import type { Bootstrap, User } from './types';

interface Credential {id:string;name:string;plant_ids:string[];revoked:boolean}
export default function Administration({context,onChanged}:{context:Bootstrap;onChanged:()=>Promise<void>}) {
  const [users,setUsers]=useState<{user:User;line_ids:string[]}[]>([]);
  const [credentials,setCredentials]=useState<Credential[]>([]);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [token,setToken]=useState('');
  const [busy,setBusy]=useState(false);
  async function load() {
    const [u,c]=await Promise.all([api.get('/users'),api.get('/service-credentials')]);
    setUsers(u.data);setCredentials(c.data);
  }
  useEffect(()=>{void load().catch(e=>setError(errorMessage(e)));},[]);
  async function submit(event:React.FormEvent<HTMLFormElement>, action:string) {
    event.preventDefault();setError('');setMessage('');setBusy(true);
    const form=event.currentTarget, data=new FormData(form);
    const text=(key:string)=>String(data.get(key)||'');
    try {
      if(action==='plant') await api.post('/plants',{name:text('name'),timezone:text('timezone')});
      if(action==='line') await api.post('/lines',{plant_id:text('plant_id'),name:text('name')});
      if(action==='catalog') await api.post('/catalog',{kind:text('kind'),name:text('name')});
      if(action==='user') await axios.post(origin+'/api/v1/auth/register',{employee_number:text('employee_number'),name:text('name'),password:text('password'),role:text('role')},{headers:{Authorization:'Bearer '+localStorage.getItem('gulliver_token')}});
      if(action==='assignment') await api.put('/users/'+text('user_id')+'/assignments',{line_ids:data.getAll('line_ids')});
      if(action==='credential') {
        const result=await api.post('/service-credentials',{name:text('name'),plant_ids:data.getAll('plant_ids')});
        setToken(result.data.token);
      }
      setMessage('Configuración guardada.');form.reset();await load();await onChanged();
    } catch(e){setError(errorMessage(e));}finally{setBusy(false);}
  }
  async function revoke(id:string) {
    try {await api.delete('/service-credentials/'+id);await load();}
    catch(e){setError(errorMessage(e));}
  }
  return <section><h1>Administración</h1><p>Configura plantas, líneas, cuentas y permisos antes de preparar los primeros turnos.</p>
    {error&&<p role="alert" className="notice error">{error}</p>}{message&&<p role="status" className="notice">{message}</p>}
    <div className="admin-sections">
      <form onSubmit={e=>submit(e,'plant')}><fieldset disabled={busy}><legend>Crear planta</legend><label>Nombre<input name="name" required maxLength={160}/></label><label>Zona horaria IANA<input name="timezone" required defaultValue="America/Mexico_City" list="plant-zones"/></label>
        <datalist id="plant-zones">{['America/Mexico_City','America/Monterrey','America/Tijuana','America/Chicago','America/New_York','America/Los_Angeles','America/Toronto','America/Vancouver'].map(z=><option key={z} value={z}/>)}</datalist><button>Crear planta</button></fieldset></form>
      <form onSubmit={e=>submit(e,'line')}><fieldset disabled={busy}><legend>Crear línea</legend><label>Planta<select required name="plant_id"><option value="">Selecciona</option>{context.plants.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Nombre<input name="name" required maxLength={160}/></label><button>Crear línea</button></fieldset></form>
      <form onSubmit={e=>submit(e,'catalog')}><fieldset disabled={busy}><legend>Agregar motivo al catálogo</legend><label>Tipo<select name="kind"><option value="scrap">Scrap</option><option value="downtime">Paro</option><option value="fault">Falla</option></select></label><label>Motivo<input name="name" required maxLength={160}/></label><button>Agregar motivo</button></fieldset></form>
      <form onSubmit={e=>submit(e,'user')}><fieldset disabled={busy}><legend>Crear cuenta individual</legend><label>Número de empleado<input name="employee_number" required maxLength={8}/></label><label>Nombre<input name="name" required minLength={2} maxLength={100}/></label><label>Contraseña inicial<input type="password" name="password" required minLength={12} maxLength={128} autoComplete="new-password"/></label><label>Rol<select name="role">{['Operador','Líder de Línea','Supervisor','Coordinador','Gerente','Administrador'].map(role=><option key={role}>{role}</option>)}</select></label><button>Crear cuenta</button></fieldset></form>
      <form onSubmit={e=>submit(e,'assignment')}><fieldset disabled={busy}><legend>Asignaciones por línea</legend><label>Persona<select required name="user_id"><option value="">Selecciona</option>{users.map(({user,line_ids})=><option key={user.id} value={user.id}>{user.name} · {user.role} · {line_ids.length} líneas</option>)}</select></label>
        <p>Selecciona el conjunto completo de líneas autorizadas. Guardar reemplaza las asignaciones anteriores.</p>
        {context.lines.map(l=><label className="check" key={l.id}><input type="checkbox" name="line_ids" value={l.id}/>{context.plants.find(p=>p.id===l.plant_id)?.name} / {l.name}</label>)}
        <button>Guardar asignaciones</button></fieldset></form>
      <form onSubmit={e=>submit(e,'credential')}><fieldset disabled={busy}><legend>Acceso de lectura para Power BI</legend><label>Nombre de integración<input name="name" required maxLength={160}/></label>{context.plants.map(p=><label className="check" key={p.id}><input name="plant_ids" type="checkbox" value={p.id}/>{p.name}</label>)}<button>Crear credencial de lectura</button></fieldset></form>
    </div>
    {token&&<div className="notice"><label>Credencial nueva: cópiala ahora y guárdala de forma segura<textarea readOnly value={token} rows={3}/></label><button onClick={()=>setToken('')}>Ocultar credencial</button></div>}
    <h2>Integraciones</h2><ul>{credentials.map(c=><li key={c.id}>{c.name} · {c.revoked?'Revocada':c.plant_ids.length+' plantas'} {!c.revoked&&<button onClick={()=>revoke(c.id)}>Revocar acceso de {c.name}</button>}</li>)}</ul>
  </section>;
}
