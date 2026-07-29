import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  memo,
  useOptimistic,
  startTransition,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import Toast from "./Toast";
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  TrendingDown,
  Wrench,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Network,
  BadgeCheck,
  ShieldAlert,
  X,
  Eye,
  ShieldCheck,
  Layers,
  Trash2,
  Edit3,
} from "lucide-react";
import type {
  HourRecord,
  FilterState,
  FaultRecord,
  ScrapRecord,
  ValidationStatus,
} from "../types";
import scrapCatalog from "../utils/Failures_SCRAP.json";
import { baseDataApi } from "../api/baseDataApi";
import type {
  BaseMachine,
  BaseMaintenanceCategory,
  DowntimeRecord,
  ScrapCatalog,
  BaseAssetFamily,
  BaseProcess,
  BaseScrapDefect
} from "../types";
import FaultAnalysisDrawer from "./FaultAnalysisDrawer";
import ShiftTimeline from "./ShiftTimeline";
import {
  createHourRecord,
  updateHourRecord,
  updateOperativeRecordStatus,
} from "../api/productionService";
import axiosClient from "../api/axiosClient";
import { TURNO_CONFIG, parseTimeToMinutes } from "../utils/shiftUtils";
import { useSyncStore } from "../store/syncStore";
import { useProductionStore } from "../store/productionStore";
import { useGlobalStore } from "../store/globalStore";
import { useLocalShiftStore } from "../store/localShiftStore";

const catalog = scrapCatalog as ScrapCatalog;
const technologies = Object.keys(catalog);

const getCatalogTranslation = (t: any, text: string) => {
  if (!text) return text;
  const key = `catalog.${text.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  const translated = t(key, { defaultValue: text });
  return translated;
};

interface HourByHourViewProps {
  filters: FilterState;
  planTarget: number;
}

/* FaultRegistrationModal has been unified with DowntimeRegistrationModal */

/* ════════════════════════════════════════════════════ */
/*          Scrap Registration Modal                  */
/* ════════════════════════════════════════════════════ */

interface ScrapModalProps {
  hourNumber: number;
  activePlanSku?: string;
  initialData?: ScrapRecord | null;
  onRegister: (
    scrap: Omit<ScrapRecord, "id" | "validationQuality" | "timestamp">,
  ) => void;
  onClose: () => void;
}

const ScrapRegistrationModal = memo(function ScrapRegistrationModal({
  hourNumber,
  activePlanSku,
  initialData,
  onRegister,
  onClose,
}: ScrapModalProps) {
  const { t } = useTranslation();
  
  const [processes, setProcesses] = useState<BaseProcess[]>([]);
  const [allDefects, setAllDefects] = useState<BaseScrapDefect[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selTech, setSelTech] = useState("");
  const [selDefect, setSelDefect] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [comments, setComments] = useState("");
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    Promise.all([
      baseDataApi.getProcesses(),
      baseDataApi.getScrapDefects(),
      baseDataApi.getProducts()
    ]).then(([proc, def, prods]) => {
      setProducts(prods);
      setAllDefects(def);
      
      const activeProd = prods.find(p => p.sku === activePlanSku);
      const allowedProcessIds = activeProd?.process_ids || [];
      const filteredProc = allowedProcessIds.length > 0
        ? proc.filter(p => allowedProcessIds.includes(p.id))
        : proc;
        
      setProcesses(filteredProc);
      
      if (initialData) {
        const p = filteredProc.find(p => p.name === initialData.tecnologia) || filteredProc[0];
        if (p) setSelTech(p.id);
        setSelDefect(initialData.codigoDefecto || "");
        setCantidad(initialData.cantidad || 1);
        setComments(initialData.comments || "");
        setActiveStep(3);
      } else if (filteredProc.length > 0) {
        setSelTech(filteredProc[0].id);
      }
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  }, []);

  const defects = allDefects.filter((d) => d.process_id === selTech);
  const currentDefect = defects.find((d) => d.code === selDefect);
  const isValid = selTech && selDefect && cantidad > 0;

  const selectStyle: React.CSSProperties = {
    appearance: "none",
    width: "100%",
    padding: "10px 36px 10px 14px",
    background: "var(--gv-surface-alt)",
    border: "1px solid var(--gv-border)",
    borderRadius: 8,
    color: "var(--gv-text-heading)",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "inherit",
    cursor: "pointer",
  };

  const techColors: Record<string, string> = {
    Inyeccion: "#3b82f6",
    Termoformado: "#8b5cf6",
    Corte: "#f59e0b",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 8000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 10 }}
        transition={{ type: "spring", damping: 25, stiffness: 320 }}
        style={{
          width: "100%",
          maxWidth: 560,
          background: "var(--gv-surface)",
          border: "1px solid var(--gv-border)",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--gv-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(236,72,153,0.06))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background:
                  "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.15))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldCheck size={16} color="#8b5cf6" />
            </div>
            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--gv-text-heading)",
                }}
              >
                {initialData ? t("hourByHour.edit_scrap_title", "Editar Scrap") : t("hourByHour.register_scrap_title")} {hourNumber}
              </div>
              <div style={{ fontSize: 13, color: "var(--gv-text-muted)" }}>
                {t("hourByHour.scrap_recorded_msg")}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              border: "1px solid var(--gv-border)",
              background: "var(--gv-surface-alt)",
              color: "var(--gv-text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {loading && !!initialData ? (
          <div style={{ padding: "32px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ height: 60, width: "100%", background: "var(--gv-surface-alt)", borderRadius: 12, opacity: 0.5, animation: "pulse 1.5s infinite" }} />
            <div style={{ height: 60, width: "100%", background: "var(--gv-surface-alt)", borderRadius: 12, opacity: 0.5, animation: "pulse 1.5s infinite" }} />
            <div style={{ height: 60, width: "100%", background: "var(--gv-surface-alt)", borderRadius: 12, opacity: 0.5, animation: "pulse 1.5s infinite" }} />
            <style>{`@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.2; } }`}</style>
          </div>
        ) : (
          <>
            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
          {/* Step 1 — Technology Tabs */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: activeStep === 1 ? 12 : 0 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--gv-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: selTech
                      ? "var(--gv-primary)"
                      : "var(--gv-border)",
                    color: selTech ? "#fff" : "var(--gv-text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  1
                </span>
                {t("hourByHour.technology")}
              </label>
              {selTech && activeStep !== 1 && (
                <button type="button" onClick={() => setActiveStep(1)} style={{ background: "transparent", border: "none", color: "var(--gv-primary)", fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "uppercase" }}>Editar</button>
              )}
            </div>
            <AnimatePresence>
              {activeStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                    {processes.map((tech) => {
                      const isActive = tech.id === selTech;
                      const tc = "#3b82f6"; // default color for process
                      return (
                        <motion.button
                          key={tech.id}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            setSelTech(tech.id);
                            setSelDefect("");
                            setActiveStep(2);
                          }}
                          style={{
                            flex: 1,
                            padding: "10px 14px",
                            borderRadius: 8,
                            border: isActive
                              ? `2px solid ${tc}`
                              : "2px solid var(--gv-border)",
                            background: isActive ? `${tc}12` : "transparent",
                            color: isActive ? tc : "var(--gv-text-muted)",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            transition: "all 0.2s ease",
                            minWidth: 100,
                            textAlign: 'center'
                          }}
                        >
                          {tech.name}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Step 2 — Defect */}
          <AnimatePresence>
            {selTech && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: activeStep === 2 ? 12 : 0 }}>
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--gv-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: selDefect
                            ? "var(--gv-primary)"
                            : "var(--gv-border)",
                          color: selDefect ? "#fff" : "var(--gv-text-muted)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 800,
                        }}
                      >
                        2
                      </span>
                      {t("hourByHour.defect_type")}
                    </label>
                    {selDefect && activeStep !== 2 && (
                      <button type="button" onClick={() => setActiveStep(2)} style={{ background: "transparent", border: "none", color: "var(--gv-primary)", fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "uppercase" }}>Editar</button>
                    )}
                  </div>
                  <AnimatePresence>
                    {activeStep === 2 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                            gap: 8,
                            paddingBottom: 4
                          }}
                        >
                          {defects.length === 0 && (
                            <div style={{ fontSize: 12, color: 'var(--gv-text-muted)', fontStyle: 'italic', padding: 8 }}>
                              No hay defectos registrados para esta tecnología.
                            </div>
                          )}
                          {defects.map((d) => {
                            const isActive = d.code === selDefect;
                            return (
                              <motion.button
                                key={d.code}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => {
                                  setSelDefect(d.code);
                                  setActiveStep(3);
                                }}
                                style={{
                                  width: "100%",
                                  padding: "10px 14px",
                                  borderRadius: 8,
                                  border: isActive ? "2px solid #8b5cf6" : "2px solid var(--gv-border)",
                                  background: isActive ? "rgba(139,92,246,0.08)" : "transparent",
                                  color: isActive ? "#8b5cf6" : "var(--gv-text-muted)",
                                  fontSize: 13,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  fontFamily: "inherit",
                                  transition: "all 0.2s ease",
                                }}
                              >
                                {getCatalogTranslation(t, d.name)}
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3 — Quantity & Comments */}
          <AnimatePresence>
            {selDefect && activeStep === 3 && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--gv-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background:
                          cantidad > 0 ? "var(--gv-primary)" : "var(--gv-border)",
                        color: cantidad > 0 ? "#fff" : "var(--gv-text-muted)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      3
                    </span>
                    {t("hourByHour.pieces_amount")}
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setCantidad((p) => Math.max(1, p - 1))}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        border: "1px solid var(--gv-border)",
                        background: "var(--gv-surface-alt)",
                        color: "var(--gv-text)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        fontWeight: 700,
                        fontFamily: "inherit",
                      }}
                    >
                      −
                    </motion.button>
                    <input
                      type="number"
                      min={1}
                      value={cantidad}
                      onChange={(e) =>
                        setCantidad(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      style={{
                        width: 80,
                        padding: "10px",
                        background: "var(--gv-surface-alt)",
                        border: "1px solid var(--gv-border)",
                        borderRadius: 8,
                        color: "var(--gv-text-heading)",
                        fontSize: 20,
                        fontWeight: 800,
                        fontFamily: "inherit",
                        textAlign: "center",
                      }}
                    />
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setCantidad((p) => p + 1)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        border: "none",
                        background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        fontWeight: 700,
                        fontFamily: "inherit",
                      }}
                    >
                      +
                    </motion.button>
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--gv-text-muted)",
                        fontWeight: 600,
                      }}
                    >
                      {t("hourByHour.pieces")}
                    </span>
                  </div>
                </div>

                {/* Comments */}
                <div style={{ marginTop: 16 }}>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--gv-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 6,
                    }}
                  >
                    {t("hourByHour.comments")}
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "var(--gv-surface-alt)",
                      border: "1px solid var(--gv-border)",
                      borderRadius: 8,
                      color: "var(--gv-text-heading)",
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                    placeholder={t("hourByHour.comment_placeholder")}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview */}
          <AnimatePresence>
            {currentDefect && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: "rgba(139,92,246,0.06)",
                  border: "1px solid rgba(139,92,246,0.2)",
                  fontSize: 12,
                }}
              >
                <div
                  style={{ color: "#8b5cf6", fontWeight: 700, marginBottom: 4 }}
                >
                  {t("hourByHour.preview_title")}:
                </div>
                <div style={{ color: "var(--gv-text)", lineHeight: 1.6 }}>
                  <strong>{t("hourByHour.technology")}:</strong> {processes.find(p => p.id === selTech)?.name}
                  <br />
                  <strong>{t("hourByHour.defect_type")}:</strong> [
                  {currentDefect.code}] {getCatalogTranslation(t, currentDefect.name)}
                  <br />
                  <strong>{t("hourByHour.pieces_amount")}:</strong> {cantidad}{" "}
                  {t("hourByHour.pieces")}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid var(--gv-border)",
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            background: "var(--gv-surface-alt)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px",
              borderRadius: 7,
              border: "1px solid var(--gv-border)",
              background: "transparent",
              color: "var(--gv-text)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {t("hourByHour.cancel")}
          </button>
          <motion.button
            whileHover={isValid ? { scale: 1.02 } : {}}
            whileTap={isValid ? { scale: 0.97 } : {}}
            disabled={!isValid}
            onClick={() => {
              if (!currentDefect) return;
              onRegister({
                tecnologia: processes.find(p => p.id === selTech)?.name || selTech,
                process_id: selTech,
                codigoDefecto: currentDefect.code,
                defecto: currentDefect.name,
                cantidad,
                comments,
              });
              onClose();
            }}
            style={{
              padding: "9px 24px",
              borderRadius: 7,
              border: "none",
              background: isValid
                ? "linear-gradient(135deg, #8b5cf6, #7c3aed)"
                : "var(--gv-border)",
              color: isValid ? "#fff" : "var(--gv-text-muted)",
              fontSize: 13,
              fontWeight: 700,
              cursor: isValid ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ShieldCheck size={14} /> {t("hourByHour.register_defect_btn")}
          </motion.button>
        </div>
        </>
        )}
      </motion.div>
    </div>
  );
});

/* ════════════════════════════════════════════════════ */
/*          Downtime Registration Modal               */
/* ════════════════════════════════════════════════════ */

interface DowntimeModalProps {
  hourNumber: number;
  initialData?: any;
  onRegisterDT: (dt: Omit<DowntimeRecord, "id" | "timestamp">) => void;
  onRegisterFault: (fault: Omit<FaultRecord, "id" | "validationMtto" | "validationQuality" | "timestamp" | "analysisType" | "analysisComplete">) => void;
  onClose: () => void;
}

const DowntimeRegistrationModal = memo(function DowntimeRegistrationModal({
  hourNumber,
  initialData,
  onRegisterDT,
  onRegisterFault,
  onClose,
}: DowntimeModalProps) {
  const { t } = useTranslation();
  const [unifiedCatalog, setUnifiedCatalog] = useState<BaseMaintenanceCategory[]>(
    baseDataApi.getCachedCategories() || []
  );
  const [machinesList, setMachinesList] = useState<BaseMachine[]>(
    baseDataApi.getCachedMachines() || []
  );
  const [allAssetFamilies, setAllAssetFamilies] = useState<BaseAssetFamily[]>([]);
  const [selCategory, setSelCategory] = useState("");
  const [selFault, setSelFault] = useState("");
  const [selMachine, setSelMachine] = useState("");
  const [durationMin, setDurationMin] = useState<number | "">("");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [activeStep, setActiveStep] = useState(1);
  
  const faultsScrollRef = useRef<HTMLDivElement>(null);
  const machinesScrollRef = useRef<HTMLDivElement>(null);

  const scrollFaults = (dir: "left" | "right") => {
    if (faultsScrollRef.current) {
      faultsScrollRef.current.scrollBy({ left: dir === "left" ? -250 : 250, behavior: "smooth" });
    }
  };

  const scrollMachines = (dir: "left" | "right") => {
    if (machinesScrollRef.current) {
      machinesScrollRef.current.scrollBy({ left: dir === "left" ? -250 : 250, behavior: "smooth" });
    }
  };

  useEffect(() => {
    Promise.all([
      baseDataApi.getMaintenanceCategories(),
      baseDataApi.getMachines(),
      baseDataApi.getAssetFamilies()
    ]).then(([cats, machs, fams]) => {
      setUnifiedCatalog(cats);
      setMachinesList(machs);
      setAllAssetFamilies(fams);
      
      if (initialData) {
        if (initialData.codigoFalla) {
          setSelCategory(initialData.categoriaId || "");
          setSelMachine(initialData.maquinaId || "");
          setSelFault(initialData.codigoFalla || "");
          setDurationMin(initialData.downtimeMin || "");
          setComments(initialData.comments || "");
          setActiveStep(initialData.maquinaId ? 4 : 3);
        } else if (initialData.reason) {
          const reasonMatch = initialData.reason.match(/^\[(.*?)\]/);
          const code = reasonMatch ? reasonMatch[1] : null;
          let foundCat = "";
          let foundFault = "";
          if (code) {
             for (const c of cats) {
                const f = c.faults?.find((x: any) => x.code === code || x.codigo === code);
                if (f) { foundCat = c.id; foundFault = f.code || f.codigo; break; }
             }
          }
          if (foundCat) setSelCategory(foundCat);
          if (foundFault) setSelFault(foundFault);
          setDurationMin(initialData.durationMin || "");
          setComments(initialData.comments || "");
          setActiveStep(3);
        }
      }
      setLoading(false);
    }).catch((e) => {
      console.error(e);
      setLoading(false);
    });
  }, []);

  const currentCategory = unifiedCatalog.find((c) => c.id === selCategory);
  
  const isMachineRequired = currentCategory?.name?.toUpperCase() === "MANTENIMIENTO" || selCategory === "technical_failure" || selCategory === "maintenance";
  const currentMachine = isMachineRequired ? machinesList.find((m) => m.id === selMachine) : null;
  
  let faults: any[] = [];
  if (isMachineRequired && currentMachine) {
    const machineFamilies = allAssetFamilies.filter(f => currentMachine.family_ids?.includes(f.id));
    faults = machineFamilies.flatMap(f => f.faults || []);
  } else if (!isMachineRequired) {
    faults = currentCategory?.faults ?? [];
  }
  
  const currentFault = faults.find((f) => f.code === selFault);
  
  const isValid = Boolean(selCategory && selFault && (!isMachineRequired || selMachine) && typeof durationMin === "number" && durationMin > 0);

  const selectStyle: React.CSSProperties = {
    appearance: "none",
    width: "100%",
    padding: "10px 36px 10px 14px",
    background: "var(--gv-surface-alt)",
    border: "1px solid var(--gv-border)",
    borderRadius: 8,
    color: "var(--gv-text-heading)",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "inherit",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 8000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 10 }}
        transition={{ type: "spring", damping: 25, stiffness: 320 }}
        style={{
          width: "100%",
          maxWidth: 600,
          background: "var(--gv-surface)",
          border: "1px solid var(--gv-border)",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--gv-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background:
              "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(249,115,22,0.06))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background:
                  "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.15))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock size={16} color="#f59e0b" />
            </div>
            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--gv-text-heading)",
                }}
              >
                {initialData ? t("hourByHour.edit_downtime_title", "Editar Tiempo Muerto") : t("hourByHour.register_downtime_title", "Registro de Tiempo Muerto")} {hourNumber}
              </div>
              <div style={{ fontSize: 13, color: "var(--gv-text-muted)" }}>
                {t("hourByHour.downtime_recorded_msg", "Selecciona un motivo del catálogo para justificar el tiempo inactivo.")}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              border: "1px solid var(--gv-border)",
              background: "var(--gv-surface-alt)",
              color: "var(--gv-text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {loading && !!initialData ? (
          <div style={{ padding: "32px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ height: 60, width: "100%", background: "var(--gv-surface-alt)", borderRadius: 12, opacity: 0.5, animation: "pulse 1.5s infinite" }} />
            <div style={{ height: 60, width: "100%", background: "var(--gv-surface-alt)", borderRadius: 12, opacity: 0.5, animation: "pulse 1.5s infinite" }} />
            <div style={{ height: 60, width: "100%", background: "var(--gv-surface-alt)", borderRadius: 12, opacity: 0.5, animation: "pulse 1.5s infinite" }} />
            <style>{`@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.2; } }`}</style>
          </div>
        ) : (
          <>
            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
          {/* Step 1 — Category */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: activeStep === 1 ? 12 : 0 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--gv-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: selCategory ? "var(--gv-primary)" : "var(--gv-border)", color: selCategory ? "#fff" : "var(--gv-text-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>1</span>
                {t("maintenance.category", "Categoría / Subsistema")}
              </label>
              {selCategory && activeStep !== 1 && (
                <button type="button" onClick={() => setActiveStep(1)} style={{ background: "transparent", border: "none", color: "var(--gv-primary)", fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "uppercase" }}>Editar</button>
              )}
            </div>
            {activeStep === 1 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                  gap: 8,
                }}
              >
                {unifiedCatalog.map((c) => {
                  const isActive = c.id === selCategory;
                  return (
                    <motion.button
                      key={c.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        setSelCategory(c.id);
                        setSelFault("");
                        setSelMachine("");
                        const needsMachine = c.name?.toUpperCase() === "MANTENIMIENTO" || c.id === "technical_failure" || c.id === "maintenance";
                        setActiveStep(needsMachine ? 2 : 3);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: isActive ? "2px solid #f59e0b" : "2px solid var(--gv-border)",
                        background: isActive ? "rgba(245,158,11,0.08)" : "transparent",
                        color: isActive ? "#f59e0b" : "var(--gv-text-muted)",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {getCatalogTranslation(t, c.name)}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2 — Machine (Conditional) */}
          <AnimatePresence>
            {selCategory && isMachineRequired && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: activeStep === 2 ? 12 : 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--gv-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", background: selMachine ? "var(--gv-primary)" : "var(--gv-border)", color: selMachine ? "#fff" : "var(--gv-text-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>2</span>
                      {t("maintenance.machine", "Activo Fijo / Máquina")}
                    </label>
                    {selMachine && activeStep !== 2 && (
                      <button type="button" onClick={() => setActiveStep(2)} style={{ background: "transparent", border: "none", color: "var(--gv-primary)", fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "uppercase" }}>Editar</button>
                    )}
                  </div>
                  {activeStep === 2 && (
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      {machinesList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => scrollMachines("left")}
                          style={{
                            position: "absolute", left: -12, zIndex: 2,
                            width: 28, height: 28, borderRadius: "50%",
                            background: "var(--gv-surface)", border: "1px solid var(--gv-border)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", color: "var(--gv-text)", boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                          }}
                        >
                          <ChevronLeft size={16} />
                        </button>
                      )}
                      <div
                        ref={machinesScrollRef}
                        className="no-scrollbar"
                        style={{
                          display: "flex",
                          gap: 10,
                          overflowX: "auto",
                          padding: "4px 20px",
                          scrollBehavior: "smooth",
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                          width: "100%",
                        }}
                      >
                        {machinesList.length === 0 ? (
                          <p style={{ fontSize: 13, color: "var(--gv-text-muted)", fontStyle: "italic", margin: "10px 0" }}>
                            No hay máquinas registradas.
                          </p>
                        ) : (
                          machinesList.map((m) => {
                            const isActive = m.id === selMachine;
                            return (
                              <motion.button
                                key={m.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => {
                                  setSelMachine(m.id);
                                  setSelFault("");
                                  setActiveStep(3);
                                }}
                                style={{
                                  flex: "0 0 auto",
                                  minWidth: 140,
                                  maxWidth: 160,
                                  padding: "10px 14px",
                                  borderRadius: 8,
                                  border: isActive ? "2px solid #f59e0b" : "2px solid var(--gv-border)",
                                  background: isActive ? "rgba(245,158,11,0.08)" : "transparent",
                                  color: isActive ? "#f59e0b" : "var(--gv-text-muted)",
                                  fontSize: 13,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  fontFamily: "inherit",
                                  transition: "all 0.2s ease",
                                  whiteSpace: "normal",
                                  textAlign: "center",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                              >
                                {m.name} {m.code ? `— ${m.code}` : ""}
                              </motion.button>
                            );
                          })
                        )}
                      </div>
                      {machinesList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => scrollMachines("right")}
                          style={{
                            position: "absolute", right: -12, zIndex: 2,
                            width: 28, height: 28, borderRadius: "50%",
                            background: "var(--gv-surface)", border: "1px solid var(--gv-border)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", color: "var(--gv-text)", boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                          }}
                        >
                          <ChevronRight size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3 — Fault / Reason */}
          <AnimatePresence>
            {selCategory && (!isMachineRequired || selMachine) && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: activeStep === 3 ? 12 : 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--gv-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", background: selFault ? "var(--gv-primary)" : "var(--gv-border)", color: selFault ? "#fff" : "var(--gv-text-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>{isMachineRequired ? "3" : "2"}</span>
                      {t("config.label_faults", "Motivo")}
                    </label>
                    {selFault && activeStep !== 3 && (
                      <button type="button" onClick={() => setActiveStep(3)} style={{ background: "transparent", border: "none", color: "var(--gv-primary)", fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "uppercase" }}>Editar</button>
                    )}
                  </div>
                  {activeStep === 3 && (
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      {faults.length > 0 && (
                        <button
                          type="button"
                          onClick={() => scrollFaults("left")}
                          style={{
                            position: "absolute", left: -12, zIndex: 2,
                            width: 28, height: 28, borderRadius: "50%",
                            background: "var(--gv-surface)", border: "1px solid var(--gv-border)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", color: "var(--gv-text)", boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                          }}
                        >
                          <ChevronLeft size={16} />
                        </button>
                      )}
                      <div
                        ref={faultsScrollRef}
                        className="no-scrollbar"
                        style={{
                          display: "flex",
                          gap: 10,
                          overflowX: "auto",
                          padding: "4px 20px",
                          scrollBehavior: "smooth",
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                          width: "100%",
                        }}
                      >
                        <style>{`
                          .no-scrollbar::-webkit-scrollbar {
                            display: none;
                          }
                        `}</style>
                        {faults.length === 0 ? (
                          <p style={{ fontSize: 13, color: "var(--gv-text-muted)", fontStyle: "italic", margin: "10px 0" }}>
                            No hay motivos registrados para esta selección.
                          </p>
                        ) : (
                          faults.map((f) => {
                            const isActive = f.code === selFault;
                            return (
                              <motion.button
                                key={f.code}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => {
                                  setSelFault(f.code);
                                  setActiveStep(4);
                                }}
                                style={{
                                  flex: "0 0 auto",
                                  minWidth: 140,
                                  maxWidth: 160,
                                  padding: "10px 14px",
                                  borderRadius: 8,
                                  border: isActive ? "2px solid #f59e0b" : "2px solid var(--gv-border)",
                                  background: isActive ? "rgba(245,158,11,0.08)" : "transparent",
                                  color: isActive ? "#f59e0b" : "var(--gv-text-muted)",
                                  fontSize: 13,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  fontFamily: "inherit",
                                  transition: "all 0.2s ease",
                                  whiteSpace: "normal",
                                  textAlign: "center",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                              >
                                {getCatalogTranslation(t, f.description)}
                              </motion.button>
                            );
                          })
                        )}
                      </div>
                      {faults.length > 0 && (
                        <button
                          type="button"
                          onClick={() => scrollFaults("right")}
                          style={{
                            position: "absolute", right: -12, zIndex: 2,
                            width: 28, height: 28, borderRadius: "50%",
                            background: "var(--gv-surface)", border: "1px solid var(--gv-border)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", color: "var(--gv-text)", boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                          }}
                        >
                          <ChevronRight size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Downtime & Comments */}
          <AnimatePresence>
            {selFault && (!isMachineRequired || selMachine) && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: activeStep === 4 ? 12 : 0 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--gv-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", background: activeStep === 4 ? "var(--gv-primary)" : "var(--gv-border)", color: activeStep === 4 ? "#fff" : "var(--gv-text-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>{isMachineRequired ? "4" : "3"}</span>
                      {t("hourByHour.duration_min", "DURACIÓN (MIN)")}
                    </label>
                  </div>
                  {activeStep === 4 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => {
                        const current = typeof durationMin === "number" ? durationMin : 5;
                        setDurationMin(Math.max(1, current - 5));
                      }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        border: "1px solid var(--gv-border)",
                        background: "var(--gv-surface-alt)",
                        color: "var(--gv-text)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        fontWeight: 700,
                        fontFamily: "inherit",
                      }}
                    >
                      −
                    </motion.button>
                    <input
                      type="number"
                      min={1}
                      value={durationMin}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setDurationMin("");
                        } else {
                          const parsed = parseInt(val, 10);
                          setDurationMin(isNaN(parsed) ? "" : Math.max(1, parsed));
                        }
                      }}
                      style={{
                        width: 80,
                        padding: "10px",
                        background: "var(--gv-surface-alt)",
                        border: "1px solid var(--gv-border)",
                        borderRadius: 8,
                        color: "var(--gv-text-heading)",
                        fontSize: 20,
                        fontWeight: 800,
                        fontFamily: "inherit",
                        textAlign: "center",
                      }}
                    />
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => {
                        const current = typeof durationMin === "number" ? durationMin : 0;
                        setDurationMin(current + 5);
                      }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        border: "none",
                        background: isMachineRequired ? "linear-gradient(135deg, #ef4444, #f97316)" : "linear-gradient(135deg, #f59e0b, #f97316)",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        fontWeight: 700,
                        fontFamily: "inherit",
                      }}
                    >
                      +
                    </motion.button>
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--gv-text-muted)",
                        fontWeight: 600,
                        marginLeft: 4,
                      }}
                    >
                      {t("hourByHour.minutes", "minutos")}
                    </span>
                    </div>
                  )}
                </div>

                {/* Comments */}
                {activeStep === 4 && (
                  <div style={{ marginTop: 16 }}>
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--gv-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 6,
                      }}
                    >
                      {t("hourByHour.comments", "COMENTARIOS")}
                    </label>
                    <textarea
                      value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "var(--gv-surface-alt)",
                      border: "1px solid var(--gv-border)",
                      borderRadius: 8,
                      color: "var(--gv-text-heading)",
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                    placeholder={t("hourByHour.comment_placeholder", "Comentario...")}
                  />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview */}
          <AnimatePresence>
            {currentFault && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: isMachineRequired ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)",
                  border: isMachineRequired ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(245,158,11,0.2)",
                  fontSize: 12,
                }}
              >
                <div
                  style={{ color: isMachineRequired ? "#ef4444" : "#f59e0b", fontWeight: 700, marginBottom: 4 }}
                >
                  {t("hourByHour.preview_title", "Vista previa del registro")}:
                </div>
                <div style={{ color: "var(--gv-text)", lineHeight: 1.6 }}>
                  {isMachineRequired && currentMachine && (
                    <>
                      <strong>{t("maintenance.machine", "Activo Fijo / Máquina")}:</strong> {currentMachine.name}
                      <br />
                    </>
                  )}
                  <strong>{t("maintenance.category", "Categoría / Subsistema")}:</strong> {getCatalogTranslation(t, currentCategory?.name || "")}
                  <br />
                  <strong>{t("hourByHour.reason", "Motivo")}:</strong> [{currentFault.code}] {getCatalogTranslation(t, currentFault.description)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid var(--gv-border)",
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            background: "var(--gv-surface-alt)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px",
              borderRadius: 7,
              border: "1px solid var(--gv-border)",
              background: "transparent",
              color: "var(--gv-text)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {t("hourByHour.cancel", "Cancelar")}
          </button>
          <motion.button
            whileHover={isValid ? { scale: 1.02 } : {}}
            whileTap={isValid ? { scale: 0.97 } : {}}
            disabled={!isValid}
            onClick={() => {
              if (!currentCategory || !currentFault || (isMachineRequired && !currentMachine) || typeof durationMin !== "number") return;
              
              if (isMachineRequired) {
                onRegisterFault({
                  maquinaId: currentMachine?.id || "",
                  maquinaNombre: currentMachine?.name || "N/A",
                  categoriaId: currentCategory.id,
                  categoriaNombre: currentCategory.name,
                  codigoFalla: currentFault.code,
                  fallaDescripcion: currentFault.description,
                  downtimeMin: durationMin,
                  comments,
                });
              } else {
                onRegisterDT({
                  reason: `[${currentFault.code}] ${currentFault.description}`,
                  durationMin,
                  comments,
                });
              }
              onClose();
            }}
            style={{
              padding: "9px 24px",
              borderRadius: 7,
              border: "none",
              background: isValid
                ? (isMachineRequired ? "linear-gradient(135deg, #ef4444, #f97316)" : "linear-gradient(135deg, #f59e0b, #f97316)")
                : "var(--gv-border)",
              color: isValid ? "#fff" : "var(--gv-text-muted)",
              fontSize: 13,
              fontWeight: 700,
              cursor: isValid ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {isMachineRequired ? <Wrench size={14} /> : <Clock size={14} />} {t("hourByHour.register_dt_btn", "Registrar DT")}
          </motion.button>
        </div>
        </>
        )}
      </motion.div>
    </div>
  );
});

/* ════════════════════════════════════════════════════ */
/*          Shift Finish Modal                        */
/* ════════════════════════════════════════════════════ */

interface ShiftFinishModalProps {
  type: "error" | "confirm";
  title: string;
  message: string;
  onConfirm?: () => void;
  onClose: () => void;
}

const ShiftFinishModal = memo(function ShiftFinishModal({
  type,
  title,
  message,
  onConfirm,
  onClose,
}: ShiftFinishModalProps) {
  const { t } = useTranslation();
  
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 10 }}
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--gv-surface)",
          borderRadius: 16,
          boxShadow: "0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--gv-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: type === "error" ? "rgba(239,68,68,0.15)" : "rgba(249,115,22,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: type === "error" ? "#ef4444" : "#f97316",
              }}
            >
              {type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: "var(--gv-text-heading)",
              }}
            >
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--gv-text-muted)",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px", color: "var(--gv-text)", fontSize: 14, lineHeight: 1.5 }}>
          {message}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--gv-border)",
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            background: "var(--gv-surface-alt)",
          }}
        >
          {type === "confirm" && (
            <button
              onClick={onClose}
              style={{
                padding: "9px 20px",
                borderRadius: 7,
                border: "1px solid var(--gv-border)",
                background: "transparent",
                color: "var(--gv-text)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {t("hourByHour.cancel", "Cancelar")}
            </button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={type === "confirm" ? onConfirm : onClose}
            style={{
              padding: "9px 24px",
              borderRadius: 7,
              border: type === "error" ? "1px solid var(--gv-border)" : "none",
              background: type === "error" 
                ? "var(--gv-surface-alt)" 
                : "linear-gradient(135deg, #ef4444, #f97316)",
              color: type === "error" ? "var(--gv-text-heading)" : "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {type === "error" ? t("hourByHour.understood", "Entendido") : t("hourByHour.finish_shift", "Finalizar Turno")}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
});

/* ════════════════════════════════════════════════════ */
/*       Shared Small Components                     */
/* ════════════════════════════════════════════════════ */

const ValidationPill = memo(function ValidationPill({
  status,
  dept,
}: {
  status: ValidationStatus;
  dept: "MTTO" | "CAL";
}) {
  const cfg: Record<
    ValidationStatus,
    { label: string; bg: string; color: string; icon: React.ReactNode }
  > = {
    pendiente: {
      label: "Pendiente",
      bg: "rgba(245,158,11,0.12)",
      color: "#f59e0b",
      icon: <Clock size={10} />,
    },
    validado: {
      label: "Validado",
      bg: "rgba(16,185,129,0.12)",
      color: "#10b981",
      icon: <CheckCircle2 size={10} />,
    },
    corregido: {
      label: "Corregido",
      bg: "rgba(59,130,246,0.12)",
      color: "#3b82f6",
      icon: <BadgeCheck size={10} />,
    },
  };
  const c = cfg[status];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: "var(--gv-text-muted)",
          letterSpacing: "0.04em",
        }}
      >
        {dept}
      </div>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 8px",
          borderRadius: 5,
          fontSize: 10,
          fontWeight: 700,
          background: c.bg,
          color: c.color,
        }}
      >
        {c.icon} {c.label}
      </span>
    </div>
  );
});

const AnalysisBadge = memo(function AnalysisBadge({
  fault,
  onClick,
}: {
  fault: FaultRecord | ScrapRecord;
  onClick: () => void;
}) {
  if (fault.analysisComplete) {
    const isWhys = fault.analysisType === "5whys";
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 10px",
          borderRadius: 6,
          border: "none",
          background: isWhys ? "rgba(139,92,246,0.12)" : "rgba(6,182,212,0.12)",
          color: isWhys ? "#8b5cf6" : "#06b6d4",
          fontSize: 10,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        {isWhys ? <GitBranch size={11} /> : <Network size={11} />}
        {isWhys ? "5 Porqués" : "Ishikawa"} ✓
      </motion.button>
    );
  }
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 6,
        border: "1px dashed rgba(245,158,11,0.4)",
        background: "rgba(245,158,11,0.06)",
        color: "#f59e0b",
        fontSize: 10,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <ShieldAlert size={11} /> Requiere RCA
    </motion.button>
  );
});

/* ════════════════════════════════════════════════════ */
/*               MAIN COMPONENT                       */
/* ════════════════════════════════════════════════════ */

export default function HourByHourView({
  filters,
  planTarget: defaultPlanTarget,
}: HourByHourViewProps) {
  const { t } = useTranslation();
  const { globalDateRange, setGlobalLoading } = useGlobalStore();
  const [activePlan, setActivePlan] = useState<PlanRecord | null>(null);
  const [availablePlans, setAvailablePlans] = useState<PlanRecord[]>([]);
  const [operativeRecordId, setOperativeRecordId] = useState<string | null>(
    null,
  );
  const [shiftStatus, setShiftStatus] = useState<"active" | "finished">(
    "active",
  );
  const [isFinishingShift, setIsFinishingShift] = useState(false);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [selectedHourIndex, setSelectedHourIndex] = useState<number | null>(null);

  /* ── Hour Records ── */
  const [records, setRecords] = useState<HourRecord[]>([]);
  const [allOperativeRecords, setAllOperativeRecords] = useState<any[]>([]);
  const [optimisticRecords, addOptimisticRecord] = useOptimistic(
    records,
    (state, newRecord: HourRecord) => [...state, newRecord],
  );

  const planTarget = activePlan ? activePlan.target_hr : defaultPlanTarget;
  const maxHours = useMemo(() => {
    if (!activePlan) return 8;
    if (activePlan.slot?.start && activePlan.slot?.end) {
      let start = parseTimeToMinutes(activePlan.slot.start);
      let end = parseTimeToMinutes(activePlan.slot.end);
      if (end <= start) end += 24 * 60;
      return Math.round((end - start) / 60);
    }
    return TURNO_CONFIG[activePlan.turno]?.durationHrs || 8;
  }, [activePlan]);

  useEffect(() => {
    const todayStr = globalDateRange.startDate;
    const { fetchAllForDateRange } = useProductionStore.getState();

    setGlobalLoading(true);
    
    Promise.all([
      baseDataApi.getMaintenanceCategories().catch(console.error),
      baseDataApi.getMachines().catch(console.error),
      baseDataApi.getAssetFamilies().catch(console.error),
      fetchAllForDateRange(globalDateRange.startDate, globalDateRange.endDate)
    ])
      .then(async ([_, __, ___, { plans, hourRecords, faults, scrap, downtime, operative }]) => {
        // Find published plans for the current line (filters.process)
        const dayPlans = plans.filter(
          (p) =>
            p.fecha === todayStr &&
            p.planta === filters.businessUnit &&
            p.linea === filters.process &&
            p.status !== "cancelled" &&
            p.target_hr > 0,
        );

        // Sort plans by logical shift order
        const shiftOrder: Record<string, number> = {
          Matutino: 1,
          "12x12_Dia": 2,
          Vespertino: 3,
          Mixto: 4,
          "12x12_Noche": 5,
          Nocturno: 6,
        };
        dayPlans.sort((a, b) => {
          const orderA = shiftOrder[a.turno] || 99;
          const orderB = shiftOrder[b.turno] || 99;
          if (orderA !== orderB) return orderA - orderB;

          // Resolve ties (e.g., multiple "Mixto" shifts) by sorting by start time
          const startA = a.slot?.start || TURNO_CONFIG[a.turno]?.start || "00:00";
          const startB = b.slot?.start || TURNO_CONFIG[b.turno]?.start || "00:00";
          return startA.localeCompare(startB);
        });

        setAvailablePlans(dayPlans);
        setAllOperativeRecords(operative);
        if (dayPlans.length > 0) {
          const firstPlan = dayPlans[0];
          setActivePlan(firstPlan);
          // Use pre-fetched data (no additional network calls)
          loadPlanData(firstPlan, todayStr, hourRecords, faults, scrap, downtime, operative);
        } else {
          setActivePlan(null);
          setRecords([]);
        }
      })
      .finally(() => {
        setGlobalLoading(false);
      });
  }, [filters.process, globalDateRange.startDate, globalDateRange.endDate]);

  // ── Offline Sync Logic ──
  useEffect(() => {
    const handleOnline = async () => {
      const { offlineQueue, dequeueAction } = useSyncStore.getState();
      if (offlineQueue.length > 0) {
        setToast({
          message: "Conexión recuperada. Sincronizando datos pendientes...",
          type: "info",
          visible: true,
        });
        let syncedCount = 0;

        for (const action of offlineQueue) {
          if (action.type === "CREATE_HOUR_RECORD") {
            try {
              const dataToSend = { ...action.payload.record };
              delete dataToSend.id;
              delete dataToSend.pending;
              delete dataToSend.isOffline;
              const saved = await createHourRecord(
                action.payload.planId,
                dataToSend,
              );
              setRecords((prev) =>
                prev.map((r) =>
                  r.id === action.payload.record.id ? saved : r,
                ),
              );
              dequeueAction(action.id);
              syncedCount++;
            } catch (err: any) {
              console.error("Failed to sync offline action", action, err);
              if (err.response && err.response.status >= 400 && err.response.status < 500) {
                console.warn("Discarding offline action due to client error", action);
                dequeueAction(action.id);
              }
            }
          } else if (action.type === "FINISH_SHIFT") {
            try {
              await updateOperativeRecordStatus(
                action.payload.operativeRecordId,
                "finished",
              );
              dequeueAction(action.id);
              syncedCount++;
            } catch (err) {
              console.error(
                "Failed to sync FINISH_SHIFT offline action",
                action,
                err,
              );
            }
          }
        }
        if (syncedCount > 0) {
          // Invalidate cache after sync to get fresh data
          useProductionStore.getState().invalidateCache('all');
          setToast({
            message: `Se sincronizaron ${syncedCount} filas correctamente.`,
            type: "success",
            visible: true,
          });
        }
      }
    };

    window.addEventListener("online", handleOnline);
    if (navigator.onLine) handleOnline();

    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const handlePlanChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const planId = e.target.value;
    const plan = availablePlans.find((p) => p.id_plan === planId);
    if (plan) {
      setGlobalLoading(true);
      try {
        setActivePlan(plan);
        const todayStr = globalDateRange.startDate;
        const { fetchHourRecords, fetchFaults, fetchScrap, fetchDowntime, fetchOperative } =
          useProductionStore.getState();
        // All these will be cache HITs (same date range, already fetched)
        const [hourRecords, faults, scrap, downtime, operative] = await Promise.all([
          fetchHourRecords(globalDateRange.startDate, globalDateRange.endDate),
          fetchFaults(globalDateRange.startDate, globalDateRange.endDate),
          fetchScrap(globalDateRange.startDate, globalDateRange.endDate),
          fetchDowntime(globalDateRange.startDate, globalDateRange.endDate),
          fetchOperative(globalDateRange.startDate, globalDateRange.endDate),
        ]);
        setAllOperativeRecords(operative);
        loadPlanData(plan, todayStr, hourRecords, faults, scrap, downtime, operative);
      } finally {
        setGlobalLoading(false);
      }
    }
  }, [availablePlans, globalDateRange.startDate, globalDateRange.endDate]);

  const loadPlanData = (
    plan: PlanRecord,
    todayStr: string,
    hourRecords: HourRecord[],
    faults: any[],
    scrap: any[],
    downtime: any[],
    operative: any[]
  ) => {
    const localShift = useLocalShiftStore.getState();
    if (
      localShift.status === "active" &&
      localShift.planId === plan.id_plan &&
      localShift.date === todayStr &&
      localShift.shift === plan.turno
    ) {
      // Restore from local storage
      setOperativeRecordId(localShift.operativeRecordId!);
      setShiftStatus("active");
      setRecords(localShift.records);
      setFaultsByHour(localShift.faultsByHour);
      setScrapByHour(localShift.scrapByHour);
      setDowntimeByHour(localShift.downtimeByHour);
      return;
    }

    // Otherwise, calculate from API data
    const planRecs = hourRecords.filter((r) => r.plan_id === plan.id_plan).sort((a, b) => a.hour - b.hour);
    const faultsMap: Record<number, FaultRecord[]> = {};
    const scrapMap: Record<number, ScrapRecord[]> = {};
    const dtMap: Record<number, DowntimeRecord[]> = {};
    
    const cachedMachines = baseDataApi.getCachedMachines() || [];

    planRecs.forEach((hrRecord, index) => {
      const hrId = hrRecord.id;

      const hrFaults = faults.filter((f) => f.hour_record_id === hrId);
      if (hrFaults.length > 0) {
        faultsMap[index] = hrFaults.map((f) => {
          let fallaDescripcion = "";
          const cachedCategories = baseDataApi.getCachedCategories() || [];
          const cachedAssetFamilies = baseDataApi.getCachedAssetFamilies() || [];

          for (const fam of cachedAssetFamilies) {
            const found = (fam.faults || []).find((x: any) => x.code === f.fault_code);
            if (found) { fallaDescripcion = found.description || found.name; break; }
          }
          if (!fallaDescripcion) {
            for (const cat of cachedCategories) {
              const found = (cat.faults || []).find((x: any) => x.codigo === f.fault_code || x.code === f.fault_code);
              if (found) { fallaDescripcion = found.descripcion || found.description || found.name; break; }
            }
          }

          return {
            id: f.id,
            maquinaId: f.machine_id,
            maquinaNombre: (() => {
              const machine = cachedMachines.find((m: any) => (m.id || m.id_maquina) === f.machine_id);
              if (machine) {
                const code = machine.code || 'N/A';
                const name = machine.name || machine.nombre || '';
                return `[${code}] ${name}`;
              }
              return f.machine_id;
            })(),
            categoriaId: f.category_id,
            categoriaNombre: "",
            codigoFalla: f.fault_code,
            fallaDescripcion,
            downtimeMin: f.downtime_min,
            comments: f.comments || "",
            analysisType: f.analysis_type,
          analysisComplete: f.analysis_complete,
          validationMtto: f.validation_mtto || "pendiente",
          validationQuality: f.validation_quality || "pendiente",
          timestamp: `Hora ${hrRecord.hour}`,
          };
        });
      }

      const hrScrap = scrap.filter((s) => s.hour_record_id === hrId);
      if (hrScrap.length > 0) {
        scrapMap[index] = hrScrap.map((s) => ({
          id: s.id,
          tecnologia: s.tecnologia,
          codigoDefecto: s.codigo_defecto,
          defecto: s.defecto,
          cantidad: s.cantidad,
          comments: s.comments || "",
          validationQuality: s.validation_quality || "pendiente",
          timestamp: `Hora ${hrRecord.hour}`,
        }));
      }

      const hrDT = downtime.filter((dt) => dt.hour_record_id === hrId);
      if (hrDT.length > 0) {
        dtMap[index] = hrDT.map((dt) => ({
          id: dt.id,
          reason: dt.reason,
          durationMin: dt.duration_min,
          comments: dt.comments,
          timestamp: `Hora ${hrRecord.hour}`,
        }));
      }
    });

    const match = operative.find((o: any) => o.plan_id === plan.id_plan || (!o.plan_id && o.date === todayStr && o.shift === plan.turno));

    if (match) {
      setOperativeRecordId(match.id);
      setShiftStatus(match.status || "active");
      if (match.status !== "finished" && todayStr === globalDateRange.startDate) {
        // Active shift from API but not local: init local with API data
        localShift.initShift(plan.id_plan, todayStr, plan.turno, match.id);
        localShift.setRecords(planRecs, faultsMap, scrapMap, dtMap);
      }
    } else if (todayStr === globalDateRange.startDate) {
      // New shift today
      const opId = `OP-${Date.now()}`;
      setOperativeRecordId(opId);
      setShiftStatus("active");
      localShift.initShift(plan.id_plan, todayStr, plan.turno, opId);
    } else {
      setOperativeRecordId(null);
      setShiftStatus("finished");
    }

    setRecords(planRecs);
    setFaultsByHour(faultsMap);
    setScrapByHour(scrapMap);
    setDowntimeByHour(dtMap);

    const unfinishedPrevious = operative.find(
      (o: any) =>
        o.status !== "finished" &&
        (o.date < todayStr || (o.date === todayStr && o.shift !== plan.turno)),
    );
    if (unfinishedPrevious) {
      setToast({
        message: t("hourByHour.previous_shift_not_finished"),
        type: "info",
        visible: true,
      });
      setTimeout(() => setToast(null), 8000);
    }
  };


  /* ── Fault state ── */
  const [faultsByHour, setFaultsByHour] = useState<
    Record<number, FaultRecord[]>
  >({});

  /* ── Scrap state ── */
  const [scrapByHour, setScrapByHour] = useState<Record<number, ScrapRecord[]>>(
    {},
  );

  /* ── DT state ── */
  const [downtimeByHour, setDowntimeByHour] = useState<
    Record<number, DowntimeRecord[]>
  >({});

  /* ── UI state ── */

  const [scrapModal, setScrapModal] = useState<number | null>(null);
  const [dtModal, setDtModal] = useState<number | null>(null);
  const [editScrapModal, setEditScrapModal] = useState<{ index: number; item: ScrapRecord } | null>(null);
  const [editDtModal, setEditDtModal] = useState<{ index: number; item: DowntimeRecord | FaultRecord } | null>(null);
  const [analysisDrawer, setAnalysisDrawer] = useState<
    FaultRecord | ScrapRecord | null
  >(null);
  const [validationPanel, setValidationPanel] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
    visible: boolean;
  } | null>(null);
  const [finishShiftModal, setFinishShiftModal] = useState<{
    visible: boolean;
    type: "error" | "confirm";
    title: string;
    message: string;
    onConfirm?: () => void;
  } | null>(null);

  const [deleteItemModal, setDeleteItemModal] = useState<{
    visible: boolean;
    type: "dt" | "scrap" | "fault";
    hourIndex: number;
    id: string;
    description: string;
  } | null>(null);

  /* ── Actions ── */
  const confirmDelete = () => {
    if (!deleteItemModal) return;
    const { type, hourIndex, id } = deleteItemModal;
    
    if (type === "dt") {
      setDowntimeByHour((prev) => {
        const next = { ...prev };
        next[hourIndex] = (next[hourIndex] || []).filter(item => item.id !== id);
        
        const totalDt = next[hourIndex].reduce((acc, dt) => acc + dt.durationMin, 0);
        const totalFaultsDt = (faultsByHour[hourIndex] || []).reduce((acc, f) => acc + f.downtimeMin, 0);
        setTimeout(() => updateRecord(hourIndex, "downtime", String(totalDt + totalFaultsDt), next[hourIndex]), 0);
        
        return next;
      });
      useLocalShiftStore.getState().deleteDowntime(hourIndex, id);
    } else if (type === "fault") {
      setFaultsByHour((prev) => {
        const next = { ...prev };
        next[hourIndex] = (next[hourIndex] || []).filter(item => item.id !== id);
        
        const totalFaultsDt = next[hourIndex].reduce((acc, f) => acc + f.downtimeMin, 0);
        const totalDt = (downtimeByHour[hourIndex] || []).reduce((acc, dt) => acc + dt.durationMin, 0);
        setTimeout(() => updateRecord(hourIndex, "downtime", String(totalDt + totalFaultsDt)), 0);
        
        return next;
      });
      useLocalShiftStore.getState().deleteFault(hourIndex, id);
    } else if (type === "scrap") {
      setScrapByHour((prev) => {
        const next = { ...prev };
        next[hourIndex] = (next[hourIndex] || []).filter(item => item.id !== id);
        
        const totalScrap = next[hourIndex].reduce((acc, s) => acc + s.cantidad, 0);
        setTimeout(() => updateRecord(hourIndex, "scrap", String(totalScrap)), 0);
        
        return next;
      });
      useLocalShiftStore.getState().deleteScrap(hourIndex, id);
    }
    
    setToast({
      message: t("hourByHour.delete_success", "Registro eliminado exitosamente."),
      type: "success",
      visible: true
    });
    setTimeout(() => setToast(null), 4000);
    setDeleteItemModal(null);
  };

  const addRow = async () => {
    if (shiftStatus === "finished" || !activePlan || isAddingRow) return;

    if (optimisticRecords.length >= maxHours) {
      alert(
        `El turno ${activePlan.turno} permite un máximo de ${maxHours} horas.`,
      );
      return;
    }

    setIsAddingRow(true);
    const newHour = optimisticRecords.length + 1;
    const tempId = `temp-${Date.now()}`;
    
    // Calculate record_date for night shifts that cross midnight
    let recordDate = globalDateRange.startDate;
    const startStr = activePlan.slot?.start || (typeof TURNO_CONFIG !== 'undefined' ? TURNO_CONFIG[activePlan.turno]?.start : null);
    if (startStr) {
      const startHour = parseInt(startStr.split(':')[0], 10);
      if (!isNaN(startHour)) {
        const hourIndex = newHour - 1; 
        if (startHour + hourIndex >= 24) {
          const d = new Date(`${recordDate}T00:00:00Z`);
          d.setUTCDate(d.getUTCDate() + 1);
          recordDate = d.toISOString().split('T')[0];
        }
      }
    }

    const newRec: HourRecord = {
      id: tempId,
      plan_id: activePlan.id_plan,
      record_date: recordDate,
      hour: newHour,
      target: planTarget,
      actualOK: 0,
      scrap: 0,
      downtime: 0,
      comments: "",
      oeeLoss: 0,
      pending: false, // No longer awaiting network
    };

    addOptimisticRecord(newRec);
    useLocalShiftStore.getState().addHourRecord(newRec);
    setRecords((prev) => [...prev, newRec]);
    setIsAddingRow(false);
  };

  const updateRecord = (
    index: number,
    field: keyof HourRecord,
    value: string,
    forcedDT?: DowntimeRecord[]
  ) => {
    if (shiftStatus === "finished") return;

    const currentRec = records[index];
    if (!currentRec) return;

    let updatedObj: HourRecord = { ...currentRec };
    if (field === "comments") updatedObj.comments = value;
    else (updatedObj as any)[field] = parseInt(value) || 0;

    const hourDTs = forcedDT !== undefined ? forcedDT : (downtimeByHour[index] || []);
    const plannedDowntime = hourDTs
      .filter(
        (dt) =>
          dt.reason.includes("PLANNED_STOPS") ||
          dt.reason.toLowerCase().includes("lunch") ||
          dt.reason.toLowerCase().includes("comida"),
      )
      .reduce((sum, dt) => sum + dt.durationMin, 0);

    const effectiveTarget =
      plannedDowntime > 0
        ? Math.round(updatedObj.target * (Math.max(0, 60 - plannedDowntime) / 60))
        : updatedObj.target;

    updatedObj.oeeLoss =
      effectiveTarget > 0 && updatedObj.actualOK < effectiveTarget
        ? parseFloat(
            (
              ((effectiveTarget - updatedObj.actualOK) / effectiveTarget) *
              100
            ).toFixed(1),
          )
        : 0;

    // Discrepancy Toast logic
    if (updatedObj.actualOK < effectiveTarget) {
      if (
        updatedObj.comments.trim().length > 0 &&
        !updatedObj.deviationNotified
      ) {
        updatedObj.deviationNotified = true;
        setToast({
          message: `Notificación enviada: Desviación registrada en hora ${updatedObj.hour}.`,
          type: "info",
          visible: true,
        });
        setTimeout(() => setToast(null), 4000);
      }
    } else {
      updatedObj.deviationNotified = false;
    }

    setRecords((prev) => {
      const next = [...prev];
      next[index] = updatedObj;
      return next;
    });

    if (updatedObj.id) {
      useLocalShiftStore.getState().updateHourRecord(index, updatedObj);
    }
  };

  const registerFault = async (
    hourIndex: number,
    payload: Omit<
      FaultRecord,
      | "id"
      | "validationMtto"
      | "validationQuality"
      | "timestamp"
      | "analysisType"
      | "analysisComplete"
    >,
  ) => {
    const hrRecord = records[hourIndex];
    if (!hrRecord || !hrRecord.id) {
      setToast({
        message: t(
          "hourByHour.record_not_saved_error",
          "No se puede registrar. Espere a que se guarde la hora o recargue la página.",
        ),
        type: "error",
        visible: true,
      });
      setTimeout(() => setToast(null), 5000);
      return;
    }

    const newFaultData = {
      id: `F-${Date.now()}`,
      operative_record_id: operativeRecordId,
      hour_record_id: hrRecord.id,
      machine_id: payload.maquinaId,
      category_id: payload.categoriaId,
      fault_code: payload.codigoFalla,
      downtime_min: payload.downtimeMin,
      comments: payload.comments || "",
    };

    const newFault: FaultRecord = {
      ...payload,
      id: newFaultData.id,
      analysisType: null,
      analysisComplete: false,
      validationMtto: "pendiente",
      validationQuality: "pendiente",
      timestamp: `Hora ${hrRecord.hour}`,
    };

    // Optimistic Update
    setFaultsByHour((prev) => {
      const updated = {
        ...prev,
        [hourIndex]: [...(prev[hourIndex] || []), newFault],
      };
      
      // Compute total downtime for the hour (including any DT and faults)
      const totalFaultsDt = updated[hourIndex].reduce((acc, f) => acc + f.downtimeMin, 0);
      const totalDt = (downtimeByHour[hourIndex] || []).reduce((acc, d) => acc + d.durationMin, 0);
      
      setTimeout(() => updateRecord(hourIndex, "downtime", String(totalFaultsDt + totalDt)), 0);
      return updated;
    });

    setToast({
      message: t("hourByHour.register_fault_success", "Falla registrada exitosamente."),
      type: "success",
      visible: true,
    });
    setTimeout(() => setToast(null), 4000);

    useLocalShiftStore.getState().addFault(hourIndex, newFault);
  };

  const registerScrap = async (
    hourIndex: number,
    payload: Omit<ScrapRecord, "id" | "validationQuality" | "timestamp">,
  ) => {
    const hrRecord = records[hourIndex];
    if (!hrRecord || !hrRecord.id) {
      setToast({
        message: t(
          "hourByHour.record_not_saved_error",
          "No se puede registrar. Espere a que se guarde la hora o recargue la página.",
        ),
        type: "error",
        visible: true,
      });
      setTimeout(() => setToast(null), 5000);
      return;
    }

    const newScrapData = {
      id: `S-${Date.now()}`,
      operative_record_id: operativeRecordId,
      hour_record_id: hrRecord.id,
      tecnologia: payload.tecnologia,
      codigo_defecto: payload.codigoDefecto,
      defecto: payload.defecto,
      cantidad: payload.cantidad,
      comments: payload.comments || "",
    };

    const newScrap: ScrapRecord = {
      ...payload,
      id: newScrapData.id,
      validationQuality: "pendiente",
      timestamp: `Hora ${hrRecord.hour}`,
    };

    // Optimistic Update
    setScrapByHour((prev) => {
      const updated = {
        ...prev,
        [hourIndex]: [...(prev[hourIndex] || []), newScrap],
      };
      const totalScrap = updated[hourIndex].reduce(
        (acc, s) => acc + s.cantidad,
        0,
      );
      setTimeout(
        () => updateRecord(hourIndex, "scrap", String(totalScrap)),
        0,
      );
      return updated;
    });

    setToast({
      message: t("hourByHour.register_scrap_success", "Scrap registrado exitosamente."),
      type: "success",
      visible: true,
    });
    setTimeout(() => setToast(null), 4000);

    useLocalShiftStore.getState().addScrap(hourIndex, newScrap);
  };

  const registerDowntime = async (
    hourIndex: number,
    payload: Omit<DowntimeRecord, "id" | "timestamp">,
  ) => {
    const hrRecord = records[hourIndex];
    if (!hrRecord || !hrRecord.id) {
      setToast({
        message: t(
          "hourByHour.record_not_saved_error",
          "No se puede registrar. Espere a que se guarde la hora o recargue la página.",
        ),
        type: "error",
        visible: true,
      });
      setTimeout(() => setToast(null), 5000);
      return;
    }

    const newDTData = {
      id: `DT-${Date.now()}`,
      operative_record_id: operativeRecordId,
      hour_record_id: hrRecord.id,
      reason: payload.reason,
      duration_min: payload.durationMin,
      comments: payload.comments || "",
    };

    const newDT: DowntimeRecord = {
      ...payload,
      id: newDTData.id,
      timestamp: `Hora ${hrRecord.hour}`,
    };

    // Optimistic Update
    setDowntimeByHour((prev) => {
      const updated = {
        ...prev,
        [hourIndex]: [...(prev[hourIndex] || []), newDT],
      };
      const totalDt = updated[hourIndex].reduce(
        (acc, dt) => acc + dt.durationMin,
        0,
      );
      const totalFaultsDt = (faultsByHour[hourIndex] || []).reduce((acc, f) => acc + f.downtimeMin, 0);
      
      setTimeout(
        () => updateRecord(hourIndex, "downtime", String(totalDt + totalFaultsDt), updated[hourIndex]),
        0,
      );
      return updated;
    });

    setToast({
      message: t("hourByHour.register_dt_success", "Tiempo Muerto registrado exitosamente."),
      type: "success",
      visible: true,
    });
    setTimeout(() => setToast(null), 4000);

    useLocalShiftStore.getState().addDowntime(hourIndex, newDT);
  };

  const updateFault = (updatedFault: any) => {
    const isFault = "maquinaNombre" in updatedFault;
    if (isFault) {
      setFaultsByHour((prev) => {
        const next = { ...prev };
        for (const key in next)
          next[key] = next[key].map((f) =>
            f.id === updatedFault.id ? updatedFault : f,
          );
        return next;
      });
    } else {
      setScrapByHour((prev) => {
        const next = { ...prev };
        for (const key in next)
          next[key] = next[key].map((s) =>
            s.id === updatedFault.id ? updatedFault : s,
          );
        return next;
      });
    }
  };

  const updateValidation = (
    id: string,
    type: "fault" | "scrap",
    dept: string,
    status: ValidationStatus,
  ) => {
    if (type === "fault") {
      setFaultsByHour((prev) => {
        const next = { ...prev };
        for (const key in next)
          next[key] = next[key].map((f) =>
            f.id === id ? { ...f, [dept]: status } : f,
          );
        return next;
      });
    } else {
      setScrapByHour((prev) => {
        const next = { ...prev };
        for (const key in next)
          next[key] = next[key].map((s) =>
            s.id === id ? { ...s, [dept]: status } : s,
          );
        return next;
      });
    }
  };

  /* ── Computed values ── */
  const allFaults = useMemo(
    () => Object.values(faultsByHour).flat(),
    [faultsByHour],
  );
  const allScrap = useMemo(
    () => Object.values(scrapByHour).flat(),
    [scrapByHour],
  );
  const allDT = useMemo(
    () => Object.values(downtimeByHour).flat(),
    [downtimeByHour],
  );
  const totalScrapPieces = useMemo(
    () => allScrap.reduce((acc, s) => acc + s.cantidad, 0),
    [allScrap],
  );
  const totalDowntimeMin = useMemo(
    () => allDT.reduce((acc, dt) => acc + dt.durationMin, 0),
    [allDT],
  );

  const enrichedOptimisticRecords = useMemo(() => {
    return optimisticRecords.map((r, idx) => {
      const hourDTs = downtimeByHour[idx] || [];
      const plannedDowntime = hourDTs
        .filter(dt => dt.reason.includes("PLANNED_STOPS") || dt.reason.toLowerCase().includes("lunch") || dt.reason.toLowerCase().includes("comida"))
        .reduce((sum, dt) => sum + dt.durationMin, 0);
      const effectiveTarget = plannedDowntime && plannedDowntime > 0
        ? Math.round(r.target * (Math.max(0, 60 - plannedDowntime) / 60))
        : r.target;
      return { ...r, plannedDowntime, effectiveTarget };
    });
  }, [optimisticRecords, downtimeByHour]);

  const totals = useMemo(
    () =>
      enrichedOptimisticRecords.reduce(
        (acc, r) => {
          const effectiveTarget = r.effectiveTarget;
            
          return {
            target: acc.target + effectiveTarget,
            actualOK: acc.actualOK + r.actualOK,
            scrap: acc.scrap + r.scrap,
            downtime: acc.downtime + r.downtime,
            oeeLoss:
              acc.oeeLoss +
              (effectiveTarget > 0 ? Math.max(0, effectiveTarget - r.actualOK) : 0),
          };
        },
        { target: 0, actualOK: 0, scrap: 0, downtime: 0, oeeLoss: 0 },
      ),
    [enrichedOptimisticRecords],
  );

  const efficiency =
    totals.target > 0
      ? ((totals.actualOK / totals.target) * 100).toFixed(1)
      : "0.0";
  const scrapRate =
    totals.actualOK + totals.scrap > 0
      ? ((totals.scrap / (totals.actualOK + totals.scrap)) * 100).toFixed(1)
      : "0.0";
  const totalOeeLossPct =
    totals.target > 0
      ? ((totals.oeeLoss / totals.target) * 100).toFixed(1)
      : "0.0";

  const pendingValidation =
    allFaults.filter(
      (f) =>
        f.validationMtto === "pendiente" || f.validationQuality === "pendiente",
    ).length +
    allScrap.filter((s) => s.validationQuality === "pendiente").length;

  const handleFinishShift = async () => {
    // Check if we have records for all hours
    if (records.length < maxHours) {
      setFinishShiftModal({
        visible: true,
        type: "error",
        title: t("hourByHour.cannot_finish_title", "No se puede finalizar"),
        message: t("hourByHour.unregistered_all_hours_error").replace(
          "{maxHours}",
          String(maxHours),
        ),
      });
      return;
    }

    // Validate that all recorded hours have been registered properly
    // i.e., actualOK or scrap has been inputted
    const hasUnregistered = records.some(
      (r) =>
        r.actualOK === 0 &&
        r.scrap === 0 &&
        r.downtime === 0 &&
        r.comments.trim() === "",
    );
    if (hasUnregistered) {
      setFinishShiftModal({
        visible: true,
        type: "error",
        title: t("hourByHour.incomplete_records_title", "Registros Incompletos"),
        message: t("hourByHour.unregistered_error"),
      });
      return;
    }

    setFinishShiftModal({
      visible: true,
      type: "confirm",
      title: t("hourByHour.finish_shift_title", "¿Finalizar Turno?"),
      message: t("hourByHour.finish_shift_confirm"),
      onConfirm: async () => {
        setFinishShiftModal(null);
        setGlobalLoading(true);
        try {
          if (operativeRecordId) {
            const localShift = useLocalShiftStore.getState();
            
            // 1. Prepare Bulk Payload
            const bulkPayload = {
              operative_record: {
                id: localShift.operativeRecordId,
                plan_id: localShift.planId,
                date: localShift.date,
                shift: localShift.shift,
                status: "finished",
              },
              hour_records: localShift.records.map((rec) => ({
                id: rec.id,
                plan_id: localShift.planId,
                hour: rec.hour,
                target: rec.target,
                actual_ok: rec.actualOK,
                scrap: rec.scrap,
                downtime: rec.downtime,
                comments: rec.comments,
                oee_loss: rec.oeeLoss,
                deviation_notified: rec.deviationNotified || false
              })),
              fault_records: Object.entries(localShift.faultsByHour).flatMap(([hourIdx, hourFaults]) => {
                const hrRecord = localShift.records[Number(hourIdx)];
                if (!hrRecord) return [];
                return hourFaults.map((f) => ({
                  id: f.id,
                  operative_record_id: localShift.operativeRecordId,
                  hour_record_id: hrRecord.id,
                  machine_id: f.maquinaId,
                  category_id: f.categoriaId,
                  fault_code: f.codigoFalla,
                  downtime_min: f.downtimeMin,
                  comments: f.comments || ""
                }));
              }),
              scrap_records: Object.entries(localShift.scrapByHour).flatMap(([hourIdx, hourScrap]) => {
                const hrRecord = localShift.records[Number(hourIdx)];
                if (!hrRecord) return [];
                return hourScrap.map((s) => ({
                  id: s.id,
                  operative_record_id: localShift.operativeRecordId,
                  hour_record_id: hrRecord.id,
                  tecnologia: s.tecnologia,
                  codigo_defecto: s.codigoDefecto,
                  defecto: s.defecto,
                  cantidad: s.cantidad,
                  comments: s.comments || ""
                }));
              }),
              downtime_records: Object.entries(localShift.downtimeByHour).flatMap(([hourIdx, hourDt]) => {
                const hrRecord = localShift.records[Number(hourIdx)];
                if (!hrRecord) return [];
                return hourDt.map((dt) => ({
                  id: dt.id,
                  operative_record_id: localShift.operativeRecordId,
                  hour_record_id: hrRecord.id,
                  reason: dt.reason,
                  duration_min: dt.durationMin,
                  comments: dt.comments || ""
                }));
              })
            };

            await axiosClient.post("/production-records/bulk", bulkPayload);

            // 2. Invalidate caches and clear local shift
            useProductionStore.getState().invalidateCache('all');
            localShift.clearShift();
            setShiftStatus("finished");
            setToast({
              message: t("hourByHour.shift_finished_toast"),
              type: "success",
              visible: true,
            });
            setTimeout(() => setToast(null), 4000);
          }
        } catch (e) {
          console.error("API Error during bulk upload", e);
          setToast({
            message: "Error al sincronizar datos. Verifique conexión y reintente.",
            type: "error",
            visible: true,
          });
        } finally {
          setGlobalLoading(false);
        }
      }
    });
  };

  /* ── Styles ── */
  const inputStyle: React.CSSProperties = {
    width: "100%",
    minHeight: 56,
    padding: "14px 18px",
    background: "var(--gv-surface-alt)",
    border: "1px solid var(--gv-border)",
    borderRadius: 10,
    color: "var(--gv-text-heading)",
    fontSize: 28,
    fontFamily: "'Inter', sans-serif",
    fontWeight: 800,
    textAlign: "center",
    transition: "all 0.2s ease",
  };
  const thStyle: React.CSSProperties = {
    padding: "20px 20px",
    textAlign: "center",
    fontSize: 15,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--gv-text-muted)",
    borderBottom: "2px solid var(--gv-border)",
    background: "var(--gv-surface-alt)",
    position: "sticky",
    top: 0,
    zIndex: 10,
    whiteSpace: "nowrap",
  };
  const tdStyle: React.CSSProperties = {
    padding: "16px 14px",
    borderBottom: "1px solid var(--gv-border)",
    verticalAlign: "middle",
  };

  return (
    <>
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
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 5,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background:
                    "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.15))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ClipboardList size={18} color="#f59e0b" />
              </div>
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "var(--gv-text-heading)",
                  margin: 0,
                  letterSpacing: -0.5,
                }}
              >
                {t("hourByHour.title")}
              </h1>
            </div>
            <div
              style={{
                fontSize: 15,
                color: "var(--gv-text-muted)",
                margin: 0,
                paddingLeft: 46,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span>
                {filters.location} › {filters.process} —
              </span>

              {availablePlans.length > 0 ? (
                <div style={{ position: "relative" }}>
                  <select
                    value={activePlan?.id_plan || ""}
                    onChange={handlePlanChange}
                    style={{
                      appearance: "none",
                      padding: "6px 30px 6px 12px",
                      borderRadius: 6,
                      background: "rgba(59,130,246,0.1)",
                      color: "#3b82f6",
                      border: "1px solid rgba(59,130,246,0.3)",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      outline: "none",
                    }}
                  >
                    {availablePlans.map((plan) => {
                      const opMatch = allOperativeRecords.find(o => o.plan_id === plan.id_plan || (!o.plan_id && o.date === globalDateRange.startDate && o.shift === plan.turno));
                      let statusIcon = "⏳"; // pending
                      if (opMatch) {
                        statusIcon = opMatch.status === "finished" ? "✅" : "▶️";
                      }
                      return (
                        <option key={plan.id_plan} value={plan.id_plan}>
                          [{statusIcon}] {plan.target_hr === 0 ? "🚧 PARO PROGRAMADO" : t(
                            `shifts.${plan.turno}`,
                            TURNO_CONFIG[plan.turno]?.label || plan.turno,
                          )}{" "}
                          ({plan.slot?.start || TURNO_CONFIG[plan.turno]?.start} -{" "}
                          {plan.slot?.end || TURNO_CONFIG[plan.turno]?.end}) - {plan.sku}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown
                    size={12}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#3b82f6",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              ) : (
                <span style={{ color: "#ef4444", fontWeight: 600 }}>
                  {t(
                    "hourByHour.no_shifts_scheduled",
                    "Sin turnos programados",
                  )}
                </span>
              )}

              {activePlan && (
                <span style={{ fontSize: 16, marginLeft: 8 }}>
                  | {t("hourByHour.target_only", "Objetivo:")}{" "}
                  <strong style={{ color: "var(--gv-primary)", fontSize: 20 }}>
                    {planTarget} {t("hourByHour.pcs_hr", "pzs/hr")}
                  </strong>
                </span>
              )}
              {shiftStatus === "finished" && (
                <span
                  style={{
                    marginLeft: 8,
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: "rgba(239,68,68,0.1)",
                    color: "#ef4444",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {t("hourByHour.read_only_mode")}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {shiftStatus === "active" && activePlan && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleFinishShift}
                style={{
                  padding: "12px 22px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #ef4444, #f97316)",
                  color: "#fff",
                  fontSize: 17,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s ease",
                }}
              >
                <CheckCircle2 size={18} /> {t("hourByHour.finish_shift")}
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setValidationPanel((v) => !v)}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border:
                  pendingValidation > 0
                    ? "1px solid rgba(245,158,11,0.4)"
                    : "1px solid var(--gv-border)",
                background:
                  pendingValidation > 0
                    ? "rgba(245,158,11,0.08)"
                    : "var(--gv-surface)",
                color: pendingValidation > 0 ? "#f59e0b" : "var(--gv-text)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "none",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s ease",
              }}
            >
              <BadgeCheck size={15} />
              {t("hourByHour.validation_panel")}
              {pendingValidation > 0 && (
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#f59e0b",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {pendingValidation}
                </span>
              )}
            </motion.button>
          </div>
        </div>

        {/* ── Shift Timeline & Info Banner ── */}
        {optimisticRecords.length > 0 && (
          <>
          <ShiftTimeline
            records={enrichedOptimisticRecords}
            planTarget={planTarget}
            totals={totals}
            efficiency={efficiency}
            scrapRate={scrapRate}
            allFaults={allFaults}
            allScrap={allScrap}
            shiftStatus={shiftStatus}
            activeHourIndex={selectedHourIndex}
            onHourActive={setSelectedHourIndex}
          />


          </>
        )}

        {/* ── Main Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card"
          style={{ overflow: "hidden" }}
        >
          {enrichedOptimisticRecords.length === 0 ? (
            <div
              style={{
                padding: "60px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: "rgba(59,130,246,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3b82f6",
                  marginBottom: 20,
                }}
              >
                <Clock size={32} />
              </div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "var(--gv-text-heading)",
                  marginBottom: 8,
                }}
              >
                {availablePlans.length === 0
                  ? t("hourByHour.no_shifts_title", "Sin turnos programados")
                  : t("hourByHour.no_records_title", "Turno iniciado")}
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--gv-text-muted)",
                  maxWidth: 450,
                  lineHeight: 1.5,
                  marginBottom: 24,
                }}
              >
                {availablePlans.length === 0
                  ? t(
                      "hourByHour.no_shifts_desc",
                      "No hay ningún turno programado para la fecha, ubicación y proceso seleccionados.",
                    )
                  : t(
                      "hourByHour.no_records_desc",
                      "Se debe comenzar con el registro de la primera hora dando clic en el botón Añadir Fila de Hora.",
                    )}
              </p>
              {availablePlans.length > 0 && shiftStatus !== "finished" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={addRow}
                  disabled={isAddingRow}
                  style={{
                    padding: "12px 24px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: isAddingRow ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 8px 20px rgba(59,130,246,0.2)",
                    opacity: isAddingRow ? 0.7 : 1,
                  }}
                >
                  {isAddingRow ? <Clock size={18} className="animate-spin" /> : <Plus size={18} />} {t("hourByHour.add_row")} (0/{maxHours})
                </motion.button>
              )}
            </div>
          ) : (
            <>
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
                      <th style={{ ...thStyle, width: 60, minWidth: 60, maxWidth: 60, textAlign: "center", color: "var(--gv-text-muted)" }}>
                      </th>
                      <th style={{ ...thStyle, minWidth: 100 }}>
                        {t("hourByHour.hour_col", "Hora")}
                      </th>
                      <th style={{ ...thStyle, minWidth: 70 }}>{t("hourByHour.target", "Target")}</th>
                      <th style={{ ...thStyle, minWidth: 180 }}>OK</th>
                      <th style={{ ...thStyle, width: 130, minWidth: 130, maxWidth: 130 }}>{t("hourByHour.oee_loss", "OEE Loss")}</th>
                      <th
                        style={{
                          ...thStyle,
                          minWidth: 180,
                          background: "rgba(245,158,11,0.05)",
                          color: "#f59e0b",
                          borderLeft: "2px solid rgba(245,158,11,0.15)",
                        }}
                      >
                        {t("hourByHour.registered_downtime", "TIEMPO MUERTO")}
                      </th>
                      <th
                        style={{
                          ...thStyle,
                          minWidth: 180,
                          background: "rgba(139,92,246,0.05)",
                          color: "#8b5cf6",
                          borderLeft: "2px solid rgba(139,92,246,0.15)",
                        }}
                      >
                        {t("hourByHour.registered_scrap")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedOptimisticRecords.map((r, idx) => {
                      const record = r;
                      const index = idx;
                      const isCurrentHour =
                        index === optimisticRecords.length - 1 &&
                        record.actualOK === 0;
                      const pctOK =
                        record.effectiveTarget > 0 ? record.actualOK / record.effectiveTarget : 0;
                      const rowDT = downtimeByHour[index] || [];
                      const rowFaults = faultsByHour[index] || [];
                      const rowScrap = scrapByHour[index] || [];

                      const startStr = activePlan?.slot?.start || (activePlan ? TURNO_CONFIG[activePlan.turno]?.start : "00:00") || "00:00";
                      const startMins = parseTimeToMinutes(startStr) + (record.hour - 1) * 60;
                      const endMins = startMins + 60;
                      const formatMins = (m: number) => {
                        const hrs = Math.floor((m % 1440) / 60);
                        const mins = (m % 1440) % 60;
                        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                      };
                      const timeRangeStr = `${formatMins(startMins)} - ${formatMins(endMins)}`;

                      return (
                        <motion.tr
                          key={`hour-${record.hour}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.05 * index }}
                          style={{
                            background:
                              index === selectedHourIndex
                                ? "rgba(59,130,246,0.15)"
                                : rowFaults.length > 0
                                  ? "rgba(239,68,68,0.025)"
                                  : isCurrentHour
                                    ? "rgba(59,130,246,0.04)"
                                    : "transparent",
                            transition: "background 0.2s ease"
                          }}
                        >
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            <span style={{ fontSize: 22, fontWeight: 800, color: "var(--gv-text-muted)", opacity: 0.6 }}>
                              H{index + 1}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "6px 12px",
                                borderRadius: 8,
                                fontWeight: 800,
                                fontSize: 14,
                                whiteSpace: "nowrap",
                                color:
                                  index === selectedHourIndex
                                    ? "#fff"
                                    : rowFaults.length > 0
                                      ? "#fff"
                                      : isCurrentHour
                                        ? "#fff"
                                        : "var(--gv-text-heading)",
                                background:
                                  index === selectedHourIndex
                                    ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                                    : rowFaults.length > 0
                                      ? "linear-gradient(135deg, #ef4444, #f97316)"
                                      : isCurrentHour
                                        ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                                        : "var(--gv-surface-alt)",
                                position: "relative",
                                opacity: record.pending ? 0.6 : 1,
                                transition: "all 0.2s ease"
                              }}
                            >
                              {record.pending ? (
                                <Clock size={14} className="animate-spin" />
                              ) : record.isOffline ? (
                                <Clock size={14} color="#f59e0b" />
                              ) : (
                                timeRangeStr
                              )}
                            </div>
                          </td>
                          {/* Target */}
                          <td
                            style={{
                              ...tdStyle,
                              textAlign: "center",
                              fontWeight: 800,
                              color: "var(--gv-text-muted)",
                              fontSize: 24,
                            }}
                          >
                            {record.target}
                          </td>
                          {/* OK */}
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', margin: '0 auto' }}>
                              <button
                                onClick={() => {
                                  if (shiftStatus === "finished") return;
                                  const newVal = Math.max(0, (record.actualOK || 0) - 1);
                                  setRecords((prev) => {
                                    const next = prev.map((r, i) => {
                                      if (i !== index) return r;
                                      let updated = { ...r, actualOK: newVal };
                                      const effTarget = record.effectiveTarget || updated.target;
                                      updated.oeeLoss = effTarget > 0 && updated.actualOK < effTarget
                                        ? parseFloat((((effTarget - updated.actualOK) / effTarget) * 100).toFixed(1))
                                        : 0;
                                      return updated;
                                    });
                                    return next;
                                  });
                                  updateRecord(index, "actualOK", String(newVal));
                                }}
                                disabled={shiftStatus === "finished"}
                                style={{
                                  background: 'rgba(251, 113, 133, 0.15)', // soft pastel rose background
                                  border: 'none',
                                  cursor: shiftStatus === "finished" ? 'not-allowed' : 'pointer',
                                  padding: '8px 12px',
                                  color: '#fb7185', // pastel rose color
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: 8,
                                  opacity: shiftStatus === "finished" ? 0.5 : 1,
                                  transition: 'transform 0.1s ease'
                                }}
                                title="Decrementar (-1)"
                                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                <Minus size={24} strokeWidth={2.5} />
                              </button>
                              
                              <input
                                type="number"
                                style={{
                                  ...inputStyle,
                                  border: 'none',
                                  background: 'transparent',
                                  width: '60px',
                                  minWidth: '60px',
                                  padding: 0,
                                  textAlign: 'center',
                                  fontSize: 20,
                                  fontWeight: 800,
                                  color: 'var(--gv-text-heading)'
                                }}
                                value={record.actualOK || ""}
                                onChange={(e) => {
                                  setRecords((prev) => {
                                    const next = prev.map((r, i) => {
                                      if (i !== index) return r;
                                      let updated = { ...r, actualOK: parseInt(e.target.value) || 0 };
                                      const effTarget = record.effectiveTarget || updated.target;
                                      updated.oeeLoss = effTarget > 0 && updated.actualOK < effTarget
                                        ? parseFloat((((effTarget - updated.actualOK) / effTarget) * 100).toFixed(1))
                                        : 0;
                                      return updated;
                                    });
                                    return next;
                                  });
                                }}
                                onBlur={(e) =>
                                  updateRecord(index, "actualOK", (e.target as HTMLInputElement).value)
                                }
                                onKeyUp={(e) => {
                                  if (e.key === 'Enter') {
                                    updateRecord(index, "actualOK", (e.target as HTMLInputElement).value);
                                  }
                                }}
                                placeholder="0"
                                min={0}
                                disabled={shiftStatus === "finished"}
                              />

                              <button
                                onClick={() => {
                                  if (shiftStatus === "finished") return;
                                  const newVal = (record.actualOK || 0) + 1;
                                  setRecords((prev) => {
                                    const next = prev.map((r, i) => {
                                      if (i !== index) return r;
                                      let updated = { ...r, actualOK: newVal };
                                      const effTarget = record.effectiveTarget || updated.target;
                                      updated.oeeLoss = effTarget > 0 && updated.actualOK < effTarget
                                        ? parseFloat((((effTarget - updated.actualOK) / effTarget) * 100).toFixed(1))
                                        : 0;
                                      return updated;
                                    });
                                    return next;
                                  });
                                  updateRecord(index, "actualOK", String(newVal));
                                }}
                                disabled={shiftStatus === "finished"}
                                style={{
                                  background: 'rgba(52, 211, 153, 0.15)', // soft pastel emerald background
                                  border: 'none',
                                  cursor: shiftStatus === "finished" ? 'not-allowed' : 'pointer',
                                  padding: '8px 12px',
                                  color: '#34d399', // pastel emerald color
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: 8,
                                  opacity: shiftStatus === "finished" ? 0.5 : 1,
                                  transition: 'transform 0.1s ease'
                                }}
                                title="Incrementar (+1)"
                                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                <Plus size={24} strokeWidth={2.5} />
                              </button>
                            </div>
                          </td>
                          {/* OEE Loss */}
                          <td style={{ ...tdStyle, padding: "20px 12px", textAlign: "center" }}>
                            {record.oeeLoss > 0 ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "8px 16px",
                                  borderRadius: 8,
                                  fontSize: 16,
                                  fontWeight: 900,
                                  background:
                                    record.oeeLoss > 15
                                      ? "rgba(239,68,68,0.12)"
                                      : "rgba(245,158,11,0.12)",
                                  color:
                                    record.oeeLoss > 15 ? "#ef4444" : "#f59e0b",
                                }}
                              >
                                <TrendingDown size={14} />-{record.oeeLoss}%
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "8px 16px",
                                  borderRadius: 8,
                                  fontSize: 16,
                                  fontWeight: 900,
                                  background:
                                    record.actualOK > 0
                                      ? "rgba(16,185,129,0.12)"
                                      : "transparent",
                                  color:
                                    record.actualOK > 0
                                      ? "#10b981"
                                      : "var(--gv-text-muted)",
                                }}
                              >
                                {record.actualOK > 0 ? "✓ OK" : "—"}
                              </span>
                            )}
                          </td>

                          {/* ── TIEMPO MUERTO CELL (DOWNTIME & FAULTS) ── */}
                          <td
                            style={{
                              ...tdStyle,
                              padding: "16px 12px",
                              borderLeft: "2px solid rgba(245,158,11,0.1)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                              }}
                            >
                              {rowDT.map((dt) => (
                                <motion.div
                                  key={dt.id}
                                  initial={{ opacity: 0, y: -6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  style={{
                                    padding: "10px 14px",
                                    borderRadius: 10,
                                    background: "rgba(245,158,11,0.06)",
                                    border: "1px solid rgba(245,158,11,0.18)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 6,
                                    maxWidth: 260,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "flex-start",
                                      gap: 8,
                                    }}
                                  >
                                    <Clock
                                      size={14}
                                      color="#f59e0b"
                                      style={{ marginTop: 2, flexShrink: 0 }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: "#f59e0b",
                                          letterSpacing: "0.04em",
                                        }}
                                      >
                                        {dt.reason.match(/^\[(.*?)\]/) ? dt.reason.match(/^\[(.*?)\]/)![1] : "DT"} ·{" "}
                                        {dt.durationMin} min
                                      </div>
                                      <div
                                        style={{
                                          fontSize: 13,
                                          color: "var(--gv-text-heading)",
                                          fontWeight: 600,
                                          marginTop: 2,
                                        }}
                                      >
                                        {dt.reason.replace(/^\[.*?\]\s*/, "")}
                                      </div>
                                      {dt.comments && (
                                        <div
                                          title={dt.comments}
                                          style={{
                                            fontSize: 11,
                                            color: "var(--gv-text-muted)",
                                            marginTop: 3,
                                            fontStyle: "italic",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          "{dt.comments}"
                                        </div>
                                      )}
                                    </div>
                                    {shiftStatus !== "finished" && (
                                      <div style={{ display: "flex", alignItems: "center", marginLeft: "auto" }}>
                                        <button
                                          onClick={() => setEditDtModal({ index, item: dt })}
                                          style={{
                                            background: "transparent",
                                            border: "none",
                                            color: "rgba(59,130,246,0.6)",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            padding: 6,
                                            borderRadius: 6,
                                          }}
                                          title={t("hourByHour.edit", "Editar")}
                                        >
                                          <Edit3 size={16} />
                                        </button>
                                        <button
                                          onClick={() => setDeleteItemModal({ visible: true, type: "dt", hourIndex: index, id: dt.id, description: dt.reason.replace(/^\[.*?\]\s*/, "") })}
                                          style={{
                                            background: "transparent",
                                            border: "none",
                                            color: "rgba(245,158,11,0.6)",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            padding: 6,
                                            marginLeft: 4,
                                            borderRadius: 6,
                                          }}
                                          title={t("hourByHour.delete", "Eliminar")}
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                              {rowFaults.map((fault) => (
                                <motion.div
                                  key={fault.id}
                                  initial={{ opacity: 0, y: -6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  style={{
                                    padding: "10px 14px",
                                    borderRadius: 10,
                                    background: "rgba(239,68,68,0.06)",
                                    border: "1px solid rgba(239,68,68,0.18)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 6,
                                    maxWidth: 260,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "flex-start",
                                      gap: 8,
                                    }}
                                  >
                                    <Wrench
                                      size={14}
                                      color="#ef4444"
                                      style={{ marginTop: 2, flexShrink: 0 }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: "#ef4444",
                                          letterSpacing: "0.04em",
                                        }}
                                      >
                                        {fault.codigoFalla} ·{" "}
                                        {fault.downtimeMin} min
                                      </div>
                                      <div
                                        style={{
                                          fontSize: 13,
                                          color: "var(--gv-text-heading)",
                                          fontWeight: 600,
                                          marginTop: 2,
                                        }}
                                      >
                                        {fault.fallaDescripcion}
                                      </div>
                                      {fault.comments && (
                                        <div
                                          title={fault.comments}
                                          style={{
                                            fontSize: 11,
                                            color: "var(--gv-text-muted)",
                                            marginTop: 3,
                                            fontStyle: "italic",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          "{fault.comments}"
                                        </div>
                                      )}
                                      <div
                                        style={{
                                          fontSize: 11,
                                          color: "var(--gv-text-muted)",
                                          marginTop: 4,
                                        }}
                                      >
                                        {(() => {
                                          const machines = baseDataApi.getCachedMachines() || [];
                                          const machine = machines.find((m: any) => (m.id || m.id_maquina) === fault.maquinaId);
                                          if (machine) {
                                            const code = machine.code || "N/A";
                                            const name = machine.name || machine.nombre || "";
                                            return `[${code}] ${name}`;
                                          }
                                          return fault.maquinaId || fault.maquinaNombre;
                                        })()}
                                      </div>
                                    </div>
                                    {shiftStatus !== "finished" && (
                                      <div style={{ display: "flex", alignItems: "center", marginLeft: "auto" }}>
                                        <button
                                          onClick={() => setEditDtModal({ index, item: fault })}
                                          style={{
                                            background: "transparent",
                                            border: "none",
                                            color: "rgba(59,130,246,0.6)",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            padding: 6,
                                            borderRadius: 6,
                                          }}
                                          title={t("hourByHour.edit", "Editar")}
                                        >
                                          <Edit3 size={16} />
                                        </button>
                                        <button
                                          onClick={() => setDeleteItemModal({ visible: true, type: "fault", hourIndex: index, id: fault.id, description: fault.fallaDescripcion })}
                                          style={{
                                            background: "transparent",
                                            border: "none",
                                            color: "rgba(239,68,68,0.6)",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            padding: 6,
                                            marginLeft: 4,
                                            borderRadius: 6,
                                          }}
                                          title={t("hourByHour.delete", "Eliminar")}
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                </motion.div>
                              ))}
                              {shiftStatus !== "finished" && (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => setDtModal(index)}
                                  style={{
                                    padding: "8px 14px",
                                    borderRadius: 6,
                                    border: "1px dashed rgba(245,158,11,0.35)",
                                    background: "transparent",
                                    color: "rgba(245,158,11,0.6)",
                                    fontSize: 14,
                                    fontWeight: 800,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    transition: "all 0.2s ease",
                                    alignSelf: "flex-start",
                                  }}
                                >
                                  <Plus size={14} />{" "}
                                  {t("hourByHour.register_downtime", "Registrar DT / Falla")}
                                </motion.button>
                              )}
                            </div>
                          </td>

                          {/* ── SCRAP CELL ── */}
                          <td
                            style={{
                              ...tdStyle,
                              borderLeft: "2px solid rgba(139,92,246,0.1)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 5,
                              }}
                            >
                              {rowScrap.map((scrap) => (
                                <motion.div
                                  key={scrap.id}
                                  initial={{ opacity: 0, y: -6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: 7,
                                    background: "rgba(139,92,246,0.06)",
                                    border: "1px solid rgba(139,92,246,0.18)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    maxWidth: 240,
                                  }}
                                >
                                  <ShieldCheck
                                    size={11}
                                    color="#8b5cf6"
                                    style={{ flexShrink: 0 }}
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: "#8b5cf6",
                                        letterSpacing: "0.04em",
                                      }}
                                    >
                                      {scrap.codigoDefecto}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: "var(--gv-text-heading)",
                                        fontWeight: 600,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {scrap.defecto}
                                    </div>
                                    {scrap.comments && (
                                      <div
                                        title={scrap.comments}
                                        style={{
                                          fontSize: 10,
                                          color: "var(--gv-text-muted)",
                                          marginTop: 2,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          fontStyle: "italic",
                                        }}
                                      >
                                        "{scrap.comments}"
                                      </div>
                                    )}
                                  </div>
                                  {/* Qty badge */}
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      minWidth: 26,
                                      height: 22,
                                      borderRadius: 6,
                                      background:
                                        "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                                      color: "#fff",
                                      fontSize: 11,
                                      fontWeight: 800,
                                      padding: "0 6px",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {scrap.cantidad}
                                  </span>
                                  {shiftStatus !== "finished" && (
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                      <button
                                        onClick={() => setEditScrapModal({ index, item: scrap })}
                                        style={{
                                          background: "transparent",
                                          border: "none",
                                          color: "rgba(59,130,246,0.6)",
                                          cursor: "pointer",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          padding: 4,
                                          marginLeft: 4,
                                          borderRadius: 4,
                                        }}
                                        title={t("hourByHour.edit", "Editar")}
                                      >
                                        <Edit3 size={13} />
                                      </button>
                                      <button
                                        onClick={() => setDeleteItemModal({ visible: true, type: "scrap", hourIndex: index, id: scrap.id, description: scrap.defecto })}
                                        style={{
                                          background: "transparent",
                                          border: "none",
                                          color: "rgba(139,92,246,0.6)",
                                          cursor: "pointer",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          padding: 4,
                                          marginLeft: 4,
                                          borderRadius: 4,
                                        }}
                                        title={t("hourByHour.delete", "Eliminar")}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  )}
                                  <div
                                    style={{
                                      marginLeft: "auto",
                                      display: "none",
                                      alignItems: "center",
                                      gap: 6,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <AnalysisBadge
                                      fault={scrap}
                                      onClick={() => setAnalysisDrawer(scrap)}
                                    />
                                    <ValidationPill
                                      status={scrap.validationQuality}
                                      dept="CAL"
                                    />
                                  </div>
                                </motion.div>
                              ))}
                              {shiftStatus !== "finished" && (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => setScrapModal(index)}
                                  style={{
                                    padding: "8px 14px",
                                    borderRadius: 6,
                                    border: "1px dashed rgba(139,92,246,0.35)",
                                    background: "transparent",
                                    color: "rgba(139,92,246,0.6)",
                                    fontSize: 14,
                                    fontWeight: 800,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    transition: "all 0.2s ease",
                                    alignSelf: "flex-start",
                                  }}
                                >
                                  <Plus size={14} />{" "}
                                  {t("hourByHour.register_defect")}
                                </motion.button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>

                  {/* Totals footer */}
                  <tfoot>
                    <tr style={{ background: "var(--gv-surface-alt)" }}>
                      <td
                        colSpan={2}
                        style={{
                          ...tdStyle,
                          textAlign: "center",
                          fontWeight: 800,
                          fontSize: 14,
                          color: "var(--gv-text-heading)",
                          borderBottom: "none",
                        }}
                      >
                        {t("hourByHour.total")}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          textAlign: "center",
                          fontWeight: 800,
                          fontSize: 18,
                          color: "var(--gv-text-heading)",
                          borderBottom: "none",
                        }}
                      >
                        {totals.target}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          textAlign: "center",
                          fontWeight: 800,
                          fontSize: 18,
                          color: "#10b981",
                          borderBottom: "none",
                        }}
                      >
                        {totals.actualOK}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          textAlign: "center",
                          fontWeight: 800,
                          fontSize: 18,
                          color: "#ef4444",
                          borderBottom: "none",
                        }}
                      >
                        -{totalOeeLossPct}%
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          textAlign: "center",
                          fontWeight: 800,
                          fontSize: 18,
                          color: "#f59e0b",
                          borderBottom: "none",
                          borderLeft: "2px solid rgba(245,158,11,0.1)",
                        }}
                      >
                        {totals.downtime} min
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          borderBottom: "none",
                          borderLeft: "2px solid rgba(139,92,246,0.1)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            fontSize: 15,
                            fontWeight: 800,
                          }}
                        >
                          <ShieldCheck size={13} color="#8b5cf6" />
                          <span style={{ color: "#8b5cf6" }}>
                            {totalScrapPieces} {t("hourByHour.pcs", "pzs")}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "var(--gv-text-muted)",
                            }}
                          >
                            ({allScrap.length}{" "}
                            {allScrap.length === 1
                              ? t("hourByHour.defect_singular", "defecto")
                              : t("hourByHour.defects_plural", "defectos")}
                            )
                          </span>
                          <span
                            style={{
                              marginLeft: 8,
                              paddingLeft: 8,
                              borderLeft: "1px solid var(--gv-border)",
                              color:
                                parseFloat(scrapRate) > 2.5
                                  ? "#ef4444"
                                  : "#10b981",
                            }}
                          >
                            SR: {scrapRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Add Row */}
              {availablePlans.length > 0 && shiftStatus !== "finished" && (
                <div
                  style={{
                    padding: "12px 22px",
                    borderTop: "1px solid var(--gv-border)",
                  }}
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={addRow}
                    disabled={optimisticRecords.length >= maxHours || isAddingRow}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 8,
                      border: "1px dashed var(--gv-border)",
                      background: "transparent",
                      color:
                        optimisticRecords.length >= maxHours
                          ? "var(--gv-text-muted)"
                          : "var(--gv-primary)",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor:
                        optimisticRecords.length >= maxHours || isAddingRow
                          ? "not-allowed"
                          : "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      transition: "all 0.2s ease",
                      opacity: optimisticRecords.length >= maxHours || isAddingRow ? 0.4 : 1,
                    }}
                  >
                    {isAddingRow ? <Clock size={15} className="animate-spin" /> : <Plus size={15} />} {t("hourByHour.add_row")} (
                    {optimisticRecords.length}/{maxHours})
                  </motion.button>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* ── Validation Panel ── */}
        <AnimatePresence>
          {validationPanel && (allFaults.length > 0 || allScrap.length > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
              className="glass-card"
              style={{ overflow: "hidden" }}
            >
              {/* Panel header */}
              <div
                style={{
                  padding: "16px 22px",
                  borderBottom: "1px solid var(--gv-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(245,158,11,0.04)",
                }}
              >
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--gv-text-heading)",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <BadgeCheck size={16} color="#f59e0b" />{" "}
                  {t("hourByHour.validation_panel_title")}
                </h3>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--gv-text-muted)",
                    margin: 0,
                  }}
                >
                  {t("hourByHour.validation_panel_desc")}
                </p>
              </div>

              {/* ─ Faults validation section ─ */}
              {allFaults.length > 0 && (
                <>
                  <div
                    style={{
                      padding: "10px 22px",
                      background: "rgba(239,68,68,0.04)",
                      borderBottom: "1px solid var(--gv-border)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Wrench size={14} color="#ef4444" />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#ef4444",
                      }}
                    >
                      {t("hourByHour.faults_validation")}
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 11,
                        color: "var(--gv-text-muted)",
                      }}
                    >
                      {allFaults.length} registro
                      {allFaults.length !== 1 ? "s" : ""}
                    </span>
                  </div>
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
                          {[
                            "Hora",
                            "Código",
                            "Falla",
                            "Máquina",
                            "DT",
                            "RCA",
                            "MTTO",
                            "Calidad",
                          ].map((h) => (
                            <th
                              key={h}
                              style={{
                                padding: "8px 14px",
                                textAlign: "left",
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                color: "var(--gv-text-muted)",
                                borderBottom: "1px solid var(--gv-border)",
                                background: "var(--gv-surface-alt)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {allFaults.map((fault, fi) => (
                          <motion.tr
                            key={fault.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: fi * 0.03 }}
                          >
                            <td
                              style={{
                                padding: "8px 14px",
                                borderBottom: "1px solid var(--gv-border)",
                                fontSize: 12,
                                fontWeight: 700,
                                color: "var(--gv-text-heading)",
                              }}
                            >
                              {fault.timestamp}
                            </td>
                            <td
                              style={{
                                padding: "8px 14px",
                                borderBottom: "1px solid var(--gv-border)",
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#ef4444",
                              }}
                            >
                              {fault.codigoFalla}
                            </td>
                            <td
                              style={{
                                padding: "8px 14px",
                                borderBottom: "1px solid var(--gv-border)",
                                fontSize: 12,
                                color: "var(--gv-text-heading)",
                                maxWidth: 180,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {fault.fallaDescripcion}
                            </td>
                            <td
                              style={{
                                padding: "8px 14px",
                                borderBottom: "1px solid var(--gv-border)",
                                fontSize: 11,
                                color: "var(--gv-text-muted)",
                                whiteSpace: "nowrap",
                                maxWidth: 140,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {fault.maquinaNombre}
                            </td>
                            <td
                              style={{
                                padding: "8px 14px",
                                borderBottom: "1px solid var(--gv-border)",
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#f59e0b",
                                textAlign: "center",
                              }}
                            >
                              {fault.downtimeMin}m
                            </td>
                            <td
                              style={{
                                padding: "8px 14px",
                                borderBottom: "1px solid var(--gv-border)",
                              }}
                            >
                              <AnalysisBadge
                                fault={fault}
                                onClick={() => setAnalysisDrawer(fault)}
                              />
                            </td>
                            <td
                              style={{
                                padding: "8px 14px",
                                borderBottom: "1px solid var(--gv-border)",
                              }}
                            >
                              <select
                                value={fault.validationMtto}
                                onChange={(e) =>
                                  updateValidation(
                                    fault.id,
                                    "fault",
                                    "validationMtto",
                                    e.target.value as ValidationStatus,
                                  )
                                }
                                style={{
                                  appearance: "none",
                                  padding: "5px 10px",
                                  borderRadius: 6,
                                  border: "1px solid var(--gv-border)",
                                  background:
                                    fault.validationMtto === "validado"
                                      ? "rgba(16,185,129,0.08)"
                                      : fault.validationMtto === "corregido"
                                        ? "rgba(59,130,246,0.08)"
                                        : "rgba(245,158,11,0.08)",
                                  color:
                                    fault.validationMtto === "validado"
                                      ? "#10b981"
                                      : fault.validationMtto === "corregido"
                                        ? "#3b82f6"
                                        : "#f59e0b",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  fontFamily: "inherit",
                                  cursor: "pointer",
                                }}
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="validado">Validado ✓</option>
                                <option value="corregido">Corregido</option>
                              </select>
                            </td>
                            <td
                              style={{
                                padding: "8px 14px",
                                borderBottom: "1px solid var(--gv-border)",
                              }}
                            >
                              <select
                                value={fault.validationQuality}
                                onChange={(e) =>
                                  updateValidation(
                                    fault.id,
                                    "fault",
                                    "validationQuality",
                                    e.target.value as ValidationStatus,
                                  )
                                }
                                style={{
                                  appearance: "none",
                                  padding: "5px 10px",
                                  borderRadius: 6,
                                  border: "1px solid var(--gv-border)",
                                  background:
                                    fault.validationQuality === "validado"
                                      ? "rgba(16,185,129,0.08)"
                                      : fault.validationQuality === "corregido"
                                        ? "rgba(59,130,246,0.08)"
                                        : "rgba(245,158,11,0.08)",
                                  color:
                                    fault.validationQuality === "validado"
                                      ? "#10b981"
                                      : fault.validationQuality === "corregido"
                                        ? "#3b82f6"
                                        : "#f59e0b",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  fontFamily: "inherit",
                                  cursor: "pointer",
                                }}
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="validado">Validado ✓</option>
                                <option value="corregido">Corregido</option>
                              </select>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ─ Scrap validation section ─ */}
              {allScrap.length > 0 && (
                <>
                  <div
                    style={{
                      padding: "10px 22px",
                      background: "rgba(139,92,246,0.04)",
                      borderBottom: "1px solid var(--gv-border)",
                      borderTop:
                        allFaults.length > 0
                          ? "2px solid var(--gv-border)"
                          : "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <ShieldCheck size={14} color="#8b5cf6" />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#8b5cf6",
                      }}
                    >
                      {t("hourByHour.scrap_validation")}
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 11,
                        color: "var(--gv-text-muted)",
                      }}
                    >
                      {allScrap.length} defecto
                      {allScrap.length !== 1 ? "s" : ""} · {totalScrapPieces}{" "}
                      pzs
                    </span>
                  </div>
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
                          {[
                            "Hora",
                            "Código",
                            "Defecto",
                            "Tecnología",
                            "Cantidad",
                            "Calidad",
                          ].map((h) => (
                            <th
                              key={h}
                              style={{
                                padding: "8px 14px",
                                textAlign: "left",
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                color: "var(--gv-text-muted)",
                                borderBottom: "1px solid var(--gv-border)",
                                background: "var(--gv-surface-alt)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {allScrap.map((scrap, si) => (
                          <motion.tr
                            key={scrap.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: si * 0.03 }}
                          >
                            <td
                              style={{
                                padding: "8px 14px",
                                borderBottom: "1px solid var(--gv-border)",
                                fontSize: 12,
                                fontWeight: 700,
                                color: "var(--gv-text-heading)",
                              }}
                            >
                              {scrap.timestamp}
                            </td>
                            <td
                              style={{
                                padding: "8px 14px",
                                borderBottom: "1px solid var(--gv-border)",
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#8b5cf6",
                              }}
                            >
                              {scrap.codigoDefecto}
                            </td>
                            <td
                              style={{
                                padding: "8px 14px",
                                borderBottom: "1px solid var(--gv-border)",
                                fontSize: 12,
                                color: "var(--gv-text-heading)",
                                maxWidth: 200,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {scrap.defecto}
                            </td>
                            <td
                              style={{
                                padding: "8px 14px",
                                borderBottom: "1px solid var(--gv-border)",
                                fontSize: 11,
                                color: "var(--gv-text-muted)",
                              }}
                            >
                              {scrap.tecnologia}
                            </td>
                            <td
                              style={{
                                padding: "8px 14px",
                                borderBottom: "1px solid var(--gv-border)",
                                fontSize: 14,
                                fontWeight: 800,
                                color: "#ef4444",
                                textAlign: "center",
                              }}
                            >
                              {scrap.cantidad}
                            </td>
                            <td
                              style={{
                                padding: "8px 14px",
                                borderBottom: "1px solid var(--gv-border)",
                              }}
                            >
                              <select
                                value={scrap.validationQuality}
                                onChange={(e) =>
                                  updateValidation(
                                    scrap.id,
                                    "scrap",
                                    "validationQuality",
                                    e.target.value as ValidationStatus,
                                  )
                                }
                                style={{
                                  appearance: "none",
                                  padding: "5px 10px",
                                  borderRadius: 6,
                                  border: "1px solid var(--gv-border)",
                                  background:
                                    scrap.validationQuality === "validado"
                                      ? "rgba(16,185,129,0.08)"
                                      : scrap.validationQuality === "corregido"
                                        ? "rgba(59,130,246,0.08)"
                                        : "rgba(245,158,11,0.08)",
                                  color:
                                    scrap.validationQuality === "validado"
                                      ? "#10b981"
                                      : scrap.validationQuality === "corregido"
                                        ? "#3b82f6"
                                        : "#f59e0b",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  fontFamily: "inherit",
                                  cursor: "pointer",
                                }}
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="validado">Validado ✓</option>
                                <option value="corregido">Corregido</option>
                              </select>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Toast Notification */}
      <Toast
        message={toast?.message || ""}
        type={toast?.type || "info"}
        visible={!!toast?.visible}
        onClose={() => setToast(null)}
      />

      {/* ── Modals ── */}
      <AnimatePresence>
        {finishShiftModal?.visible && (
          <ShiftFinishModal
            key="finish-shift-modal"
            type={finishShiftModal.type}
            title={finishShiftModal.title}
            message={finishShiftModal.message}
            onConfirm={finishShiftModal.onConfirm}
            onClose={() => setFinishShiftModal(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deleteItemModal?.visible && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(4px)",
              zIndex: 9000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
            onClick={(e) => e.target === e.currentTarget && setDeleteItemModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 10 }}
              style={{
                width: "100%",
                maxWidth: 400,
                background: "var(--gv-surface)",
                border: "1px solid var(--gv-border)",
                borderRadius: 16,
                boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(239,68,68,0.1)",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Trash2 size={24} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--gv-text-heading)", marginBottom: 8 }}>
                {t("hourByHour.delete_confirm_title", "Confirmar Eliminación")}
              </h3>
              <p style={{ fontSize: 14, color: "var(--gv-text-muted)", marginBottom: 16, lineHeight: 1.5 }}>
                {t("hourByHour.delete_confirm_msg", "¿Estás seguro que deseas eliminar este registro?")}
                <br />
                <strong style={{ color: "var(--gv-text)" }}>
                  {deleteItemModal.type === "dt" && "[DT] "}
                  {deleteItemModal.type === "fault" && "[FAULT] "}
                  {deleteItemModal.type === "scrap" && "[SCRAP] "}
                  {deleteItemModal.description}
                </strong>
              </p>
              <div style={{ display: "flex", gap: 12, width: "100%" }}>
                <button
                  onClick={() => setDeleteItemModal(null)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 8,
                    border: "1px solid var(--gv-border)",
                    background: "transparent",
                    color: "var(--gv-text)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {t("hourByHour.cancel")}
                </button>
                <button
                  onClick={confirmDelete}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 8,
                    border: "none",
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {t("hourByHour.delete", "Eliminar")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {scrapModal !== null && (
          <ScrapRegistrationModal
            key="scrap-modal"
            hourNumber={records[scrapModal]?.hour ?? scrapModal + 1}
            activePlanSku={activePlan?.sku}
            onRegister={(payload) => registerScrap(scrapModal, payload)}
            onClose={() => setScrapModal(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editScrapModal !== null && (
          <ScrapRegistrationModal
            key="edit-scrap-modal"
            hourNumber={records[editScrapModal.index]?.hour ?? editScrapModal.index + 1}
            activePlanSku={activePlan?.sku}
            initialData={editScrapModal.item}
            onRegister={(payload) => {
              // Create full record by spreading existing and overwriting with new
              const updated = { ...editScrapModal.item, ...payload };
              setScrapByHour((prev) => {
                const next = { ...prev };
                next[editScrapModal.index] = next[editScrapModal.index].map(s => s.id === updated.id ? (updated as ScrapRecord) : s);
                const hrScrap = next[editScrapModal.index];
                const totalScrap = hrScrap.reduce((acc, s) => acc + s.cantidad, 0);
                setTimeout(() => updateRecord(editScrapModal.index, "scrap", String(totalScrap)), 0);
                return next;
              });
              
              // We simulate update by deleting and re-adding in local store
              useLocalShiftStore.getState().deleteScrap(editScrapModal.index, updated.id);
              useLocalShiftStore.getState().addScrap(editScrapModal.index, updated as ScrapRecord);
              setEditScrapModal(null);
            }}
            onClose={() => setEditScrapModal(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {dtModal !== null && (
          <DowntimeRegistrationModal
            key="dt-modal"
            hourNumber={records[dtModal]?.hour ?? dtModal + 1}
            onRegisterDT={(payload) => registerDowntime(dtModal, payload)}
            onRegisterFault={(payload) => registerFault(dtModal, payload)}
            onClose={() => setDtModal(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editDtModal !== null && (
          <DowntimeRegistrationModal
            key="edit-dt-modal"
            hourNumber={records[editDtModal.index]?.hour ?? editDtModal.index + 1}
            initialData={editDtModal.item}
            onRegisterDT={(payload) => {
              const updated = { ...editDtModal.item, ...payload };
              setDowntimeByHour((prev) => {
                const next = { ...prev };
                next[editDtModal.index] = next[editDtModal.index].map(dt => dt.id === updated.id ? (updated as DowntimeRecord) : dt);
                const totalDt = next[editDtModal.index].reduce((acc, dt) => acc + dt.durationMin, 0);
                const totalFaultsDt = (faultsByHour[editDtModal.index] || []).reduce((acc, f) => acc + f.downtimeMin, 0);
                setTimeout(() => updateRecord(editDtModal.index, "downtime", String(totalDt + totalFaultsDt), next[editDtModal.index]), 0);
                return next;
              });
              useLocalShiftStore.getState().deleteDowntime(editDtModal.index, updated.id);
              useLocalShiftStore.getState().addDowntime(editDtModal.index, updated as DowntimeRecord);
              setEditDtModal(null);
            }}
            onRegisterFault={(payload) => {
              const updated = { ...editDtModal.item, ...payload };
              setFaultsByHour((prev) => {
                const next = { ...prev };
                next[editDtModal.index] = next[editDtModal.index].map(f => f.id === updated.id ? (updated as FaultRecord) : f);
                const totalFaultsDt = next[editDtModal.index].reduce((acc, f) => acc + f.downtimeMin, 0);
                const totalDt = (downtimeByHour[editDtModal.index] || []).reduce((acc, dt) => acc + dt.durationMin, 0);
                setTimeout(() => updateRecord(editDtModal.index, "downtime", String(totalDt + totalFaultsDt)), 0);
                return next;
              });
              useLocalShiftStore.getState().deleteFault(editDtModal.index, updated.id);
              useLocalShiftStore.getState().addFault(editDtModal.index, updated as FaultRecord);
              setEditDtModal(null);
            }}
            onClose={() => setEditDtModal(null)}
          />
        )}
      </AnimatePresence>
      {/* ── RCA Drawer ── */}
      <FaultAnalysisDrawer
        open={!!analysisDrawer}
        fault={analysisDrawer}
        onClose={() => setAnalysisDrawer(null)}
        onSave={(updated) => {
          updateFault(updated);
          setAnalysisDrawer(null);
        }}
      />
    </>
  );
}
