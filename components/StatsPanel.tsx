import React from 'react';
import { ScheduleResult } from '../types';

interface StatsPanelProps {
   schedule: ScheduleResult | null;
   budget: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ schedule, budget }) => {
  const used = schedule?.totalHoursUsed || 0;
  const percentage = Math.min(100, (used / budget) * 100);
  const isOver = used > budget;

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-800/60 p-6 h-full flex flex-col justify-center">
       <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Hours Used</h3>
            <div className="flex items-baseline gap-2">
               <span className={`text-3xl font-bold tracking-tight ${isOver ? 'text-rose-400' : 'text-slate-100'}`}>
                  {used.toFixed(1)}
               </span>
               <span className="text-sm text-slate-500 font-medium">/ {budget} hrs</span>
            </div>
          </div>
          <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${isOver ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
             {percentage.toFixed(0)}%
          </div>
       </div>

       {/* Linear Progress Bar */}
       <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner">
          <div 
             className={`h-full rounded-full transition-all duration-700 ease-out shadow-lg ${isOver ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 'bg-gradient-to-r from-indigo-600 to-indigo-400'}`}
             style={{ width: `${percentage}%` }}
          />
       </div>

       {isOver && (
         <p className="text-xs text-rose-400 font-medium mt-3 text-right flex justify-end gap-1">
            <span>⚠</span> Over budget by {(used - budget).toFixed(1)}h
         </p>
       )}
    </div>
  );
};