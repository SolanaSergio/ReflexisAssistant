import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, X, LayoutDashboard, Settings } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
   isOpen, onClose,
}) => {
  
  const navItemClass = (isActive: boolean) => `
    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm
    ${isActive 
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 translate-x-1' 
      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
  `;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={onClose} />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:shadow-none md:z-auto md:bg-slate-900 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800/50">
           <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                 Z
              </div>
              <span className="font-bold text-slate-100 tracking-tight text-lg">ZWS Solver</span>
           </div>
           <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white"><X className="w-6 h-6"/></button>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-500 px-4 mb-2 uppercase tracking-wider">Menu</h3>
            
            <NavLink to="/" className={({ isActive }) => navItemClass(isActive)} onClick={onClose}>
               <LayoutDashboard className="w-5 h-5" />
               Dashboard
            </NavLink>
            
            <NavLink to="/staff" className={({ isActive }) => navItemClass(isActive)} onClick={onClose}>
               <Users className="w-5 h-5" />
               Staff Manager
            </NavLink>
            
            <NavLink to="/settings" className={({ isActive }) => navItemClass(isActive)} onClick={onClose}>
               <Settings className="w-5 h-5" />
               Configuration
            </NavLink>
        </div>

        {/* Footer info */}
        <div className="mt-auto p-6 border-t border-slate-800/50">
            <div className="flex items-center gap-3 opacity-50">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-slate-400">System Ready</span>
            </div>
        </div>

      </div>
    </>
  );
};