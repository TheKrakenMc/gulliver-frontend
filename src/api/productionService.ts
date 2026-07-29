import axiosClient from './axiosClient';
import type { PlanRecord, HourRecord, OperativeRecord } from '../types';

const appendExactIsoDateParams = (params: URLSearchParams, startDate?: string, endDate?: string) => {
  if (startDate) {
    const s = new Date(startDate + "T00:00:00");
    params.append('start_date', s.toISOString());
  }
  if (endDate) {
    const e = new Date(endDate + "T23:59:59.999");
    params.append('end_date', e.toISOString());
  }
};

export const getLogisticPlans = async (startDate?: string, endDate?: string): Promise<PlanRecord[]> => {
  const params = new URLSearchParams();
  appendExactIsoDateParams(params, startDate, endDate);
  const { data } = await axiosClient.get<any[]>(`/logistic-plans/?${params.toString()}`);
  
  const mapped = data.map(item => {
    // Convert UTC timestamps back to local strings
    const startObj = new Date(item.start_time);
    const endObj = new Date(item.end_time);
    const getLocalDateString = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const getLocalTimeString = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    
    return {
      ...item,
      id_plan: item.id_plan || item.id,
      fecha: getLocalDateString(startObj),
      slot: { start: getLocalTimeString(startObj), end: getLocalTimeString(endObj) }
    };
  });

  return mapped;
};

export const createLogisticPlan = async (plan: Omit<PlanRecord, 'id_plan' | 'created_at'>): Promise<PlanRecord> => {
  // Backend model uses 'id' instead of 'id_plan', so we might need mapping if the types differ
  // Based on schemas/production.py, the backend expects LogisticPlanCreate:
  // fecha, planta, linea, turno, slot_start, slot_end, sku, target_hr, creado_por, status, id
  const start_time = new Date(`${plan.fecha}T${plan.slot.start}:00`).toISOString();
  
  // Calculate end_time
  let endObj = new Date(`${plan.fecha}T${plan.slot.end}:00`);
  if (plan.slot.end < plan.slot.start) {
    // Crosses midnight, add 1 day
    endObj.setDate(endObj.getDate() + 1);
  }
  const end_time = endObj.toISOString();

  const payload = {
    id: `PLAN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    start_time,
    end_time,
    planta: plan.planta,
    linea: plan.linea,
    turno: plan.turno,
    sku: plan.sku,
    target_hr: plan.target_hr,
    creado_por: plan.creado_por,
    status: plan.status
  };

  const { data } = await axiosClient.post('/logistic-plans/', payload);
  return {
    ...plan,
    id_plan: data.id,
    created_at: data.created_at || new Date().toISOString()
  };
};

export const updateLogisticPlan = async (planId: string, plan: Partial<PlanRecord>): Promise<PlanRecord> => {
  const payload: any = { ...plan };
  if (plan.fecha && plan.slot) {
    payload.start_time = new Date(`${plan.fecha}T${plan.slot.start}:00`).toISOString();
    let endObj = new Date(`${plan.fecha}T${plan.slot.end}:00`);
    if (plan.slot.end < plan.slot.start) {
      endObj.setDate(endObj.getDate() + 1);
    }
    payload.end_time = endObj.toISOString();
  }
  const { data } = await axiosClient.put(`/logistic-plans/${planId}`, payload);
  return { ...plan, id_plan: data.id } as PlanRecord;
};

export const deleteLogisticPlan = async (planId: string): Promise<void> => {
  await axiosClient.delete(`/logistic-plans/${planId}`);
};

// -- Hour Records --
export const getHourRecords = async (startDate?: string, endDate?: string): Promise<HourRecord[]> => {
  const params = new URLSearchParams();
  appendExactIsoDateParams(params, startDate, endDate);
  const { data } = await axiosClient.get(`/production-records/hour?${params.toString()}`);
  return data.map((r: any) => ({
    id: r.id,
    hour: r.hour,
    target: r.target,
    actualOK: r.actual_ok,
    scrap: r.scrap,
    downtime: r.downtime,
    comments: r.comments,
    oeeLoss: r.oee_loss,
    deviationNotified: r.deviation_notified,
    plan_id: r.plan_id
  }));
};

export const createHourRecord = async (planId: string, record: HourRecord): Promise<HourRecord> => {
  const payload = {
    id: `HR-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    plan_id: planId,
    hour: record.hour,
    target: record.target,
    actual_ok: record.actualOK,
    scrap: record.scrap,
    downtime: record.downtime,
    comments: record.comments,
    oee_loss: record.oeeLoss,
    deviation_notified: record.deviationNotified
  };
  const { data } = await axiosClient.post('/production-records/hour', payload);
  return { ...record, id: data.id || payload.id, plan_id: planId };
};

export const updateHourRecord = async (recordId: string, record: Partial<HourRecord>): Promise<HourRecord> => {
  const payload: any = {};
  if (record.actualOK !== undefined) payload.actual_ok = record.actualOK;
  if (record.scrap !== undefined) payload.scrap = record.scrap;
  if (record.downtime !== undefined) payload.downtime = record.downtime;
  if (record.comments !== undefined) payload.comments = record.comments;
  if (record.oeeLoss !== undefined) payload.oee_loss = record.oeeLoss;
  if (record.deviationNotified !== undefined) payload.deviation_notified = record.deviationNotified;

  const { data } = await axiosClient.put(`/production-records/hour/${recordId}`, payload);
  return record as HourRecord; // mapping would ideally be more robust
};

// -- Operative Records --
export const getOperativeRecords = async (startDate?: string, endDate?: string): Promise<any[]> => {
  const params = new URLSearchParams();
  appendExactIsoDateParams(params, startDate, endDate);
  const { data } = await axiosClient.get(`/production-records/operative?${params.toString()}`);
  return data.map((item: any) => {
    const dateStr = item.date ? item.date.split('T')[0] : item.date;
    return { ...item, date: dateStr };
  });
};

export const updateOperativeRecordStatus = async (recordId: string, status: string): Promise<any> => {
  const { data } = await axiosClient.put(`/production-records/operative/${recordId}`, { status });
  return data;
};

// -- Fault Records --
export const getFaultRecords = async (startDate?: string, endDate?: string): Promise<any[]> => {
  const params = new URLSearchParams();
  appendExactIsoDateParams(params, startDate, endDate);
  const { data } = await axiosClient.get(`/fault-records/?${params.toString()}`);
  return data;
};

export const createFaultRecord = async (record: any): Promise<any> => {
  const { data } = await axiosClient.post('/fault-records/', record);
  return data;
};

export const updateFaultRecord = async (recordId: string, record: any): Promise<any> => {
  const { data } = await axiosClient.put(`/fault-records/${recordId}`, record);
  return data;
};

// -- Scrap Records --
export const getScrapRecords = async (startDate?: string, endDate?: string): Promise<any[]> => {
  const params = new URLSearchParams();
  appendExactIsoDateParams(params, startDate, endDate);
  const { data } = await axiosClient.get(`/production-records/scrap?${params.toString()}`);
  return data;
};

export const createScrapRecord = async (record: any): Promise<any> => {
  const { data } = await axiosClient.post('/production-records/scrap', record);
  return data;
};

export const updateScrapRecord = async (recordId: string, record: any): Promise<any> => {
  const { data } = await axiosClient.put(`/production-records/scrap/${recordId}`, record);
  return data;
};

// -- Downtime Records --
export const getDowntimeRecords = async (startDate?: string, endDate?: string): Promise<any[]> => {
  const params = new URLSearchParams();
  appendExactIsoDateParams(params, startDate, endDate);
  const { data } = await axiosClient.get(`/production-records/downtime?${params.toString()}`);
  return data;
};

export const createDowntimeRecord = async (record: any): Promise<any> => {
  const { data } = await axiosClient.post('/production-records/downtime', record);
  return data;
};

export const updateDowntimeRecord = async (recordId: string, record: any): Promise<any> => {
  const { data } = await axiosClient.put(`/production-records/downtime/${recordId}`, record);
  return data;
};
