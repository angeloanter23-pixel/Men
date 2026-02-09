
import React, { useState } from 'react';
import * as MenuService from '../../services/menuService';

interface AdminWaiterRequestsProps {
  requests: any[];
  onRefresh: () => void;
  getRelativeTime: (ts: string) => string;
}

export default function AdminWaiterRequests({ requests, onRefresh, getRelativeTime }: AdminWaiterRequestsProps) {
  const [waiterActionTarget, setWaiterActionTarget] = useState<any | null>(null);

  const handleResolveRequest = async (requestId: string) => {
    try {
        await MenuService.supabase.from('messages').delete().eq('id', requestId);
        setWaiterActionTarget(null);
        onRefresh();
    } catch (e) {
        console.error("Failed to clear request");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 animate-fade-in">
        {requests.map((req) => (
            <div 
                key={req.id} 
                onClick={() => setWaiterActionTarget(req)} 
                className="bg-white p-6 rounded-[2.5rem] border border-rose-100 shadow-sm flex items-center justify-between animate-fade-in active:scale-[0.98] transition-transform cursor-pointer group"
            >
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg animate-pulse">
                        <i className="fa-solid fa-bell text-xl"></i>
                    </div>
                    <div className="text-left">
                        <h4 className="text-[18px] font-black text-slate-900 leading-none mb-1.5 uppercase italic">
                            {req.table_number}
                        </h4>
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none">
                            Help Requested
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <p className="text-[12px] font-black text-slate-400 uppercase">
                        {getRelativeTime(req.created_at)}
                    </p>
                    <i className="fa-solid fa-chevron-right text-[10px] text-slate-200 group-hover:translate-x-1 transition-transform"></i>
                </div>
            </div>
        ))}

        {requests.length === 0 && (
            <div className="py-32 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto text-2xl shadow-inner">
                    <i className="fa-solid fa-bell-slash"></i>
                </div>
                <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em] italic">No active requests</p>
            </div>
        )}

        {/* ACKNOWLEDGMENT ACTION SHEET */}
        {waiterActionTarget && (
            <div className="fixed inset-0 z-[2000] flex items-end justify-center animate-fade-in p-4">
                <div onClick={() => setWaiterActionTarget(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" />
                <div className="relative w-full max-w-lg space-y-3 animate-slide-up">
                    <div className="bg-white/95 backdrop-blur-2xl rounded-[1.5rem] overflow-hidden flex flex-col divide-y divide-slate-100 shadow-2xl">
                        <div className="px-6 py-5 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Service Alert</p>
                            <h4 className="text-sm font-bold text-slate-900">Request from {waiterActionTarget.table_number}</h4>
                        </div>
                        <button 
                            onClick={() => handleResolveRequest(waiterActionTarget.id)} 
                            className="w-full py-5 text-[#007AFF] font-bold text-[18px] active:bg-slate-100 transition-colors"
                        >
                            I'm heading there now
                        </button>
                        <button 
                            onClick={() => handleResolveRequest(waiterActionTarget.id)} 
                            className="w-full py-5 text-rose-500 font-bold text-[18px] active:bg-slate-100 transition-colors"
                        >
                            Clear alert
                        </button>
                    </div>
                    <button 
                        onClick={() => setWaiterActionTarget(null)} 
                        className="w-full bg-white py-5 rounded-[1.5rem] font-bold text-[18px] text-slate-900 active:scale-[0.98] transition-all shadow-xl"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )}
    </div>
  );
}
