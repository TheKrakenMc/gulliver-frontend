import { useEffect, useState } from 'react';
import { summary, errorMessage } from './api';
import type { Summary } from './types';
export default function Report({lineId,plantId}:{lineId:string;plantId:string}) {
  const [data,setData]=useState<Summary>();
  const [error,setError]=useState('');
  const [lastUpdated,setLastUpdated]=useState('');
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    let alive=true;
    const load=async()=>{
      try { const next=await summary(lineId || undefined,undefined,plantId || undefined); if(alive){setData(next);setError('');setLastUpdated(new Date().toLocaleTimeString('es-MX'));} }
      catch(e){if(alive)setError(errorMessage(e));}
    };
    void load();
    const timer=window.setInterval(()=>{if(document.visibilityState==='visible' && navigator.onLine)void load();},30000);
    return ()=>{alive=false;clearInterval(timer);};
  },[lineId,plantId,refresh]);
  return <section><div className="section-heading"><h1>Resultados de producción</h1><button onClick={()=>setRefresh(n=>n+1)}>Actualizar resultados</button></div>
    <p>{lineId?'Línea seleccionada':plantId?'Planta seleccionada':'Todas tus plantas y líneas asignadas'} · Actualización cada 30 segundos mientras esta vista esté visible.</p>
    {error&&<p role="alert" className="notice error">{error} Los últimos resultados pueden estar desactualizados.</p>}
    {data?<><p>Última consulta confirmada: {lastUpdated}. {data.provisional_intervals} intervalos de turnos aún no cerrados.</p>
      <div className="table-scroll"><table><caption>Totales registrados, incluidos datos provisionales</caption><thead><tr><th>Buenas</th><th>Scrap</th><th>Paros y fallas</th><th>Meta de intervalos capturados</th><th>Cumplimiento</th></tr></thead><tbody><tr><td>{data.good.toLocaleString('es-MX')}</td><td>{data.scrap.toLocaleString('es-MX')}</td><td>{data.downtime_min} min</td><td>{data.target.toLocaleString('es-MX')}</td><td>{data.compliance_pct===null?'Sin meta':data.compliance_pct.toFixed(1)+'%'}</td></tr></tbody></table></div>
      <p>OEE provisional: pendiente de aprobación de fórmula por producción. El cumplimiento compara piezas buenas con la meta de los intervalos capturados.</p>
      {!data.intervals&&<p className="empty">Todavía no hay intervalos confirmados en este alcance. Un cero total no indica un turno capturado.</p>}
    </>:<p role="status">Consultando resultados…</p>}
  </section>;
}
