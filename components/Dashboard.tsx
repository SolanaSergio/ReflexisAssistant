import React, { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ScheduleVisualizer } from './ScheduleVisualizer';
import { StatsPanel } from './StatsPanel';
import { ReflexisExport } from './ReflexisExport';
import { ScheduleResult, StoreConfig } from '../types';
import { scanScheduleImage } from '../services/ocr';
import { LayoutDashboard, Clock, DollarSign, FileInput, ScanLine, ImagePlus, Loader2, X } from 'lucide-react';

interface AppContextType {
  schedule: ScheduleResult | null;
  storeConfig: StoreConfig;
  onSolve: (text: string) => void;
}

export const Dashboard = () => {
    const { schedule, storeConfig, onSolve } = useOutletContext<AppContextType>();
    const [inputText, setInputText] = useState("");
    const [isInputExpanded, setIsInputExpanded] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAnalyze = () => {
        onSolve(inputText);
        setIsInputExpanded(false);
    };

    const handleLoadSample = () => {
        const sample = `Alice (Mgr): 07:15 - 15:15
Bob (Mgr): 13:00 - 21:15
Charlie: 09:00 - 17:00
David: 11:00 - 19:00
Eve: 10:00 - 14:00`;
        setInputText(sample);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        try {
            // Convert to Base64
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                // Strip the data url prefix (e.g., "data:image/png;base64,")
                const base64Data = base64String.split(',')[1];
                const mimeType = file.type;

                const scannedText = await scanScheduleImage(base64Data, mimeType);
                setInputText(prev => prev ? `${prev}\n${scannedText}` : scannedText);
                setIsScanning(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error(err);
            setIsScanning(false);
            alert("Failed to scan image.");
        }
        
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };
    
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Dashboard Header & Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
                        <LayoutDashboard className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                        <div className="flex items-center gap-3 mt-1 text-xs font-medium text-slate-500">
                           <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {storeConfig.openTime} - {storeConfig.closeTime}</span>
                           <span className="w-1 h-1 rounded-full bg-slate-700" />
                           <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {storeConfig.budget} Hrs Budget</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Input Section */}
            <div className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-300 ${isInputExpanded ? 'shadow-xl' : 'shadow-none opacity-80 hover:opacity-100'}`}>
                <div 
                    className="p-4 flex items-center justify-between cursor-pointer bg-slate-800/30"
                    onClick={() => setIsInputExpanded(!isInputExpanded)}
                >
                    <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                        <FileInput className="w-4 h-4 text-indigo-400" />
                        Schedule Input Source
                    </div>
                    <span className="text-xs text-slate-500">{isInputExpanded ? 'Click to collapse' : 'Click to edit input'}</span>
                </div>
                
                {isInputExpanded && (
                    <div className="p-4 space-y-4">
                        <div className="flex flex-wrap justify-between items-center gap-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paste Text or Upload Image</label>
                            
                            <div className="flex gap-3">
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                                <button 
                                    onClick={triggerFileSelect}
                                    disabled={isScanning}
                                    className="flex items-center gap-2 text-xs font-bold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    {isScanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
                                    {isScanning ? 'SCANNING...' : 'SCAN IMAGE'}
                                </button>
                                <button onClick={handleLoadSample} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Load Sample Data</button>
                            </div>
                        </div>

                        <div className="relative group">
                            <textarea 
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="e.g.&#10;Alice: 09:00 - 17:00&#10;Bob: 12:00 - 20:00"
                                className={`w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-mono text-slate-300 outline-none focus:border-indigo-500 transition-all resize-y ${isScanning ? 'opacity-50 blur-[1px]' : ''}`}
                                readOnly={isScanning}
                            />
                            
                            {isScanning && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-400 z-10">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                    <span className="text-xs font-bold tracking-widest animate-pulse">ANALYZING SCHEDULE...</span>
                                </div>
                            )}

                            {inputText && !isScanning && (
                                <button 
                                    onClick={() => setInputText('')}
                                    className="absolute top-2 right-2 p-1.5 bg-slate-800 text-slate-500 hover:text-rose-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    title="Clear text"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        <div className="flex justify-between items-center pt-2">
                             <p className="text-[10px] text-slate-600 max-w-md">
                                 Tip: You can take a photo of a physical schedule or upload a screenshot from Reflexis. The AI will convert it to text automatically.
                             </p>
                            <button 
                                onClick={handleAnalyze}
                                disabled={!inputText.trim() || isScanning}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/25 transition-all active:scale-95 group"
                            >
                                <ScanLine className="w-5 h-5" />
                                ANALYZE & ALIGN
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Results Section */}
            <div className="flex-none w-full">
               <ScheduleVisualizer 
                   schedule={schedule} 
                   openTime={storeConfig.openTime}
                   closeTime={storeConfig.closeTime}
               />
            </div>
            
            {schedule && (
                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 pb-20 md:pb-0">
                <div className="lg:col-span-1">
                    <StatsPanel schedule={schedule} budget={storeConfig.budget} />
                </div>
                <div className="lg:col-span-2">
                    <ReflexisExport schedule={schedule} />
                </div>
                </div>
            )}
        </div>
    );
}