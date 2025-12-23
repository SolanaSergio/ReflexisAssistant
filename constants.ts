import { Employee, EmployeeRole } from './types';

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: '1', name: 'Alice (Mgr)', role: EmployeeRole.MANAGER, maxHours: 40, email: 'alice@store.com' },
  { id: '2', name: 'Bob (Mgr)', role: EmployeeRole.MANAGER, maxHours: 40, email: 'bob@store.com' },
  { id: '3', name: 'Charlie', role: EmployeeRole.FULL_TIME, maxHours: 38, phone: '555-0101' },
  { id: '4', name: 'David', role: EmployeeRole.FULL_TIME, maxHours: 38 },
  { id: '5', name: 'Eve', role: EmployeeRole.PART_TIME, maxHours: 20 },
  { id: '6', name: 'Frank', role: EmployeeRole.PART_TIME, maxHours: 15 },
  { id: '7', name: 'Grace', role: EmployeeRole.PART_TIME, maxHours: 25 },
];