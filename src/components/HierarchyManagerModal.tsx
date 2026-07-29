import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Layers, Plus, Trash2, Save, MapPin, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGlobalStore } from '../store/globalStore';
import { baseDataApi } from '../api/baseDataApi';

interface HierarchyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HierarchyManagerModal({ isOpen, onClose }: HierarchyManagerModalProps) {
  const { t } = useTranslation();
  const { hierarchy, fetchHierarchy } = useGlobalStore();
  
  // State for Selection
  const [selectedLocId, setSelectedLocId] = useState<string | null>(null);
  
  // States for adding/editing Locations
  const [newLocName, setNewLocName] = useState('');
  const [isAddingLoc, setIsAddingLoc] = useState(false);
  const [editingLocId, setEditingLocId] = useState<string | null>(null);
  const [editLocName, setEditLocName] = useState('');
  const [locLoading, setLocLoading] = useState(false);
  
  // States for adding/editing Business Units
  const [newBuName, setNewBuName] = useState('');
  const [isAddingBu, setIsAddingBu] = useState(false);
  const [editingBuId, setEditingBuId] = useState<string | null>(null);
  const [editBuName, setEditBuName] = useState('');
  const [buLoading, setBuLoading] = useState(false);

  // Common styles
  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '8px 12px',
    background: 'var(--gv-surface)',
    border: '1px solid var(--gv-border)',
    borderRadius: 8,
    color: 'var(--gv-text-heading)',
    fontSize: 13,
    fontWeight: 600,
    outline: 'none',
  };

  // --- Location Handlers ---
  const handleSaveLoc = async () => {
    if (newLocName.trim() === '') return;
    setLocLoading(true);
    try {
      await baseDataApi.createLocation({ name: newLocName.trim() });
      await fetchHierarchy();
      setNewLocName('');
      setIsAddingLoc(false);
    } catch (error) {
      console.error(error);
    }
    setLocLoading(false);
  };

  const handleUpdateLoc = async (id: string) => {
    if (editLocName.trim() === '') return;
    setLocLoading(true);
    try {
      await baseDataApi.updateLocation(id, { name: editLocName.trim() });
      await fetchHierarchy();
      setEditingLocId(null);
    } catch (error) {
      console.error(error);
    }
    setLocLoading(false);
  };

  const handleDeleteLoc = async (id: string) => {
    if (!confirm('¿Eliminar esta planta? Se perderá la configuración de sus unidades.')) return;
    setLocLoading(true);
    try {
      await baseDataApi.deleteLocation(id);
      if (selectedLocId === id) setSelectedLocId(null);
      await fetchHierarchy();
    } catch (error) {
      console.error(error);
    }
    setLocLoading(false);
  };

  // --- Business Unit Handlers ---
  const handleSaveBu = async () => {
    if (newBuName.trim() === '' || !selectedLocId) return;
    setBuLoading(true);
    try {
      await baseDataApi.createBusinessUnit({ name: newBuName.trim(), location_id: selectedLocId });
      await fetchHierarchy();
      setNewBuName('');
      setIsAddingBu(false);
    } catch (error) {
      console.error(error);
    }
    setBuLoading(false);
  };

  const handleUpdateBu = async (id: string) => {
    if (editBuName.trim() === '') return;
    setBuLoading(true);
    try {
      await baseDataApi.updateBusinessUnit(id, { name: editBuName.trim() });
      await fetchHierarchy();
      setEditingBuId(null);
    } catch (error) {
      console.error(error);
    }
    setBuLoading(false);
  };

  const handleDeleteBu = async (id: string) => {
    if (!confirm('¿Eliminar esta unidad de negocio?')) return;
    setBuLoading(true);
    try {
      await baseDataApi.deleteBusinessUnit(id);
      await fetchHierarchy();
    } catch (error) {
      console.error(error);
    }
    setBuLoading(false);
  };

  if (!isOpen) return null;

  const selectedLoc = hierarchy.find(l => l.id === selectedLocId);

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          padding: 20
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={{
            background: 'var(--gv-bg)',
            border: '1px solid var(--gv-border)',
            borderRadius: 16,
            width: '100%', maxWidth: 850,
            maxHeight: '90vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--gv-border)', background: 'var(--gv-surface-alt)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={18} color="#3b82f6" />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--gv-text-heading)', margin: 0 }}>Gestión de Estructura</h2>
                <p style={{ fontSize: 12, color: 'var(--gv-text-muted)', margin: 0 }}>Administra las Plantas y sus Unidades de Negocio</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gv-text-muted)' }}>
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            
            {/* Left: Locations */}
            <div style={{ width: 320, borderRight: '1px solid var(--gv-border)', display: 'flex', flexDirection: 'column', background: 'var(--gv-surface)' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--gv-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--gv-text)' }}>Plantas</h3>
                <button onClick={() => setIsAddingLoc(true)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Plus size={18} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {isAddingLoc && (
                  <div style={{ display: 'flex', gap: 8, padding: 8, background: 'var(--gv-surface-alt)', borderRadius: 8, border: '1px dashed #3b82f6' }}>
                    <input autoFocus type="text" value={newLocName} onChange={(e) => setNewLocName(e.target.value)} style={inputStyle} placeholder="Nombre planta..." />
                    <button disabled={locLoading} onClick={handleSaveLoc} style={{ background: '#3b82f6', border: 'none', borderRadius: 6, color: '#fff', padding: '0 10px', cursor: 'pointer' }}><Save size={14}/></button>
                    <button onClick={() => setIsAddingLoc(false)} style={{ background: 'transparent', border: 'none', color: 'var(--gv-text-muted)', cursor: 'pointer' }}><X size={14}/></button>
                  </div>
                )}
                {hierarchy.map(loc => (
                  <div 
                    key={loc.id} 
                    onClick={() => { if (editingLocId !== loc.id) setSelectedLocId(loc.id) }}
                    style={{ 
                      padding: '10px 14px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s',
                      background: selectedLocId === loc.id ? 'var(--gv-surface-alt)' : 'transparent',
                      border: `1px solid ${selectedLocId === loc.id ? '#3b82f6' : 'transparent'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      boxShadow: selectedLocId === loc.id ? 'var(--gv-shadow-sm)' : 'none'
                    }}
                  >
                    {editingLocId === loc.id ? (
                      <div style={{ display: 'flex', gap: 8, flex: 1 }} onClick={e => e.stopPropagation()}>
                        <input autoFocus type="text" value={editLocName} onChange={(e) => setEditLocName(e.target.value)} style={inputStyle} />
                        <button disabled={locLoading} onClick={() => handleUpdateLoc(loc.id)} style={{ background: '#10b981', border: 'none', borderRadius: 6, color: '#fff', padding: '0 8px', cursor: 'pointer' }}><Save size={14}/></button>
                        <button onClick={() => setEditingLocId(null)} style={{ background: 'transparent', border: 'none', color: 'var(--gv-text-muted)', cursor: 'pointer' }}><X size={14}/></button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Building2 size={16} color={selectedLocId === loc.id ? '#3b82f6' : 'var(--gv-text-muted)'} />
                          <span style={{ fontSize: 13, fontWeight: selectedLocId === loc.id ? 700 : 600, color: selectedLocId === loc.id ? 'var(--gv-text-heading)' : 'var(--gv-text)' }}>
                            {loc.name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={(e) => { e.stopPropagation(); setEditLocName(loc.name); setEditingLocId(loc.id); }} style={{ background: 'transparent', border: 'none', color: 'var(--gv-text-muted)', cursor: 'pointer' }}><Pencil size={14} /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteLoc(loc.id); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Business Units */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {!selectedLocId ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--gv-text-muted)' }}>
                  <Layers size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                  <p>Selecciona una Planta para gestionar sus Unidades</p>
                </div>
              ) : (
                <>
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--gv-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--gv-surface)' }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--gv-text-heading)' }}>Unidades de Negocio</h3>
                      <p style={{ fontSize: 11, color: 'var(--gv-text-muted)', margin: 0 }}>en {selectedLoc?.name}</p>
                    </div>
                    <button onClick={() => setIsAddingBu(true)} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12 }}>
                      <Plus size={16} /> Agregar Unidad
                    </button>
                  </div>
                  
                  <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, alignContent: 'start' }}>
                    {isAddingBu && (
                      <div style={{ background: 'var(--gv-surface-alt)', border: '1px dashed #10b981', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <input autoFocus type="text" value={newBuName} onChange={(e) => setNewBuName(e.target.value)} style={inputStyle} placeholder="Nombre unidad..." />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button disabled={buLoading} onClick={handleSaveBu} style={{ flex: 1, background: '#10b981', border: 'none', borderRadius: 6, color: '#fff', padding: '8px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Guardar</button>
                          <button onClick={() => setIsAddingBu(false)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--gv-border)', borderRadius: 6, color: 'var(--gv-text)', padding: '8px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Cancelar</button>
                        </div>
                      </div>
                    )}
                    
                    {selectedLoc?.business_units.length === 0 && !isAddingBu && (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--gv-text-muted)', fontStyle: 'italic', fontSize: 13 }}>
                        No hay unidades de negocio registradas en esta planta.
                      </div>
                    )}

                    {selectedLoc?.business_units.map(bu => (
                      <div key={bu.id} style={{ background: 'var(--gv-surface-alt)', border: '1px solid var(--gv-border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {editingBuId === bu.id ? (
                          <>
                            <input autoFocus type="text" value={editBuName} onChange={(e) => setEditBuName(e.target.value)} style={inputStyle} />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button disabled={buLoading} onClick={() => handleUpdateBu(bu.id)} style={{ flex: 1, background: '#10b981', border: 'none', borderRadius: 6, color: '#fff', padding: '6px', cursor: 'pointer', fontSize: 12 }}>Guardar</button>
                              <button onClick={() => setEditingBuId(null)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--gv-border)', borderRadius: 6, color: 'var(--gv-text)', padding: '6px', cursor: 'pointer', fontSize: 12 }}>Cancelar</button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Layers size={16} color="#8b5cf6" />
                                </div>
                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--gv-text-heading)' }}>{bu.name}</h4>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--gv-border)' }}>
                              <button onClick={() => { setEditBuName(bu.name); setEditingBuId(bu.id); }} style={{ flex: 1, background: 'var(--gv-surface)', border: '1px solid var(--gv-border)', borderRadius: 6, color: 'var(--gv-text)', padding: '6px', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                                <Pencil size={12} /> Editar
                              </button>
                              <button onClick={() => handleDeleteBu(bu.id)} style={{ flex: 1, background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6, color: '#ef4444', padding: '6px', cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                                <Trash2 size={12} /> Eliminar
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
