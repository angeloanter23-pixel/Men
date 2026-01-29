
import React, { useState, useEffect } from 'react';
import * as MenuService from '../services/menuService';

interface OrdersViewProps {
  restaurantId?: string;
  tableNumber: string | null;
  onPayNow: () => void;
  onGoToMenu: () => void;
  onIdentifyTable: () => void; // Added new prop to trigger QR scan
}

const LogisticsStepper: React.FC<{ status: string }> = ({ status }) => {
    const steps = [
        { id: 'Pending', label: 'Order Received', desc: 'Awaiting kitchen queue', icon: 'fa-clipboard-check' },
        { id: 'Preparing', label: 'Chef Cooking', desc: 'Your meal is being prepared', icon: 'fa-fire-burner' },
        { id: 'Serving', label: 'Order Ready', desc: 'Quality checked & ready', icon: 'fa-bell-concierge' },
        { id: 'Served', label: 'Order Served', desc: 'Enjoy your meal!', icon: 'fa-circle-check' }
    ];

    const currentIdx = steps.findIndex(s => s.id === status);
    const safeIdx = currentIdx === -1 ? 0 : currentIdx;

    return (
        <div className="flex flex-col gap-6 py-4">
            {steps.map((step, i) => {
                const isActive = i <= safeIdx;
                const isCurrent = i === safeIdx;
                return (
                    <div key={step.id} className="flex gap-5 relative group">
                        {i < steps.length - 1 && (
                            <div className={`absolute left-[17px] top-[34px] bottom-[-24px] w-[3px] transition-all duration-700 ${i < safeIdx ? 'bg-brand-primary' : 'bg-slate-100'}`}></div>
                        )}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-500 border-4 ${
                            isActive ? 'bg-brand-primary border-brand-secondary text-white shadow-lg' : 'bg-white border-slate-50 text-slate-200'
                        }`}>
                            <i className={`fa-solid ${step.icon} text-[12px]`}></i>
                        </div>
                        <div className={`flex flex-col justify-center transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-20'}`}>
                            <p className={`text-[11px] font-black uppercase tracking-widest leading-none mb-1 ${isCurrent ? 'text-brand-primary' : 'text-slate-800'}`}>{step.label}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none">{isCurrent ? 'Live now' : step.desc}</p>
                        </div>
                        {isCurrent && (
                            <div className="absolute -left-1 -top-1 w-11 h-11 bg-brand-primary/10 rounded-full animate-ping pointer-events-none"></div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const OrdersView: React.FC<OrdersViewProps> = ({ restaurantId, tableNumber, onPayNow, onGoToMenu, onIdentifyTable }) => {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (tableNumber) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 8000);
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
      console.error("Tracking sync failed");
    }
  };

  const totalUnpaid = orders
    .filter(o => o.payment_status === 'Unpaid')
    .reduce((sum, o) => sum + o.amount, 0);

  if (!tableNumber) {
    return (
      <div className="p-10 text-center py-48 animate-fade-in flex flex-col items-center font-jakarta">
        <div className="w-28 h-28 bg-white text-slate-200 rounded-[3rem] flex items-center justify-center mb-10 text-5xl shadow-2xl border border-slate-50">
          <i className="fa-solid fa-qrcode text-indigo-600/20"></i>
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tighter italic">Scan QR to <span className="text-indigo-600">Track.</span></h2>
        <p className="text-slate-400 text-sm font-medium max-w-xs mb-12 italic leading-relaxed">
          Your table ID is required for live order updates and logistics tracking.
        </p>
        <div className="flex flex-col w-full max-w-xs gap-4">
          <button 
            onClick={onIdentifyTable} 
            className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <i className="fa-solid fa-camera"></i>
            Identify My Table
          </button>
          <button 
            onClick={onGoToMenu} 
            className="w-full bg-slate-50 text-slate-400 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in bg-[#FBFBFD] min-h-screen pb-48 font-jakarta">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <header className="mb-12 md:mb-16 flex flex-col md:flex-row md:justify-between md:items-end gap-8">
          <div>
            <p className="text-[11px] font-black text-brand-primary uppercase tracking-[0.4em] mb-3 italic">Autonomous Order Dispatch</p>
            <h2 className="text-5xl md:text-8xl font-black text-slate-900 uppercase tracking-tighter leading-[0.85]">TRACKING<br /> <span className="text-brand-primary">ENGINE.</span></h2>
          </div>
          <div className="bg-white p-6 md:p-8 rounded-[3rem] border border-slate-100 shadow-xl flex items-center gap-6 group">
             <div className="w-16 h-16 bg-brand-primary text-white rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg"><i className="fa-solid fa-location-dot text-2xl"></i></div>
             <div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1 italic">Identity Node</p>
                <p className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">{tableNumber}</p>
             </div>
          </div>
        </header>

        {orders.length === 0 ? (
          <div className="py-40 text-center border-4 border-dashed border-slate-100 rounded-[5rem] bg-white shadow-inner flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-100 text-4xl mb-6 animate-pulse"><i className="fa-solid fa-cloud-arrow-down"></i></div>
            <p className="text-slate-300 text-xs font-black uppercase tracking-[0.8em] italic">No active deployments found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
            <div className="lg:col-span-8 space-y-8">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-[4rem] border border-slate-50 shadow-sm flex flex-col md:flex-row transition-all duration-700 hover:shadow-2xl overflow-hidden group">
                   <div className="w-full md:w-64 bg-slate-50/50 p-8 md:p-10 flex flex-col justify-between shrink-0 border-b md:border-b-0 md:border-r border-slate-100 text-center md:text-left">
                      <div className="space-y-6">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg mx-auto md:mx-0 group-hover:scale-110 transition-transform"><i className="fa-solid fa-box text-brand-primary text-sm"></i></div>
                        <div>
                            <h4 className="font-black text-2xl text-slate-800 uppercase tracking-tight italic leading-tight mb-2">{order.item_name}</h4>
                            <div className="flex gap-4 items-center justify-center md:justify-start">
                                <span className="text-[11px] font-black text-brand-primary bg-brand-secondary px-3 py-1 rounded-lg">₱{order.amount.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty x{order.quantity}</span>
                            </div>
                        </div>
                      </div>
                      <div className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] mt-8">INITIATED • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                   </div>

                   <div className="flex-1 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10">
                      <LogisticsStepper status={order.order_status} />
                      
                      {order.instructions && (
                        <div className="w-full md:max-w-[200px] bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100 italic relative overflow-hidden group/note">
                            <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-100 rounded-bl-2xl"></div>
                            <p className="text-[8px] font-black uppercase text-indigo-400 tracking-widest mb-2">Internal Update</p>
                            <p className="text-[11px] text-indigo-600 font-bold leading-relaxed">"{order.instructions}"</p>
                        </div>
                      )}
                   </div>
                </div>
              ))}
            </div>

            <aside className="lg:col-span-4 space-y-8">
              {totalUnpaid > 0 && (
                <div className="bg-slate-900 p-10 md:p-12 rounded-[4.5rem] text-white shadow-2xl sticky top-28 overflow-hidden group">
                   <div className="absolute top-0 right-0 w-40 h-40 bg-brand-primary/10 rounded-full translate-x-10 -translate-y-10 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                   <div className="relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-primary mb-6 italic">Balance Owed</p>
                      <h3 className="text-6xl md:text-7xl font-black tracking-tighter leading-none mb-10 italic">₱{totalUnpaid.toLocaleString()}</h3>
                      <div className="space-y-4">
                        <button onClick={onPayNow} className="w-full bg-white text-slate-900 py-6 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-xl hover:bg-brand-secondary transition-all active:scale-95">Checkout Now</button>
                        <button onClick={onGoToMenu} className="w-full py-5 rounded-[2rem] font-black uppercase text-[9px] tracking-[0.3em] border border-white/10 hover:bg-white/5 transition-all">Add to Session</button>
                      </div>
                   </div>
                </div>
              )}
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 text-center shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 bg-indigo-600 h-full"></div>
                 <i className="fa-solid fa-circle-question text-slate-100 text-4xl mb-6"></i>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 italic">Need table assistance?</p>
                 <button className="w-full py-5 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm">Notify My Server</button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersView;
