
import React, { useState, useMemo } from 'react';
import * as MenuService from '../../services/menuService';

interface AdminSessionsProps {
  activeSessions: any[];
  qrNodes: any[];
  onRefresh: () => void;
  getRelativeTime: (ts: string) => string;
}

export default function AdminSessions({ activeSessions, qrNodes, onRefresh, getRelativeTime }: AdminSessionsProps) {
  const [sessionToEnd, setSessionToEnd] = useState<any | null>(null);
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const sessionsList = useMemo(() => {
    return activeSessions.map(s => {
        const qr = qrNodes.find(q => q.id === s.qr_code_id);
        return { ...s, table_label: qr?.label || 'Unidentified' };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [activeSessions, qrNodes]);

  const handleEndSession = async (sessionId: string) => {
    try {
        await MenuService.endTableSession(sessionId);
        setSessionToEnd(null);
        onRefresh();
    } catch (e) {
        console.error("End session failed");
    }
  };

  const handleStartManualSession = async (qrId: string) => {
      setIsUpdating(true);
      try {
          await MenuService.createManualSession(qrId);
          setIsAddSessionOpen(false);
          onRefresh();
      } catch (e) {
          console.error("Session start failed");
      } finally {
          setIsUpdating(false);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in px-2">
        <div className="flex justify-between items-center px-2">
            <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Active Occupancy</h3>
            <button onClick={() => setIsAddSessionOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all">New Session</button>
        </div>
        
        <div className="bg-white rounded-[1.5rem] overflow-hidden border border-slate-200 shadow-sm divide-y divide-slate-100">
            {sessionsList.map((session) => (
                <button 
                    key={session.id} 
                    onClick={() => setSessionToEnd(session)}
                    className="w-full p-5 flex items-center justify-between active:bg-slate-50 transition-colors text-left group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                            <i className="fa-solid fa-key text-sm"></i>
                        </div>
                        <div>
                            <h4 className="text-[17px] font-bold text-slate-900 tracking-tight leading-none mb-1">{session.table_label}</h4>
                            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Occupied • {getRelativeTime(session.created_at)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-emerald-600 uppercase">PIN: {session.verification_code}</span>
                            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">Active Sync</span>
                        </div>
                        <i className="fa-solid fa-chevron-right text-slate-200 text-[10px] group-active:translate-x-1 transition-transform"></i>
                    </div>
                </button>
            ))}
        </div>
        {sessionsList.length === 0 && <div className="py-24 text-center opacity-20 italic">No Active Table Sessions</div>}

        {/* TERMINATE SESSION MODAL */}
        {sessionToEnd && (
            <div className="fixed inset-0 z-[3000] flex items-end justify-center animate-fade-in p-4">
                <div onClick={() => setSessionToEnd(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
                <div className="relative w-full max-w-lg space-y-3 animate-slide-up">
                    <div className="bg-white/95 backdrop-blur-2xl rounded-[1.5rem] overflow-hidden flex flex-col shadow-2xl">
                        <div className="px-10 py-10 text-center">
                            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl shadow-inner">
                                <i className="fa-solid fa-power-off"></i>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-3">Terminate Session</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">
                                End current session for <span className="font-bold text-slate-900">{sessionToEnd.table_label}</span>? 
                                <br/><span className="text-[10px] text-rose-500 font-black uppercase mt-2 block">System will reset Token and PIN.</span>
                            </p>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
                            <button 
                                onClick={() => handleEndSession(sessionToEnd.id)} 
                                className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-[14px] uppercase tracking-[0.2em] shadow-xl shadow-rose-100 active:scale-95 transition-all"
                            >
                                End Session Now
                            </button>
                            <button 
                                onClick={() => setSessionToEnd(null)} 
                                className="w-full py-4 text-slate-400 font-bold text-[14px] uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* ADD SESSION MODAL */}
        {isAddSessionOpen && (
            <div className="fixed inset-0 z-[3000] flex items-end justify-center animate-fade-in">
                <div onClick={() => setIsAddSessionOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                <div className="relative bg-white w-full max-w-lg rounded-t-[3rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up pb-12 max-h-[85vh]">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-5 shrink-0" />
                    <div className="px-8 pb-8 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 leading-none">Start <span className="text-indigo-600">New Session</span></h2>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Manual entry for walk-in guests</p>
                        </div>
                        <button onClick={() => setIsAddSessionOpen(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all shadow-sm"><i className="fa-solid fa-xmark"></i></button>
                    </div>

                    <div className="px-8 space-y-6 flex-1 overflow-y-auto no-scrollbar">
                        <div className="bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100/50 flex gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                                <i className="fa-solid fa-info text-xs"></i>
                            </div>
                            <p className="text-sm text-indigo-900 font-bold leading-snug">
                                Just pick an empty table below to start a new dining session. This will generate a code for the guests.
                            </p>
                        </div>

                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Which table is being occupied?</p>
                        
                        <div className="grid grid-cols-1 gap-3">
                            {qrNodes.filter(node => !activeSessions.some(s => s.qr_code_id === node.id)).length > 0 ? (
                                qrNodes.filter(node => !activeSessions.some(s => s.qr_code_id === node.id)).map(node => (
                                    <button 
                                        key={node.id} 
                                        onClick={() => handleStartManualSession(node.id)}
                                        className="w-full p-6 rounded-[2.2rem] bg-slate-50 hover:bg-white border border-transparent hover:border-indigo-200 flex items-center justify-between group transition-all hover:shadow-xl hover:shadow-indigo-50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm transition-all">
                                                <i className="fa-solid fa-utensils text-sm"></i>
                                            </div>
                                            <span className="font-black uppercase text-slate-800 tracking-tight text-lg">{node.label}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Select Table</span>
                                            <i className="fa-solid fa-plus text-slate-300 group-hover:text-indigo-600"></i>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="py-20 text-center opacity-30 italic">
                                    <p>All tables are currently occupied.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
