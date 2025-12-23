import React from 'react';
import { ScheduleResult, EmployeeRole } from '../types';
import { differenceInMinutes, format, startOfDay, addMinutes, parse } from 'date-fns';
import { AlertTriangle, Clock, Calendar } from 'lucide-react';

interface ScheduleVisualizerProps {
  schedule: ScheduleResult | null;
  openTime: string;
  closeTime: string;
}

export const ScheduleVisualizer: React.FC<ScheduleVisualizerProps> = ({ schedule, openTime, closeTime }) => {
  if (!schedule) {
    return (
      <div className="w-full h-64 md:h-96 flex flex-col items-center justify-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-500 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Clock className="w-12 h-12 mb-4 opacity-20 text-indigo-400" />
        <p className="text-sm font-medium relative z-10">Waiting for input...</p>
      </div>
    );
  }

  const today = startOfDay(new Date());
  const start = parse(openTime, 'HH:mm', today);
  const end = parse(closeTime, 'HH:mm', today);
  const totalMinutes = differenceInMinutes(end, start);

  const getLeftPercent = (time: Date) => {
    const minutesFromStart = differenceInMinutes(time, start);
    return Math.max(0, Math.min(100, (minutesFromStart / totalMinutes) * 100));
  };
  
  const getWidthPercent = (durationMin: number) => {
    return (durationMin / totalMinutes) * 100;
  };

  const employeeRows = Array.from(new Set(schedule.shifts.map(s => s.employeeId))).map(id => {
    const empShifts = schedule.shifts.filter(s => s.employeeId === id);
    return {
      id,
      name: empShifts[0].employeeName,
      role: empShifts[0].role,
      shifts: empShifts
    };
  });

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-800/60 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
        <h2 className="font-bold text-slate-200 text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Timeline
        </h2>
        {schedule.errors.length > 0 && (
          <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full text-xs font-medium border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" />
            <span>{schedule.errors.length} Issue{schedule.errors.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Errors Expanded */}
      {schedule.errors.length > 0 && (
        <div className="bg-rose-950/30 px-5 py-3 text-xs text-rose-300 border-b border-rose-900/30 space-y-1">
          {schedule.errors.map((e, i) => <div key={i}>• {e}</div>)}
        </div>
      )}

      {/* Main Scrollable Timeline */}
      <div className="overflow-x-auto relative min-h-[250px] md:min-h-0 custom-scrollbar">
        <div className="min-w-[700px] md:min-w-full pb-6">
          
          {/* Time Ruler */}
          <div className="flex h-12 border-b border-slate-800/50 text-[10px] text-slate-500 font-mono select-none pl-16">
            <div className="relative w-full h-full">
              {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                <div key={pct} className="absolute bottom-3 transform -translate-x-1/2 flex flex-col items-center gap-1" style={{ left: `${pct * 100}%` }}>
                  <div className="h-1.5 w-px bg-slate-700"></div>
                  {format(addMinutes(start, totalMinutes * pct), 'HH:mm')}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="py-2 space-y-1">
            {employeeRows.map(row => (
              <div key={row.id} className="relative h-14 flex items-center group hover:bg-slate-800/30 transition-colors">
                
                {/* Sticky Avatar/Name */}
                <div className="sticky left-0 w-16 md:w-40 bg-slate-900 group-hover:bg-slate-800/30 z-20 h-full flex items-center justify-center md:justify-start md:pl-6 border-r border-slate-800 shrink-0 transition-colors shadow-[4px_0_10px_-4px_rgba(0,0,0,0.5)]">
                   <div className="md:hidden w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 border border-slate-700">
                      {row.name.charAt(0)}
                   </div>
                   <div className="hidden md:block">
                      <div className="text-sm font-semibold text-slate-200 truncate w-32">{row.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-medium tracking-wide">{row.role.split(' ')[0]}</div>
                   </div>
                </div>

                {/* Track */}
                <div className="relative flex-1 h-10 mx-4 bg-slate-800/30 rounded-lg border border-slate-800/50">
                   {/* Background Grid */}
                   {[0.25, 0.5, 0.75].map(pct => (
                      <div key={pct} className="absolute top-0 bottom-0 w-px bg-slate-700/20" style={{ left: `${pct * 100}%` }} />
                   ))}

                   {/* Shifts */}
                   {row.shifts.map(shift => {
                      const left = getLeftPercent(shift.startTime);
                      const width = getWidthPercent(differenceInMinutes(shift.endTime, shift.startTime));
                      const isMgr = shift.role === EmployeeRole.MANAGER;
                      
                      return (
                         <div 
                            key={shift.id}
                            className={`absolute h-full rounded-md shadow-lg border-t border-white/10 flex items-center justify-center overflow-hidden transition-transform hover:scale-[1.02] z-10
                                       ${isMgr 
                                          ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-indigo-500/20' 
                                          : 'bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-rose-500/20'}`}
                            style={{ left: `${left}%`, width: `${width}%` }}
                         >
                            {/* Lunch indicator */}
                            {shift.lunchStart && (
                               <div 
                                  className="absolute h-full w-[6px] bg-black/40 backdrop-blur-md flex items-center justify-center"
                                  style={{ left: `${(differenceInMinutes(shift.lunchStart, shift.startTime) / differenceInMinutes(shift.endTime, shift.startTime)) * 100}%` }}
                                  title={`Lunch: ${format(shift.lunchStart, 'HH:mm')}`}
                               />
                            )}
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] md:text-xs font-bold truncate px-1 drop-shadow-md">
                                {format(shift.startTime, 'HH:mm')} - {format(shift.endTime, 'HH:mm')}
                                </span>
                            </div>
                         </div>
                      );
                   })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Coverage Bar */}
      <div className="h-1.5 w-full flex bg-slate-950">
         {schedule.coverageMap.map((slot, idx) => {
            const isRisk = slot.count < 2;
            const bg = isRisk ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] z-10' : (slot.hasManager ? 'bg-emerald-500/60' : 'bg-amber-400/60');
            return <div key={idx} className={`flex-1 ${bg}`} />
         })}
      </div>
    </div>
  );
};