import React from 'react';
import { ScheduleResult, EmployeeRole } from '../types';
import { format } from 'date-fns';
import { Copy, Check, Terminal, FileCode } from 'lucide-react';

interface ReflexisExportProps {
  schedule: ScheduleResult | null;
}

export const ReflexisExport: React.FC<ReflexisExportProps> = ({ schedule }) => {
  const [copied, setCopied] = React.useState(false);

  if (!schedule) return null;

  const generateText = () => {
    return schedule.shifts.map(s => {
       const rolePrefix = s.role === EmployeeRole.MANAGER ? '[MGR]' : '[STAFF]';
       const timeStr = `${format(s.startTime, 'HH:mm')} - ${format(s.endTime, 'HH:mm')}`;
       const lunchStr = s.lunchStart ? `(Lunch: ${format(s.lunchStart, 'HH:mm')})` : '(No Lunch)';
       return `${rolePrefix} ${s.employeeName}: ${timeStr} ${lunchStr}`;
    }).join('\n');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm text-slate-200 rounded-2xl shadow-lg flex flex-col h-full overflow-hidden border border-slate-800/60">
       {/* Header */}
       <div className="p-4 md:p-5 flex justify-between items-center bg-slate-900/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <FileCode className="w-5 h-5 text-indigo-400" />
             </div>
             <div>
               <h3 className="text-sm font-bold text-slate-100">Export Data</h3>
               <p className="text-[10px] text-slate-500">Formatted for Reflexis input</p>
             </div>
          </div>
          <button 
             onClick={handleCopy}
             className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border
                ${copied ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'}`}
          >
             {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
             {copied ? 'COPIED' : 'COPY'}
          </button>
       </div>

       {/* Code Block Content */}
       <div className="p-4 md:p-5 overflow-y-auto flex-1 font-mono text-xs md:text-sm bg-slate-950/50 custom-scrollbar shadow-inner">
          {schedule.shifts.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2 opacity-50">
                <Terminal className="w-8 h-8" />
                <span>No schedule generated</span>
             </div>
          ) : (
             <div className="space-y-3">
                {schedule.shifts.map((s, i) => (
                   <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 pb-2 border-b border-slate-800/50 last:border-0 hover:bg-white/5 p-1 rounded transition-colors">
                      <div className="flex items-center gap-2 w-36 shrink-0">
                         <span className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${s.role === EmployeeRole.MANAGER ? 'bg-indigo-400 shadow-indigo-500/50' : 'bg-rose-400 shadow-rose-500/50'}`} />
                         <span className="text-slate-300 font-semibold truncate">{s.employeeName}</span>
                      </div>
                      <div className="flex items-center justify-between flex-1 pl-4 sm:pl-0">
                         <span className="text-indigo-200 font-medium tracking-wide">
                            {format(s.startTime, 'HH:mm')} - {format(s.endTime, 'HH:mm')}
                         </span>
                         <span className="text-slate-500 text-[10px] uppercase font-bold">
                            {s.lunchStart ? 'Lunch' : 'No Meal'}
                         </span>
                      </div>
                   </div>
                ))}
             </div>
          )}
       </div>
    </div>
  );
};