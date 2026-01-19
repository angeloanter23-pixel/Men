
import React, { useState, useEffect } from 'react';
import * as MenuService from '../../services/menuService';

const AdminOrders: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'Preparing' | 'Serving' | 'Served'>('All');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
    const interval = setInterval(fetchLiveOrders, 5000); // Poll every 5 seconds for live updates
    return () => clearInterval(interval);
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

  const filteredOrders = orders.filter(o => filter === 'All' || o.order_status === filter);

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'Preparing': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Serving': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Served': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const getPaymentColor = (status: string) => {
    return status === 'Paid' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200';
  };

  return (
    <div className="p-6 lg:p-10 animate-fade-in font-['Plus_Jakarta_Sans']">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-slate-900">
            KITCHEN<span className="text-indigo-600">QUEUE</span>
          </h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-3 italic">Order Fulfillment Hub (Live)</p>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar max-w-full">
           {['All', 'Preparing', 'Serving', 'Served'].map(f => (
             <button 
               key={f} 
               onClick={() => setFilter(f as any)}
               className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === f ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
             >
               {f}
             </button>
           ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="py-32 text-center border-4 border-dashed border-slate-100 rounded-[3rem] bg-white">
            <i className="fa-solid fa-utensils text-4xl text-slate-100 mb-6"></i>
            <p className="text-slate-300 text-[11px] font-black uppercase tracking-[0.5em] italic">No active tickets</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:shadow-xl transition-all duration-500">
               <div className="flex items-center gap-6">
                 <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center text-indigo-400 border border-slate-100 shrink-0">
                    <i className="fa-solid fa-receipt text-xl"></i>
                 </div>
                 <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                       <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-tight truncate max-w-[200px]">{order.item_name}</h4>
                       <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded-lg shrink-0">x{order.quantity}</span>
                    </div>
                    <div className="flex flex-wrap gap-y-2 gap-x-4">
                       <div className="flex items-center gap-2">
                          <i className="fa-solid fa-location-dot text-[10px] text-slate-300"></i>
                          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{order.table_number?.replace(/-/g, ' ') || 'Walk-in'}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <i className="fa-solid fa-user text-[10px] text-slate-300"></i>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{order.customer_name}</span>
                       </div>
                       {order.qr_code_token && (
                         <div className="flex items-center gap-2">
                            <i className="fa-solid fa-qrcode text-[10px] text-indigo-300"></i>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{order.qr_code_token}</span>
                         </div>
                       )}
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-900">₱{order.amount.toLocaleString()}</span>
                       </div>
                    </div>
                    {order.instructions && (
                      <p className="text-[9px] text-orange-500 font-bold mt-2 italic">“{order.instructions}”</p>
                    )}
                 </div>
               </div>

               <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="flex flex-col gap-1 w-24">
                    <div className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border text-center ${getOrderStatusColor(order.order_status)}`}>
                        {order.order_status}
                    </div>
                    <button 
                      onClick={() => togglePayment(order.id, order.payment_status)}
                      className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border text-center transition-all active:scale-95 ${getPaymentColor(order.payment_status)}`}
                    >
                        {order.payment_status}
                    </button>
                  </div>
                  
                  <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                     {order.order_status === 'Preparing' && (
                       <button onClick={() => updateStatus(order.id, 'Serving')} className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm">Start Serving</button>
                     )}
                     {order.order_status === 'Serving' && (
                       <button onClick={() => updateStatus(order.id, 'Served')} className="px-4 py-2 bg-white text-emerald-600 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm">Mark Served</button>
                     )}
                     {order.order_status === 'Served' && (
                        <div className="px-4 py-2 text-[8px] font-black text-slate-300 uppercase tracking-widest italic">Ticket Closed</div>
                     )}
                     
                     {order.payment_status === 'Unpaid' && (
                       <button onClick={() => togglePayment(order.id, 'Unpaid')} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-sm">Mark Paid</button>
                     )}
                  </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
