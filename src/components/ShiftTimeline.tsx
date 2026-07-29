import { memo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ClipboardList,
  Wrench,
  Layers,
  Info
} from "lucide-react";
import type { HourRecord, FaultRecord, ScrapRecord } from "../types";

interface ShiftTimelineProps {
  records: HourRecord[];
  planTarget: number;
  totals: {
    actualOK: number;
    scrap: number;
    downtime: number;
  };
  efficiency: string;
  scrapRate: string;
  allFaults: FaultRecord[];
  allScrap: ScrapRecord[];
  shiftStatus: "active" | "finished";
  activeHourIndex?: number | null;
  onHourActive?: (index: number | null) => void;
}

const ShiftTimeline = memo(function ShiftTimeline({
  records,
  planTarget,
  totals,
  efficiency,
  scrapRate,
  allFaults,
  allScrap,
  shiftStatus,
  activeHourIndex,
  onHourActive,
}: ShiftTimelineProps) {
  const { t } = useTranslation();
  const [localHovered, setLocalHovered] = useState<number | null>(null);
  const hoveredHour = activeHourIndex !== undefined ? activeHourIndex : localHovered;
  
  const setHoveredHour = (val: number | null) => {
    setLocalHovered(val);
    if (onHourActive) onHourActive(val);
  };

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setHoveredHour(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const hasAnyData = records.some(r => r.actualOK > 0 || r.scrap > 0 || r.downtime > 0 || (r.comments && r.comments.trim() !== ""));

  const totalMinutes = records.length * 60;
  
  const totalPlannedDT = records.reduce((sum, r) => sum + (r.plannedDowntime || 0), 0);
  const totalPlannedMinutes = Math.max(0, totalMinutes - totalPlannedDT);
  const totalUnplannedDT = Math.max(0, totals.downtime - totalPlannedDT);
  
  const availabilityVal = totalPlannedMinutes > 0 ? Math.max(0, ((totalPlannedMinutes - totalUnplannedDT) / totalPlannedMinutes) * 100) : 100;
  
  const totalPieces = totals.actualOK + totals.scrap;
  const qualityVal = totalPieces > 0 ? ((totals.actualOK / totalPieces) * 100) : 100;
  
  const performanceVal = parseFloat(efficiency) || 0; 
  
  const oeeVal = (availabilityVal / 100) * (performanceVal / 100) * (qualityVal / 100) * 100;

  // Define KPI items for the compact header
  const kpiItems = [
    {
      label: t("hourByHour.efficiency", "EFICIENCIA"),
      value: hasAnyData ? `${performanceVal.toFixed(1)}%` : t("hourByHour.no_data_short", "N/D"),
      icon: <ClipboardList size={16} />,
      color: !hasAnyData ? "#9ca3af" : performanceVal >= 85 ? "#10b981" : performanceVal >= 75 ? "#f59e0b" : "#ef4444",
    },
    {
      label: t("hourByHour.availability", "DISPONIBILIDAD"),
      value: hasAnyData ? `${availabilityVal.toFixed(1)}%` : t("hourByHour.no_data_short", "N/D"),
      icon: <Clock size={16} />,
      color: !hasAnyData ? "#9ca3af" : availabilityVal >= 90 ? "#10b981" : availabilityVal >= 80 ? "#f59e0b" : "#ef4444",
    },
    {
      label: t("hourByHour.quality", "CALIDAD"),
      value: hasAnyData ? `${qualityVal.toFixed(1)}%` : t("hourByHour.no_data_short", "N/D"),
      icon: <CheckCircle2 size={16} />,
      color: !hasAnyData ? "#9ca3af" : qualityVal >= 95 ? "#10b981" : qualityVal >= 90 ? "#f59e0b" : "#ef4444",
    },
    {
      label: t("hourByHour.oee", "OEE"),
      value: hasAnyData ? `${oeeVal.toFixed(1)}%` : t("hourByHour.no_data_short", "N/D"),
      icon: <Layers size={16} />,
      color: !hasAnyData ? "#9ca3af" : oeeVal >= 85 ? "#10b981" : oeeVal >= 70 ? "#f59e0b" : "#ef4444",
    },
  ];

  // Logic to determine the color of a specific hour segment
  const getSegmentColor = (r: HourRecord) => {
    // If not registered yet
    if (r.actualOK === 0 && r.scrap === 0 && r.downtime === 0 && (!r.comments || r.comments.trim() === "")) {
      return "var(--gv-surface-alt)"; // Gray base
    }

    // Is it a planned stop?
    const plannedDT = r.plannedDowntime || 0;
    
    // High downtime (excluding planned) or high scrap -> Red
    const effectiveDowntime = Math.max(0, r.downtime - plannedDT);
    if (effectiveDowntime > 15 || r.scrap > 5) {
      return "#ef4444"; // Red
    }

    // Adjust target if there's a planned stop
    const adjustedTarget = plannedDT > 0 ? planTarget * (Math.max(0, 60 - plannedDT) / 60) : planTarget;

    // Good performance
    if (r.actualOK >= adjustedTarget) {
      return "#10b981"; // Green
    }

    // Medium performance
    if (r.actualOK >= adjustedTarget * 0.8) {
      return "#f59e0b"; // Yellow/Orange
    }

    return "#ef4444"; 
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* ── Compact KPIs Header ── */}
      <div 
        className="flex flex-wrap items-center gap-4 w-full justify-evenly"
        style={{ padding: "14px 16px", marginBottom: "8px" }}
      >
        <div className="flex flex-wrap flex-1 justify-between" style={{ gap: "16px", width: "100%" }}>
          {kpiItems.map((item, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: `${item.color}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: item.color,
                  flexShrink: 0,
                }}
              >
                {/* Icon sizes slightly scaled up indirectly through padding, or keep original */}
                {item.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    color: "var(--gv-text-muted)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: "var(--gv-text-heading)",
                    lineHeight: 1.2,
                  }}
                >
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Timeline Bar ── */}
      <div className="relative w-full z-40" ref={containerRef}>
        {/* Background Dividers */}
        <div className="absolute top-0 bottom-0 left-0 right-0 flex pointer-events-none z-0" style={{ padding: "0 3px" }}>
          {records.map((_, i) => (
            <div 
              key={`divider-${i}`} 
              className="flex-1"
              style={{
                borderRight: i !== records.length - 1 ? "1px dashed var(--gv-border-hover)" : "none",
                opacity: 0.6
              }}
            />
          ))}
        </div>

        {/* Hours labels row */}
        <div className="flex w-full mb-2 px-1 relative z-10">
          {records.map((r, i) => (
            <div key={`label-${i}`} className="flex-1 text-center">
              <span style={{ fontSize: 16, fontWeight: 800, color: "var(--gv-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                H{i + 1}
              </span>
            </div>
          ))}
        </div>

        {/* The segmented bar */}
        <div 
          className="flex w-full h-12 bg-[var(--gv-surface-alt)] shadow-inner border border-[var(--gv-border)] p-[3px] relative z-10"
          style={{ borderRadius: "var(--gv-radius)", gap: 3 }}
        >
          {records.map((r, i) => {
            const color = getSegmentColor(r);
            const isUnregistered = r.actualOK === 0 && r.scrap === 0 && r.downtime === 0 && (!r.comments || r.comments.trim() === "");
            
            const plannedDT = r.plannedDowntime || 0;
            const plannedProdTime = Math.max(0, 60 - plannedDT);
            const unplannedDT = Math.max(0, r.downtime - plannedDT);
            
            const hourAvail = plannedProdTime > 0 
                ? Math.max(0, ((plannedProdTime - unplannedDT) / plannedProdTime) * 100)
                : 100;

            const hourTotalPieces = r.actualOK + r.scrap;
            const hourQuality = hourTotalPieces > 0 ? (r.actualOK / hourTotalPieces) * 100 : 100;
            const adjustedTarget = plannedDT > 0 ? planTarget * (plannedProdTime / 60) : planTarget;
            const hourPerf = adjustedTarget > 0 ? Math.min(100, (r.actualOK / adjustedTarget) * 100) : 100;
            const hourOEE = (hourAvail / 100) * (hourPerf / 100) * (hourQuality / 100) * 100;
            
            const isFirst = i === 0;
            const isLast = i === records.length - 1;
            const motionX = isFirst ? "0%" : isLast ? "-100%" : "-50%";
            const tooltipLeft = isFirst ? "0%" : isLast ? "100%" : "50%";
            const arrowLeft = isFirst ? "15%" : isLast ? "calc(85% - 8px)" : "calc(50% - 8px)";

            return (
              <div
                key={`segment-${i}`}
                className="relative flex-1 h-full"
                style={{
                  cursor: "pointer",
                  borderRadius: "var(--gv-radius-sm)",
                  zIndex: hoveredHour === i ? 20 : 1,
                }}
                onMouseEnter={() => setHoveredHour(i)}
                onMouseLeave={() => setHoveredHour(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setHoveredHour(hoveredHour === i ? null : i);
                }}
              >
                {/* Background layer to decouple opacity from tooltip */}
                <div 
                  className="absolute inset-0 transition-all duration-300 pointer-events-none"
                  style={{
                    backgroundColor: color,
                    opacity: isUnregistered && hoveredHour !== i ? 0.6 : 1,
                    borderRadius: "var(--gv-radius-sm)",
                    transform: hoveredHour === i ? "scaleY(1.15) scaleX(1.02)" : "scale(1)",
                    boxShadow: hoveredHour === i ? `0 4px 8px ${color}4d` : "none",
                  }}
                />
                
                {/* Tooltip positioned inside the hovered segment to guarantee perfect centering */}
                <AnimatePresence>
                  {hoveredHour === i && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, x: motionX, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, x: motionX, scale: 1 }}
                        exit={{ opacity: 0, y: 10, x: motionX, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 rounded-xl border border-[var(--gv-border)] bg-[var(--gv-surface)] backdrop-blur-md pointer-events-none"
                        style={{
                          top: "100%",
                          marginTop: "14px",
                          left: tooltipLeft,
                          width: 260,
                          padding: "20px 24px",
                          boxShadow: "var(--gv-shadow-lg)"
                        }}
                      >
                        {/* Tooltip arrow */}
                        <div 
                          className="absolute w-4 h-4 bg-[var(--gv-surface)] border-l border-t border-[var(--gv-border)] transform rotate-45"
                          style={{ top: "-9px", left: arrowLeft }}
                        />
                        
                        <div className="relative z-10 flex flex-col gap-3">
                          <div className="flex justify-between items-center border-b border-[var(--gv-border)] pb-2 mb-1">
                            <span className="text-sm font-bold text-[var(--gv-text-heading)] uppercase">
                              {t("hourByHour.hour", "Hora")} {i + 1}
                            </span>
                          </div>
                        
                          {isUnregistered ? (
                            <div className="py-4 text-center">
                              <span className="text-sm font-medium text-[var(--gv-text-muted)] italic">
                                {t("hourByHour.no_data_message", "Aún no hay registros en esta hora.")}
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-1">
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-[var(--gv-text-muted)] uppercase">{t("hourByHour.efficiency", "Eficiencia")}</span>
                                  <span className={`text-sm font-bold ${hourPerf >= 85 ? "text-[#10b981]" : "text-[#f59e0b]"}`}>{hourPerf.toFixed(1)}%</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-[var(--gv-text-muted)] uppercase">{t("hourByHour.availability", "Disponibilidad")}</span>
                                  <span className={`text-sm font-bold ${hourAvail >= 90 ? "text-[#10b981]" : "text-[#f59e0b]"}`}>{hourAvail.toFixed(1)}%</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-[var(--gv-text-muted)] uppercase">{t("hourByHour.quality", "Calidad")}</span>
                                  <span className={`text-sm font-bold ${hourQuality >= 95 ? "text-[#10b981]" : "text-[#f59e0b]"}`}>{hourQuality.toFixed(1)}%</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-[var(--gv-text-muted)] uppercase">{t("hourByHour.oee", "OEE")}</span>
                                  <span className={`text-sm font-bold ${hourOEE >= 85 ? "text-[#10b981]" : "text-[#f59e0b]"}`}>{hourOEE.toFixed(1)}%</span>
                                </div>
                              </div>

                              <div className="border-t border-[var(--gv-border)] pt-2" />

                              <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-[var(--gv-text-muted)]">{t("hourByHour.actual", "Actual")}:</span>
                                <span className={`text-sm font-bold ${r.actualOK >= planTarget ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                                  {r.actualOK} {t("hourByHour.pcs", "pzs")}
                                </span>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-[var(--gv-text-muted)]">{t("hourByHour.scrap", "Scrap")}:</span>
                                <span className={`text-sm font-bold ${r.scrap > 0 ? "text-[#ef4444]" : "text-[#10b981]"}`}>
                                  {r.scrap}
                                </span>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-[var(--gv-text-muted)]">{t("hourByHour.downtime", "Downtime")}:</span>
                                <span className={`text-sm font-bold ${r.downtime > 0 ? "text-[#f59e0b]" : "text-[#10b981]"}`}>
                                  {r.downtime} min
                                </span>
                              </div>

                              {r.comments && (
                                <div className="mt-2 pt-2 border-t border-[var(--gv-border)]">
                                  <span className="text-xs text-[var(--gv-text-muted)] block line-clamp-3 italic">
                                    "{r.comments}"
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default ShiftTimeline;
