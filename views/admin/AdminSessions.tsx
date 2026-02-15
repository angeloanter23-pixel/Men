
import React, { useState, useMemo } from 'react';
import * as MenuService from '../../services/menuService';

interface AdminSessionsProps {
  activeSessions: any[];
  qrNodes: any[];
  onRefresh: () => void;
  getRelativeTime: (ts: string) => string;
}

export default function AdminSessions({ activeSessions, qrNodes, onRefresh, getRelativeTime }: AdminSessionsProps) {
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const sessionsList = useMemo(() => {
    return activeSessions.map(s => {
        const qr = qrNodes.find(q => q.id === s.qr_code_id);
        return { ...s, table_label: qr?.label || 'Unidentified' };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [activeSessions, qrNodes]);

  const handleEndSession = async (sessionId: string) => {
    setIsUpdating(true);
    try {
        await MenuService.endTableSession(sessionId);
        setSelectedSession(null);
        onRefresh();
    } catch (e) {
        console.error("End session failed");
    } finally {
        setIsUpdating(false);
    }
  };

  const handleTogglePin = async (sessionId: string, currentStatus: boolean) => {
    setIsUpdating(true);
    const nextStatus = !currentStatus;
    try {
        await MenuService.updateTableSession(sessionId, { pin_required: nextStatus });
        setSelectedSession(prev => prev ? { ...prev, pin_required: nextStatus } : null);
        onRefresh();
    } catch (e) {
        console.error("Toggle PIN failed");
    } finally {
        setIsUpdating(false);
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
                    onClick={() => setSelectedSession(session)}
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
                            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                                {session.pin_required !== false ? 'PIN Required' : 'PIN Disabled'}
                            </span>
                        </div>
                        <i className="fa-solid fa-chevron-right text-slate-200 text-[10px] group-active:translate-x-1 transition-transform"></i>
                    </div>
                </button>
            ))}
        </div>
        {sessionsList.length === 0 && <div className="py-24 text-center opacity-20 italic">No Active Table Sessions</div>}

        {selectedSession && (
            <div className="fixed inset-0 z-[3000] flex items-end justify-center animate-fade-in p-0">
                <div onClick={() => !isUpdating && setSelectedSession(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                <div className="relative bg-white w-full max-w-lg rounded-t-[3rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up pb-12">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-5 shrink-0" />
                    
                    <div className="px-10 pb-8 flex justify-between items-start border-b border-slate-50">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{selectedSession.table_label}</h3>
                            <p className="text-[10px] font-black text-indigo-600 uppercase mt-2 tracking-[0.2em] leading-none">Session Context Settings</p>
                        </div>
                        <button onClick={() => setSelectedSession(null)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors"><i className="fa-solid fa-xmark"></i></button>
                    </div>

                    <div className="p-10 space-y-10">
                        <div className="flex items-center justify-between bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                            <div className="space-y-1 pr-4">
                                <h4 className="text-[15px] font-black uppercase text-slate-900 leading-none">PIN Verification</h4>
                                <p className="text-[11px] font-medium text-slate-400 leading-tight">Require 4-digit code to place orders</p>
                            </div>
                            <button 
                                onClick={() => handleTogglePin(selectedSession.id, selectedSession.pin_required !== false)}
                                disabled={isUpdating}
                                className={`w-16 h-8 rounded-full transition-all duration-300 relative flex items-center px-1 border-2 ${selectedSession.pin_required !== false ? 'bg-indigo-600 border-indigo-700' : 'bg-slate-300 border-slate-400'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${selectedSession.pin_required !== false ? 'translate-x-8' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white border border-slate-100 p-5 rounded-3xl text-center shadow-sm">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Active PIN</p>
                                <p className="text-xl font-black text-indigo-600">{selectedSession.verification_code}</p>
                            </div>
                            <div className="bg-white border border-slate-100 p-5 rounded-3xl text-center shadow-sm">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Connected</p>
                                <p className="text-xl font-black text-slate-800">{getRelativeTime(selectedSession.created_at).split(' ')[0]}m</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            <button 
                                onClick={() => handleEndSession(selectedSession.id)} 
                                disabled={isUpdating}
                                className="w-full py-6 bg-rose-50 text-rose-500 rounded-3xl font-black uppercase text-[11px] tracking-[0.3em] active:scale-95 transition-all flex items-center justify-center gap-3 border border-rose-100 shadow-inner"
                            >
                                {isUpdating ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-power-off"></i>}
                                <span>Terminate Session</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

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
                                        <i className="fa-solid fa-plus text-slate-300 group-hover:text-indigo-600"></i>
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
