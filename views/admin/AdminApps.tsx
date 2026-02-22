import React, { useState } from 'react';
import CalculatorApp from '../../components/admin/apps/CalculatorApp';
import NotepadApp from '../../components/admin/apps/NotepadApp';

const AdminApps: React.FC = () => {
  const [activeApp, setActiveApp] = useState<'calc' | 'notepad' | null>(null);

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-jakarta pb-40">
        <div className="max-w-4xl mx-auto px-4 md:px-6 pt-8 md:pt-12 space-y-8 md:space-y-12">
            <header className="px-2 text-center">
                <p className="text-[10px] font-bold uppercase text-orange-500 tracking-[0.4em] mb-2">Merchant Utilities</p>
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">Terminal Apps</h1>
                <p className="text-[17px] font-medium text-slate-500 leading-relaxed mt-4">
                    Internal tools to assist your daily operations.
                </p>
            </header>

            {!activeApp ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button 
                        onClick={() => setActiveApp('calc')}
                        className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center gap-6 group hover:shadow-xl transition-all duration-500"
                    >
                        <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110">
                            <i className="fa-solid fa-calculator"></i>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 leading-none mb-2">Calculator</h3>
                            <p className="text-xs text-slate-400 font-medium">Quick math</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => setActiveApp('notepad')}
                        className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center gap-6 group hover:shadow-xl transition-all duration-500"
                    >
                        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110">
                            <i className="fa-solid fa-note-sticky"></i>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 leading-none mb-2">Notepad</h3>
                            <p className="text-xs text-slate-400 font-medium">Local notes</p>
                        </div>
                    </button>
                </div>
            ) : (
                <div className="space-y-6 md:space-y-10 animate-fade-in">
                    <button 
                        onClick={() => setActiveApp(null)}
                        className="flex items-center gap-2 text-indigo-600 font-black uppercase text-[11px] tracking-widest px-4 hover:opacity-70"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        Back to Apps
                    </button>
                    
                    {activeApp === 'calc' && <CalculatorApp onClose={() => setActiveApp(null)} />}
                    {activeApp === 'notepad' && <NotepadApp onClose={() => setActiveApp(null)} />}
                </div>
            )}
        </div>
    </div>
  );
};

export default AdminApps;