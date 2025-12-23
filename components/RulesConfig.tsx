import React from 'react';
import { Constraint, StoreConfig } from '../types';
import { ShieldAlert, UserX, Settings2, Clock, CalendarClock, Briefcase, Zap, Store, Utensils } from 'lucide-react';

interface RulesConfigProps {
  config: StoreConfig;
  setConfig: (c: StoreConfig) => void;
  constraints: Constraint[];
  setConstraints: (c: Constraint[]) => void;
}

export const RulesConfig: React.FC<RulesConfigProps> = ({ 
    config, setConfig,
    constraints, setConstraints
}) => {
  
  // Helpers
  const updateConfig = (key: keyof StoreConfig, value: any) => {
      setConfig({ ...config, [key]: value });
  };

  const noSoloRule = constraints.find(c => c.type === 'NO_SOLO');
  const toggleNoSolo = () => {
    if (noSoloRule) {
      const updated = constraints.map(c => c.type === 'NO_SOLO' ? { ...c, isActive: !c.isActive } : c);
      setConstraints(updated);
    } else {
      setConstraints([...constraints, { id: 'no-solo', type: 'NO_SOLO', isActive: true, minStaffCount: 2 }]);
    }
  };

  const updateMinStaff = (delta: number) => {
    if (noSoloRule) {
        const newVal = Math.max(1, (noSoloRule.minStaffCount || 2) + delta);
        setConstraints(constraints.map(c => c.type === 'NO_SOLO' ? { ...c, minStaffCount: newVal } : c));
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col gap-1">
         <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings2 className="w-8 h-8 text-indigo-500" />
            Store Configuration
         </h1>
         <p className="text-slate-400 text-lg">Define operating hours, labor standards, and compliance rules.</p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* COLUMN 1: STORE OPS & LABOR */}
          <div className="space-y-8">
              
              {/* Card 1: Operating Hours */}
              <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                          <Store className="w-5 h-5" />
                      </div>
                      <h2 className="text-lg font-bold text-slate-200">Operating Hours</h2>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Store Open</label>
                          <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <input 
                                type="time" 
                                value={config.openTime}
                                onChange={e => updateConfig('openTime', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 pl-10 text-center font-mono outline-none focus:border-indigo-500 transition-all"
                              />
                          </div>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Store Close</label>
                          <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <input 
                                type="time" 
                                value={config.closeTime}
                                onChange={e => updateConfig('closeTime', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 pl-10 text-center font-mono outline-none focus:border-indigo-500 transition-all"
                              />
                          </div>
                      </div>
                  </div>
              </section>

              {/* Card 2: Labor Compliance (Reflexis Parameters) */}
              <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
                          <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-200">Labor Standards</h2>
                        <p className="text-xs text-slate-500">Compliance rules for shifts and meal breaks.</p>
                      </div>
                  </div>

                  <div className="space-y-6">
                      {/* Budget */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/50">
                           <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Labor Budget</label>
                                <span className="text-emerald-400 text-xs font-mono font-bold">{config.budget} Hrs</span>
                           </div>
                           <input 
                              type="range" 
                              min="0" max="200" step="0.5"
                              value={config.budget}
                              onChange={e => updateConfig('budget', Number(e.target.value))}
                              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                           />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                           {/* Shift Lengths */}
                           <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 uppercase font-bold">Min Shift Length (Hrs)</label>
                                <input 
                                    type="number" 
                                    value={config.minShiftLength}
                                    onChange={e => updateConfig('minShiftLength', Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                                />
                           </div>
                           <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 uppercase font-bold">Max Shift Length (Hrs)</label>
                                <input 
                                    type="number" 
                                    value={config.maxShiftLength}
                                    onChange={e => updateConfig('maxShiftLength', Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                                />
                           </div>

                           {/* Lunch Logic */}
                           <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                                   <Utensils className="w-3 h-3 text-rose-400" /> Lunch Threshold (Hrs)
                                </label>
                                <input 
                                    type="number" 
                                    value={config.lunchThreshold}
                                    onChange={e => updateConfig('lunchThreshold', Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                                />
                                <p className="text-[10px] text-slate-600">Lunch mandatory if shift exceeds this.</p>
                           </div>
                           <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 uppercase font-bold">Lunch Duration (Mins)</label>
                                <select 
                                    value={config.lunchDuration}
                                    onChange={e => updateConfig('lunchDuration', Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                                >
                                    <option value={30}>30 Minutes</option>
                                    <option value={45}>45 Minutes</option>
                                    <option value={60}>1 Hour</option>
                                </select>
                           </div>
                      </div>
                  </div>
              </section>
          </div>

          {/* COLUMN 2: OPTIMIZATION & INFO */}
          <div className="space-y-8">
              
              {/* Card 3: Coverage Rules */}
              <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                    <ShieldAlert className="w-32 h-32 text-indigo-500" />
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-200">Coverage Optimization</h2>
                            <p className="text-xs text-slate-500">AI rules for minimum staffing levels.</p>
                        </div>
                    </div>

                    <div className="bg-slate-950/80 rounded-xl p-5 border border-slate-800">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${noSoloRule?.isActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-600'}`}>
                                    <UserX className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-200">No Solo Coverage</h3>
                                    <p className="text-xs text-slate-500">Ensure minimum headcount (lunch aware).</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={toggleNoSolo}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${noSoloRule?.isActive ? 'bg-indigo-600' : 'bg-slate-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${noSoloRule?.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                         </div>

                         {noSoloRule?.isActive && (
                            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-400">Minimum Staff Count</span>
                                <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1 border border-slate-700">
                                    <button onClick={() => updateMinStaff(-1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded text-slate-400 hover:text-white">-</button>
                                    <span className="w-8 text-center font-mono font-bold text-white">{noSoloRule.minStaffCount || 2}</span>
                                    <button onClick={() => updateMinStaff(1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded text-slate-400 hover:text-white">+</button>
                                </div>
                            </div>
                         )}
                    </div>
                </div>
              </section>
              
              {/* Card 4: Global Availability View */}
              <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg h-full max-h-[400px] flex flex-col">
                  <div className="flex items-center gap-3 mb-6 shrink-0">
                      <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                          <CalendarClock className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-200">Exception Master List</h2>
                        <p className="text-xs text-slate-500">Read-only view of all active constraints.</p>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/50 rounded-xl p-2 border border-slate-800 space-y-2">
                      {constraints.filter(c => c.type === 'UNAVAILABLE').length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-60">
                              <CalendarClock className="w-8 h-8 mb-2" />
                              <span className="text-xs">No active exceptions</span>
                          </div>
                      ) : (
                          constraints.filter(c => c.type === 'UNAVAILABLE').map(c => (
                              <div key={c.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center">
                                  <div>
                                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">
                                          {/* We don't have employee name here easily without lookup, but we can pass generic */}
                                          Staff ID: {c.employeeId?.substr(0,4)}...
                                      </div>
                                      <div className="text-sm font-mono text-amber-400">{c.startTime} - {c.endTime}</div>
                                  </div>
                                  <div className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">
                                      {c.reason || 'N/A'}
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-4 text-center">
                      To manage individual availability, use the <span className="text-indigo-400 font-bold">Staff Manager</span>.
                  </p>
              </section>

          </div>
      </div>
    </div>
  );
};