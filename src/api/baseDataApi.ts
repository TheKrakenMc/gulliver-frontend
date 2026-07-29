import axiosClient from './axiosClient';
import type {
  HierarchyLocation,
  BaseLocation, BaseBusinessUnit, BaseProcess,
  BaseProduct, BaseSector, BaseClient, ClientWithSector,
  BaseMachine, BaseMaintenanceCategory,
  BaseAssetFamily, BaseAssetFault, BaseScrapDefect
} from '../types';

export const baseDataApi = {
  // ── Cache for UI Optimization ──
  getCachedMachines: () => (window as any)._gulliverMachinesCache || null,
  getCachedCategories: () => (window as any)._gulliverCategoriesCache || null,
  getCachedAssetFamilies: () => (window as any)._gulliverAssetFamiliesCache || null,

  // ── Hierarchy ──
  getHierarchy: async (): Promise<HierarchyLocation[]> => {
    const response = await axiosClient.get('/config/hierarchy');
    return response.data;
  },

  // ── Locations ──
  getLocations: async (): Promise<BaseLocation[]> => {
    const response = await axiosClient.get('/config/locations');
    return response.data;
  },
  createLocation: async (data: Omit<BaseLocation, 'id'>): Promise<BaseLocation> => {
    const response = await axiosClient.post('/config/locations', data);
    return response.data;
  },
  updateLocation: async (id: string, data: { name: string }): Promise<BaseLocation> => {
    const response = await axiosClient.put(`/config/locations/${id}`, data);
    return response.data;
  },
  deleteLocation: async (id: string): Promise<void> => {
    await axiosClient.delete(`/config/locations/${id}`);
  },

  // ── Business Units ──
  getBusinessUnits: async (locationId?: string): Promise<BaseBusinessUnit[]> => {
    const params = locationId ? { location_id: locationId } : {};
    const response = await axiosClient.get('/config/business-units', { params });
    return response.data;
  },
  createBusinessUnit: async (data: Omit<BaseBusinessUnit, 'id'>): Promise<BaseBusinessUnit> => {
    const response = await axiosClient.post('/config/business-units', data);
    return response.data;
  },
  updateBusinessUnit: async (id: string, data: { name: string }): Promise<BaseBusinessUnit> => {
    const response = await axiosClient.put(`/config/business-units/${id}`, data);
    return response.data;
  },
  deleteBusinessUnit: async (id: string): Promise<void> => {
    await axiosClient.delete(`/config/business-units/${id}`);
  },

  // ── Processes ──
  getProcesses: async (businessUnitId?: string): Promise<BaseProcess[]> => {
    const params = businessUnitId ? { business_unit_id: businessUnitId } : {};
    const response = await axiosClient.get('/config/processes', { params });
    return response.data;
  },
  createProcess: async (data: Omit<BaseProcess, 'id'>): Promise<BaseProcess> => {
    const response = await axiosClient.post('/config/processes', data);
    return response.data;
  },
  updateProcess: async (id: string, data: { name: string }): Promise<BaseProcess> => {
    const response = await axiosClient.put(`/config/processes/${id}`, data);
    return response.data;
  },
  deleteProcess: async (id: string): Promise<void> => {
    await axiosClient.delete(`/config/processes/${id}`);
  },

  // ── Sectors ──
  getSectors: async (): Promise<BaseSector[]> => {
    const response = await axiosClient.get('/config/sectors');
    return response.data;
  },
  createSector: async (data: Omit<BaseSector, 'id'>): Promise<BaseSector> => {
    const response = await axiosClient.post('/config/sectors', data);
    return response.data;
  },
  updateSector: async (id: string, data: { name: string; description?: string }): Promise<BaseSector> => {
    const response = await axiosClient.put(`/config/sectors/${id}`, data);
    return response.data;
  },
  deleteSector: async (id: string): Promise<void> => {
    await axiosClient.delete(`/config/sectors/${id}`);
  },

  // ── Clients ──
  getClients: async (sectorId?: string): Promise<ClientWithSector[]> => {
    const params = sectorId ? { sector_id: sectorId } : {};
    const response = await axiosClient.get('/config/clients', { params });
    return response.data;
  },
  createClient: async (data: Omit<BaseClient, 'id'>): Promise<BaseClient> => {
    const response = await axiosClient.post('/config/clients', data);
    return response.data;
  },
  updateClient: async (id: string, data: Omit<BaseClient, 'id'>): Promise<BaseClient> => {
    const response = await axiosClient.put(`/config/clients/${id}`, data);
    return response.data;
  },
  deleteClient: async (id: string): Promise<void> => {
    await axiosClient.delete(`/config/clients/${id}`);
  },

  // ── Products ──
  getProducts: async (processId?: string, clientId?: string): Promise<BaseProduct[]> => {
    const params: Record<string, string> = {};
    if (processId) params.process_id = processId;
    if (clientId) params.client_id = clientId;
    const response = await axiosClient.get('/config/products', { params });
    return response.data;
  },
  createProduct: async (data: { sku: string; name: string; description?: string; client_id?: string; rate_per_hour?: number; process_ids: string[] }): Promise<BaseProduct> => {
    const response = await axiosClient.post('/config/products', data);
    return response.data;
  },
  updateProduct: async (id: string, data: { sku: string; name: string; description?: string; client_id?: string; rate_per_hour?: number; process_ids: string[] }): Promise<BaseProduct> => {
    const response = await axiosClient.put(`/config/products/${id}`, data);
    return response.data;
  },
  deleteProduct: async (id: string): Promise<void> => {
    await axiosClient.delete(`/config/products/${id}`);
  },

  // ── Machines ──
  getMachines: async (processId?: string): Promise<BaseMachine[]> => {
    const params = processId ? { process_id: processId } : {};
    const response = await axiosClient.get('/config/machines', { params });
    if (!processId) {
      (window as any)._gulliverMachinesCache = response.data;
    }
    return response.data;
  },
  createMachine: async (data: Omit<BaseMachine, 'id'>): Promise<BaseMachine> => {
    const response = await axiosClient.post('/config/machines', data);
    return response.data;
  },
  updateMachine: async (id: string, data: Partial<BaseMachine>): Promise<BaseMachine> => {
    const response = await axiosClient.put(`/config/machines/${id}`, data);
    return response.data;
  },
  deleteMachine: async (id: string): Promise<void> => {
    await axiosClient.delete(`/config/machines/${id}`);
  },

  // ── Maintenance Categories ──
  getMaintenanceCategories: async (machineId?: string): Promise<BaseMaintenanceCategory[]> => {
    const params = machineId ? { machine_id: machineId } : {};
    const response = await axiosClient.get('/config/maintenance-categories', { params });
    if (!machineId) {
      (window as any)._gulliverCategoriesCache = response.data;
    }
    return response.data;
  },
  createMaintenanceCategory: async (data: Omit<BaseMaintenanceCategory, 'id' | 'faults'>): Promise<BaseMaintenanceCategory> => {
    const response = await axiosClient.post('/config/maintenance-categories', data);
    return response.data;
  },
  updateMaintenanceCategory: async (id: string, data: Partial<BaseMaintenanceCategory>): Promise<BaseMaintenanceCategory> => {
    const response = await axiosClient.put(`/config/maintenance-categories/${id}`, data);
    return response.data;
  },
  deleteMaintenanceCategory: async (id: string): Promise<void> => {
    await axiosClient.delete(`/config/maintenance-categories/${id}`);
  },

  // ── Maintenance Faults ──
  getMaintenanceFaults: async (categoryId?: string): Promise<BaseMaintenanceFault[]> => {
    const params = categoryId ? { category_id: categoryId } : {};
    const response = await axiosClient.get('/config/maintenance-faults', { params });
    return response.data;
  },
  createMaintenanceFault: async (data: BaseMaintenanceFault): Promise<BaseMaintenanceFault> => {
    const response = await axiosClient.post('/config/maintenance-faults', data);
    return response.data;
  },
  updateMaintenanceFault: async (code: string, data: Partial<BaseMaintenanceFault>): Promise<BaseMaintenanceFault> => {
    const response = await axiosClient.put(`/config/maintenance-faults/${code}`, data);
    return response.data;
  },
  deleteMaintenanceFault: async (code: string): Promise<void> => {
    await axiosClient.delete(`/config/maintenance-faults/${code}`);
  },

  // ── Asset Families ──
  getAssetFamilies: async (machineId?: string): Promise<BaseAssetFamily[]> => {
    const params = machineId ? { machine_id: machineId } : {};
    const response = await axiosClient.get('/config/asset-families', { params });
    if (!machineId) {
      (window as any)._gulliverAssetFamiliesCache = response.data;
    }
    return response.data;
  },
  createAssetFamily: async (data: Omit<BaseAssetFamily, 'id' | 'faults'>): Promise<BaseAssetFamily> => {
    const response = await axiosClient.post('/config/asset-families', data);
    return response.data;
  },
  updateAssetFamily: async (id: string, data: Partial<BaseAssetFamily>): Promise<BaseAssetFamily> => {
    const response = await axiosClient.put(`/config/asset-families/${id}`, data);
    return response.data;
  },
  deleteAssetFamily: async (id: string): Promise<void> => {
    await axiosClient.delete(`/config/asset-families/${id}`);
  },
  getAssetFaults: async (familyId?: string): Promise<BaseAssetFault[]> => {
    const params = familyId ? { family_id: familyId } : {};
    const response = await axiosClient.get('/config/asset-faults', { params });
    return response.data;
  },
  createAssetFault: async (data: Omit<BaseAssetFault, 'code'> & { code: string }): Promise<BaseAssetFault> => {
    const response = await axiosClient.post('/config/asset-faults', data);
    return response.data;
  },
  updateAssetFault: async (code: string, data: Partial<BaseAssetFault>): Promise<BaseAssetFault> => {
    const response = await axiosClient.put(`/config/asset-faults/${code}`, data);
    return response.data;
  },
  deleteAssetFault: async (code: string): Promise<void> => {
    await axiosClient.delete(`/config/asset-faults/${code}`);
  },

  // ── Scrap Defects ──
  getScrapDefects: async (processId?: string): Promise<BaseScrapDefect[]> => {
    const params = processId ? { process_id: processId } : {};
    const response = await axiosClient.get('/config/scrap-defects', { params });
    return response.data;
  },
  createScrapDefect: async (data: Omit<BaseScrapDefect, 'id'>): Promise<BaseScrapDefect> => {
    const response = await axiosClient.post('/config/scrap-defects', data);
    return response.data;
  },
  updateScrapDefect: async (code: string, data: Partial<BaseScrapDefect>): Promise<BaseScrapDefect> => {
    const response = await axiosClient.put(`/config/scrap-defects/${code}`, data);
    return response.data;
  },
  deleteScrapDefect: async (code: string): Promise<void> => {
    await axiosClient.delete(`/config/scrap-defects/${code}`);
  },
};
