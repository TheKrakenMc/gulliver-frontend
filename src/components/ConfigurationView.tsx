import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Plus, Activity, Box, Building2, Users, Pencil, Trash2, X, Tag, Wrench, AlertTriangle, Layers, Loader2 } from 'lucide-react';
import Toast, { type ToastType } from './Toast';
import { useTranslation } from 'react-i18next';
import { useGlobalStore } from '../store/globalStore';
import { baseDataApi } from '../api/baseDataApi';
import type { 
  BaseProcess, BaseProduct, BaseSector, BaseClient, ClientWithSector, 
  BaseMachine, BaseMaintenanceCategory, BaseMaintenanceFault, FilterState,
  BaseAssetFamily, BaseAssetFault, BaseScrapDefect
} from '../types';

type TabId = 'processes' | 'machines' | 'maintenance_categories' | 'asset_families' | 'scrap_defects' | 'products' | 'sectors' | 'clients';

const getCatalogTranslation = (t: any, text: string) => {
  if (!text) return text;
  const key = `catalog.${text.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  const translated = t(key, { defaultValue: text });
  return translated;
};

interface ConfigurationViewProps {
  filters?: FilterState;
}

export default function ConfigurationView({ filters }: ConfigurationViewProps) {
  const { t } = useTranslation();
  const { hierarchy, fetchHierarchy } = useGlobalStore();
  const [activeTab, setActiveTab] = useState<TabId>('processes');

  // ── CRUD State ──
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── Form fields ──
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formRatePerHour, setFormRatePerHour] = useState<number | ''>('');
  const [formDesc, setFormDesc] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSectorId, setFormSectorId] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formProcessIds, setFormProcessIds] = useState<string[]>([]);
  const [formNave, setFormNave] = useState('');
  const [formMachineCode, setFormMachineCode] = useState('');
  const [formProcessId, setFormProcessId] = useState('');

  // ── UI State ──
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean } | null>(null);

  // ── Filter state ──
  // Replaced local BU state with global filter prop

  // ── Extra data ──
  const [sectors, setSectors] = useState<BaseSector[]>([]);
  const [clients, setClients] = useState<ClientWithSector[]>([]);
  const [allProducts, setAllProducts] = useState<BaseProduct[]>([]);
  const [allMachines, setAllMachines] = useState<BaseMachine[]>([]);
  
  // ── Machine Sub-catalogs State ──
  const [allMaintenanceCategories, setAllMaintenanceCategories] = useState<BaseMaintenanceCategory[]>([]);
  const [allAssetFamilies, setAllAssetFamilies] = useState<BaseAssetFamily[]>([]);
  const [formFamilyIds, setFormFamilyIds] = useState<string[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingFaultToCatId, setAddingFaultToCatId] = useState<string | null>(null);
  const [newFaultCode, setNewFaultCode] = useState('');
  const [newFaultDesc, setNewFaultDesc] = useState('');
  const [allScrapDefects, setAllScrapDefects] = useState<BaseScrapDefect[]>([]);
  const [newScrapDefectName, setNewScrapDefectName] = useState('');
  const [newScrapDefectDesc, setNewScrapDefectDesc] = useState('');
  const [pendingScrapDefects, setPendingScrapDefects] = useState<{code: string; name: string; description?: string}[]>([]);

  // Load data
  useEffect(() => {
    loadSectors();
    loadClients();
    loadProducts();
    loadMachines();
    loadAllMaintenanceCategories();
    loadAllAssetFamilies();
    loadAllScrapDefects();
  }, []);

  const loadSectors = async () => {
    try { setSectors(await baseDataApi.getSectors()); } catch (e) { console.error(e); }
  };
  const loadClients = async () => {
    try { setClients(await baseDataApi.getClients()); } catch (e) { console.error(e); }
  };
  const loadProducts = async () => {
    try { setAllProducts(await baseDataApi.getProducts()); } catch (e) { console.error(e); }
  };
  const loadMachines = async () => {
    try { setAllMachines(await baseDataApi.getMachines()); } catch (e) { console.error(e); }
  };

  const loadAllMaintenanceCategories = async () => {
    try {
      const cats = await baseDataApi.getMaintenanceCategories();
      setAllMaintenanceCategories(cats);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAllAssetFamilies = async () => {
    try {
      const families = await baseDataApi.getAssetFamilies();
      setAllAssetFamilies(families);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAllScrapDefects = async () => {
    try {
      setAllScrapDefects(await baseDataApi.getScrapDefects());
    } catch (e) {
      console.error(e);
    }
  };

  // Derived lists based on Location filter
  const filteredHierarchy = filters?.location 
    ? hierarchy.filter(l => l.name === filters.location)
    : hierarchy;
  const allBUs = filteredHierarchy.flatMap(l => l.business_units || []);
  
  let selectedBUObj = filters?.businessUnit 
    ? allBUs.find(bu => bu.name === filters.businessUnit) 
    : undefined;
    
  if (!selectedBUObj && allBUs.length > 0) {
    selectedBUObj = allBUs[0];
  }
    
  const selectedBUId = selectedBUObj?.id || '';
  const processes = selectedBUObj?.processes || [];
  const processIds = processes.map(p => p.id);
  
  const productsForBU = allProducts.filter(p =>
    p.process_ids.some(pid => processIds.includes(pid))
  );
  const machinesForBU = allMachines.filter(m => processIds.includes(m.process_id));

  // ── Reset form ──
  const resetForm = () => {
    setFormName(''); setFormSku(''); setFormDesc(''); setFormRatePerHour('');
    setFormContactName(''); setFormEmail(''); setFormPhone('');
    setFormSectorId(''); setFormClientId(''); setFormProcessIds([]);
    setFormNave(''); setFormProcessId(''); setFormMachineCode(''); setFormFamilyIds([]);
    setIsAdding(false); setEditingId(null);
    setIsAddingCategory(false); setNewCategoryName('');
    setAddingFaultToCatId(null); setNewFaultCode(''); setNewFaultDesc('');
    setNewScrapDefectName(''); setNewScrapDefectDesc('');
    setPendingScrapDefects([]);
  };

  // ── Generic refresh ──
  const refresh = async () => {
    await fetchHierarchy();
    await loadSectors();
    await loadClients();
    await loadProducts();
    await loadMachines();
    await loadAllMaintenanceCategories();
    await loadAllAssetFamilies();
    await loadAllScrapDefects();
  };

  // ═══════════════════════════════════════════════════
  //  SAVE HANDLER
  // ═══════════════════════════════════════════════════
  const handleSave = async () => {
    if (!formName.trim() && activeTab !== 'products') return;

    setIsSaving(true);
    try {
      if (activeTab === 'processes') {
        if (!selectedBUId) return;
        if (editingId) {
          await baseDataApi.updateProcess(editingId, { name: formName });
        } else {
          const newProcess = await baseDataApi.createProcess({ name: formName, business_unit_id: selectedBUId });
          for (const defect of pendingScrapDefects) {
            await baseDataApi.createScrapDefect({
              code: defect.code,
              name: defect.name,
              description: defect.description,
              process_id: newProcess.id
            });
          }
        }
      } else if (activeTab === 'machines') {
        const assignedProcessId = formProcessId || (processes.length > 0 ? processes[0].id : '');
        if (!formName.trim() || !formMachineCode.trim() || !formNave.trim() || !assignedProcessId) return;
        const payload = {
          name: formName, code: formMachineCode, nave: formNave, process_id: assignedProcessId, family_ids: formFamilyIds
        };
        if (editingId) {
          await baseDataApi.updateMachine(editingId, payload);
        } else {
          await baseDataApi.createMachine(payload);
        }
      } else if (activeTab === 'products') {
        if (!formName.trim() || !formSku.trim()) return;
        const payload = {
          name: formName, sku: formSku, description: formDesc || undefined,
          client_id: formClientId || undefined, process_ids: formProcessIds,
          rate_per_hour: formRatePerHour === '' ? undefined : Number(formRatePerHour)
        };
        if (editingId) {
          await baseDataApi.updateProduct(editingId, payload);
        } else {
          await baseDataApi.createProduct(payload);
        }
      } else if (activeTab === 'sectors') {
        const payload = { name: formName, description: formDesc || undefined };
        if (editingId) {
          await baseDataApi.updateSector(editingId, payload);
        } else {
          await baseDataApi.createSector(payload);
        }
      } else if (activeTab === 'clients') {
        const payload = {
          name: formName, contact_name: formContactName || undefined,
          email: formEmail || undefined, phone: formPhone || undefined,
          sector_id: formSectorId || undefined,
        };
        if (editingId) {
          await baseDataApi.updateClient(editingId, payload);
        } else {
          await baseDataApi.createClient(payload);
        }
      } else if (activeTab === 'maintenance_categories') {
        const payload = { name: formName };
        if (editingId) {
          await baseDataApi.updateMaintenanceCategory(editingId, payload);
        } else {
          await baseDataApi.createMaintenanceCategory(payload);
        }
      } else if (activeTab === 'asset_families') {
        const payload = { name: formName };
        if (editingId) {
          await baseDataApi.updateAssetFamily(editingId, payload);
        } else {
          await baseDataApi.createAssetFamily(payload);
        }
      }
      await refresh();
      resetForm();
      setToast({ message: t('config.success_save', 'Guardado exitosamente'), type: 'success', visible: true });
      setTimeout(() => setToast(null), 4000);
    } catch (e: any) {
      console.error(e);
      setToast({ message: e?.response?.data?.detail || t('config.error_save', 'Error al guardar'), type: 'error', visible: true });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════
  //  DELETE HANDLER
  // ═══════════════════════════════════════════════════
  const handleDelete = async (id: string) => {
    try {
      if (activeTab === 'processes') await baseDataApi.deleteProcess(id);
      else if (activeTab === 'machines') await baseDataApi.deleteMachine(id);
      else if (activeTab === 'products') await baseDataApi.deleteProduct(id);
      else if (activeTab === 'sectors') await baseDataApi.deleteSector(id);
      else if (activeTab === 'clients') await baseDataApi.deleteClient(id);
      else if (activeTab === 'maintenance_categories') await baseDataApi.deleteMaintenanceCategory(id);
      else if (activeTab === 'asset_families') await baseDataApi.deleteAssetFamily(id);
      await refresh();
      setConfirmDeleteId(null);
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail || t('config.error_save'));
    }
  };

  // ═══════════════════════════════════════════════════
  //  SUBCATALOG HANDLERS (Categories & Faults)
  // ═══════════════════════════════════════════════════
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await baseDataApi.createMaintenanceCategory({ name: newCategoryName });
      setNewCategoryName('');
      setIsAddingCategory(false);
      await loadAllMaintenanceCategories();
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail || 'Error');
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    try {
      await baseDataApi.deleteMaintenanceCategory(catId);
      await loadAllMaintenanceCategories();
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail || 'Error');
    }
  };

  const handleAddFault = async (catId: string) => {
    if (!newFaultCode.trim() || !newFaultDesc.trim()) return;
    try {
      await baseDataApi.createMaintenanceFault({
        code: newFaultCode, description: newFaultDesc, category_id: catId
      });
      setNewFaultCode(''); setNewFaultDesc('');
      setAddingFaultToCatId(null);
      await loadAllMaintenanceCategories();
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail || 'Error');
    }
  };

  const handleDeleteFault = async (code: string) => {
    try {
      await baseDataApi.deleteMaintenanceFault(code);
      await loadAllMaintenanceCategories();
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail || 'Error');
    }
  };

  const handleAddFamily = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await baseDataApi.createAssetFamily({ name: newCategoryName });
      setNewCategoryName('');
      setIsAddingCategory(false);
      await loadAllAssetFamilies();
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail || 'Error');
    }
  };

  const handleDeleteFamily = async (famId: string) => {
    try {
      await baseDataApi.deleteAssetFamily(famId);
      await loadAllAssetFamilies();
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail || 'Error');
    }
  };

  const handleAddAssetFault = async (famId: string) => {
    if (!newFaultCode.trim() || !newFaultDesc.trim()) return;
    try {
      await baseDataApi.createAssetFault({
        code: newFaultCode, name: newFaultDesc, description: newFaultDesc, family_id: famId
      });
      setNewFaultCode(''); setNewFaultDesc('');
      setAddingFaultToCatId(null);
      await loadAllAssetFamilies();
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail || 'Error');
    }
  };

  const handleDeleteAssetFault = async (code: string) => {
    try {
      await baseDataApi.deleteAssetFault(code);
      await loadAllAssetFamilies();
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail || 'Error');
    }
  };

  const handleAddScrapDefect = async (processId: string | null) => {
    if (!newScrapDefectName.trim()) return;
    const generatedCode = `SCRAP-${Date.now().toString().slice(-4)}`;
    if (processId) {
      try {
        await baseDataApi.createScrapDefect({
          code: generatedCode,
          name: newScrapDefectName,
          description: newScrapDefectDesc || undefined,
          process_id: processId
        });
        setNewScrapDefectName(''); setNewScrapDefectDesc('');
        await loadAllScrapDefects();
      } catch (e: any) {
        console.error(e);
        alert(e?.response?.data?.detail || 'Error');
      }
    } else {
      setPendingScrapDefects([...pendingScrapDefects, {
        code: generatedCode,
        name: newScrapDefectName,
        description: newScrapDefectDesc || undefined,
      }]);
      setNewScrapDefectName(''); setNewScrapDefectDesc('');
    }
  };

  const handleDeleteScrapDefect = async (code: string, isPending: boolean = false) => {
    if (isPending) {
      setPendingScrapDefects(pendingScrapDefects.filter(d => d.code !== code));
    } else {
      try {
        await baseDataApi.deleteScrapDefect(code);
        await loadAllScrapDefects();
      } catch (e: any) {
        console.error(e);
        alert(e?.response?.data?.detail || 'Error');
      }
    }
  };

  // ═══════════════════════════════════════════════════
  //  EDIT HANDLER — populate form
  // ═══════════════════════════════════════════════════
  const startEdit = async (entity: any) => {
    setEditingId(entity.id);
    setIsAdding(true);
    setFormName(entity.name || '');
    setFormDesc(entity.description || '');
    
    if (activeTab === 'machines') {
      setFormMachineCode(entity.code || '');
      setFormNave(entity.nave || '');
      setFormProcessId(entity.process_id || '');
      setFormFamilyIds(entity.family_ids || []);
    }
    if (activeTab === 'products') {
      setFormSku(entity.sku || '');
      setFormRatePerHour(entity.rate_per_hour ?? '');
      setFormClientId(entity.client_id || '');
      setFormProcessIds(entity.process_ids || []);
    }
    if (activeTab === 'clients') {
      setFormContactName(entity.contact_name || '');
      setFormEmail(entity.email || '');
      setFormPhone(entity.phone || '');
      setFormSectorId(entity.sector_id || '');
    }
  };

  // ═══════════════════════════════════════════════════
  //  TABS CONFIG
  // ═══════════════════════════════════════════════════
  const unitTabs = [
    { id: 'processes' as const, labelKey: 'config.tab_processes', icon: <Activity size={18} />, color: '#06b6d4' },
    { id: 'machines' as const, labelKey: 'config.tab_machines', icon: <Wrench size={18} />, color: '#10b981' },
    { id: 'products' as const, labelKey: 'config.tab_products', icon: <Box size={18} />, color: '#f43f5e' },
  ];

  const generalTabs = [
    { id: 'maintenance_categories' as const, labelKey: 'config.tab_maintenance_categories', icon: <Layers size={18} />, color: '#f97316' },
    { id: 'asset_families' as const, labelKey: 'config.tab_asset_families', icon: <Tag size={18} />, color: '#8b5cf6' },
    { id: 'clients' as const, labelKey: 'config.tab_clients', icon: <Users size={18} />, color: '#f59e0b' },
  ];

  const renderTab = (tab: { id: TabId; labelKey: string; icon: React.ReactNode; color: string }) => {
    const isActive = activeTab === tab.id;
    return (
      <motion.button
        key={tab.id}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => { setActiveTab(tab.id); resetForm(); setConfirmDeleteId(null); }}
        style={{
          padding: '8px 18px', borderRadius: 8,
          background: isActive ? 'var(--gv-surface)' : 'transparent',
          border: isActive ? '1px solid var(--gv-border)' : '1px solid transparent',
          color: isActive ? tab.color : 'var(--gv-text-muted)',
          fontWeight: 700, fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
          boxShadow: isActive ? 'var(--gv-shadow-sm)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {tab.icon}
        {t(tab.labelKey)}
      </motion.button>
    );
  };

  /* ── Shared Styles ── */
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: 'var(--gv-surface)', border: '1px solid var(--gv-border)',
    borderRadius: 10, color: 'var(--gv-text-heading)',
    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  };
  const selectFormStyle: React.CSSProperties = {
    ...inputStyle, appearance: 'none' as const, cursor: 'pointer',
  };
  const selectStyle: React.CSSProperties = {
    ...inputStyle, appearance: 'none' as const, cursor: 'pointer', maxWidth: 320, paddingRight: 32,
  };
  const labelSt: React.CSSProperties = {
    display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--gv-text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
  };

  // Toggle a process_id in/out of the formProcessIds list
  const toggleProcess = (pid: string) => {
    setFormProcessIds(prev =>
      prev.includes(pid) ? prev.filter(x => x !== pid) : [...prev, pid]
    );
  };

  const toggleFamily = (fid: string) => {
    setFormFamilyIds(prev =>
      prev.includes(fid) ? prev.filter(x => x !== fid) : [...prev, fid]
    );
  };

  // All processes from all BUs (for product form)
  const allProcesses = hierarchy.flatMap(l => l.business_units).flatMap(bu => bu.processes);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 28 }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Settings size={18} color="#6366f1" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--gv-text-heading)', margin: 0, letterSpacing: -0.5 }}>
              {t('config.title')}
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--gv-text-muted)', margin: 0, paddingLeft: 46 }}>
            {t('config.subtitle')}
          </p>
        </div>
      </div>

      {/* ── Main Card ── */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {/* Tabs Grouped */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 24, padding: '16px 20px',
          borderBottom: '1px solid var(--gv-border)',
          background: 'var(--gv-surface-alt)',
        }}>
          {/* Unit Data Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', paddingLeft: 6 }}>
              {t('config.group_unit')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {unitTabs.map(renderTab)}
            </div>
          </div>

          <div style={{ width: '1px', background: 'var(--gv-border)', margin: '4px 0' }} />

          {/* General Data Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', paddingLeft: 6 }}>
              {t('config.group_general')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {generalTabs.map(renderTab)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Local BU Filter Removed, using Global Filter */}

          {/* Section Title + Add Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gv-text-heading)', margin: 0 }}>
              {activeTab === 'processes' && t('config.list_processes')}
              {activeTab === 'machines' && t('config.list_machines')}
              {activeTab === 'maintenance_categories' && t('config.list_maintenance_categories', 'Categorías de Mantenimiento')}
              {activeTab === 'asset_families' && t('config.list_asset_families', 'Fallas comunes y Causas de Maquinaria')}
              {activeTab === 'products' && t('config.list_products')}
              {activeTab === 'sectors' && t('config.list_sectors')}
              {activeTab === 'clients' && t('config.list_clients')}
            </h2>
            {true && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  resetForm();
                  if (activeTab === 'machines') {
                    const defaultCatNames = ['INSTRUMENTACION', 'PROCESO / PARAMETROS', 'SEGURIDAD', 'ESTRUCTURAL'];
                    const defaultIds = allAssetFamilies
                      .filter(cat => defaultCatNames.includes(cat.name.toUpperCase()))
                      .map(cat => cat.id);
                    setFormFamilyIds(defaultIds);
                  }
                  setIsAdding(true);
                }}
                style={{
                  padding: '8px 18px', borderRadius: 8, border: 'none',
                  background: activeTab === 'maintenance_categories' ? 'linear-gradient(135deg, #f97316, #ea580c)' : activeTab === 'asset_families' ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s ease',
                }}
              >
                <Plus size={16} />
                {activeTab === 'maintenance_categories' ? t('config.btn_add_category', 'Agregar Categoría') : activeTab === 'asset_families' ? t('config.btn_add_family', 'Agregar Falla común') : t('config.btn_add_new')}
              </motion.button>
            )}
          </div>

          {/* ═══ ADD / EDIT FORM MODAL ═══ */}
          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                  zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 20,
                }}
                onClick={resetForm}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: 'var(--gv-surface)',
                    border: '1px solid var(--gv-border)',
                    borderRadius: 16,
                    padding: '28px 32px',
                    width: '100%',
                    maxWidth: activeTab === 'machines' && editingId ? 800 : 600,
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    display: 'flex', flexDirection: 'column', gap: 24
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--gv-text-heading)', margin: 0 }}>
                      {editingId ? t('config.btn_update') : t('config.btn_add_new')}
                    </h3>
                    <button
                      onClick={resetForm}
                      style={{
                        background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)',
                        cursor: 'pointer', padding: 6, borderRadius: 8, color: 'var(--gv-text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    {/* Readonly Business Unit for relevant tabs */}
                    {['processes', 'machines', 'products'].includes(activeTab) && (
                      <div style={{ flex: '1 1 100%' }}>
                        <label style={labelSt}>{t('filters.businessUnit')}</label>
                        <input type="text" value={selectedBUObj?.name || ''} readOnly style={{ ...inputStyle, background: 'var(--gv-surface-alt)', color: 'var(--gv-text-muted)' }} />
                      </div>
                    )}

                    {/* Common: Name */}
                    <div style={{ flex: '1 1 100%' }}>
                      <label style={labelSt}>{t('config.label_name')}</label>
                      <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} style={inputStyle} placeholder={t('config.placeholder_name')} />
                    </div>

                    {/* Processes: Scrap Defects List */}
                    {activeTab === 'processes' && (
                      <div style={{ flex: '1 1 100%', marginTop: 8 }}>
                        <label style={labelSt}>{t('config.label_scrap_defects', 'Defectos de Scrap (Asociados a esta Tecnología)')}</label>
                        <div style={{ background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)', borderRadius: 12, padding: 16 }}>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <input type="text" value={newScrapDefectName} onChange={(e) => setNewScrapDefectName(e.target.value)} style={{ ...inputStyle, width: '150px', padding: '8px 12px' }} placeholder={t('config.placeholder_scrap_name', 'Nombre del defecto')} />
                            <input type="text" value={newScrapDefectDesc} onChange={(e) => setNewScrapDefectDesc(e.target.value)} style={{ ...inputStyle, flex: 1, padding: '8px 12px' }} placeholder={t('config.placeholder_scrap_desc', 'Descripción')} />
                            <button onClick={() => handleAddScrapDefect(editingId)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', fontWeight: 700, cursor: 'pointer' }}>
                              <Plus size={16} />
                            </button>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(() => {
                              const procDefects = editingId 
                                ? allScrapDefects.filter(d => d.process_id === editingId)
                                : pendingScrapDefects;
                                
                              if (procDefects.length === 0) {
                                return <p style={{ fontSize: 12, color: 'var(--gv-text-muted)', fontStyle: 'italic', textAlign: 'center', margin: '10px 0' }}>Sin defectos registrados.</p>;
                              }
                              return procDefects.map(d => (
                                <div key={d.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--gv-surface)', borderRadius: 8, border: '1px solid var(--gv-border)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(220,38,38,0.1)', color: '#dc2626', fontSize: 11, fontWeight: 800 }}>
                                      {d.code}
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gv-text-heading)' }}>{getCatalogTranslation(t, d.name)}</div>
                                      {d.description && <div style={{ fontSize: 11, color: 'var(--gv-text-muted)', marginTop: 2 }}>{d.description}</div>}
                                    </div>
                                  </div>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDeleteScrapDefect(d.code, !editingId)}
                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                                  >
                                    <Trash2 size={16} />
                                  </motion.button>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Machines: Nave and Process */}
                    {activeTab === 'machines' && (
                      <>
                        <div style={{ flex: '1 1 calc(50% - 8px)' }}>
                          <label style={labelSt}>{t('config.label_machine_code')}</label>
                          <input type="text" value={formMachineCode} onChange={(e) => setFormMachineCode(e.target.value)} style={inputStyle} placeholder={t('config.placeholder_machine_code')} />
                        </div>
                        <div style={{ flex: '1 1 calc(50% - 8px)' }}>
                          <label style={labelSt}>{t('config.label_nave')}</label>
                          <input type="text" value={formNave} onChange={(e) => setFormNave(e.target.value)} style={inputStyle} placeholder={t('config.placeholder_nave')} />
                        </div>
                        <div style={{ flex: '1 1 100%' }}>
                          <label style={labelSt}>{t('config.label_technology', 'Tecnología (Proceso)')}</label>
                          <select style={selectFormStyle} value={formProcessId} onChange={(e) => setFormProcessId(e.target.value)}>
                            <option value="">— {t('config.no_selection', 'Seleccionar')} —</option>
                            {processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                      </>
                    )}

                    {/* Products: SKU and Rate */}
                    {activeTab === 'products' && (
                      <>
                        <div style={{ flex: '1 1 calc(50% - 8px)' }}>
                          <label style={labelSt}>{t('config.label_sku')}</label>
                          <input type="text" value={formSku} onChange={(e) => setFormSku(e.target.value)} style={inputStyle} placeholder={t('config.placeholder_sku')} />
                        </div>
                        <div style={{ flex: '1 1 calc(50% - 8px)' }}>
                          <label style={labelSt}>{t('config.label_rate_per_hour')}</label>
                          <input type="number" value={formRatePerHour} onChange={(e) => setFormRatePerHour(e.target.value === '' ? '' : Number(e.target.value))} style={inputStyle} placeholder={t('config.placeholder_rate_per_hour')} />
                        </div>
                      </>
                    )}

                    {/* Products & Sectors: Description */}
                    {(activeTab === 'products' || activeTab === 'sectors') && (
                      <div style={{ flex: activeTab === 'products' ? '1 1 calc(50% - 8px)' : '1 1 100%' }}>
                        <label style={labelSt}>{t('config.label_description')}</label>
                        <input type="text" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} style={inputStyle} placeholder={t('config.placeholder_desc')} />
                      </div>
                    )}

                    {/* Products: Client selector */}
                    {activeTab === 'products' && (
                      <div style={{ flex: '1 1 100%' }}>
                        <label style={labelSt}>{t('config.label_client')}</label>
                        <select style={selectFormStyle} value={formClientId} onChange={(e) => setFormClientId(e.target.value)}>
                          <option value="">— {t('config.no_selection')} —</option>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    )}

                    {/* Products: Process multi-select (checkboxes) */}
                    {activeTab === 'products' && (
                      <div style={{ flex: '1 1 100%' }}>
                        <label style={labelSt}>{t('config.label_processes')}</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {allProcesses.map(proc => (
                            <label key={proc.id} style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '8px 14px', borderRadius: 8,
                              background: formProcessIds.includes(proc.id) ? 'rgba(6,182,212,0.15)' : 'var(--gv-surface-alt)',
                              border: formProcessIds.includes(proc.id) ? '1px solid rgba(6,182,212,0.4)' : '1px solid var(--gv-border)',
                              cursor: 'pointer', fontSize: 12, fontWeight: 600,
                              color: formProcessIds.includes(proc.id) ? '#06b6d4' : 'var(--gv-text-muted)',
                              transition: 'all 0.2s ease',
                            }}>
                              <input
                                type="checkbox"
                                checked={formProcessIds.includes(proc.id)}
                                onChange={() => toggleProcess(proc.id)}
                                style={{ display: 'none' }}
                              />
                              <Activity size={14} />
                              {proc.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clients: Contact fields */}
                    {activeTab === 'clients' && (
                      <>
                        <div style={{ flex: '1 1 calc(50% - 8px)' }}>
                          <label style={labelSt}>{t('config.label_contact')}</label>
                          <input type="text" value={formContactName} onChange={(e) => setFormContactName(e.target.value)} style={inputStyle} placeholder={t('config.placeholder_contact')} />
                        </div>
                        <div style={{ flex: '1 1 calc(50% - 8px)' }}>
                          <label style={labelSt}>{t('config.label_email')}</label>
                          <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} style={inputStyle} placeholder={t('config.placeholder_email')} />
                        </div>
                        <div style={{ flex: '1 1 calc(50% - 8px)' }}>
                          <label style={labelSt}>{t('config.label_phone')}</label>
                          <input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} style={inputStyle} placeholder={t('config.placeholder_phone')} />
                        </div>
                        <div style={{ flex: '1 1 calc(50% - 8px)' }}>
                          <label style={labelSt}>{t('config.label_sector')}</label>
                          <select style={selectFormStyle} value={formSectorId} onChange={(e) => setFormSectorId(e.target.value)}>
                            <option value="">— {t('config.no_selection')} —</option>
                            {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                      </>
                    )}

                    {/* Maintenance Categories: Faults List (only if editing) */}
                    {activeTab === 'maintenance_categories' && editingId && (
                      <div style={{ flex: '1 1 100%', marginTop: 8 }}>
                        <label style={labelSt}>{t('config.label_faults', 'Fallas Específicas')}</label>
                        <div style={{ background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)', borderRadius: 12, padding: 16 }}>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <input type="text" value={newFaultCode} onChange={(e) => setNewFaultCode(e.target.value)} style={{ ...inputStyle, width: '100px', padding: '8px 12px' }} placeholder={t('config.placeholder_fault_code', 'Cód.')} />
                            <input type="text" value={newFaultDesc} onChange={(e) => setNewFaultDesc(e.target.value)} style={{ ...inputStyle, flex: 1, padding: '8px 12px' }} placeholder={t('config.placeholder_fault_desc', 'Descripción')} />
                            <button onClick={() => handleAddFault(editingId)} style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', fontWeight: 700, cursor: 'pointer' }}>
                              <Plus size={16} />
                            </button>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(() => {
                              const cat = allMaintenanceCategories.find(c => c.id === editingId);
                              if (!cat || !cat.faults || cat.faults.length === 0) {
                                return <p style={{ fontSize: 12, color: 'var(--gv-text-muted)', fontStyle: 'italic', textAlign: 'center', margin: '10px 0' }}>Sin fallas registradas.</p>;
                              }
                              return cat.faults.map(fault => (
                                <div key={fault.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--gv-surface)', borderRadius: 8, border: '1px solid var(--gv-border)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ display: 'inline-block', padding: '4px 8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                                      {fault.code}
                                    </span>
                                    <span style={{ fontSize: 13, color: 'var(--gv-text)', fontWeight: 600 }}>{fault.description}</span>
                                  </div>
                                  <button onClick={() => handleDeleteFault(fault.code)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gv-text-muted)', padding: 4 }}>
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                    {activeTab === 'maintenance_categories' && !editingId && (
                       <p style={{ fontSize: 12, color: 'var(--gv-text-muted)', fontStyle: 'italic', width: '100%', textAlign: 'center', marginTop: 10 }}>
                         Guarda la categoría primero para poder registrar sus fallas.
                       </p>
                    )}

                    {/* Asset Families: Faults List (only if editing) */}
                    {activeTab === 'asset_families' && editingId && (
                      <div style={{ flex: '1 1 100%', marginTop: 8 }}>
                        <label style={labelSt}>{t('config.label_faults', 'Causas Específicas')}</label>
                        <div style={{ background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)', borderRadius: 12, padding: 16 }}>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <input type="text" value={newFaultCode} onChange={(e) => setNewFaultCode(e.target.value)} style={{ ...inputStyle, width: '100px', padding: '8px 12px' }} placeholder={t('config.placeholder_fault_code', 'Cód.')} />
                            <input type="text" value={newFaultDesc} onChange={(e) => setNewFaultDesc(e.target.value)} style={{ ...inputStyle, flex: 1, padding: '8px 12px' }} placeholder={t('config.placeholder_fault_desc', 'Descripción')} />
                            <button onClick={() => handleAddAssetFault(editingId)} style={{ background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', fontWeight: 700, cursor: 'pointer' }}>
                              <Plus size={16} />
                            </button>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(() => {
                              const fam = allAssetFamilies.find(f => f.id === editingId);
                              if (!fam || !fam.faults || fam.faults.length === 0) {
                                return <p style={{ fontSize: 12, color: 'var(--gv-text-muted)', fontStyle: 'italic', textAlign: 'center', margin: '10px 0' }}>Sin causas registradas.</p>;
                              }
                              return fam.faults.map(fault => (
                                <div key={fault.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--gv-surface)', borderRadius: 8, border: '1px solid var(--gv-border)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ display: 'inline-block', padding: '4px 8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                                      {fault.code}
                                    </span>
                                    <span style={{ fontSize: 13, color: 'var(--gv-text)', fontWeight: 600 }}>{fault.description}</span>
                                  </div>
                                  <button onClick={() => handleDeleteAssetFault(fault.code)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gv-text-muted)', padding: 4 }}>
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                    {activeTab === 'asset_families' && !editingId && (
                       <p style={{ fontSize: 12, color: 'var(--gv-text-muted)', fontStyle: 'italic', width: '100%', textAlign: 'center', marginTop: 10 }}>
                         Guarda la falla común primero para poder registrar sus causas.
                       </p>
                    )}
                  </div>

                    {/* Machines: Asset Families multi-select (checkboxes) */}
                    {activeTab === 'machines' && (
                      <div style={{ flex: '1 1 100%' }}>
                        <label style={labelSt}>{t('config.label_asset_families', 'Fallas comunes de Activos')}</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {allAssetFamilies.map(fam => (
                            <label key={fam.id} style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '8px 14px', borderRadius: 8,
                              background: formFamilyIds.includes(fam.id) ? 'rgba(16,185,129,0.15)' : 'var(--gv-surface-alt)',
                              border: formFamilyIds.includes(fam.id) ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--gv-border)',
                              cursor: 'pointer', fontSize: 12, fontWeight: 600,
                              color: formFamilyIds.includes(fam.id) ? '#10b981' : 'var(--gv-text-muted)',
                              transition: 'all 0.2s ease',
                            }}>
                              <input
                                type="checkbox"
                                checked={formFamilyIds.includes(fam.id)}
                                onChange={() => toggleFamily(fam.id)}
                                style={{ display: 'none' }}
                              />
                              <Tag size={14} />
                              {fam.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8, paddingTop: 20, borderTop: '1px solid var(--gv-border)' }}>
                    <button
                      onClick={resetForm}
                      style={{
                        padding: '10px 24px', borderRadius: 8,
                        border: '1px solid var(--gv-border)', background: 'transparent',
                        color: 'var(--gv-text)', fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
                      }}
                    >
                      {t('config.btn_cancel')}
                    </button>
                    <motion.button
                      whileHover={{ scale: isSaving ? 1 : 1.02 }} whileTap={{ scale: isSaving ? 1 : 0.97 }}
                      onClick={handleSave}
                      disabled={isSaving}
                      style={{
                        padding: '10px 24px', borderRadius: 8, border: 'none',
                        background: isSaving ? 'var(--gv-surface-alt)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: isSaving ? 'var(--gv-text-muted)' : '#fff', fontSize: 13, fontWeight: 700,
                        cursor: isSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
                        boxShadow: isSaving ? 'none' : '0 4px 14px 0 rgba(99, 102, 241, 0.39)',
                        display: 'flex', alignItems: 'center', gap: 8
                      }}
                    >
                      {isSaving && <Loader2 size={16} className="animate-spin" />}
                      {editingId && activeTab === 'machines' ? t('config.btn_update') : (editingId ? t('config.btn_update') : t('config.btn_save'))}
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ ENTITY CARDS ═══ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>

            {/* ── PROCESSES ── */}
            {activeTab === 'processes' && processes.map((p, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                key={p.id}
                onClick={() => startEdit(p)}
                style={{
                  padding: '16px 18px', borderRadius: 10,
                  background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)',
                  display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s ease', cursor: 'pointer'
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: 'rgba(6,182,212,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Activity size={20} color="#06b6d4" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gv-text-heading)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</h3>
                  <p style={{ fontSize: 11, color: 'var(--gv-text-muted)', margin: '2px 0 0' }}>{t('config.assigned_to')}: {selectedBUObj?.name}</p>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {confirmDeleteId === p.id ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                        style={{ background: '#ef4444', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}
                      >✓</motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                        style={{ background: 'var(--gv-surface)', border: '1px solid var(--gv-border)', cursor: 'pointer', padding: '6px 10px', borderRadius: 6, color: 'var(--gv-text)', fontSize: 12, fontFamily: 'inherit' }}
                      ><X size={14} /></motion.button>
                    </div>
                  ) : (
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(p.id); }}
                      style={{ background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 6, color: '#ef4444' }}
                    ><Trash2 size={18} /></motion.button>
                  )}
                </div>
              </motion.div>
            ))}


            {/* ── MACHINES ── */}
            {activeTab === 'machines' && machinesForBU.map((m, i) => {
              const processName = processes.find(p => p.id === m.process_id)?.name;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  key={m.id}
                  onClick={() => startEdit(m)}
                  style={{
                    padding: '16px 18px', borderRadius: 10,
                    background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)',
                    display: 'flex', alignItems: 'flex-start', gap: 14, transition: 'all 0.2s ease', cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
                  }}>
                    <Wrench size={20} color="#10b981" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 6px', borderRadius: 4,
                        background: 'var(--gv-surface)', border: '1px solid var(--gv-border)',
                        fontSize: 10, fontWeight: 700, color: 'var(--gv-text-muted)',
                      }}>{m.code}</span>
                      <span style={{
                        display: 'inline-block', padding: '2px 6px', borderRadius: 4,
                        background: 'var(--gv-surface)', border: '1px solid var(--gv-border)',
                        fontSize: 10, fontWeight: 700, color: 'var(--gv-text-muted)',
                      }}>{m.nave}</span>
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gv-text-heading)', margin: 0, lineHeight: 1.3 }}>{m.name}</h3>
                    {processName && (
                      <p style={{ fontSize: 11, color: '#06b6d4', margin: '3px 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Activity size={11} /> {processName}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {confirmDeleteId === m.id ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                          style={{ background: '#ef4444', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}
                        >✓</motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                          style={{ background: 'var(--gv-surface)', border: '1px solid var(--gv-border)', cursor: 'pointer', padding: '6px 10px', borderRadius: 6, color: 'var(--gv-text)', fontSize: 12, fontFamily: 'inherit' }}
                        ><X size={14} /></motion.button>
                      </div>
                    ) : (
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(m.id); }}
                        style={{ background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 6, color: '#ef4444' }}
                      ><Trash2 size={18} /></motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* ── MAINTENANCE CATEGORIES ── */}
            {activeTab === 'maintenance_categories' && allMaintenanceCategories.map((cat, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                key={cat.id}
                onClick={() => startEdit(cat)}
                style={{
                  padding: '16px 18px', borderRadius: 10,
                  background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)',
                  display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s ease', cursor: 'pointer'
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: 'rgba(249,115,22,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Layers size={20} color="#f97316" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gv-text-heading)', margin: 0 }}>{getCatalogTranslation(t, cat.name)}</h3>
                  <p style={{ fontSize: 11, color: 'var(--gv-text-muted)', margin: '4px 0 0' }}>
                    {t('config.faults_recorded', { count: cat.faults?.length || 0 })}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {confirmDeleteId === cat.id ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); handleDelete(cat.id); }}
                        style={{ background: '#ef4444', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}
                      >✓</motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                        style={{ background: 'var(--gv-surface)', border: '1px solid var(--gv-border)', cursor: 'pointer', padding: '6px 10px', borderRadius: 6, color: 'var(--gv-text)', fontSize: 12, fontFamily: 'inherit' }}
                      ><X size={14} /></motion.button>
                    </div>
                  ) : (
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(cat.id); }}
                      style={{ background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 6, color: '#ef4444' }}
                    ><Trash2 size={18} /></motion.button>
                  )}
                </div>
              </motion.div>
            ))}
            
            {/* ── ASSET FAMILIES ── */}
            {activeTab === 'asset_families' && allAssetFamilies.map((fam, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                key={fam.id}
                onClick={() => startEdit(fam)}
                style={{
                  padding: '16px 18px', borderRadius: 10,
                  background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)',
                  display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s ease', cursor: 'pointer'
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: 'rgba(139,92,246,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Tag size={20} color="#8b5cf6" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gv-text-heading)', margin: 0 }}>{getCatalogTranslation(t, fam.name)}</h3>
                  <p style={{ fontSize: 11, color: 'var(--gv-text-muted)', margin: '4px 0 0' }}>
                    {t('config.faults_recorded', { count: fam.faults?.length || 0 })}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {confirmDeleteId === fam.id ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); handleDelete(fam.id); }}
                        style={{ background: '#ef4444', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}
                      >✓</motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                        style={{ background: 'var(--gv-surface)', border: '1px solid var(--gv-border)', cursor: 'pointer', padding: '6px 10px', borderRadius: 6, color: 'var(--gv-text)', fontSize: 12, fontFamily: 'inherit' }}
                      ><X size={14} /></motion.button>
                    </div>
                  ) : (
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(fam.id); }}
                      style={{ background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 6, color: '#ef4444' }}
                    ><Trash2 size={18} /></motion.button>
                  )}
                </div>
              </motion.div>
            ))}

            {/* ── PRODUCTS ── */}
            {activeTab === 'products' && productsForBU.map((p, i) => {
              const clientName = clients.find(c => c.id === p.client_id)?.name;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  key={p.id}
                  onClick={() => startEdit(p)}
                  style={{
                    padding: '16px 18px', borderRadius: 10,
                    background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)',
                    display: 'flex', alignItems: 'flex-start', gap: 14, transition: 'all 0.2s ease', cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, background: 'rgba(244,63,94,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
                  }}>
                    <Box size={20} color="#f43f5e" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 6px', borderRadius: 4,
                      background: 'var(--gv-surface)', border: '1px solid var(--gv-border)',
                      fontSize: 10, fontWeight: 700, color: 'var(--gv-text-muted)', marginBottom: 4,
                    }}>{p.sku}</span>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gv-text-heading)', margin: 0, lineHeight: 1.3 }}>{p.name}</h3>
                    {clientName && (
                      <p style={{ fontSize: 11, color: '#f59e0b', margin: '3px 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={11} /> {clientName}
                      </p>
                    )}
                    {p.description && <p style={{ fontSize: 11, color: 'var(--gv-text-muted)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {confirmDeleteId === p.id ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                          style={{ background: '#ef4444', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}
                        >✓</motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                          style={{ background: 'var(--gv-surface)', border: '1px solid var(--gv-border)', cursor: 'pointer', padding: '6px 10px', borderRadius: 6, color: 'var(--gv-text)', fontSize: 12, fontFamily: 'inherit' }}
                        ><X size={14} /></motion.button>
                      </div>
                    ) : (
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(p.id); }}
                        style={{ background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 6, color: '#ef4444' }}
                      ><Trash2 size={18} /></motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* ── SECTORS ── */}
            {activeTab === 'sectors' && sectors.map((s, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                key={s.id}
                onClick={() => startEdit(s)}
                style={{
                  padding: '16px 18px', borderRadius: 10,
                  background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)',
                  display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s ease', cursor: 'pointer'
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: 'rgba(139,92,246,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Building2 size={20} color="#8b5cf6" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gv-text-heading)', margin: 0 }}>{s.name}</h3>
                  {s.description && <p style={{ fontSize: 11, color: 'var(--gv-text-muted)', margin: '2px 0 0' }}>{s.description}</p>}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {confirmDeleteId === s.id ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                        style={{ background: '#ef4444', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}
                      >✓</motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                        style={{ background: 'var(--gv-surface)', border: '1px solid var(--gv-border)', cursor: 'pointer', padding: '6px 10px', borderRadius: 6, color: 'var(--gv-text)', fontSize: 12, fontFamily: 'inherit' }}
                      ><X size={14} /></motion.button>
                    </div>
                  ) : (
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(s.id); }}
                      style={{ background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 6, color: '#ef4444' }}
                    ><Trash2 size={18} /></motion.button>
                  )}
                </div>
              </motion.div>
            ))}

            {/* ── CLIENTS ── */}
            {activeTab === 'clients' && clients.map((c, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                key={c.id}
                onClick={() => startEdit(c)}
                style={{
                  padding: '16px 18px', borderRadius: 10,
                  background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)',
                  display: 'flex', alignItems: 'flex-start', gap: 14, transition: 'all 0.2s ease', cursor: 'pointer'
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
                }}>
                  <Users size={20} color="#f59e0b" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gv-text-heading)', margin: 0 }}>{c.name}</h3>
                  {c.sector && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 4, marginTop: 4,
                      background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                      fontSize: 10, fontWeight: 700, color: '#8b5cf6',
                    }}>
                      <Tag size={10} /> {c.sector.name}
                    </span>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {c.contact_name && <span style={{ fontSize: 11, color: 'var(--gv-text-muted)' }}>👤 {c.contact_name}</span>}
                    {c.email && <span style={{ fontSize: 11, color: 'var(--gv-text-muted)' }}>✉️ {c.email}</span>}
                    {c.phone && <span style={{ fontSize: 11, color: 'var(--gv-text-muted)' }}>📞 {c.phone}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {confirmDeleteId === c.id ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                        style={{ background: '#ef4444', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}
                      >✓</motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                        style={{ background: 'var(--gv-surface)', border: '1px solid var(--gv-border)', cursor: 'pointer', padding: '6px 10px', borderRadius: 6, color: 'var(--gv-text)', fontSize: 12, fontFamily: 'inherit' }}
                      ><X size={14} /></motion.button>
                    </div>
                  ) : (
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(c.id); }}
                      style={{ background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 6, color: '#ef4444' }}
                    ><Trash2 size={18} /></motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Toast
        message={toast?.message || ''}
        type={toast?.type || 'info'}
        visible={!!toast?.visible}
        onClose={() => setToast(null)}
      />
    </motion.div>
  );
}
