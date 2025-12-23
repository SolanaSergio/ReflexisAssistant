import React, { useState } from 'react';
import { HashRouter, Routes, Route, Outlet, useOutletContext, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { RulesConfig } from './components/RulesConfig';
import { StaffManager } from './components/StaffManager';
import { INITIAL_EMPLOYEES } from './constants';
import { ScheduleResult, SolverParams, Employee, Constraint, StoreConfig } from './types';
import { analyzeSchedule } from './services/scheduler';
import { Menu, Sparkles } from 'lucide-react';

// --- Types for Outlet Context ---
interface AppContextType {
  schedule: ScheduleResult | null;
  storeConfig: StoreConfig;
  setStoreConfig: React.Dispatch<React.SetStateAction<StoreConfig>>;
  constraints: Constraint[];
  setConstraints: React.Dispatch<React.SetStateAction<Constraint[]>>;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  onSolve: (text: string) => void;
}

// --- Layout Component ---
const MainLayout = () => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<ScheduleResult | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Centralized Store Config
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
      budget: 35,
      openTime: "07:15",
      closeTime: "21:15",
      minShiftLength: 4,
      maxShiftLength: 10,
      lunchThreshold: 5, // Shifts > 5 hours need a lunch
      lunchDuration: 30
  });

  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [constraints, setConstraints] = useState<Constraint[]>([
      { id: 'default-no-solo', type: 'NO_SOLO', isActive: true, minStaffCount: 2 }
  ]);

  const handleSolve = (inputScheduleText: string) => {
    try {
      const params: SolverParams = {
          inputScheduleText,
          config: storeConfig,
          employees, 
          constraints
      };
      // Use the new Analysis Engine
      const result = analyzeSchedule(params);
      setSchedule(result);
    } catch (e) {
      console.error("Solver error:", e);
    }
  };

  const contextValue: AppContextType = {
    schedule, 
    storeConfig, setStoreConfig,
    constraints, setConstraints,
    employees, setEmployees,
    onSolve: handleSolve,
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-indigo-500/30">
        {/* Mobile Header */}
        <div className="md:hidden bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-40">
            <h1 className="font-bold text-lg text-slate-100 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-4 h-4 fill-white" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">ZWS Solver</span>
            </h1>
            <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors active:scale-95 text-slate-400 hover:text-white"
            >
            <Menu className="w-6 h-6" />
            </button>
        </div>

        <Sidebar 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-4 md:p-8 gap-6 overflow-y-auto w-full max-w-[100vw] relative scroll-smooth">
             <div className="fixed top-0 left-0 right-0 h-96 bg-indigo-900/10 blur-[100px] -z-10 pointer-events-none" />
             <Outlet context={contextValue} />
        </div>
    </div>
  );
};

// --- Page Wrapper Components ---

const SettingsPageWrapper = () => {
    const { 
        storeConfig, setStoreConfig,
        constraints, setConstraints
    } = useOutletContext<AppContextType>();
    
    return (
        <RulesConfig 
            config={storeConfig} 
            setConfig={setStoreConfig}
            constraints={constraints} 
            setConstraints={setConstraints} 
        />
    );
}

const StaffPageWrapper = () => {
    const { employees, setEmployees, constraints, setConstraints } = useOutletContext<AppContextType>();
    return (
        <StaffManager 
            employees={employees} 
            setEmployees={setEmployees}
            constraints={constraints}
            setConstraints={setConstraints} 
        />
    );
}

// --- App Root ---

function App() {
  return (
    <HashRouter>
       <Routes>
          <Route path="/" element={<MainLayout />}>
             <Route index element={<Dashboard />} />
             <Route path="staff" element={<StaffPageWrapper />} />
             <Route path="settings" element={<SettingsPageWrapper />} />
             <Route path="rules" element={<SettingsPageWrapper />} />
          </Route>
       </Routes>
    </HashRouter>
  );
}

export default App;