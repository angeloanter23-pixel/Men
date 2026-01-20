
import React, { useState, useEffect, useMemo } from 'react';
import * as MenuService from '../../services/menuService';

const AdminOrders: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'Preparing' | 'Serving' | 'Served'>('All');
  const [orders, setOrders] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());
  const [orderToDelete, setOrderToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get Restaurant ID from Session
  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const restaurantId = session?.restaurant?.id;

  const fetchLiveOrders = async () => {
    if (!restaurantId || restaurantId === "undefined") return;
    try {
      const data = await MenuService.getMerchantOrders(restaurantId);
      setOrders(data);
    } catch (err) {
      console.error("Kitchen Queue sync failure:", err);
    }
  };

  useEffect(() => {
    fetchLiveOrders();
    const pollInterval = setInterval(fetchLiveOrders, 5000);
    const clockInterval = setInterval(() => setNow(new Date()), 60000); // Update relative time every minute
    return () => {
      clearInterval(pollInterval);
      clearInterval(clockInterval);
    };
  }, [restaurantId]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await MenuService.updateOrder(id, { order_status: newStatus });
      await fetchLiveOrders();
    } catch (err) {
      alert("Status update failed.");
    }
  };

  const togglePayment = async (id: string, current: string) => {
    try {
      const next = current === 'Paid' ? 'Unpaid' : 'Paid';
      await MenuService.updateOrder(id, { payment_status: next });
      await fetchLiveOrders();
    } catch (err) {
      alert("Payment toggle failed.");
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      await MenuService.deleteOrder(orderToDelete.id);
      await fetchLiveOrders();
      setOrderToDelete(null);
    } catch (err) {
      alert("Deletion failed.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredOrders = useMemo(() => 
    orders.filter(o => filter === 'All' || o.order_status === filter),
    [orders, filter]
  );

  const stats = useMemo(() => ({
    total: orders.length,
    preparing: orders.filter(o => o.order_status === 'Preparing').length,
    serving: orders.filter(o => o.order_status === 'Serving').length,
    served: orders.filter(o => o.order_status === 'Served').length,
  }), [orders]);

  const getTimeElapsed = (timestamp: string) => {
    const start = new Date(timestamp);
    const diff = Math.floor((now.getTime() - start.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    return `${diff}m ago`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Preparing': return 'bg-indigo-600 text-white shadow-indigo-200';
      case 'Serving': return 'bg-orange-500 text-white shadow-orange-200';
      case 'Served': return 'bg-slate-100 text-slate-400';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="p-4 lg:p-10 animate-fade-in font-jakarta bg-slate-50/50 min-h-full">
      {/* Dynamic Dashboard Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl -mx-4 lg:-mx-10 px-4 lg:px-10 py-6 mb-8 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Kitchen Command Terminal</p>
            </div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-slate-900">
              Live <span className="text-indigo-600">Tickets</span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                {[
                  { id: 'All', count: stats.total },
                  { id: 'Preparing', count: stats.preparing },
                  { id: 'Serving', count: stats.serving },
                  { id: 'Served', count: stats.served }
                ].map(f => (
                  <button 
                    key={f.id} 
                    onClick={() => setFilter(f.id as any)}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filter === f.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {f.id}
                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${filter === f.id ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>{f.count}</span>
                  </button>
                ))}
             </div>
             <button onClick={fetchLiveOrders} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all flex items-center justify-center active:scale-90 shadow-sm">
                <i className="fa-solid fa-rotate-right text-sm"></i>
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.length === 0 ? (
            <div className="py-40 text-center flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-slate-100 text-4xl mb-6 shadow-sm border border-slate-50">
                <i className="fa-solid fa-wind"></i>
              </div>
              <p className="text-slate-300 text-[11px] font-black uppercase tracking-[0.5em] italic">No matching tickets found</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className={`bg-white rounded-[2rem] border transition-all duration-500 flex flex-col lg:flex-row shadow-sm hover:shadow-xl group overflow-hidden ${order.order_status === 'Served' ? 'opacity-60 border-slate-100 grayscale-[0.5]' : 'border-white'}`}>
                {/* Status Sidebar (Color Strip) */}
                <div className={`w-full lg:w-3 ${order.order_status === 'Preparing' ? 'bg-indigo-500' : order.order_status === 'Serving' ? 'bg-orange-500' : 'bg-slate-200'}`}></div>

                <div className="flex-1 p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  {/* Left: Identity & Item */}
                  <div className="flex items-center gap-8 min-w-0">
                    <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center shrink-0 border-2 ${order.order_status === 'Preparing' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : order.order_status === 'Serving' ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                       <span className="text-[10px] font-black uppercase leading-none mb-1 opacity-60">Qty</span>
                       <span className="text-3xl font-black italic tracking-tighter">x{order.quantity}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter truncate leading-none">{order.item_name}</h4>
                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusStyle(order.order_status)}`}>
                          {order.order_status}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-x-6 gap-y-2 items-center">
                         <div className="flex items-center gap-2">
                           <i className="fa-solid fa-location-dot text-[10px] text-slate-300"></i>
                           <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-lg">{order.table_number || 'Walk-in'}</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <i className="fa-solid fa-user text-[10px] text-slate-300"></i>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{order.customer_name}</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <i className="fa-solid fa-clock text-[10px] text-slate-300"></i>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{getTimeElapsed(order.created_at)}</span>
                         </div>
                      </div>

                      {order.instructions && (
                        <div className="mt-4 bg-orange-50/50 p-3 rounded-2xl border border-orange-100/50 inline-block max-w-full">
                           <p className="text-[10px] text-orange-600 font-bold leading-relaxed italic">
                             <i className="fa-solid fa-quote-left mr-2 opacity-30"></i>
                             {order.instructions}
                           </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                    <div className="text-right sm:pr-6 sm:border-r border-slate-100">
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Total Value</p>
                       <p className="text-xl font-black text-slate-900 tracking-tighter italic leading-none">₱{order.amount.toLocaleString()}</p>
                    </div>

                    <div className="flex gap-2 p-1.5 bg-slate-50 rounded-[1.8rem] border border-slate-100 items-center">
                      <button 
                        onClick={() => togglePayment(order.id, order.payment_status)}
                        className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 border ${order.payment_status === 'Paid' ? 'bg-white border-emerald-100 text-emerald-600 shadow-sm' : 'bg-rose-500 text-white border-transparent shadow-lg shadow-rose-200'}`}
                      >
                        {order.payment_status === 'Paid' ? <i className="fa-solid fa-circle-check mr-2"></i> : <i className="fa-solid fa-credit-card mr-2"></i>}
                        {order.payment_status}
                      </button>

                      {order.order_status === 'Preparing' && (
                        <button onClick={() => updateStatus(order.id, 'Serving')} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200 active:scale-95">
                          Start Serving
                        </button>
                      )}
                      
                      {order.order_status === 'Serving' && (
                        <button onClick={() => updateStatus(order.id, 'Served')} className="px-6 py-3 bg-orange-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-orange-200 active:scale-95">
                          Finish Order
                        </button>
                      )}

                      {order.order_status === 'Served' && (
                        <div className="px-6 py-3 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] italic">
                          Ticket Closed
                        </div>
                      )}

                      <button 
                        onClick={() => setOrderToDelete(order)}
                        className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all active:scale-90 shadow-sm border border-rose-100"
                        title="Delete Ticket"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setOrderToDelete(null)}>
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl text-center space-y-8 animate-scale" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <i className="fa-solid fa-trash-can text-3xl"></i>
            </div>
            <div>
              <h4 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Purge Ticket?</h4>
              <p className="text-sm text-slate-400 font-medium mt-2 leading-relaxed">
                Permanently remove the ticket for <span className="text-slate-900 font-bold">"{orderToDelete.item_name}"</span>? This action cannot be reversed.
              </p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={handleDeleteOrder}
                disabled={isDeleting}
                className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isDeleting ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Yes, Delete Order'}
              </button>
              <button 
                onClick={() => setOrderToDelete(null)}
                className="w-full py-4 text-[10px] font-black uppercase text-slate-300 hover:text-slate-600 tracking-widest transition-colors"
              >
                Keep this Order
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-scale { animation: scale 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
};

export default AdminOrders;
