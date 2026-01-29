import React, { useState, useEffect, useMemo } from 'react';
import * as MenuService from '../../services/menuService';
import { supabase } from '../../lib/supabase';

type SubTab = 'orders' | 'messages' | 'tables';

const AdminOrders: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [qrNodes, setQrNodes] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());
  const [confirmEndSession, setConfirmEndSession] = useState<any>(null);

  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const restaurantId = sessionRaw ? JSON.parse(sessionRaw)?.restaurant?.id : null;

  const fetchData = async () => {
    if (!restaurantId) return;
    try { 
      const [ord, msg, ses, qrs] = await Promise.all([
        MenuService.getMerchantOrders(restaurantId),
        MenuService.getLiveMessages(restaurantId),
        MenuService.getActiveSessionsForRestaurant(restaurantId),
        MenuService.getQRCodes(restaurantId)
      ]);
      setOrders(ord); setMessages(msg); setActiveSessions(ses); setQrNodes(qrs);
    } catch (e) { console.error("Sync Failure:", e); }
  };

  useEffect(() => {
    fetchData();
    // Use granular channels for reliability
    const orderChannel = supabase.channel('orders-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
        .subscribe();
    const sessionChannel = supabase.channel('sessions-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'table_sessions' }, fetchData)
        .subscribe();
    const msgChannel = supabase.channel('msgs-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchData)
        .subscribe();

    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => { 
        supabase.removeChannel(orderChannel); 
        supabase.removeChannel(sessionChannel); 
        supabase.removeChannel(msgChannel);
        clearInterval(timer); 
    };
  }, [restaurantId]);

  const handleEndSession = async (sessionId: string) => {
    try { 
        await MenuService.endTableSession(sessionId); 
        setConfirmEndSession(null); 
        await fetchData(); 
    } catch (e) { alert("Failed to clear table."); }
  };

  const handleResetPin = async (qrId: string) => {
    try { await MenuService.resetTablePin(qrId); await fetchData(); } catch (e) { alert("PIN reset failed."); }
  };

  const toggleOrderStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Served' ? 'Preparing' : 'Served';
    // Optimistic Update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, order_status: newStatus } : o));
    try {
        await MenuService.updateOrder(id, { order_status: newStatus });
    } catch (e) {
        fetchData(); // Rollback
    }
  };

  const groupedOrders = useMemo(() => {
    const groups: Record<string, any> = {};
    orders.forEach(o => {
        if (!groups[o.table_number]) groups[o.table_number] = { table: o.table_number, sessionId: o.session_id, latest: o.created_at, items: [] };
        groups[o.table_number].items.push(o);
        if (new Date(o.created_at) > new Date(groups[o.table_number].latest)) groups[o.table_number].latest = o.created_at;
    });
    return Object.values(groups).sort((a,b) => new Date(b.latest).getTime() - new Date(a.latest).getTime());
  }, [orders]);

  const sortedTables = useMemo(() => {
    return qrNodes.map(qr => {
        const session = activeSessions.find(s => s.qr_id === qr.id);
        const tableOrders = orders.filter(o => o.table_number === qr.label);
        const participants = Array.from(new Set(tableOrders.map(o => o.customer_name)));
        const total = tableOrders.reduce((s, o) => s + o.amount, 0);
        return { ...qr, session, participants, total, isActive: !!session, tableOrders };
    }).sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0));
  }, [qrNodes, activeSessions, orders]);

  const formatCountdown = (expiry: string) => {
    const diff = Math.max(0, new Date(expiry).getTime() - now.getTime());
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return diff > 0 ? `${mins}m ${secs}s` : 'Expired';
  };

  return (
    <div className="flex flex-col h-full animate-fade-in font-jakarta bg-slate-50/50 min-h-screen pb-40">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-[45] px-4 py-4 shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex gap-2 max-w-5xl mx-auto">
          {[{id:'orders', l:'Live Queue', i:'fa-fire-burner'}, {id:'messages', l:'Guest Chat', i:'fa-comment'}, {id:'tables', l:'Table Control', i:'fa-table-list'}].map(t => (
            <button key={t.id} onClick={() => setActiveSubTab(t.id as any)} className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeSubTab === t.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>
              <i className={`fa-solid ${t.i} text-xs`}></i> {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
        {activeSubTab === 'orders' && (
          <div className="grid grid-cols-1 gap-8">
            {groupedOrders.map(group => (
              <div key={group.table} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                 <header className="bg-slate-900 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><i className="fa-solid fa-location-dot"></i></div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter">{group.table}</h3>
                    </div>
                    <button onClick={() => setConfirmEndSession(group)} className="px-5 py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-all">Clear Table</button>
                 </header>
                 <div className="p-8 space-y-6">
                    {group.items.sort((a:any, b:any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((order:any) => (
                        <div key={order.id} className="flex items-center justify-between border-b border-slate-50 last:border-0 pb-6 last:pb-0">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-800 border">x{order.quantity}</div>
                                <div>
                                    <h4 className="font-black text-slate-900 uppercase italic text-sm">{order.item_name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.customer_name} • {new Date(order.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                </div>
                            </div>
                            <button onClick={() => toggleOrderStatus(order.id, order.order_status)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${order.order_status === 'Served' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white text-indigo-600 border-indigo-100'}`}>{order.order_status === 'Served' ? 'Served' : 'Serve'}</button>
                        </div>
                    ))}
                 </div>
              </div>
            ))}
            {groupedOrders.length === 0 && <div className="py-40 text-center opacity-20 italic uppercase font-black tracking-widest">No active kitchen orders</div>}
          </div>
        )}

        {activeSubTab === 'tables' && (
          <div className="grid grid-cols-1 gap-6">
            {sortedTables.map(t => (
              <div key={t.id} className={`bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group transition-all hover:shadow-xl ${!t.isActive ? 'opacity-40 grayscale' : ''}`}>
                 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-4 lg:w-1/3">
                        <div className="flex items-center gap-4">
                            <h4 className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none">{t.label}</h4>
                            <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${t.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{t.isActive ? 'Occupied' : 'Vacant'}</div>
                        </div>
                        {t.isActive && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Guest Participants ({t.participants.length})</p>
                                <div className="flex flex-wrap gap-2">
                                    {t.participants.map((p: string, i: number) => (
                                        <span key={i} className="text-[10px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">{p}</span>
                                    ))}
                                    {t.participants.length === 0 && <span className="text-[10px] font-bold text-slate-300 italic">No names yet</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    {t.isActive ? (
                       <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center">
                          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-3">
                            <div className="flex justify-between items-center"><p className="text-[9px] font-black text-slate-400 uppercase">PIN</p><span className="text-2xl font-black text-indigo-600 tracking-[0.2em]">{t.session.verification_code}</span></div>
                            <div className="flex justify-between items-center"><p className="text-[9px] font-black text-slate-400 uppercase">Expires</p><span className="text-[11px] font-black text-rose-500 uppercase">{formatCountdown(t.session.verification_expires_at)}</span></div>
                            <button onClick={() => handleResetPin(t.id)} className="w-full py-2.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase text-indigo-600 hover:bg-indigo-50 transition-all">New PIN</button>
                          </div>
                          <div className="space-y-4">
                            <div>
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Session Node ID</p>
                                <p className="font-mono text-[10px] text-slate-400 truncate">{t.session.id}</p>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Total Bill</p>
                                    <p className="text-2xl font-black text-slate-900">₱{t.total.toLocaleString()}</p>
                                </div>
                                <button onClick={() => setConfirmEndSession({ table: t.label, sessionId: t.session.id })} className="text-[10px] font-black uppercase text-rose-500 underline decoration-rose-500/30">End Session</button>
                            </div>
                          </div>
                          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 max-h-[120px] overflow-y-auto no-scrollbar">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Session Logs</p>
                             {t.tableOrders.slice(0, 3).map((o: any) => (
                                 <div key={o.id} className="flex justify-between text-[9px] mb-1">
                                     <span className="text-slate-600 font-bold truncate pr-4">{o.item_name}</span>
                                     <span className={`font-black uppercase ${o.order_status === 'Served' ? 'text-emerald-500' : 'text-indigo-400'}`}>{o.order_status}</span>
                                 </div>
                             ))}
                          </div>
                       </div>
                    ) : (
                       <div className="flex-1 py-8 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                          <i className="fa-solid fa-check-circle text-slate-200 text-3xl mb-2"></i>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Station Available</p>
                       </div>
                    )}
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmEndSession && (
        <div className="fixed inset-0 z-[600] flex items-end justify-center p-0 animate-fade-in">
            <div onClick={() => setConfirmEndSession(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <div className="relative bg-white w-full max-w-lg rounded-t-[3.5rem] p-10 space-y-10 shadow-2xl animate-slide-up pb-16">
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto" />
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto text-3xl"><i className="fa-solid fa-triangle-exclamation"></i></div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter italic">End Table Session?</h3>
                    <p className="text-slate-400 text-sm font-medium italic max-w-xs mx-auto">This clears the order queue and invalidates the current PIN for <strong>Table {confirmEndSession.table}</strong>. New guests will start with a fresh basket.</p>
                </div>
                <div className="flex flex-col gap-3">
                    <button onClick={() => handleEndSession(confirmEndSession.sessionId)} className="w-full py-6 bg-rose-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">I Understand, Proceed</button>
                    <button onClick={() => setConfirmEndSession(null)} className="w-full py-4 text-[10px] font-black uppercase text-slate-300 hover:text-slate-900 transition-colors">Go Back</button>
                </div>
            </div>
        </div>
      )}
      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
      `}</style>
    </div>
  );
};

export default AdminOrders;