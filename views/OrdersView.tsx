import React, { useState, useEffect } from 'react';
import * as MenuService from '../services/menuService';

interface OrdersViewProps {
  restaurantId?: string;
  tableNumber: string | null;
  onPayNow: () => void;
  onGoToMenu: () => void;
}

const OrdersView: React.FC<OrdersViewProps> = ({ restaurantId, tableNumber, onPayNow, onGoToMenu }) => {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (tableNumber) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [tableNumber, restaurantId]);

  const fetchOrders = async () => {
    const sessionRaw = localStorage.getItem('foodie_supabase_session');
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    const rid = restaurantId || session?.restaurant?.id; 
    if (!tableNumber || !rid) return;
    try {
      const data = await MenuService.getOrdersByTable(rid, tableNumber);
      setOrders(data);
    } catch (err) {
      console.error("Order fetch failed:", err);
    }
  };

  const totalUnpaid = orders
    .filter(o => o.payment_status === 'Unpaid')
    .reduce((sum, o) => sum + o.amount, 0);

  if (!tableNumber) {
    return (
      <div className="p-10 text-center py-48 animate-fade-in flex flex-col items-center">
        <div className="w-28 h-28 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-8 text-5xl">
          <i className="fa-solid fa-receipt"></i>
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter">No Active Orders</h2>
        <p className="text-slate-400 text-base max-w-sm mb-12 leading-relaxed font-medium">Please scan a table QR code to see your orders.</p>
        <button onClick={onGoToMenu} className="bg-slate-900 text-white px-16 py-6 rounded-[2rem] font-black text-[11px] tracking-widest uppercase shadow-2xl active:scale-95">Go to Menu</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in bg-[#FBFBFD] min-h-screen pb-48">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <header className="mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-8">
          <div>
            <p className="text-[11px] font-black text-brand-primary uppercase tracking-[0.4em] mb-2 leading-none">Track Order</p>
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none">Your <span className="text-brand-primary">Food</span></h2>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
             <div className="w-14 h-14 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center"><i className="fa-solid fa-location-dot text-xl"></i></div>
             <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] leading-none mb-1.5">Your Table</p>
                <p className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">{tableNumber}</p>
             </div>
          </div>
        </header>

        {orders.length === 0 ? (
          <div className="py-40 text-center border-4 border-dashed border-slate-100 rounded-[4rem] bg-white shadow-inner">
            <i className="fa-solid fa-fire-burner text-slate-100 text-6xl mb-6 animate-pulse"></i>
            <p className="text-slate-300 text-sm font-black uppercase tracking-[0.4em]">Waiting for your order...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              {orders.map((order) => (
                <div key={order.id} className="bg-white p-7 rounded-[3rem] border border-slate-50 shadow-sm flex gap-8 group hover:shadow-xl transition-all duration-500">
                   <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border-2 shrink-0 transition-colors ${
                     order.order_status === 'Served' ? 'bg-slate-50 text-slate-200 border-slate-100' : 'bg-brand-primary/5 text-brand-primary border-brand-primary/10'
                   }`}>
                      <i className="fa-solid fa-fire-burner text-2xl"></i>
                   </div>
                   <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-black text-xl text-slate-800 uppercase tracking-tight truncate leading-none">{order.item_name}</h4>
                        <span className="text-base font-black text-brand-primary">₱{order.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex gap-6 items-center mb-6">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty: {order.quantity}</span>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border transition-all ${
                           order.order_status === 'Served' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                           order.order_status === 'Serving' ? 'bg-orange-50 text-orange-600 border-orange-100 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-100'
                         }`}>
                           {order.order_status}
                         </span>
                         <span className={`text-[10px] font-black uppercase tracking-widest ${order.payment_status === 'Paid' ? 'text-emerald-500' : 'text-rose-400'}`}>
                           {order.payment_status}
                         </span>
                      </div>
                   </div>
                </div>
              ))}
            </div>

            {totalUnpaid > 0 && (
              <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl h-fit sticky top-28">
                 <div className="space-y-10">
                    <div>
                       <p className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-primary mb-3">Wait for bill</p>
                       <h3 className="text-6xl font-black tracking-tighter leading-none">₱{totalUnpaid.toLocaleString()}</h3>
                       <p className="text-sm font-medium text-slate-400 mt-6 leading-relaxed">Please pay your bill to finish your meal.</p>
                    </div>
                    
                    <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-5">
                       <button 
                         onClick={onPayNow}
                         className="flex-[2] bg-white text-slate-900 px-10 py-6 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl hover:bg-slate-50"
                       >
                         Pay Bill
                       </button>
                       <button onClick={onGoToMenu} className="flex-1 px-10 py-6 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] border-2 border-white/20 hover:bg-white/5 transition-all">
                         Add More
                       </button>
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersView;
