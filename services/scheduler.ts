import { addMinutes, differenceInMinutes, format, parse, isBefore, isAfter, isEqual, startOfDay, min as dateMin, max as dateMax, getDay } from 'date-fns';
import { Employee, EmployeeRole, ScheduleResult, Shift, SolverParams, Constraint, StoreConfig } from '../types';

// Helper to parse "HH:mm" to a Date object on the current day
const parseTime = (timeStr: string): Date => {
  const today = startOfDay(new Date());
  return parse(timeStr, 'HH:mm', today);
};

// Round to nearest 15 min
const roundTo15 = (date: Date): Date => {
  const minutes = date.getMinutes();
  const remainder = minutes % 15;
  if (remainder === 0) return date;
  return addMinutes(date, remainder < 8 ? -remainder : 15 - remainder);
};

const isTimeBlocked = (time: Date, employeeId: string, constraints: Constraint[]): boolean => {
  const currentDay = getDay(time); // 0-6

  const employeeConstraints = constraints.filter(c => 
    c.type === 'UNAVAILABLE' && 
    c.isActive && 
    c.employeeId === employeeId && 
    c.startTime && 
    c.endTime
  );

  return employeeConstraints.some(c => {
    // If daysOfWeek is defined and not empty, check if current day is included
    if (c.daysOfWeek && c.daysOfWeek.length > 0 && !c.daysOfWeek.includes(currentDay)) {
        return false;
    }

    const start = parseTime(c.startTime!);
    const end = parseTime(c.endTime!);
    // Check if 'time' falls within [start, end)
    return (isAfter(time, start) || isEqual(time, start)) && isBefore(time, end);
  });
};

// --- PARSER ---
const parseScheduleText = (text: string, employees: Employee[]): Shift[] => {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const shifts: Shift[] = [];
  const today = startOfDay(new Date());

  lines.forEach(line => {
    // Regex to match: "Name: 09:00 - 17:00" or "[Role] Name: 09:00 - 17:00"
    const match = line.match(/(?:\[.*?\]\s*)?([A-Za-z\s]+?):\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    
    if (match) {
      const name = match[1].trim();
      const startStr = match[2];
      const endStr = match[3];

      const emp = employees.find(e => e.name.toLowerCase() === name.toLowerCase());
      
      // Basic temporary creation to get start/end times
      if (emp) {
        const startTime = parse(startStr, 'HH:mm', today);
        const endTime = parse(endStr, 'HH:mm', today);
        
        // We will finalize shift details (breaks/lunch etc) in the optimizer step using config
        shifts.push({
            id: Math.random().toString(36).substr(2, 9),
            employeeId: emp.id,
            employeeName: emp.name,
            role: emp.role,
            startTime,
            endTime,
            lunchDuration: 0,
            paidHours: 0,
            rawDuration: 0
        });
      }
    }
  });

  return shifts;
};

// --- OPTIMIZER / ALIGNER ---
export const analyzeSchedule = (params: SolverParams): ScheduleResult => {
  const { inputScheduleText, config, employees, constraints } = params;
  
  const openDate = parseTime(config.openTime);
  const closeDate = parseTime(config.closeTime);
  const totalDurationMin = differenceInMinutes(closeDate, openDate);
  const intervals = Math.ceil(totalDurationMin / 15);

  const errors: string[] = [];

  // 1. PARSE
  let shifts = parseScheduleText(inputScheduleText, employees);
  
  if (shifts.length === 0 && inputScheduleText.trim().length > 0) {
      errors.push("Could not parse any shifts from input. Use format 'Name: HH:mm - HH:mm'");
  }

  // 2. ALIGN / FIX RULES
  const optimizedShifts: Shift[] = [];
  const employeeHoursUsed: Record<string, number> = {};

  shifts.forEach(shift => {
      let currentStart = shift.startTime;
      let currentEnd = shift.endTime;
      const notes: string[] = [];
      let status: 'OK' | 'MODIFIED' | 'ERROR' = 'OK';
      
      const shiftDay = getDay(currentStart);

      // Rule A: Store Hours
      if (isBefore(currentStart, openDate)) {
          currentStart = openDate;
          notes.push(`Trimmed start to Open Time (${config.openTime})`);
          status = 'MODIFIED';
      }
      if (isAfter(currentEnd, closeDate)) {
          currentEnd = closeDate;
          notes.push(`Trimmed end to Close Time (${config.closeTime})`);
          status = 'MODIFIED';
      }

      // Rule B: Availability (Trimming overlap)
      const empConstraints = constraints.filter(c => 
          c.type === 'UNAVAILABLE' && c.isActive && c.employeeId === shift.employeeId
      );

      for (const c of empConstraints) {
          if (!c.startTime || !c.endTime) continue;
          
          if (c.daysOfWeek && c.daysOfWeek.length > 0 && !c.daysOfWeek.includes(shiftDay)) {
              continue; 
          }

          const blockStart = parseTime(c.startTime);
          const blockEnd = parseTime(c.endTime);

          if (isBefore(currentStart, blockEnd) && isAfter(currentEnd, blockStart)) {
             if ((isBefore(blockStart, currentStart) || isEqual(blockStart, currentStart)) && 
                 (isAfter(blockEnd, currentEnd) || isEqual(blockEnd, currentEnd))) {
                 notes.push(`Removed: Overlaps Unavailable (${c.startTime}-${c.endTime})`);
                 status = 'ERROR'; 
                 currentEnd = currentStart; 
             } 
             else if (isBefore(blockStart, currentEnd) && isAfter(blockStart, currentStart)) {
                 currentEnd = blockStart;
                 notes.push(`Trimmed end: Unavailable starts at ${c.startTime}`);
                 status = 'MODIFIED';
             }
             else if (isAfter(blockEnd, currentStart) && isBefore(blockEnd, currentEnd)) {
                 currentStart = blockEnd;
                 notes.push(`Trimmed start: Unavailable ends at ${c.endTime}`);
                 status = 'MODIFIED';
             }
          }
      }

      // Rule C: Max Hours & Min Shift Length
      const emp = employees.find(e => e.id === shift.employeeId);
      if (emp) {
          const currentDurationHours = differenceInMinutes(currentEnd, currentStart) / 60;
          
          // Check Min Shift Length
          if (currentDurationHours > 0 && currentDurationHours < config.minShiftLength) {
              notes.push(`Warning: Shift length (${currentDurationHours.toFixed(1)}h) is below minimum (${config.minShiftLength}h)`);
              if (status !== 'ERROR') status = 'MODIFIED'; // Just a warning mostly, or we could extend it
          }

          // Check Max Shift Length (Global)
          if (currentDurationHours > config.maxShiftLength) {
             const allowedMin = config.maxShiftLength * 60;
             currentEnd = addMinutes(currentStart, allowedMin);
             notes.push(`Trimmed: Exceeds daily max shift (${config.maxShiftLength}h)`);
             status = 'MODIFIED';
          }

          // Check Max Weekly Hours
          const used = employeeHoursUsed[emp.id] || 0;
          const remaining = emp.maxHours - used;
          const newDuration = differenceInMinutes(currentEnd, currentStart) / 60;
          
          if (newDuration > remaining) {
              const allowedMin = remaining * 60;
              if (allowedMin <= 0) {
                   notes.push(`Removed: Max weekly hours (${emp.maxHours}) exceeded`);
                   status = 'ERROR';
                   currentEnd = currentStart;
              } else {
                   currentEnd = addMinutes(currentStart, allowedMin);
                   notes.push(`Trimmed: Exceeds max weekly hours (${emp.maxHours})`);
                   status = 'MODIFIED';
              }
          }
      }

      // Re-create shift if valid
      if (differenceInMinutes(currentEnd, currentStart) > 0) {
          const newShift = createShift(
              employees.find(e => e.id === shift.employeeId)!, 
              currentStart, 
              currentEnd,
              config
          );
          newShift.status = status;
          newShift.notes = notes;
          
          optimizedShifts.push(newShift);
          employeeHoursUsed[shift.employeeId] = (employeeHoursUsed[shift.employeeId] || 0) + newShift.paidHours;
      }
  });

  // 3. GLOBAL CHECKS
  const minStaffRule = constraints.find(c => c.type === 'NO_SOLO' && c.isActive);
  const MIN_STAFF = minStaffRule?.minStaffCount || 2;

  const coverageMap = [];
  let coverageFailures = 0;

  for (let i = 0; i < intervals; i++) {
    const t = addMinutes(openDate, i * 15);
    const nextT = addMinutes(t, 15);
    
    const active = optimizedShifts.filter(s => 
      (isBefore(s.startTime, nextT) || isEqual(s.startTime, t)) && 
      isAfter(s.endTime, t)
    );
    
    // Check coverage excluding those on lunch
    const working = active.filter(s => {
       if (!s.lunchStart) return true;
       const bEnd = addMinutes(s.lunchStart, s.lunchDuration);
       // If current time t falls inside the lunch window, they are NOT working
       const isOnLunch = (isAfter(t, s.lunchStart) || isEqual(t, s.lunchStart)) && isBefore(t, bEnd);
       return !isOnLunch;
    });

    if (working.length < MIN_STAFF) coverageFailures++;

    coverageMap.push({
      time: t,
      count: working.length,
      hasManager: working.some(s => s.role === EmployeeRole.MANAGER)
    });
  }

  const totalHoursUsed = optimizedShifts.reduce((sum, s) => sum + s.paidHours, 0);

  if (totalHoursUsed > config.budget) errors.push(`Over budget by ${(totalHoursUsed - config.budget).toFixed(2)} hours.`);
  if (coverageFailures > 0) errors.push(`Lunch Coverage: Min Staff (${MIN_STAFF}) violated for ${(coverageFailures * 15) / 60} hours.`);
  if (optimizedShifts.length === 0 && inputScheduleText.trim().length > 0) errors.push("All shifts were removed due to constraints.");

  return {
    shifts: optimizedShifts.sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    totalHoursUsed,
    coverageMap,
    isValid: errors.length === 0,
    errors
  };
};

function createShift(employee: Employee, start: Date, end: Date, config: StoreConfig): Shift {
  const startRounded = roundTo15(start);
  const endRounded = roundTo15(end);
  
  const durationMin = differenceInMinutes(endRounded, startRounded);
  const durationHours = durationMin / 60;
  let lunchStart: Date | undefined;
  let lunchDuration = 0;
  let paidHours = durationHours;

  // LUNCH COMPLIANCE LOGIC
  // If working more than lunchThreshold (e.g. 5 hours), deduct lunch duration.
  if (durationHours > config.lunchThreshold) {
    const lDur = config.lunchDuration; // minutes
    const lDurHours = lDur / 60;
    paidHours -= lDurHours;
    lunchDuration = lDur;
    
    // Schedule lunch in the middle for now, but ensure it's compliant
    // Ideally lunch is between 3rd and 5th hour.
    // For simplicity, we place it exactly middle, which is usually safe for 5-9 hour shifts.
    lunchStart = roundTo15(addMinutes(startRounded, durationMin / 2));
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    employeeId: employee.id,
    employeeName: employee.name,
    role: employee.role,
    startTime: startRounded,
    endTime: endRounded,
    lunchStart,
    lunchDuration,
    paidHours,
    rawDuration: durationHours
  };
}