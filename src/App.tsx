import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import GlobalFilterBar from './components/GlobalFilterBar';
import DashboardView from './components/DashboardView';
import HourByHourView from './components/HourByHourView';
import MaintenanceView from './components/MaintenanceView';
import QualityView from './components/QualityView';
import LogisticsView from './components/LogisticsView';
import PDCAView from './components/PDCAView';
import type { ViewId, FilterState, PlanRecord } from './types';
import { filterOptions } from './data/mockData';

const defaultPlanRecords: PlanRecord[] = [
  { id_plan: 'PLAN-TM-01', linea: 'HMP-1', turno: 'Matutino', sku: 'DASH-INNER-001', target_hr: 45 },
  { id_plan: 'PLAN-TV-01', linea: 'HMP-1', turno: 'Vespertino', sku: 'DASH-INNER-001', target_hr: 42 },
  { id_plan: 'PLAN-TN-01', linea: 'INJ-1', turno: 'Nocturno', sku: 'CONSOLE-004', target_hr: 38 },
];

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [darkMode, setDarkMode] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    location: filterOptions.locations[0],
    businessUnit: filterOptions.businessUnits[2],
    facility: filterOptions.facilities[3],
    process: filterOptions.processes[0],
  });

  // Shared state: Logistics planning → HourByHour target
  const [planRecords, setPlanRecords] = useState<PlanRecord[]>(defaultPlanRecords);

  // Derive target from first plan record (simulates feeding data)
  const planTarget = planRecords.length > 0 ? planRecords[0].target_hr : 60;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden' }}>
        <GlobalFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />
        <main style={{ flex: 1, overflow: 'auto' }}>
          <AnimatePresence mode="wait">
            {activeView === 'dashboard' && <DashboardView key="dashboard" filters={filters} />}
            {activeView === 'hourByHour' && <HourByHourView key="hourByHour" filters={filters} planTarget={planTarget} />}
            {activeView === 'maintenance' && <MaintenanceView key="maintenance" />}
            {activeView === 'quality' && <QualityView key="quality" />}
            {activeView === 'logistics' && <LogisticsView key="logistics" planRecords={planRecords} onUpdatePlanRecords={setPlanRecords} />}
            {activeView === 'pdca' && <PDCAView key="pdca" />}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
