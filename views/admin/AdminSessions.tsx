import React, { useState, useMemo } from 'react';
import * as MenuService from '../../services/menuService';

interface AdminSessionsProps {
  activeSessions: any[];
  qrNodes: any[];
  onRefresh: () => void;
  getRelativeTime: (ts: string) => string;
  orders: any[];
}

export default function AdminSessions({ activeSessions, qrNodes, onRefresh, getRelativeTime, orders }: AdminSessionsProps) {
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [activeModalTab, setActiveModalTab] = useState<'billing' | 'session'>('billing');

  const sessionsList = useMemo(() => {
    return activeSessions.map(s => {
        const qr = qrNodes.find(q => q.id === s.qr_code_id);
        return { ...s, table_label: qr?.label || 'Unidentified' };
    }).sort((a, b) => new Date(b.session_started_at || b.created_at).getTime() - new Date(a.session_started_at || a.created_at).getTime());
  }, [activeSessions, qrNodes]);

  const sessionOrders = useMemo(() => {
    if (!selectedSession) return [];
    return orders.filter(o => 
        o.qr_code_token === selectedSession.session_token || 
        o.table_number === selectedSession.table_label
    );
  }, [selectedSession, orders]);

  const billingStats = useMemo(() => {
    const total = sessionOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const paid = sessionOrders.filter(o => o.payment_status === 'Paid').reduce((sum, o) => sum + (o.amount || 0), 0);
    const unpaid = total - paid;
    return { total, paid, unpaid };
  }, [sessionOrders]);

  const handleTerminateAndReset = async () => {
    if (!selectedSession) return;
    
    setIsUpdating(true);
    try {
        // 1. End current session (Invalidates old token/PIN)
        await MenuService.endTableSession(selectedSession.id);
        
        // 2. Start new session for same table (Creates new token/PIN)
        await MenuService.createManualSession(selectedSession.qr_code_id);
        
        // Update UI state
        setShowTerminateConfirm(false);
        setSelectedSession(null);
        onRefresh();
    } catch (e: any) {
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
      } catch (e: any) {
          console.error("Session start failed", e);
          alert("Failed to start session: " + (e.message || "Unknown error"));
      } finally {
          setIsUpdating(false);
      }
  };

  return (
    <div className="space-y-4 animate-fade-in px-1">
        <div className="flex justify-between items-center px-4">
            <h3 className="text-[11px] font-bold text-slate-400 tracking-tight">Active tables</h3>
            <button onClick={() => setIsAddSessionOpen(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold tracking-tight shadow-md active:scale-95 transition-all">Start new</button>
        </div>
        
        <div className="bg-white rounded-xl overflow-hidden border border-slate-200/60 shadow-sm divide-y divide-slate-100">
            {sessionsList.map((session) => (
                <button 
                    key={session.id} 
                    onClick={() => { setSelectedSession(session); setIsEditingPin(false); setActiveModalTab('billing'); }}
                    className="w-full p-4 flex items-center justify-between active:bg-slate-50 transition-colors text-left group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                            <i className="fa-solid fa-chair text-sm"></i>
                        </div>
                        <div>
                            <h4 className="text-[16px] font-bold text-slate-900 tracking-tight leading-none mb-1">{session.table_label}</h4>
                            <p className="text-[10px] font-medium text-slate-400">{getRelativeTime(session.session_started_at || session.created_at)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex flex-col items-end">
                            <span className="text-[12px] font-bold text-emerald-600 tracking-tight">PIN: {session.verification_code}</span>
                            <span className="text-[9px] font-medium text-slate-300">
                                {session.pin_required !== false ? 'Protected' : 'Open access'}
                            </span>
                        </div>
                        <i className="fa-solid fa-chevron-right text-slate-200 text-[10px] group-active:translate-x-1 transition-transform"></i>
                    </div>
                </button>
            ))}
        </div>
        {sessionsList.length === 0 && <div className="py-24 text-center text-slate-300 text-[11px] font-medium">No active table sessions.</div>}

        {selectedSession && (
            <div className="fixed inset-0 z-[3000] flex items-end justify-center animate-fade-in p-0">
                <div onClick={() => !isUpdating && setSelectedSession(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                <div className="relative bg-[#F2F2F7] w-full max-w-lg rounded-t-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up pb-8 max-h-[92vh]">
                    <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto my-4 shrink-0" />
                    
                    <div className="px-6 pb-0 bg-white border-b border-slate-100">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none italic">{selectedSession.table_label}</h3>
                                <p className="text-[10px] font-bold text-indigo-600 mt-2 tracking-widest leading-none">Table Management</p>
                            </div>
                            <button onClick={() => setSelectedSession(null)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all border border-slate-100"><i className="fa-solid fa-xmark text-lg"></i></button>
                        </div>
                        
                        <div className="flex gap-6">
                            <button 
                                onClick={() => setActiveModalTab('billing')}
                                className={`pb-4 text-sm font-bold tracking-tight border-b-2 transition-all ${activeModalTab === 'billing' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                            >
                                Billing
                            </button>
                            <button 
                                onClick={() => setActiveModalTab('session')}
                                className={`pb-4 text-sm font-bold tracking-tight border-b-2 transition-all ${activeModalTab === 'session' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                            >
                                Session
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                        {activeModalTab === 'billing' && (
                            <div className="space-y-6">
                                {/* Billing Summary Card */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                                    <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Bill</span>
                                        <span className="text-2xl font-black text-slate-900 tracking-tight">₱{billingStats.total.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Paid</span>
                                        <span className="text-sm font-bold text-emerald-600 tracking-tight">₱{billingStats.paid.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Unpaid</span>
                                        <span className="text-xl font-black text-rose-600 tracking-tight">₱{billingStats.unpaid.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Orders List */}
                                <div className="space-y-3">
                                    <h4 className="text-[11px] font-bold text-slate-400 tracking-tight px-2">Order History</h4>
                                    {sessionOrders.length > 0 ? (
                                        <div className="bg-white rounded-xl overflow-hidden border border-slate-200/60 shadow-sm divide-y divide-slate-100">
                                            {sessionOrders.map(order => (
                                                <div key={order.id} className="p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-100">
                                                            {order.quantity}x
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900 leading-tight">{order.item_name}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{order.customer_name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-slate-900">₱{order.amount.toLocaleString()}</p>
                                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${order.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                            {order.payment_status || 'Unpaid'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-slate-400 text-xs font-medium italic">No orders for this session yet.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeModalTab === 'session' && (
                            <>
                                {/* PIN Control Section */}
                                <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 tracking-tight">PIN protection</h4>
                                            <p className="text-[10px] font-medium text-slate-400 mt-1">Require code for table ordering</p>
                                        </div>
                                        <button 
                                            onClick={() => handleTogglePinRequirement(selectedSession.id, selectedSession.pin_required !== false)}
                                            disabled={isUpdating}
                                            className={`w-12 h-7 rounded-full transition-all flex items-center px-1 border-2 ${selectedSession.pin_required !== false ? 'bg-indigo-600 border-indigo-700' : 'bg-slate-200 border-slate-300'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-lg transform transition-transform ${selectedSession.pin_required !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
                                        <div>
                                            <span className="text-[9px] font-bold text-slate-300 block mb-1">Active table code</span>
                                            {isEditingPin ? (
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        autoFocus
                                                        maxLength={4}
                                                        value={newPin}
                                                        onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                                                        className="w-24 bg-slate-50 border-2 border-indigo-600 rounded-lg px-3 py-1.5 font-bold text-indigo-600 text-lg outline-none"
                                                        placeholder="0000"
                                                    />
                                                    <button onClick={handleUpdatePinManual} className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] shadow-lg">Save</button>
                                                    <button onClick={() => setIsEditingPin(false)} className="text-slate-400 font-bold text-[10px]">Cancel</button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <span className="text-3xl font-black text-slate-900 tracking-widest tabular-nums">{selectedSession.verification_code}</span>
                                                    <button onClick={() => { setIsEditingPin(true); setNewPin(selectedSession.verification_code); }} className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center active:scale-90 transition-all"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] font-bold text-slate-300 block mb-1">Status</span>
                                            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5 justify-end">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                                Online
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* SINGLE ACTION BUTTON */}
                                <div className="pt-2">
                                    <button 
                                        onClick={() => setShowTerminateConfirm(true)}
                                        disabled={isUpdating}
                                        className="w-full py-5 bg-rose-600 text-white rounded-xl flex flex-col items-center justify-center gap-0.5 shadow-xl shadow-rose-100 active:scale-95 transition-all group overflow-hidden relative"
                                    >
                                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                                        <div className="flex items-center gap-2 relative z-10">
                                            {isUpdating ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-power-off text-xs"></i>}
                                            <span className="font-bold text-[13px] tracking-tight">Terminate & reset session</span>
                                        </div>
                                        <span className="text-[9px] font-medium text-rose-200 relative z-10">Ends current session and generates new PIN</span>
                                    </button>
                                    
                                    <p className="mt-4 text-center text-[10px] text-slate-400 font-medium px-6 leading-relaxed">
                                        This will end the current digital session and prepare the table for the next guest with a fresh entry code.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Terminate Confirmation Modal */}
        {showTerminateConfirm && (
            <div className="fixed inset-0 z-[4000] flex items-end justify-center animate-fade-in p-0">
                <div onClick={() => !isUpdating && setShowTerminateConfirm(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                <div className="relative bg-white w-full max-w-lg rounded-t-2xl shadow-2xl p-6 pb-10 flex flex-col animate-slide-up space-y-6">
                    <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mx-auto text-xl">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <div className="text-center space-y-1">
                        <h3 className="text-xl font-bold tracking-tight">Terminate session?</h3>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                            This will immediately log out current guests at <span className="font-bold text-slate-900">{selectedSession?.table_label}</span> and generate a brand new entry code.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={handleTerminateAndReset}
                            disabled={isUpdating}
                            className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold text-[12px] tracking-widest shadow-xl shadow-rose-200 active:scale-95 transition-all"
                        >
                            {isUpdating ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Confirm termination'}
                        </button>
                        <button 
                            onClick={() => setShowTerminateConfirm(false)}
                            className="w-full py-4 bg-slate-100 text-slate-500 rounded-xl font-bold text-[12px] tracking-widest active:scale-95 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Start New Session Overlay */}
        {isAddSessionOpen && (
            <div className="fixed inset-0 z-[3000] flex items-end justify-center animate-fade-in">
                <div onClick={() => setIsAddSessionOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                <div className="relative bg-white w-full max-w-lg rounded-t-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up pb-10 max-h-[85vh]">
                    <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto my-4 shrink-0" />
                    <div className="px-6 pb-4 flex justify-between items-center border-b border-slate-50">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Start session</h2>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">Pick a table to initialize</p>
                        </div>
                        <button onClick={() => setIsAddSessionOpen(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all shadow-sm"><i className="fa-solid fa-xmark text-lg"></i></button>
                    </div>

                    <div className="p-6 space-y-4 flex-1 overflow-y-auto no-scrollbar">
                        <div className="grid grid-cols-1 gap-2">
                            {qrNodes.filter(node => !activeSessions.some(s => s.qr_code_id === node.id)).length > 0 ? (
                                qrNodes.filter(node => !activeSessions.some(s => s.qr_code_id === node.id)).map(node => (
                                    <button 
                                        key={node.id} 
                                        onClick={() => handleStartManualSession(node.id)}
                                        className="w-full p-4 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 flex items-center justify-between group transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm transition-all">
                                                <i className="fa-solid fa-chair text-sm"></i>
                                            </div>
                                            <span className="font-bold text-slate-800 tracking-tight text-base">{node.label}</span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-200 group-hover:bg-indigo-600 group-hover:text-white shadow-sm transition-all">
                                            <i className="fa-solid fa-plus text-[10px]"></i>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="py-20 text-center opacity-30 flex flex-col items-center">
                                    <i className="fa-solid fa-check-circle text-3xl mb-3"></i>
                                    <p className="text-[11px] font-bold">All tables are occupied</p>
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