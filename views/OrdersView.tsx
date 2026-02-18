import React, { useState, useEffect, useMemo } from 'react';
import * as MenuService from '../services/menuService';
import { supabase } from '../lib/supabase';

interface OrdersViewProps {
  restaurantId?: string;
  tableNumber: string | null;
  onPayNow: () => void;
  onGoToMenu: () => void;
  onIdentifyTable: () => void; 
}

const GlobalPulse: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center animate-fade-in p-6 font-jakarta">
        <div onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
        <div className="relative bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 text-center animate-scale overflow-hidden">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto text-3xl mb-6"><i className="fa-solid fa-tower-broadcast animate-pulse"></i></div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none italic mb-4">Venue Traffic</h3>
            <div className="grid grid-cols-1 gap-4">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Global Queue</p>
                    <p className="text-4xl font-black text-slate-900">28 <span className="text-lg text-slate-300 font-medium">Orders</span></p>
                    <p className="text-[9px] font-bold text-indigo-500 uppercase mt-2 tracking-widest">Across all 12 active tables</p>
                </div>
            </div>
            <button onClick={onClose} className="w-full mt-8 py-5 bg-slate-900 text-white rounded-full font-black uppercase text-[11px] tracking-widest shadow-xl">Close Pulse</button>
        </div>
    </div>
);

const OrdersView: React.FC<OrdersViewProps> = ({ restaurantId, tableNumber, onPayNow, onGoToMenu, onIdentifyTable }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'tracking'>('summary');
  const [statusFilter, setStatusFilter] = useState<'Pending' | 'Preparing' | 'Served'>('Preparing');
  const [showPulse, setShowPulse] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const fetchOrders = async () => {
    if (!tableNumber || !restaurantId) return;
    try {
      const data = await MenuService.getOrdersByTable(restaurantId, tableNumber);
      setOrders(data);
    } catch (err) { console.error("Order sync failed"); }
  };

  useEffect(() => {
    if (tableNumber && restaurantId) {
      fetchOrders();
      const channel = supabase.channel(`live-orders-${tableNumber}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` }, fetchOrders)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [tableNumber, restaurantId]);

  const localIds = useMemo(() => JSON.parse(localStorage.getItem('foodie_my_order_ids') || '[]'), [orders]);
  
  const { myOrders, groupOrders } = useMemo(() => {
    const list = activeTab === 'summary' ? orders : orders.filter(o => {
        if (statusFilter === 'Preparing') return o.order_status === 'Preparing' || o.order_status === 'Confirmed' || o.order_status === 'Serving';
        return o.order_status === statusFilter;
    });

    return {
        myOrders: list.filter(o => localIds.includes(String(o.id))),
        groupOrders: list.filter(o => !localIds.includes(String(o.id)))
    };
  }, [orders, activeTab, statusFilter, localIds]);

  if (!tableNumber) {
    return (
      <div className="p-10 text-center py-48 animate-fade-in flex flex-col items-center font-jakarta">
        <div className="w-24 h-24 bg-white text-slate-100 rounded-[2.5rem] flex items-center justify-center mb-8 text-4xl shadow-xl border border-slate-50"><i className="fa-solid fa-qrcode"></i></div>
        <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Locate Table.</h2>
        <button onClick={onIdentifyTable} className="w-full max-w-xs bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-xl active:scale-95 transition-all">Find My Table</button>
      </div>
    );
  }

  const OrderCard: React.FC<{ order: any }> = ({ order }) => (
    <div className="w-full bg-white p-5 rounded-[2.2rem] border border-white shadow-sm flex items-center justify-between transition-all">
        <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-800 border border-slate-100 text-[10px] shrink-0">x{order.quantity}</div>
            <div className="min-w-0">
                <h4 className="font-bold text-slate-800 uppercase text-sm leading-none mb-1.5 truncate">{order.item_name}</h4>
                <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${order.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>{order.payment_status}</span>
                    <span className="text-[8px] font-bold text-indigo-400 uppercase italic">/ {order.customer_name || 'Unknown'}</span>
                </div>
            </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-4">
            <span className="text-sm font-black text-slate-900 tracking-tighter">₱{order.amount.toLocaleString()}</span>
            <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">{order.order_status || 'Pending'}</span>
        </div>
    </div>
  );

  return (
    <div className="animate-fade-in bg-[#F2F2F7] min-h-screen pb-48 font-jakarta">
      <div className="max-w-[800px] mx-auto">
        
        {/* HEADER WITH PULSE ICON */}
        <header className="sticky top-[72px] z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-6 py-6 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 leading-none italic">Active Session</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">Table {tableNumber}</h2>
          </div>
          <button 
            onClick={() => setShowPulse(true)}
            className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all"
          >
            <i className="fa-solid fa-tower-broadcast text-xs animate-pulse"></i>
          </button>
        </header>

        {/* TOP NAV TABS */}
        <div className="px-6 pt-6">
            <div className="bg-slate-200/50 p-1 rounded-2xl flex border border-slate-200/50 shadow-inner">
                <button onClick={() => setActiveTab('summary')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'summary' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>All Orders</button>
                <button onClick={() => setActiveTab('tracking')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'tracking' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Status View</button>
            </div>
        </div>

        {/* SUB-STATUS TABS (IF TRACKING) */}
        {activeTab === 'tracking' && (
            <div className="px-6 pt-4 animate-fade-in">
                <div className="flex bg-white/50 p-1 rounded-full border border-slate-200 gap-1">
                    {(['Pending', 'Preparing', 'Served'] as const).map(s => (
                        <button 
                            key={s} 
                            onClick={() => setStatusFilter(s)}
                            className={`flex-1 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* CONTENT SECTIONS */}
        <section className="px-6 py-8 space-y-12">
            {/* MY SELECTION */}
            <div className="space-y-4">
                <div className="flex items-center gap-4 px-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">My Selection</span>
                    <div className="h-px bg-slate-200 flex-1 opacity-50"></div>
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                    {myOrders.map(order => <OrderCard key={order.id} order={order} />)}
                    {myOrders.length === 0 && (
                        <div className="py-10 text-center opacity-30 italic">
                            <p className="text-[9px] font-bold uppercase tracking-widest">No items from this device</p>
                        </div>
                    )}
                </div>
            </div>

            {/* GROUP ACTIVITY */}
            <div className="space-y-4">
                <div className="flex items-center gap-4 px-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Group Activity</span>
                    <div className="h-px bg-slate-200 flex-1 opacity-50"></div>
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                    {groupOrders.map(order => <OrderCard key={order.id} order={order} />)}
                    {groupOrders.length === 0 && (
                        <div className="py-10 text-center opacity-30 italic">
                            <p className="text-[9px] font-bold uppercase tracking-widest">No other activity found</p>
                        </div>
                    )}
                </div>
            </div>

            {orders.length === 0 && (
                <div className="py-24 text-center opacity-30 flex flex-col items-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4"><i className="fa-solid fa-receipt text-2xl"></i></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Kitchen is quiet</p>
                </div>
            )}
        </section>
      </div>

      {showPulse && <GlobalPulse onClose={() => setShowPulse(false)} />}

      <style>{`
        @keyframes scale { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale { animation: scale 0.3s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
      `}</style>
    </div>
  );
};

export default OrdersView;