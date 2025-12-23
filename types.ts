export enum EmployeeRole {
  MANAGER = 'Manager (Gray Shirt)',
  FULL_TIME = 'Full-Time (Red Shirt)',
  PART_TIME = 'Part-Time (Red Shirt)',
}

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  maxHours: number;
  email?: string;
  phone?: string;
  preferences?: string; // Notes on preferred shifts
}

export interface StoreConfig {
  budget: number;
  openTime: string;
  closeTime: string;
  minShiftLength: number; // hours, e.g. 4
  maxShiftLength: number; // hours, e.g. 10
  lunchThreshold: number; // hours, e.g. 5 (shifts longer than this MUST have a lunch)
  lunchDuration: number; // minutes, e.g. 30
}

export type ConstraintType = 'NO_SOLO' | 'UNAVAILABLE';

export interface Constraint {
  id: string;
  type: ConstraintType;
  isActive: boolean;
  // Specific to NO_SOLO
  minStaffCount?: number;
  // Specific to UNAVAILABLE
  employeeId?: string;
  startTime?: string; // "08:00"
  endTime?: string; // "12:00"
  daysOfWeek?: number[]; // 0 (Sun) - 6 (Sat). If empty/undefined, applies to all days.
  reason?: string; // e.g. "School", "Doctor"
}

export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  role: EmployeeRole;
  startTime: Date; // Absolute time
  endTime: Date;   // Absolute time
  lunchStart?: Date;
  lunchDuration: number; // in minutes
  paidHours: number;
  rawDuration: number; // in hours
  status?: 'OK' | 'MODIFIED' | 'ERROR'; // Track if we changed it
  notes?: string[];
}

export interface ScheduleResult {
  shifts: Shift[];
  totalHoursUsed: number;
  coverageMap: { time: Date; count: number; hasManager: boolean }[];
  isValid: boolean;
  errors: string[];
}

export interface SolverParams {
  inputScheduleText: string; // The raw text from Reflexis
  config: StoreConfig;
  employees: Employee[];
  constraints: Constraint[];
}