import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Truck,
  Plus,
  Trash2,
  ChevronDown,
  Save,
  CheckCircle2,
  History,
  AlertCircle,
  Clock,
  Pencil,
  X,
  Edit3,
  Settings,
} from "lucide-react";
import type { PlanRecord, FilterState, TurnoType } from "../types";
import {
  TURNO_CONFIG,
  detectOverlap,
  getTargetForShift,
} from "../utils/shiftUtils";
import {
  getLogisticPlans,
  createLogisticPlan,
  updateLogisticPlan,
  deleteLogisticPlan,
} from "../api/productionService";
import { useGlobalStore } from "../store/globalStore";
import { useProductionStore } from "../store/productionStore";

// Remove fallbacks for strict validation
// const defaultLines = ['HMP-1', 'HMP-2'];
// const defaultSKUs = ['DASH-001'];

interface LogisticsViewProps {
  filters: FilterState;
  planRecords: PlanRecord[];
  onUpdatePlanRecords: (records: PlanRecord[]) => void;
  user: { name: string; dept: string; role: string } | null;
}

export default function LogisticsView({
  filters,
  planRecords,
  onUpdatePlanRecords,
  user,
}: LogisticsViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [showSaved, setShowSaved] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<PlanRecord[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingPlanConfirm, setEditingPlanConfirm] =
    useState<PlanRecord | null>(null);
  const { hierarchy, globalDateRange, setGlobalLoading } = useGlobalStore();

  const DOWNTIME_REASONS = [
    "CAMBIO_DE_MOLDE",
    "PRUEBAS_DE_INGENIERIA",
    "MANTENIMIENTO_PREVENTIVO",
    "FALTA_DE_MATERIAL_PROGRAMADA",
    "CAPACITACION",
  ];

  // Combine current drafts (planRecords) and history (published/cancelled) for overlap detection
  const allRecords = useMemo(
    () => [...planRecords, ...historyRecords],
    [planRecords, historyRecords],
  );

  const activeFacility = filters.businessUnit;

  const buObj = useMemo(() => {
    return hierarchy
      .flatMap((l) => l.business_units)
      .find((bu) => bu.name === activeFacility);
  }, [hierarchy, activeFacility]);

  const availableLines = useMemo(() => {
    if (!buObj || buObj.processes.length === 0) return [];
    return buObj.processes.map((p) => p.name);
  }, [buObj]);

  const getProductsForProcess = (processName: string) => {
    if (!buObj) return [];
    const process = buObj.processes.find((p) => p.name === processName);
    if (process && process.products && process.products.length > 0) {
      return process.products;
    }
    return [];
  };

  const getSKUsForProcess = (processName: string) => {
    return getProductsForProcess(processName).map((p) => p.sku);
  };

  const getTargetHrForSKU = (processName: string, sku: string) => {
    const product = getProductsForProcess(processName).find(
      (p) => p.sku === sku,
    );
    return product?.rate_per_hour || 45;
  };

  const hasTechnologies = availableLines.length > 0;
  const hasProducts = buObj
    ? buObj.processes.some((p) => p.products && p.products.length > 0)
    : false;

  // Fetch plans from backend based on global date range
  useEffect(() => {
    getLogisticPlans(globalDateRange.startDate, globalDateRange.endDate)
      .then((plans) => {
        setHistoryRecords(plans);
      })
      .catch((err) => console.error("Failed to load plans", err));
  }, [globalDateRange.startDate, globalDateRange.endDate]);

  // Synchronize draft records dates with global date range if they fall out of bounds
  useEffect(() => {
    if (planRecords.length > 0) {
      let changed = false;
      const updatedRecords = planRecords.map((record) => {
        if (
          record.fecha < globalDateRange.startDate ||
          record.fecha > globalDateRange.endDate
        ) {
          changed = true;
          return { ...record, fecha: globalDateRange.startDate };
        }
        return record;
      });

      if (changed) {
        onUpdatePlanRecords(updatedRecords);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalDateRange.startDate, globalDateRange.endDate]);

  const addRow = () => {
    if (availableLines.length === 0) return;
    const turnoDefault: TurnoType = "Matutino";

    let initialLine = availableLines[0];
    let initialSKUs = getSKUsForProcess(initialLine);

    if (initialSKUs.length === 0) {
      const lineWithProducts = availableLines.find(
        (l) => getSKUsForProcess(l).length > 0,
      );
      if (lineWithProducts) {
        initialLine = lineWithProducts;
        initialSKUs = getSKUsForProcess(initialLine);
      } else {
        return;
      }
    }

    const newRecord: PlanRecord = {
      id_plan: `PLAN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      fecha: globalDateRange.startDate,
      planta: activeFacility,
      linea: initialLine,
      turno: turnoDefault,
      slot: {
        start: TURNO_CONFIG[turnoDefault].start,
        end: TURNO_CONFIG[turnoDefault].end,
      },
      sku: initialSKUs[0],
      target_hr: getTargetHrForSKU(initialLine, initialSKUs[0]),
      creado_por: user?.name || "Sistema",
      created_at: new Date().toISOString(),
      status: "draft",
    };
    onUpdatePlanRecords([...planRecords, newRecord]);
  };

  const addPlannedDowntime = () => {
    if (availableLines.length === 0) return;
    const turnoDefault: TurnoType = "Matutino";
    let initialLine = availableLines[0];

    const newRecord: PlanRecord = {
      id_plan: `PLAN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      fecha: globalDateRange.startDate,
      planta: activeFacility,
      linea: initialLine,
      turno: turnoDefault,
      slot: {
        start: TURNO_CONFIG[turnoDefault].start,
        end: TURNO_CONFIG[turnoDefault].end,
      },
      sku: DOWNTIME_REASONS[0],
      target_hr: 0,
      creado_por: user?.name || "Sistema",
      created_at: new Date().toISOString(),
      status: "draft",
    };
    onUpdatePlanRecords([...planRecords, newRecord]);
  };

  const updateRow = (index: number, updates: Partial<PlanRecord>) => {
    const updated = planRecords.map((r, i) => {
      if (i !== index) return r;
      const modified = { ...r, ...updates, planta: activeFacility };
      if (updates.turno) {
        modified.slot = {
          start: TURNO_CONFIG[updates.turno as TurnoType].start,
          end: TURNO_CONFIG[updates.turno as TurnoType].end,
        };
      }
      
      const isDowntime = r.target_hr === 0;

      if (updates.linea) {
        // When process changes, reset SKU to a valid one for the new process (only for production plans)
        if (!isDowntime) {
          const validSKUs = getSKUsForProcess(updates.linea);
          if (!validSKUs.includes(modified.sku)) {
            modified.sku = validSKUs[0] || "";
            modified.target_hr = getTargetHrForSKU(updates.linea, modified.sku);
          }
        }
      }
      if (
        updates.sku &&
        updates.target_hr === undefined &&
        !updates.linea &&
        !updates.turno
      ) {
        if (!isDowntime) {
          modified.target_hr = getTargetHrForSKU(modified.linea, updates.sku);
        }
      }
      return modified;
    });
    onUpdatePlanRecords(updated);
  };

  const removeRow = (index: number) => {
    onUpdatePlanRecords(planRecords.filter((_, i) => i !== index));
  };

  // Check overlaps for all draft records
  const validationResults = useMemo(() => {
    return planRecords.map((record) => detectOverlap(record, allRecords));
  }, [planRecords, allRecords]);

  const hasAnyOverlap = validationResults.some((r) => r.hasOverlap);

  const handleSave = async () => {
    if (hasAnyOverlap) return;

    setGlobalLoading(true, t("logistics.saving_plans", "Guardando planes..."));
    try {
      const publishedRecords = await Promise.all(
        planRecords.map((r) => {
          if (!r.id_plan.startsWith("PLAN-")) {
            return updateLogisticPlan(r.id_plan, {
              ...r,
              status: "published" as const,
            });
          }
          return createLogisticPlan({ ...r, status: "published" as const });
        }),
      );
      setHistoryRecords((prev) => [...publishedRecords, ...prev]);
      onUpdatePlanRecords([]); // Clear drafts

      // Invalidate plans cache so that the HourByHourView picks up the new plans immediately
      useProductionStore.getState().invalidateCache("plans");

      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
      setActiveTab("history");
    } catch (error: any) {
      console.error("Error saving plans:", error);
      alert(
        error.response?.data?.detail ||
          "Error al guardar el plan logístico. Verifica que no haya solapamiento en el servidor.",
      );
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleEditPlan = (record: PlanRecord) => {
    setEditingPlanConfirm(record);
  };

  const confirmEditPlan = () => {
    if (!editingPlanConfirm) return;
    setHistoryRecords((prev) =>
      prev.filter((r) => r.id_plan !== editingPlanConfirm.id_plan),
    );
    onUpdatePlanRecords([
      ...planRecords,
      { ...editingPlanConfirm, status: "draft" },
    ]);
    setActiveTab("new");
    setEditingPlanConfirm(null);
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      setGlobalLoading(
        true,
        t("logistics.deleting_plan", "Eliminando plan..."),
      );
      await deleteLogisticPlan(planId);
      setHistoryRecords((prev) => prev.filter((p) => p.id_plan !== planId));
      useProductionStore.getState().invalidateCache("plans");
      setConfirmDeleteId(null);
    } catch (error: any) {
      console.error("Error deleting plan", error);
      alert(
        error.response?.data?.detail ||
          t("logistics.error_deleting", "Error al eliminar el plan."),
      );
    } finally {
      setGlobalLoading(false);
    }
  };

  const totalTargetDrafts = planRecords.reduce(
    (acc, r) => acc + getTargetForShift(r.turno, r.target_hr, r.slot),
    0,
  );

  // Filter history records based on selected BU
  const filteredHistory = useMemo(() => {
    return historyRecords.filter((r) => r.planta === activeFacility);
  }, [historyRecords, activeFacility]);

  const selectStyle: React.CSSProperties = {
    appearance: "none",
    padding: "10px 32px 10px 14px",
    background: "var(--gv-surface-alt)",
    border: "1px solid var(--gv-border)",
    borderRadius: 8,
    color: "var(--gv-text-heading)",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    width: "100%",
    transition: "all 0.2s ease",
  };

  const thStyle: React.CSSProperties = {
    padding: "14px 16px",
    textAlign: "left",
    fontSize: 14,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--gv-text-muted)",
    borderBottom: "2px solid var(--gv-border)",
    background: "var(--gv-surface-alt)",
  };

  const tdStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderBottom: "1px solid var(--gv-border)",
    verticalAlign: "middle",
    fontSize: 15,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 6,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background:
                  "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(59,130,246,0.15))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Truck size={18} color="#06b6d4" />
            </div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "var(--gv-text-heading)",
                margin: 0,
                letterSpacing: -0.5,
              }}
            >
              {t("logistics.title")}
            </h1>
          </div>
          <p
            style={{
              fontSize: 13,
              color: "var(--gv-text-muted)",
              margin: 0,
              paddingLeft: 46,
            }}
          >
            {t("logistics.subtitle")}
          </p>
        </div>

        {activeTab === "new" && (
          <div
            className="glass-card"
            style={{
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--gv-text-muted)",
                  textTransform: "uppercase",
                }}
              >
                {t("logistics.target_shift")} (Drafts)
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--gv-primary)",
                  lineHeight: 1,
                }}
              >
                {totalTargetDrafts} pzs
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          borderBottom: "1px solid var(--gv-border)",
          paddingBottom: 16,
        }}
      >
        <button
          onClick={() => setActiveTab("new")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background:
              activeTab === "new" ? "var(--gv-surface)" : "transparent",
            border:
              activeTab === "new"
                ? "1px solid var(--gv-border)"
                : "1px solid transparent",
            color:
              activeTab === "new"
                ? "var(--gv-primary)"
                : "var(--gv-text-muted)",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: activeTab === "new" ? "var(--gv-shadow-sm)" : "none",
          }}
        >
          <Plus size={16} /> {t("logistics.tab_new_plan")}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background:
              activeTab === "history" ? "var(--gv-surface)" : "transparent",
            border:
              activeTab === "history"
                ? "1px solid var(--gv-border)"
                : "1px solid transparent",
            color:
              activeTab === "history"
                ? "var(--gv-primary)"
                : "var(--gv-text-muted)",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: activeTab === "history" ? "var(--gv-shadow-sm)" : "none",
          }}
        >
          <History size={16} /> {t("logistics.tab_history")}
        </button>
      </div>

      {/* Saved toast */}
      <AnimatePresence>
        {showSaved && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            style={{
              padding: "14px 20px",
              borderRadius: 10,
              background: "rgba(16,185,129,0.12)",
              border: "1px solid rgba(16,185,129,0.3)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "#10b981",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={18} />
            {t("logistics.saved_msg")}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeTab === "new" ? (
          <motion.div
            key="new"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ display: "flex", flexDirection: "column", gap: 24 }}
          >
            {!hasTechnologies || !hasProducts ? (
              <div
                className="glass-card"
                style={{
                  padding: "60px 40px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 24,
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "#ef4444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertCircle size={40} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: "var(--gv-text-heading)",
                      marginBottom: 12,
                    }}
                  >
                    {!hasTechnologies
                      ? t("logistics.no_technologies_title")
                      : t("logistics.no_products_title")}
                  </h3>
                  <p
                    style={{
                      fontSize: 15,
                      color: "var(--gv-text-muted)",
                      maxWidth: 500,
                      margin: "0 auto",
                      lineHeight: 1.6,
                    }}
                  >
                    {!hasTechnologies
                      ? t("logistics.no_technologies_desc")
                      : t("logistics.no_products_desc")}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Editor Table */}
                <div className="glass-card" style={{ overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      <thead>
                        <tr>
                          <th style={{ ...thStyle, minWidth: 50 }}>#</th>
                          <th style={{ ...thStyle, minWidth: 140 }}>
                            {t("logistics.col_date")}
                          </th>
                          <th style={{ ...thStyle, minWidth: 120 }}>
                            {t("logistics.col_line")}
                          </th>
                          <th style={{ ...thStyle, minWidth: 150 }}>
                            {t("logistics.col_shift")}
                          </th>
                          <th style={{ ...thStyle, minWidth: 160 }}>
                            {t("logistics.col_time")}
                          </th>
                          <th style={{ ...thStyle, minWidth: 200 }}>
                            {t("logistics.col_sku")}
                          </th>
                          <th style={{ ...thStyle, minWidth: 120 }}>
                            {t("logistics.col_target_hr")}
                          </th>
                          <th style={{ ...thStyle, minWidth: 120 }}>
                            {t("logistics.col_target_shift")}
                          </th>
                          <th style={{ ...thStyle, minWidth: 60 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {planRecords.length === 0 ? (
                            <motion.tr
                              key="empty-state"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <td
                                colSpan={9}
                                style={{
                                  padding: "60px 20px",
                                  textAlign: "center",
                                  color: "var(--gv-text-muted)",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 12,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 48,
                                      height: 48,
                                      borderRadius: "50%",
                                      background: "var(--gv-surface)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "var(--gv-text-muted)",
                                      border: "1px dashed var(--gv-border)",
                                    }}
                                  >
                                    <Plus size={24} />
                                  </div>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: 15,
                                      fontWeight: 500,
                                    }}
                                  >
                                    {t("logistics.no_data_msg")}
                                  </p>
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 12,
                                      marginTop: 8,
                                    }}
                                  >
                                    <button
                                      onClick={addRow}
                                      style={{
                                        padding: "8px 16px",
                                        borderRadius: 8,
                                        background: "var(--gv-surface-alt)",
                                        border: "1px solid var(--gv-border)",
                                        color: "var(--gv-primary)",
                                        fontWeight: 600,
                                        fontSize: 13,
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                      }}
                                    >
                                      <Plus size={16} />{" "}
                                      {t("logistics.btn_add_line")}
                                    </button>
                                    <button
                                      onClick={addPlannedDowntime}
                                      style={{
                                        padding: "8px 16px",
                                        borderRadius: 8,
                                        background: "var(--gv-surface-alt)",
                                        border: "1px solid var(--gv-border)",
                                        color: "#f59e0b",
                                        fontWeight: 600,
                                        fontSize: 13,
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                      }}
                                    >
                                      <Settings size={16} /> Añadir Paro
                                      Programado
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </motion.tr>
                          ) : (
                            planRecords.map((record, index) => {
                              const shiftCfg = TURNO_CONFIG[record.turno];
                              const overlap = validationResults[index];
                              const rowTarget = getTargetForShift(
                                record.turno,
                                record.target_hr,
                                record.slot,
                              );

                              return (
                                <motion.tr
                                  key={record.id_plan}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 20, height: 0 }}
                                  transition={{ delay: index * 0.04 }}
                                  style={{
                                    background: overlap.hasOverlap
                                      ? "rgba(245, 158, 11, 0.05)"
                                      : "transparent",
                                  }}
                                >
                                  <td
                                    style={{ ...tdStyle, textAlign: "center" }}
                                  >
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: 28,
                                        height: 28,
                                        borderRadius: 7,
                                        background: overlap.hasOverlap
                                          ? "rgba(245, 158, 11, 0.2)"
                                          : "var(--gv-surface-alt)",
                                        fontWeight: 700,
                                        fontSize: 12,
                                        color: overlap.hasOverlap
                                          ? "#f59e0b"
                                          : "var(--gv-text-muted)",
                                      }}
                                    >
                                      {index + 1}
                                    </span>
                                  </td>
                                  {/* Fecha */}
                                  <td style={tdStyle}>
                                    <input
                                      type="date"
                                      value={record.fecha}
                                      min={globalDateRange.startDate}
                                      max={globalDateRange.endDate}
                                      onChange={(e) =>
                                        updateRow(index, {
                                          fecha: e.target.value,
                                        })
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        background: "var(--gv-surface-alt)",
                                        border: "1px solid var(--gv-border)",
                                        borderRadius: 8,
                                        color: "var(--gv-text-heading)",
                                        fontSize: 14,
                                        fontWeight: 600,
                                        fontFamily: "inherit",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                      }}
                                    />
                                  </td>
                                  {/* Línea */}
                                  <td style={tdStyle}>
                                    <div style={{ position: "relative" }}>
                                      <select
                                        style={selectStyle}
                                        value={record.linea}
                                        onChange={(e) =>
                                          updateRow(index, {
                                            linea: e.target.value,
                                          })
                                        }
                                      >
                                        {availableLines.map((l) => (
                                          <option key={l} value={l}>
                                            {l}
                                          </option>
                                        ))}
                                      </select>
                                      <ChevronDown
                                        size={12}
                                        style={{
                                          position: "absolute",
                                          right: 10,
                                          top: "50%",
                                          transform: "translateY(-50%)",
                                          color: "var(--gv-text-muted)",
                                          pointerEvents: "none",
                                        }}
                                      />
                                    </div>
                                  </td>
                                  {/* Turno */}
                                  <td style={tdStyle}>
                                    <div style={{ position: "relative" }}>
                                      <select
                                        style={{
                                          ...selectStyle,
                                          borderLeft: `4px solid ${shiftCfg.color}`,
                                        }}
                                        value={record.turno}
                                        onChange={(e) =>
                                          updateRow(index, {
                                            turno: e.target.value as TurnoType,
                                          })
                                        }
                                      >
                                        {Object.entries(TURNO_CONFIG).map(
                                          ([k, v]) => (
                                            <option key={k} value={k}>
                                              {v.label}
                                            </option>
                                          ),
                                        )}
                                      </select>
                                      <ChevronDown
                                        size={12}
                                        style={{
                                          position: "absolute",
                                          right: 10,
                                          top: "50%",
                                          transform: "translateY(-50%)",
                                          color: "var(--gv-text-muted)",
                                          pointerEvents: "none",
                                        }}
                                      />
                                    </div>
                                  </td>
                                  {/* Horario */}
                                  <td style={tdStyle}>
                                    {record.turno === "Mixto" ? (
                                      <div
                                        style={{
                                          display: "flex",
                                          gap: 6,
                                          alignItems: "center",
                                        }}
                                      >
                                        <input
                                          type="time"
                                          value={record.slot.start}
                                          onChange={(e) =>
                                            updateRow(index, {
                                              slot: {
                                                ...record.slot,
                                                start: e.target.value,
                                              },
                                            })
                                          }
                                          style={{
                                            padding: "6px",
                                            borderRadius: 4,
                                            border:
                                              "1px solid var(--gv-border)",
                                            background: "var(--gv-surface-alt)",
                                            color: "var(--gv-text)",
                                            fontSize: 12,
                                          }}
                                        />
                                        <span
                                          style={{
                                            color: "var(--gv-text-muted)",
                                          }}
                                        >
                                          -
                                        </span>
                                        <input
                                          type="time"
                                          value={record.slot.end}
                                          onChange={(e) =>
                                            updateRow(index, {
                                              slot: {
                                                ...record.slot,
                                                end: e.target.value,
                                              },
                                            })
                                          }
                                          style={{
                                            padding: "6px",
                                            borderRadius: 4,
                                            border:
                                              "1px solid var(--gv-border)",
                                            background: "var(--gv-surface-alt)",
                                            color: "var(--gv-text)",
                                            fontSize: 12,
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <div
                                        style={{
                                          fontSize: 12,
                                          color: "var(--gv-text-muted)",
                                          fontWeight: 600,
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 6,
                                        }}
                                      >
                                        <Clock size={14} /> {record.slot.start}{" "}
                                        – {record.slot.end}
                                      </div>
                                    )}
                                    {overlap.hasOverlap && (
                                      <div
                                        style={{
                                          fontSize: 10,
                                          color: "#f59e0b",
                                          marginTop: 4,
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 4,
                                        }}
                                      >
                                        <AlertCircle size={12} /> Solapamiento
                                      </div>
                                    )}
                                  </td>
                                  {/* SKU */}
                                  <td style={tdStyle}>
                                    <div style={{ position: "relative" }}>
                                      <select
                                        style={{
                                          ...selectStyle,
                                          color:
                                            record.target_hr === 0
                                              ? "#f59e0b"
                                              : "inherit",
                                          fontWeight:
                                            record.target_hr === 0 ? 700 : 500,
                                        }}
                                        value={record.sku}
                                        onChange={(e) =>
                                          updateRow(index, {
                                            sku: e.target.value,
                                          })
                                        }
                                      >
                                        {record.target_hr === 0
                                          ? DOWNTIME_REASONS.map((r) => (
                                              <option key={r} value={r}>
                                                {r}
                                              </option>
                                            ))
                                          : getSKUsForProcess(record.linea).map(
                                              (s) => (
                                                <option key={s} value={s}>
                                                  {s}
                                                </option>
                                              ),
                                            )}
                                      </select>
                                      <ChevronDown
                                        size={12}
                                        style={{
                                          position: "absolute",
                                          right: 10,
                                          top: "50%",
                                          transform: "translateY(-50%)",
                                          color: "var(--gv-text-muted)",
                                          pointerEvents: "none",
                                        }}
                                      />
                                    </div>
                                  </td>
                                  {/* Target / hr */}
                                  <td style={tdStyle}>
                                    <input
                                      type="number"
                                      disabled={record.target_hr === 0}
                                      style={{
                                        width: 80,
                                        padding: "10px",
                                        background:
                                          record.target_hr === 0
                                            ? "rgba(245, 158, 11, 0.1)"
                                            : "var(--gv-surface-alt)",
                                        border:
                                          record.target_hr === 0
                                            ? "1px dashed #f59e0b"
                                            : "1px solid var(--gv-border)",
                                        borderRadius: 8,
                                        color:
                                          record.target_hr === 0
                                            ? "#f59e0b"
                                            : "var(--gv-primary)",
                                        fontSize: 15,
                                        fontWeight: 800,
                                        fontFamily: "'Inter', sans-serif",
                                        textAlign: "center",
                                        transition: "all 0.2s ease",
                                      }}
                                      value={record.target_hr || ""}
                                      onChange={(e) =>
                                        updateRow(index, {
                                          target_hr:
                                            parseInt(e.target.value) || 0,
                                        })
                                      }
                                      min={0}
                                    />
                                  </td>
                                  {/* Target turno */}
                                  <td
                                    style={{
                                      ...tdStyle,
                                      textAlign: "center",
                                      fontWeight: 800,
                                      fontSize: 15,
                                      color: "var(--gv-text-heading)",
                                    }}
                                  >
                                    {rowTarget}
                                  </td>
                                  {/* Delete */}
                                  <td style={tdStyle}>
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => removeRow(index)}
                                      style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 7,
                                        border: "1px solid rgba(239,68,68,0.2)",
                                        background: "rgba(239,68,68,0.08)",
                                        color: "#ef4444",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <Trash2 size={14} />
                                    </motion.button>
                                  </td>
                                </motion.tr>
                              );
                            })
                          )}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>

                  {/* Add Row + Save */}
                  {planRecords.length > 0 && (
                    <div
                      style={{
                        padding: "16px 24px",
                        borderTop: "1px solid var(--gv-border)",
                        display: "flex",
                        justifyContent: "space-between",
                        background: hasAnyOverlap
                          ? "rgba(245, 158, 11, 0.05)"
                          : "transparent",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 16,
                          alignItems: "center",
                        }}
                      >
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={addRow}
                          style={{
                            padding: "10px 22px",
                            borderRadius: 8,
                            border: "1px dashed var(--gv-border)",
                            background: "transparent",
                            color: "var(--gv-primary)",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            transition: "all 0.2s ease",
                          }}
                        >
                          <Plus size={16} /> {t("logistics.btn_add_line")}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={addPlannedDowntime}
                          style={{
                            padding: "10px 22px",
                            borderRadius: 8,
                            border: "1px dashed rgba(245, 158, 11, 0.5)",
                            background: "rgba(245, 158, 11, 0.05)",
                            color: "#f59e0b",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            transition: "all 0.2s ease",
                          }}
                        >
                          <Settings size={16} /> Añadir Paro Programado
                        </motion.button>
                        {hasAnyOverlap && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              color: "#f59e0b",
                              fontSize: 13,
                              fontWeight: 600,
                            }}
                          >
                            <AlertCircle size={16} />
                            {t("logistics.overlap_error")}
                          </div>
                        )}
                      </div>
                      <motion.button
                        whileHover={!hasAnyOverlap ? { scale: 1.02 } : {}}
                        whileTap={!hasAnyOverlap ? { scale: 0.97 } : {}}
                        onClick={handleSave}
                        disabled={hasAnyOverlap || planRecords.length === 0}
                        style={{
                          padding: "10px 24px",
                          borderRadius: 8,
                          border: "none",
                          background:
                            hasAnyOverlap || planRecords.length === 0
                              ? "var(--gv-surface-alt)"
                              : "linear-gradient(135deg, #06b6d4, #3b82f6)",
                          color:
                            hasAnyOverlap || planRecords.length === 0
                              ? "var(--gv-text-muted)"
                              : "#fff",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor:
                            hasAnyOverlap || planRecords.length === 0
                              ? "not-allowed"
                              : "pointer",
                          fontFamily: "inherit",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Save size={16} /> {t("logistics.btn_save_publish")}
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Info callout */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    padding: "16px 20px",
                    borderRadius: 10,
                    background: "rgba(6,182,212,0.06)",
                    border: "1px solid rgba(6,182,212,0.15)",
                    fontSize: 13,
                    color: "var(--gv-text)",
                    lineHeight: 1.6,
                  }}
                >
                  <strong style={{ color: "var(--gv-primary)" }}>
                    💡 {t("logistics.info_title")}
                  </strong>{" "}
                  {t("logistics.info_desc")}
                </motion.div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card"
            style={{ overflow: "hidden" }}
          >
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <thead>
                  <tr>
                    <th style={{ ...thStyle, minWidth: 110 }}>
                      {t("logistics.col_date")}
                    </th>
                    <th style={{ ...thStyle, minWidth: 100 }}>
                      {t("logistics.col_line")}
                    </th>
                    <th style={{ ...thStyle, minWidth: 120 }}>
                      {t("logistics.col_shift")}
                    </th>
                    <th style={{ ...thStyle, minWidth: 140 }}>
                      {t("logistics.col_time")}
                    </th>
                    <th style={{ ...thStyle, minWidth: 180 }}>
                      {t("logistics.col_sku")}
                    </th>
                    <th style={{ ...thStyle, minWidth: 130 }}>
                      {t("logistics.col_target_shift")}
                    </th>
                    <th style={{ ...thStyle, minWidth: 120 }}>
                      Estatus Operativo
                    </th>
                    <th
                      style={{ ...thStyle, minWidth: 100, textAlign: "center" }}
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        style={{
                          padding: "40px",
                          textAlign: "center",
                          color: "var(--gv-text-muted)",
                        }}
                      >
                        {t("logistics.no_history")}
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((record) => {
                      const shiftCfg =
                        TURNO_CONFIG[record.turno] || TURNO_CONFIG["Matutino"];
                      const statusColors = {
                        published: {
                          bg: "rgba(16,185,129,0.1)",
                          color: "#10b981",
                          border: "rgba(16,185,129,0.2)",
                        },
                        cancelled: {
                          bg: "rgba(239,68,68,0.1)",
                          color: "#ef4444",
                          border: "rgba(239,68,68,0.2)",
                        },
                        draft: {
                          bg: "var(--gv-surface-alt)",
                          color: "var(--gv-text-muted)",
                          border: "var(--gv-border)",
                        },
                      };
                      const sColor = statusColors[record.status];

                      return (
                        <tr key={record.id_plan} className="group">
                          <td
                            style={{
                              ...tdStyle,
                              fontSize: 15,
                              fontWeight: 500,
                            }}
                          >
                            {record.fecha}
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 700 }}>
                            {record.linea}
                          </td>
                          <td style={tdStyle}>
                            <span
                              style={{
                                display: "inline-flex",
                                padding: "4px 8px",
                                borderRadius: 6,
                                fontSize: 13,
                                fontWeight: 700,
                                background: `rgba(${shiftCfg.color === "#3b82f6" ? "59,130,246" : shiftCfg.color === "#f97316" ? "249,115,22" : "139,92,246"}, 0.1)`,
                                color: shiftCfg.color,
                                border: `1px solid ${shiftCfg.color}40`,
                              }}
                            >
                              {record.turno}
                            </span>
                          </td>
                          <td
                            style={{
                              ...tdStyle,
                              fontSize: 14,
                              color: "var(--gv-text-muted)",
                            }}
                          >
                            {record.slot
                              ? `${record.slot.start} – ${record.slot.end}`
                              : `${shiftCfg.start} – ${shiftCfg.end}`}
                          </td>
                          <td style={tdStyle}>
                            {record.target_hr === 0 ? (
                              <span
                                style={{ color: "#f59e0b", fontWeight: 600 }}
                              >
                                {record.sku}
                              </span>
                            ) : (
                              record.sku
                            )}
                          </td>
                          <td
                            style={{
                              ...tdStyle,
                              fontWeight: 800,
                              fontSize: 16,
                            }}
                          >
                            {getTargetForShift(
                              record.turno,
                              record.target_hr,
                              record.slot,
                            )}
                          </td>
                          <td
                            style={{
                              ...tdStyle,
                              fontSize: 13,
                              fontWeight: 700,
                              textAlign: "center",
                            }}
                          >
                            {(() => {
                              const startTime =
                                record.slot?.start || shiftCfg.start;
                              const endTime = record.slot?.end || shiftCfg.end;
                              const [y, m, d] = record.fecha
                                .split("-")
                                .map(Number);
                              const [sH, sM] = startTime.split(":").map(Number);
                              const [eH, eM] = endTime.split(":").map(Number);

                              const start = new Date(y, m - 1, d, sH, sM);
                              const end = new Date(y, m - 1, d, eH, eM);
                              if (end < start) end.setDate(end.getDate() + 1);

                              const now = new Date();
                              let label = "Pendiente por cargar";
                              let color = "#f59e0b";
                              let bg = "rgba(245, 158, 11, 0.1)";

                              if (now > end) {
                                label = "Finalizado";
                                color = "#10b981";
                                bg = "rgba(16, 185, 129, 0.1)";
                              } else if (now >= start && now <= end) {
                                label = "En Progreso";
                                color = "#3b82f6";
                                bg = "rgba(59, 130, 246, 0.1)";
                              }

                              return (
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "4px 8px",
                                    borderRadius: 6,
                                    background: bg,
                                    color: color,
                                    border: `1px solid ${color}40`,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {label}
                                </span>
                              );
                            })()}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            <div
                              className={
                                confirmDeleteId === record.id_plan
                                  ? ""
                                  : "opacity-0 group-hover:opacity-100 transition-opacity"
                              }
                              style={{
                                display: "flex",
                                gap: 8,
                                justifyContent: "center",
                              }}
                            >
                              {confirmDeleteId === record.id_plan ? (
                                <div style={{ display: "flex", gap: 4 }}>
                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() =>
                                      handleDeletePlan(record.id_plan)
                                    }
                                    style={{
                                      background: "#ef4444",
                                      border: "none",
                                      cursor: "pointer",
                                      padding: "6px 10px",
                                      borderRadius: 6,
                                      color: "#fff",
                                      fontSize: 12,
                                      fontWeight: 700,
                                    }}
                                  >
                                    ✓
                                  </motion.button>
                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setConfirmDeleteId(null)}
                                    style={{
                                      background: "var(--gv-surface-alt)",
                                      border: "1px solid var(--gv-border)",
                                      cursor: "pointer",
                                      padding: "6px 10px",
                                      borderRadius: 6,
                                      color: "var(--gv-text)",
                                      fontSize: 12,
                                    }}
                                  >
                                    <X size={14} />
                                  </motion.button>
                                </div>
                              ) : (
                                <>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleEditPlan(record)}
                                    style={{
                                      background: "rgba(59,130,246,0.1)",
                                      border: "none",
                                      cursor: "pointer",
                                      padding: 8,
                                      borderRadius: 6,
                                      color: "#3b82f6",
                                    }}
                                  >
                                    <Pencil size={18} />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() =>
                                      setConfirmDeleteId(record.id_plan)
                                    }
                                    style={{
                                      background: "rgba(239,68,68,0.1)",
                                      border: "none",
                                      cursor: "pointer",
                                      padding: 8,
                                      borderRadius: 6,
                                      color: "#ef4444",
                                    }}
                                  >
                                    <Trash2 size={18} />
                                  </motion.button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Confirm Modal for Edit */}
      <AnimatePresence>
        {editingPlanConfirm && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-card max-w-lg w-full relative overflow-hidden flex flex-col h-[400px]"
              style={{
                padding: "40px",
                background: "var(--gv-surface)",
                border: "1px solid var(--gv-border)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
            >
              <div className="flex items-start gap-6 flex-1">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(245, 158, 11, 0.1)",
                    color: "#f59e0b",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                  }}
                >
                  <AlertCircle size={28} />
                </div>
                <div className="flex flex-col h-full flex-1">
                  <h3
                    className="text-2xl font-bold mb-4"
                    style={{ color: "var(--gv-text-heading)" }}
                  >
                    Advertencia de Edición
                  </h3>
                  <p
                    className="text-base mb-4 leading-relaxed"
                    style={{ color: "var(--gv-text-muted)" }}
                  >
                    Estás a punto de editar un plan de producción publicado. Si
                    este plan ya tiene registros operativos (piezas, paros),
                    modificarlos puede causar inconsistencias en los reportes
                    (seguridad por RBAC requerida).
                  </p>
                  <p
                    className="font-bold text-lg mt-auto"
                    style={{ color: "var(--gv-text-heading)" }}
                  >
                    ¿Deseas continuar?
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-5 mt-auto pt-6">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setEditingPlanConfirm(null)}
                  className="px-8 py-3.5 rounded-2xl text-base font-bold transition-colors"
                  style={{
                    background: "var(--gv-surface-alt)",
                    color: "var(--gv-text-heading)",
                    border: "1px solid var(--gv-border)",
                    minWidth: "140px",
                  }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={confirmEditPlan}
                  className="px-8 py-3.5 rounded-2xl text-base font-bold text-white transition-all shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    border: "none",
                    minWidth: "180px",
                  }}
                >
                  Continuar Edición
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
