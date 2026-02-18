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
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [newPin, setNewPin] = useState('');

  const sessionsList = useMemo(() => {
    return activeSessions.map(s => {
        const qr = qrNodes.find(q => q.id === s.qr_code_id);
        return { ...s, table_label: qr?.label || 'Unidentified' };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [activeSessions, qrNodes]);

  const handleTerminateAndReset = async (session: any) => {
    if (!confirm(`This will immediately log out current guests at ${session.table_label} and generate a brand new entry code. Proceed?`)) return;
    
    setIsUpdating(true);
    try {
        // 1. End current session (Invalidates old token/PIN)
        await MenuService.endTableSession(session.id);
        
        // 2. Start new session for same table (Creates new token/PIN)
        const newSession = await MenuService.createManualSession(session.qr_code_id);
        
        // Update UI state
        setSelectedSession(null);
        onRefresh();
        
        // Optional: Show new PIN in a toast or alert if needed, 
        // though it will appear in the refreshed list.
    } catch (e) {
        console.error("Reset cycle failed", e);
    } finally {
        setIsUpdating(false);
    }
  };

  const handleUpdatePinManual = async () => {
    if (newPin.length !== 4 || isNaN(Number(newPin))) {
        alert("PIN must be 4 digits.");
        return;
    }
    setIsUpdating(true);
    try {
        await MenuService.updateTableSession(selectedSession.id, { verification_code: newPin });
        setSelectedSession({ ...selectedSession, verification_code: newPin });
        setIsEditingPin(false);
        setNewPin('');
        onRefresh();
    } catch (e) {
        console.error("Manual PIN update failed");
    } finally {
        setIsUpdating(false);
    }
  };

  const handleTogglePinRequirement = async (sessionId: string, currentStatus: boolean) => {
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
        <div className="flex justify-between items-center px-4">
            <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Active Nodes</h3>
            <button onClick={() => setIsAddSessionOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all">Manual Start</button>
        </div>
        
        <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm divide-y divide-slate-100">
            {sessionsList.map((session) => (
                <button 
                    key={session.id} 
                    onClick={() => { setSelectedSession(session); setIsEditingPin(false); }}
                    className="w-full p-6 flex items-center justify-between active:bg-slate-50 transition-colors text-left group"
                >
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                            <i className="fa-solid fa-key text-base"></i>
                        </div>
                        <div>
                            <h4 className="text-[18px] font-black text-slate-900 tracking-tight leading-none mb-1.5 uppercase italic">{session.table_label}</h4>
                            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{getRelativeTime(session.created_at)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="flex flex-col items-end">
                            <span className="text-[11px] font-black text-emerald-600 uppercase tracking-tighter">PIN: {session.verification_code}</span>
                            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                                {session.pin_required !== false ? 'Protected' : 'Open Access'}
                            </span>
                        </div>
                        <i className="fa-solid fa-chevron-right text-slate-200 text-xs group-active:translate-x-1 transition-transform"></i>
                    </div>
                </button>
            ))}
        </div>
        {sessionsList.length === 0 && <div className="py-32 text-center opacity-20 italic font-bold uppercase tracking-widest">No active table sessions.</div>}

        {selectedSession && (
            <div className="fixed inset-0 z-[3000] flex items-end justify-center animate-fade-in p-0">
                <div onClick={() => !isUpdating && setSelectedSession(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                <div className="relative bg-[#F2F2F7] w-full max-w-lg rounded-t-[3rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up pb-12 max-h-[92vh]">
                    <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-5 shrink-0" />
                    
                    <div className="px-10 pb-8 bg-white border-b border-slate-100 flex justify-between items-start">
                        <div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">{selectedSession.table_label}</h3>
                            <p className="text-[10px] font-black text-indigo-600 uppercase mt-2 tracking-[0.2em] leading-none">Console Control</p>
                        </div>
                        <button onClick={() => setSelectedSession(null)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all border border-slate-100"><i className="fa-solid fa-xmark text-lg"></i></button>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-6">
                        {/* PIN Control Section */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-base font-black uppercase text-slate-900 tracking-tight">PIN Protection</h4>
                                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-1">Require code for table ordering</p>
                                </div>
                                <button 
                                    onClick={() => handleTogglePinRequirement(selectedSession.id, selectedSession.pin_required !== false)}
                                    disabled={isUpdating}
                                    className={`w-14 h-8 rounded-full transition-all flex items-center px-1 border-2 ${selectedSession.pin_required !== false ? 'bg-indigo-600 border-indigo-700' : 'bg-slate-200 border-slate-300'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${selectedSession.pin_required !== false ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                <div>
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-2">Active Table Code</span>
                                    {isEditingPin ? (
                                        <div className="flex items-center gap-3">
                                            <input 
                                                autoFocus
                                                maxLength={4}
                                                value={newPin}
                                                onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                                                className="w-28 bg-slate-50 border-2 border-indigo-600 rounded-xl px-4 py-2 font-black text-indigo-600 text-xl outline-none"
                                                placeholder="0000"
                                            />
                                            <button onClick={handleUpdatePinManual} className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] shadow-lg">Save</button>
                                            <button onClick={() => setIsEditingPin(false)} className="text-slate-400 font-bold text-xs uppercase">Exit</button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <span className="text-4xl font-black text-slate-900 tracking-widest tabular-nums">{selectedSession.verification_code}</span>
                                            <button onClick={() => { setIsEditingPin(true); setNewPin(selectedSession.verification_code); }} className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center active:scale-90 transition-all"><i className="fa-solid fa-pen-to-square text-sm"></i></button>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-2">Node Status</span>
                                    <span className="text-[12px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 justify-end">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                        Online
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* SINGLE ACTION BUTTON */}
                        <div className="pt-4">
                            <button 
                                onClick={() => handleTerminateAndReset(selectedSession)}
                                disabled={isUpdating}
                                className="w-full py-7 bg-rose-600 text-white rounded-[2.5rem] flex flex-col items-center justify-center gap-1 shadow-2xl shadow-rose-200 active:scale-95 transition-all group overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                                <div className="flex items-center gap-3 relative z-10">
                                    {isUpdating ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-power-off"></i>}
                                    <span className="font-black uppercase text-[14px] tracking-[0.2em]">Terminate & Reset Node</span>
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-widest text-rose-200 relative z-10">Invalidates token & rotates PIN</span>
                            </button>
                            
                            <p className="mt-6 text-center text-[10px] text-slate-400 font-medium px-10 leading-relaxed italic">
                                Action will end the current digital session and prepare the table for the next guest with a fresh unique identifier.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Start New Session Overlay */}
        {isAddSessionOpen && (
            <div className="fixed inset-0 z-[3000] flex items-end justify-center animate-fade-in">
                <div onClick={() => setIsAddSessionOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                <div className="relative bg-white w-full max-w-lg rounded-t-[3rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up pb-12 max-h-[85vh]">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-5 shrink-0" />
                    <div className="px-10 pb-6 flex justify-between items-center border-b border-slate-50">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Spawn Session</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Pick table to initialize</p>
                        </div>
                        <button onClick={() => setIsAddSessionOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all shadow-sm"><i className="fa-solid fa-xmark text-lg"></i></button>
                    </div>

                    <div className="p-10 space-y-6 flex-1 overflow-y-auto no-scrollbar">
                        <div className="grid grid-cols-1 gap-3">
                            {qrNodes.filter(node => !activeSessions.some(s => s.qr_code_id === node.id)).length > 0 ? (
                                qrNodes.filter(node => !activeSessions.some(s => s.qr_code_id === node.id)).map(node => (
                                    <button 
                                        key={node.id} 
                                        onClick={() => handleStartManualSession(node.id)}
                                        className="w-full p-6 rounded-[2rem] bg-slate-50 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 flex items-center justify-between group transition-all"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm transition-all">
                                                <i className="fa-solid fa-chair text-lg"></i>
                                            </div>
                                            <span className="font-black uppercase text-slate-800 tracking-tight text-lg italic">{node.label}</span>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-200 group-hover:bg-indigo-600 group-hover:text-white shadow-sm transition-all">
                                            <i className="fa-solid fa-plus text-xs"></i>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="py-24 text-center opacity-30 italic flex flex-col items-center">
                                    <i className="fa-solid fa-check-circle text-4xl mb-4"></i>
                                    <p className="text-sm font-black uppercase tracking-widest">All tables are occupied</p>
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