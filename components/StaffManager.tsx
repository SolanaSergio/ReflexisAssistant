import React, { useState, useRef, Dispatch, SetStateAction } from 'react';
import { Employee, EmployeeRole, Constraint } from '../types';
import { scanStaffList } from '../services/ocr';
import { Users, Plus, Trash2, UserCircle2, Briefcase, Search, Edit2, ChevronUp, Mail, Phone, CalendarClock, Ban, ImagePlus, Loader2, X, Heart, CalendarDays } from 'lucide-react';

interface StaffManagerProps {
  employees: Employee[];
  setEmployees: Dispatch<SetStateAction<Employee[]>>;
  constraints: Constraint[];
  setConstraints: Dispatch<SetStateAction<Constraint[]>>;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const StaffManager: React.FC<StaffManagerProps> = ({ employees, setEmployees, constraints, setConstraints }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Actions ---

  const handleAddNew = () => {
      const newId = Math.random().toString(36).substr(2, 9);
      const newEmp: Employee = {
          id: newId,
          name: "New Team Member",
          role: EmployeeRole.PART_TIME,
          maxHours: 20
      };
      setEmployees(prev => [newEmp, ...prev]); 
      setExpandedId(newId); 
  };

  const handleUpdate = (id: string, field: keyof Employee, value: any) => {
      setEmployees(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleDelete = (id: string) => {
      // Use window.confirm explicitly to ensure browser dialog
      if (window.confirm("Are you sure you want to delete this staff member?")) {
          setEmployees(prev => prev.filter(e => e.id !== id));
          setConstraints(prev => prev.filter(c => c.employeeId !== id));
          if (expandedId === id) setExpandedId(null);
      }
  };

  // --- Scanning ---

  const handleScanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsScanning(true);
      try {
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64String = reader.result as string;
              const base64Data = base64String.split(',')[1];
              
              const scannedStaff = await scanStaffList(base64Data, file.type);
              
              const newEmployees = scannedStaff.map(s => ({
                  id: Math.random().toString(36).substr(2, 9),
                  name: s.name || "Unknown",
                  role: s.role || EmployeeRole.PART_TIME,
                  maxHours: s.maxHours || 20,
                  email: s.email,
                  phone: s.phone
              }));

              setEmployees(prev => [...prev, ...newEmployees]);
              alert(`Successfully imported ${newEmployees.length} staff members!`);
              setIsScanning(false);
          };
          reader.readAsDataURL(file);
      } catch (err) {
          console.error(err);
          setIsScanning(false);
          alert("Failed to scan roster.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };


  // --- Render Helpers ---

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
             <Users className="w-8 h-8 text-indigo-500" />
             Staff Management
          </h1>
          <p className="text-slate-400 mt-2">
             Configure availability, preferred shifts, and details for each team member.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
             {/* Scan Button */}
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleScanUpload}
             />
             <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-full text-sm font-bold transition-colors whitespace-nowrap"
             >
                {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                {isScanning ? 'Scanning...' : 'Scan Roster'}
             </button>

            {/* Search */}
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Search staff..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
            </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* Add New Card */}
          <button 
             type="button"
             onClick={handleAddNew}
             className="flex flex-col items-center justify-center min-h-[160px] rounded-2xl border-2 border-dashed border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/50 transition-all group"
          >
              <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white text-slate-500 flex items-center justify-center mb-3 transition-colors">
                  <Plus className="w-6 h-6" />
              </div>
              <span className="font-bold text-slate-400 group-hover:text-slate-200">Add Team Member</span>
          </button>

          {/* Employee Cards */}
          {filteredEmployees.map(emp => (
              <EmployeeCard 
                  key={emp.id}
                  employee={emp}
                  isExpanded={expandedId === emp.id}
                  onToggle={() => setExpandedId(expandedId === emp.id ? null : emp.id)}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  constraints={constraints.filter(c => c.employeeId === emp.id)}
                  addConstraint={(c) => setConstraints(prev => [...prev, c])}
                  removeConstraint={(cid) => setConstraints(prev => prev.filter(c => c.id !== cid))}
              />
          ))}
      </div>

      {filteredEmployees.length === 0 && (
         <div className="text-center py-10 opacity-50">
             <p>No staff found matching your search.</p>
         </div>
      )}
    </div>
  );
};

// --- Sub-Component: Employee Card ---

interface EmployeeCardProps {
    employee: Employee;
    isExpanded: boolean;
    onToggle: () => void;
    onUpdate: (id: string, field: keyof Employee, value: any) => void;
    onDelete: (id: string) => void;
    constraints: Constraint[];
    addConstraint: (c: Constraint) => void;
    removeConstraint: (id: string) => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ 
    employee, isExpanded, onToggle, onUpdate, onDelete, constraints, addConstraint, removeConstraint 
}) => {
    
    // Local state for adding constraints within the card
    const [cStart, setCStart] = useState("09:00");
    const [cEnd, setCEnd] = useState("17:00");
    const [cReason, setCReason] = useState("");
    const [cDays, setCDays] = useState<number[]>([]); // Empty = All days

    const handleAddConstraint = () => {
        addConstraint({
            id: Math.random().toString(36).substr(2, 9),
            type: 'UNAVAILABLE',
            isActive: true,
            employeeId: employee.id,
            startTime: cStart,
            endTime: cEnd,
            daysOfWeek: cDays.length > 0 ? cDays : undefined,
            reason: cReason || "Busy"
        });
        setCReason("");
        setCDays([]);
    };

    const toggleDay = (dayIndex: number) => {
        if (cDays.includes(dayIndex)) {
            setCDays(cDays.filter(d => d !== dayIndex));
        } else {
            setCDays([...cDays, dayIndex].sort());
        }
    };

    const formatDays = (days?: number[]) => {
        if (!days || days.length === 0) return "Daily";
        if (days.length === 7) return "Daily";
        // Map numbers to short names
        return days.map(d => DAYS[d]).join(', ');
    };

    return (
        <div className={`
            relative rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col
            ${isExpanded 
                ? 'bg-slate-900 border-indigo-500 shadow-2xl shadow-indigo-900/20 col-span-1 md:col-span-2 xl:col-span-1 ring-1 ring-indigo-500' 
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900'}
        `}>
            <div className="flex items-center justify-between p-3 relative">
                
                {/* Left Side: Click triggers toggle */}
                <div 
                    onClick={onToggle}
                    className="flex-1 flex items-center gap-4 p-2 cursor-pointer rounded-xl hover:bg-slate-800/50 transition-colors group select-none relative z-10"
                >
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-lg shrink-0
                       ${employee.role === EmployeeRole.MANAGER ? 'bg-gradient-to-br from-slate-600 to-slate-700' : 'bg-gradient-to-br from-indigo-500 to-indigo-600'}`}>
                       {employee.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-200 group-hover:text-white transition-colors line-clamp-1">{employee.name}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> {employee.role.split(' ')[0]}
                        </p>
                    </div>
                </div>

                {/* Right Side: Actions (Isolated & On Top) */}
                <div 
                    className="flex items-center gap-1 shrink-0 relative z-20"
                    onClick={(e) => e.stopPropagation()} // Extra layer of protection
                >
                    {/* Delete Button */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDelete(employee.id);
                        }}
                        className="p-3 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer active:scale-95"
                        title="Delete Staff"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>

                    {/* Toggle Button */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggle();
                        }}
                        className={`p-3 rounded-lg transition-colors cursor-pointer active:scale-95 ${isExpanded ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-600 hover:text-indigo-400 hover:bg-slate-800'}`}
                    >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <Edit2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Expanded Editor */}
            {isExpanded && (
                <div className="px-5 pb-5 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300 cursor-default" onClick={e => e.stopPropagation()}>
                    <div className="h-px bg-slate-800 w-full mb-4" />
                    
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Full Name</label>
                            <input 
                                value={employee.name}
                                onChange={e => onUpdate(employee.id, 'name', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Role</label>
                            <select 
                                value={employee.role}
                                onChange={e => onUpdate(employee.id, 'role', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-indigo-500 outline-none"
                            >
                                <option value={EmployeeRole.MANAGER}>Manager</option>
                                <option value={EmployeeRole.FULL_TIME}>Full-Time</option>
                                <option value={EmployeeRole.PART_TIME}>Part-Time</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Max Hours</label>
                            <input 
                                type="number"
                                value={employee.maxHours}
                                onChange={e => onUpdate(employee.id, 'maxHours', Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-3 pt-2 border-t border-slate-800/50">
                        <h4 className="text-xs font-bold text-slate-400 flex items-center gap-2">
                            <UserCircle2 className="w-3 h-3" /> Contact Details
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 w-3 h-3 text-slate-600" />
                                <input 
                                    placeholder="Email"
                                    value={employee.email || ''}
                                    onChange={e => onUpdate(employee.id, 'email', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-8 pr-3 text-xs text-white focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 w-3 h-3 text-slate-600" />
                                <input 
                                    placeholder="Phone"
                                    value={employee.phone || ''}
                                    onChange={e => onUpdate(employee.id, 'phone', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-8 pr-3 text-xs text-white focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Preferred Shifts */}
                    <div className="space-y-3 pt-2 border-t border-slate-800/50">
                        <h4 className="text-xs font-bold text-slate-400 flex items-center gap-2">
                            <Heart className="w-3 h-3 text-rose-400" /> Preferred Shifts
                        </h4>
                        <div className="relative">
                            <textarea 
                                placeholder="e.g. Prefers mornings, unavailable Tuesday nights for class."
                                value={employee.preferences || ''}
                                onChange={e => onUpdate(employee.id, 'preferences', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 focus:border-indigo-500 outline-none min-h-[60px] resize-y"
                            />
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="space-y-3 pt-2 border-t border-slate-800/50">
                        <h4 className="text-xs font-bold text-slate-400 flex items-center gap-2">
                            <CalendarClock className="w-3 h-3" /> Availability Exceptions
                        </h4>
                        
                        {/* Constraints List */}
                        <div className="space-y-2">
                            {constraints.map(c => (
                                <div key={c.id} className="flex items-center justify-between bg-slate-950/50 border border-slate-800/50 p-3 rounded-lg text-xs">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <Ban className="w-3 h-3 text-rose-500" />
                                            <span className="font-mono text-sm">{c.startTime} - {c.endTime}</span>
                                            <span className="text-slate-500 italic">({c.reason})</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-indigo-400">
                                            <CalendarDays className="w-3 h-3" />
                                            <span>{formatDays(c.daysOfWeek)}</span>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => removeConstraint(c.id)} className="text-slate-600 hover:text-rose-500 p-2">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Constraint Input */}
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <input type="time" value={cStart} onChange={e => setCStart(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg text-xs px-3 py-2 text-white flex-1 text-center" />
                                    <span className="text-slate-600">-</span>
                                    <input type="time" value={cEnd} onChange={e => setCEnd(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg text-xs px-3 py-2 text-white flex-1 text-center" />
                                </div>
                                <input placeholder="Reason (e.g. School)" value={cReason} onChange={e => setCReason(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg text-xs px-3 py-2 text-white w-full" />
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                <label className="text-[10px] text-slate-500 uppercase font-bold">Repeats On:</label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS.map((day, idx) => (
                                        <button 
                                            key={day}
                                            type="button"
                                            onClick={() => toggleDay(idx)}
                                            className={`w-9 h-9 rounded-full text-[10px] font-bold transition-all border
                                                ${cDays.includes(idx) 
                                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/50' 
                                                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                                        >
                                            {day.charAt(0)}
                                        </button>
                                    ))}
                                </div>
                                <button 
                                    type="button"
                                    onClick={handleAddConstraint} 
                                    className="mt-2 w-full py-3 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl text-sm font-bold transition-all border border-indigo-500/20 flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Add Exception
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-slate-800 mt-4">
                         <button 
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDelete(employee.id);
                            }}
                            className="text-xs text-rose-500 hover:text-rose-400 flex items-center gap-1 px-3 py-2 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                         >
                             <Trash2 className="w-3 h-3" /> Delete
                         </button>
                         <button 
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onToggle();
                            }}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-bold transition-colors cursor-pointer"
                         >
                             Done
                         </button>
                    </div>
                </div>
            )}
        </div>
    );
};