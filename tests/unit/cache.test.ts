import { beforeEach, it, expect, vi } from 'vitest';
vi.mock('../../src/api/productionService',()=>({
  getLogisticPlans:vi.fn(),getHourRecords:vi.fn(),getFaultRecords:vi.fn(),getScrapRecords:vi.fn(),getDowntimeRecords:vi.fn(),getOperativeRecords:vi.fn(),
}));
import { getLogisticPlans } from '../../src/api/productionService';
import { useProductionStore } from '../../src/store/productionStore';
beforeEach(()=>{
  vi.clearAllMocks();
  localStorage.setItem('gulliver_auth_session',JSON.stringify({id:1,role:'Administrador'}));
  useProductionStore.getState().invalidateCache('all');
});
it('separates caches across identities',async()=>{
  vi.mocked(getLogisticPlans).mockResolvedValue([]);
  await useProductionStore.getState().fetchPlans('2026-10-20','2026-10-25');
  localStorage.setItem('gulliver_auth_session',JSON.stringify({id:2,role:'Administrador'}));
  await useProductionStore.getState().fetchPlans('2026-10-20','2026-10-25');
  expect(getLogisticPlans).toHaveBeenCalledTimes(2);
});
it('invalidates a cached range overlapping a changed day',async()=>{
  vi.mocked(getLogisticPlans).mockResolvedValue([]);
  await useProductionStore.getState().fetchPlans('2026-10-20','2026-10-25');
  useProductionStore.getState().invalidateByDateRange('2026-10-22','2026-10-22');
  await useProductionStore.getState().fetchPlans('2026-10-20','2026-10-25');
  expect(getLogisticPlans).toHaveBeenCalledTimes(2);
});
it('does not repopulate an invalidated cache with an old response',async()=>{
  let release:(value:[])=>void=()=>{};
  vi.mocked(getLogisticPlans).mockImplementationOnce(()=>new Promise(resolve=>{release=resolve;}));
  const old=useProductionStore.getState().fetchPlans('2026-10-20','2026-10-25');
  useProductionStore.getState().invalidateCache('all');
  release([]);await old;
  expect(useProductionStore.getState().plansCache).toEqual({});
});
