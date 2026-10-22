import { describe, it, expect, vi } from 'vitest';
import { savePrepared, documents, pending, enqueue, unresolved, setOperation, resolve } from '../../src/industrial/offline';
import { processQueue } from '../../src/industrial/sync';
import type { Prepared, Operation, Shift } from '../../src/industrial/types';

let nextUser = 100;
function prepared(userId:number):Prepared {
  const plan={id:crypto.randomUUID(),line_id:'line',sku:'SKU',shift_name:'Noche',starts_at:'2026-10-20T22:00:00-06:00',ends_at:'2026-10-21T06:00:00-06:00',target_per_hour:60,status:'published' as const,version:1,operational_date:'2026-10-20'};
  return {prepared_by:userId,prepared_at:new Date().toISOString(),plant:{id:'plant',name:'Planta',timezone:'America/Mexico_City'},line:{id:'line',name:'Línea',plant_id:'plant'},catalog:[],
    shift:{id:crypto.randomUUID(),plan_id:plan.id,line_id:'line',owner_id:userId,operational_date:'2026-10-20',status:'open',version:1,plan_snapshot:plan,updated_at:new Date().toISOString(),intervals:[]}};
}
function capture(shift:Shift):Operation {
  return {id:crypto.randomUUID(),expected_version:shift.version,kind:'capture',device_id:'tablet',captured_at:new Date().toISOString(),reason:'',
    interval:{id:crypto.randomUUID(),starts_at:shift.plan_snapshot.starts_at,ends_at:'2026-10-20T23:00:00-06:00',good:50,scrap:0,downtime_min:0,details:[],comments:'',voided:false}};
}
describe('durable outbox',()=>{
  it('isolates identities and prevents two stale tabs overwriting the same draft',async()=>{
    const user=nextUser++,data=prepared(user);await savePrepared(user,data);
    const op=capture(data.shift);await enqueue(user,data.shift.id,op);
    await expect(enqueue(user,data.shift.id,capture(data.shift))).rejects.toThrow('otra pestaña');
    expect((await documents(user))[0].data.shift.intervals[0].good).toBe(50);
    expect(await documents(user+1000)).toEqual([]);
    expect(await pending(user+1000)).toEqual([]);
    await expect(savePrepared(user,data)).rejects.toThrow('pendientes');
  });
  it('retries the same UUID after a server commit followed by timeout',async()=>{
    const user=nextUser++,data=prepared(user);await savePrepared(user,data);const op=capture(data.shift);await enqueue(user,data.shift.id,op);
    let committed: {operation_id:string;shift:Shift}|undefined;
    const transport=vi.fn(async(_shiftId:string,operation:Operation)=>{
      if(!committed) {
        committed={operation_id:operation.id,shift:{...(await documents(user))[0].data.shift}};
        throw new Error('timeout after commit');
      }
      return committed;
    });
    await processQueue(user,transport);
    const queue=await pending(user);expect(queue[0].status).toBe('pending');
    await setOperation({...queue[0],nextAttempt:0});
    await processQueue(user,transport);
    expect(transport.mock.calls[0][1].id).toBe(transport.mock.calls[1][1].id);
    expect((await pending(user)).filter(unresolved)).toHaveLength(0);
    expect((await documents(user))[0].confirmed.intervals).toHaveLength(1);
  });
  it('retains validation failures and blocks later operations for that shift',async()=>{
    const user=nextUser++,data=prepared(user);await savePrepared(user,data);await enqueue(user,data.shift.id,capture(data.shift));
    const current=(await documents(user))[0].data.shift;await enqueue(user,data.shift.id,capture(current));
    const transport=vi.fn(async()=>{throw {isAxiosError:true,response:{status:422,data:{detail:'Invalid catalog'}}};});
    await processQueue(user,transport);expect(transport).toHaveBeenCalledTimes(1);
    expect((await pending(user)).filter(unresolved)).toHaveLength(2);
    expect((await pending(user))[0].status).toBe('error');
  });
  it('retains expired-session operations until the same user authenticates',async()=>{
    const user=nextUser++,data=prepared(user);await savePrepared(user,data);await enqueue(user,data.shift.id,capture(data.shift));
    await processQueue(user,async()=>{throw {isAxiosError:true,response:{status:401,data:{}}};});
    expect((await pending(user))[0].status).toBe('auth');
    expect((await documents(user))[0].data.shift.intervals).toHaveLength(1);
  });
  it('archives the original conflict and explicitly reapplies with a new key',async()=>{
    const user=nextUser++,data=prepared(user);await savePrepared(user,data);const op=capture(data.shift);await enqueue(user,data.shift.id,op);
    await processQueue(user,async()=>{throw {isAxiosError:true,response:{status:409,data:{}}};});
    await resolve(user,data.shift.id,{...data.shift,version:9},true,'Operator verified both records');
    const ops=await pending(user);
    expect(ops.find(o=>o.id===op.id)?.status).toBe('superseded');
    const next=ops.find(unresolved)!;expect(next.operation.expected_version).toBe(9);expect(next.id).not.toBe(op.id);
  });
});
