
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
    // Resolve ID from session if prop is missing
    const sessionRaw = localStorage.getItem('foodie_supabase_session');
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    const sessionRestaurantId = session?.restaurant?.id;

    const rid = restaurantId || sessionRestaurantId; 
    
    // If no table or no restaurant ID, we cannot fetch from Supabase
    if (!tableNumber || !rid) {
      console.log("Demo/Preview Mode: No valid restaurant context for live stream.");
      return;
    }
    
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

  // Note: For demo mode, we might want to show local storage orders here
  // but for now we'll handle the 'No Session' UI which is more accurate.
  if (!tableNumber) {
    return (
      <div className="p-10 text-center py-40 md:py-64 animate-fade-in flex flex-col items-center">
        <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-8 text-4xl md:text-5xl shadow-inner">
          <i className="fa-solid fa-receipt"></i>
        </div>
        <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-4 uppercase italic tracking-tighter">No Active <span className="text-orange-500">Session</span></h2>
        <p className="text-slate-400 text-sm md:text-lg max-w-[240px] md:max-w-md mb-12 leading-relaxed font-medium">Please scan a table QR code to view your active order history and tickets.</p>
        <button onClick={onGoToMenu} className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black text-[10px] tracking-[0.4em] uppercase shadow-2xl active:scale-95 transition-all hover:bg-indigo-600">BACK TO MENU</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in font-['Plus_Jakarta_Sans'] bg-slate-50/50 min-h-screen pb-40">
      <div className="max-w-[1200px] mx-auto px-6 py-10 md:py-20">
        <header className="mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div>
            <p className="text-[10px] md:text-[12px] font-black text-indigo-500 uppercase tracking-[0.5em] mb-3 italic">Live Stream</p>
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Your <span className="text-orange-500">Tickets</span></h2>
          </div>
          <div className="text-left md:text-right bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4 md:flex-col md:items-end md:gap-1">
             <div className="w-10 h-10 md:hidden bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><i className="fa-solid fa-location-dot"></i></div>
             <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Active Table</p>
                <p className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">{tableNumber}</p>
             </div>
          </div>
        </header>

        {orders.length === 0 ? (
          <div className="py-32 text-center border-4 border-dashed border-slate-100 rounded-[4rem] bg-white shadow-sm flex flex-col items-center">
            <i className="fa-solid fa-utensils text-slate-100 text-6xl mb-8"></i>
            <p className="text-slate-300 text-[11px] md:text-sm font-black uppercase tracking-[0.6em] italic">Kitchen is currently quiet...</p>
            {/* Context Helper */}
            {!restaurantId && !localStorage.getItem('foodie_supabase_session') && (
              <p className="mt-4 text-[9px] text-slate-300 uppercase tracking-widest">Orders are local-only in Demo Mode</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white p-6 md:p-8 rounded-[3rem] border border-slate-50 shadow-sm flex gap-6 md:gap-10 animate-fade-in group hover:shadow-xl transition-all duration-500">
                   <div className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0 group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-fire-burner text-2xl group-hover:animate-bounce"></i>
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-black text-lg text-slate-800 uppercase italic tracking-tight truncate pr-4 leading-none">{order.item_name}</h4>
                        <span className="text-sm font-black text-indigo-600 italic">₱{order.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex gap-4 items-center mb-6">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Qty: {order.quantity}</span>
                        <div className="w-1.5 h-1.5 bg-slate-100 rounded-full"></div>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className={`px-6 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-colors ${
                           order.order_status === 'Served' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                           order.order_status === 'Serving' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                         }`}>
                           {order.order_status}
                         </span>
                         <span className={`text-[10px] font-black uppercase tracking-widest italic ${order.payment_status === 'Paid' ? 'text-emerald-500' : 'text-rose-400'}`}>
                           {order.payment_status}
                         </span>
                      </div>
                   </div>
                </div>
              ))}
            </div>

            {totalUnpaid > 0 && (
              <div className="mt-0 lg:sticky lg:top-32 bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform duration-1000"></div>
                 <div className="relative z-10">
                    <p className="text-[12px] font-black uppercase tracking-[0.6em] text-orange-500 mb-6">Settlement Request</p>
                    <div className="space-y-8">
                       <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Outstanding Bill Amount</p>
                          <h3 className="text-6xl font-black italic tracking-tighter leading-none">₱{totalUnpaid.toLocaleString()}</h3>
                       </div>
                       
                       <p className="text-[10px] font-medium text-slate-400 leading-relaxed max-w-xs italic">This amount represents the total for all items currently marked as 'Unpaid' in your active ticket list.</p>
                       
                       <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-4">
                          <button 
                            onClick={onPayNow}
                            className="flex-1 bg-white text-slate-900 px-10 py-6 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] active:scale-95 transition-all shadow-xl hover:bg-orange-500 hover:text-white"
                          >
                            SETTLE BILL
                          </button>
                          <button onClick={onGoToMenu} className="flex-1 px-10 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest border border-white/20 hover:bg-white/5 transition-all">
                            ORDER MORE
                          </button>
                       </div>
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
