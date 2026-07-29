import { memo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export interface HourlyAggregate {
  hour: number;
  target: number;
  actualOK: number;
  scrap: number;
  downtime: number;
  plannedDowntime: number;
  hasData: boolean;
  sku?: string;
  isPlannedStop?: boolean;
  kpis?: {
    oee: number;
    availability: number;
    performance: number;
    quality: number;
  };
}

interface Day24hTimelineProps {
  days: {
    date: string;
    fullDate: string;
    hours: HourlyAggregate[];
  }[];
}

export const Day24hTimeline = memo(function Day24hTimeline({ days = [] }: Day24hTimelineProps) {
  const { t } = useTranslation();
  const [hoveredCell, setHoveredCell] = useState<{ dayIdx: number; hourIdx: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setHoveredCell(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const getSegmentColor = (a: HourlyAggregate) => {
    if (a.isPlannedStop) return "#94a3b8";
    if (!a.hasData) return "var(--gv-surface-alt)"; 

    const plannedDT = a.plannedDowntime;
    const effectiveDowntime = Math.max(0, a.downtime - plannedDT);
    
    if (effectiveDowntime > 15 || a.scrap > (a.target * 0.05)) {
      return "#ef4444"; 
    }

    const adjustedTarget = plannedDT > 0 ? a.target * (Math.max(0, 60 - plannedDT) / 60) : a.target;

    if (a.actualOK >= adjustedTarget) return "#10b981"; 
    if (a.actualOK >= adjustedTarget * 0.8) return "#f59e0b"; 

    return "#ef4444"; 
  };

  const getKpiColor = (val: number) => {
    if (val >= 90) return "#10b981";
    if (val >= 75) return "#f59e0b";
    return "#ef4444";
  };

  if (!days || days.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-[var(--gv-text-muted)] italic text-lg">
        {t('dashboard.no_data_selected_range')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full" ref={containerRef}>
      
      {/* Header Row for Hours */}
      <div className="flex items-center gap-4 px-2">
        <div className="w-14" /> {/* Spacer for date label */}
        <div className="flex-1 flex gap-1">
          {Array.from({length: 24}).map((_, i) => (
            <div key={i} className="flex-1 text-center text-[10px] font-bold text-[var(--gv-text-muted)]">
              H{String(i).padStart(2, "0")}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {days.map((day, dIdx) => {
          const isRowHovered = hoveredCell?.dayIdx === dIdx;
          
          return (
          <div key={day.date} className="flex items-stretch gap-4 relative px-2" style={{ height: "48px", zIndex: isRowHovered ? 50 : 1 }}>
            
            {/* Date Label */}
            <div className="w-14 flex items-center justify-end text-sm font-bold text-[var(--gv-text-muted)] whitespace-nowrap">
              {day.date}
            </div>

            {/* 24-Hour Timeline Bar */}
            <div 
              className="flex-1 flex items-stretch gap-1 relative"
              style={{ perspective: 1000 }}
            >
              {day.hours.map((a, i) => {
                const color = getSegmentColor(a);
                const isHovered = hoveredCell?.dayIdx === dIdx && hoveredCell?.hourIdx === i;
                const isDimmed = hoveredCell !== null && !isHovered;
                const fulfillment = a.target > 0 ? (a.actualOK / a.target) * 100 : (a.actualOK > 0 ? 100 : 0);

                return (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredCell({ dayIdx: dIdx, hourIdx: i })}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => setHoveredCell(isHovered ? null : { dayIdx: dIdx, hourIdx: i })}
                    className="flex-1 relative group"
                    style={{
                      cursor: a.hasData ? "pointer" : "default",
                      opacity: isDimmed ? 0.4 : 1,
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    {/* Block Segment */}
                    <motion.div
                      layout
                      animate={{
                        scaleY: isHovered && a.hasData ? 1.15 : 1,
                        z: isHovered && a.hasData ? 10 : 0,
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      style={{
                        width: "100%",
                        height: "100%",
                        background: color,
                        borderRadius: 4,
                        boxShadow: isHovered && a.hasData && !a.isPlannedStop ? `0 8px 16px ${color}40` : "none",
                        transformOrigin: "center",
                        border: a.isPlannedStop ? "2px dashed #94a3b8" : "none",
                      }}
                    />

                    {/* Tooltip */}
                    <AnimatePresence>
                      {isHovered && a.hasData && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, x: "-50%", scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
                          exit={{ opacity: 0, y: 5, x: "-50%", scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: "50%",
                            marginTop: 12,
                            width: 260,
                            background: "var(--gv-bg)",
                            border: "1px solid var(--gv-border)",
                            borderRadius: 12,
                            padding: "16px",
                            zIndex: 50,
                            boxShadow: "0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)",
                            pointerEvents: "none",
                          }}
                        >
                          {/* Triangle pointer */}
                          <div
                            style={{
                              position: "absolute",
                              top: -6,
                              left: "50%",
                              transform: "translateX(-50%) rotate(45deg)",
                              width: 12,
                              height: 12,
                              background: "var(--gv-bg)",
                              borderLeft: "1px solid var(--gv-border)",
                              borderTop: "1px solid var(--gv-border)",
                            }}
                          />
                          
                          <div style={{ position: "relative", zIndex: 2 }}>
                            {/* Header: Hour & SKU */}
                            <div className="flex justify-between items-center mb-3 pb-2 border-b" style={{ borderColor: "var(--gv-border)" }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--gv-text-heading)", textTransform: "uppercase" }}>
                                HOUR {i}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gv-text-muted)", maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.sku}>
                                {a.sku}
                              </span>
                            </div>
                            
                            {a.isPlannedStop ? (
                              <div className="flex flex-col items-center justify-center py-6 text-center">
                                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--gv-text-heading)", textTransform: "uppercase" }}>{t('dashboard.planned_stop')}</div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gv-text-muted)", marginTop: 4 }}>{a.sku}</div>
                              </div>
                            ) : (
                              <>
                                {/* KPIs Grid */}
                                <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4">
                                  <div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gv-text-muted)", textTransform: "uppercase" }}>Efficiency</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: getKpiColor(a.kpis?.performance || 0) }}>{(a.kpis?.performance || 0).toFixed(1)}%</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gv-text-muted)", textTransform: "uppercase" }}>Availability</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: getKpiColor(a.kpis?.availability || 0) }}>{(a.kpis?.availability || 0).toFixed(1)}%</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gv-text-muted)", textTransform: "uppercase" }}>Quality</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: getKpiColor(a.kpis?.quality || 0) }}>{(a.kpis?.quality || 0).toFixed(1)}%</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gv-text-muted)", textTransform: "uppercase" }}>OEE</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: getKpiColor(a.kpis?.oee || 0) }}>{(a.kpis?.oee || 0).toFixed(1)}%</div>
                                  </div>
                                </div>

                                {/* Production Details */}
                                <div className="flex flex-col gap-2 pt-3 border-t border-dashed" style={{ borderColor: 'var(--gv-border)' }}>
                                  <div className="flex justify-between items-center">
                                    <span style={{ fontSize: 12, color: "var(--gv-text-muted)", fontWeight: 600 }}>Target:</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gv-text-heading)" }}>{Math.round(a.target)}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span style={{ fontSize: 12, color: "var(--gv-text-muted)", fontWeight: 600 }}>Actual:</span>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: a.actualOK >= a.target ? "#10b981" : "#f59e0b" }}>{a.actualOK} pcs</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span style={{ fontSize: 12, color: "var(--gv-text-muted)", fontWeight: 600 }}>Cumplimiento:</span>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: getKpiColor(fulfillment) }}>{fulfillment.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span style={{ fontSize: 12, color: "var(--gv-text-muted)", fontWeight: 600 }}>Scrap:</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: a.scrap > 0 ? "#ef4444" : "var(--gv-text-heading)" }}>{a.scrap} pcs</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span style={{ fontSize: 12, color: "var(--gv-text-muted)", fontWeight: 600 }}>Downtime:</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: a.downtime > 0 ? "#ef4444" : "var(--gv-text-heading)" }}>{a.downtime} min</span>
                                  </div>
                                </div>
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
        )})}
      </div>
    </div>
  );
});
