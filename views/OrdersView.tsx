
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
  const [loading, setLoading] = useState(false);

  // Poll for updates every 10 seconds for live status
  useEffect(() => {
    if (tableNumber) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [tableNumber, restaurantId]);

  const fetchOrders = async () => {
    if (!tableNumber) return;
    
    // Resolve ID from session if prop is missing
    const sessionRaw = localStorage.getItem('foodie_supabase_session');
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    const sessionRestaurantId = session?.restaurant?.id;

    const rid = restaurantId || sessionRestaurantId || '9148d88e-6701-4475-ae90-c08ef38411df'; 
    
    try {
      const data = await MenuService.getOrdersByTable(rid, tableNumber);
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch order stream:", err);
    }
  };

  const totalUnpaid = orders
    .filter(o => o.payment_status === 'Unpaid')
    .reduce((sum, o) => sum + o.amount, 0);

  if (!tableNumber) {
    return (
      <div className="p-10 text-center py-40 animate-fade-in flex flex-col items-center">
        <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-8 text-4xl shadow-inner">
          <i className="fa-solid fa-receipt"></i>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase italic tracking-tighter">No Active Session</h2>
        <p className="text-slate-400 text-sm max-w-[240px] mb-10 leading-relaxed font-medium">Please scan a table QR code to view your active order history.</p>
        <button onClick={onGoToMenu} className="bg-orange-500 text-white px-10 py-5 rounded-[2rem] font-black text-[10px] tracking-[0.3em] uppercase shadow-xl shadow-orange-100 active:scale-95 transition-all">BACK TO MENU</button>
      </div>
    );
  }

  return (
    <div className="p-6 pb-40 animate-fade-in font-['Plus_Jakarta_Sans']">
      <header className="mb-8 flex justify-between items-end px-2">
        <div>
           <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 italic">Order Stream</p>
           <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Your <span className="text-orange-500">Tickets</span></h2>
        </div>
        <div className="text-right">
           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Active Node</p>
           <p className="text-xs font-black text-slate-800 uppercase italic">{tableNumber}</p>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="py-24 text-center border-4 border-dashed border-slate-50 rounded-[3rem] bg-white shadow-sm flex flex-col items-center">
          <i className="fa-solid fa-utensils text-slate-100 text-5xl mb-6"></i>
          <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.4em]">Kitchen is quiet...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-50 shadow-sm flex gap-5 animate-fade-in group">
               <div className="w-16 h-16 rounded-[1.8rem] bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
                  <i className="fa-solid fa-fire-burner text-lg group-hover:animate-bounce"></i>
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-black text-sm text-slate-800 uppercase italic tracking-tight truncate pr-4">{order.item_name}</h4>
                    <span className="text-[10px] font-black text-indigo-600 italic">₱{order.amount}</span>
                  </div>
                  <div className="flex gap-3 items-center mb-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Quantity: {order.quantity}</span>
                    <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border ${
                       order.order_status === 'Served' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                       order.order_status === 'Serving' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                     }`}>
                       {order.order_status}
                     </span>
                     <span className={`text-[8px] font-black uppercase tracking-widest ${order.payment_status === 'Paid' ? 'text-emerald-500' : 'text-rose-400'}`}>
                       {order.payment_status}
                     </span>
                  </div>
               </div>
            </div>
          ))}

          {totalUnpaid > 0 && (
            <div className="mt-10 bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-700"></div>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 mb-2">Checkout Bill</p>
               <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-4xl font-black italic tracking-tighter">₱{totalUnpaid.toLocaleString()}</h3>
                    <p className="text-[8px] font-bold text-slate-500 mt-2 uppercase tracking-[0.2em]">Excludes already paid items</p>
                  </div>
                  <button 
                    onClick={onPayNow}
                    className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl hover:bg-orange-500 hover:text-white"
                  >
                    PAY NOW
                  </button>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersView;
