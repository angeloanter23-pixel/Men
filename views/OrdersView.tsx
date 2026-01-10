
import React, { useState } from 'react';
import { CartItem } from '../types';

interface OrderInstance extends CartItem {
  orderId: string;
  status: 'Pending' | 'Cooking' | 'Ready' | 'Served';
  timestamp: Date;
}

interface OrdersViewProps {
  orders: OrderInstance[];
  onPayNow: () => void;
  onGoToMenu: () => void;
}

const OrdersView: React.FC<OrdersViewProps> = ({ orders, onPayNow, onGoToMenu }) => {
  const [activeTab, setActiveTab] = useState<'my' | 'group'>('my');
  const myOrders = orders.filter(o => o.orderTo === 'Me');
  const groupOrders = orders.filter(o => o.orderTo !== 'Me');
  const currentDisplay = activeTab === 'my' ? myOrders : groupOrders;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Cooking': return 'bg-orange-100 text-orange-600';
      case 'Ready': return 'bg-green-100 text-green-600';
      case 'Served': return 'bg-blue-100 text-blue-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const totalBill = orders.reduce((sum, o) => sum + (o.price * o.quantity), 0);

  return (
    <div className="p-6 pb-48 min-h-screen animate-fade-in bg-slate-50/30">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase">Live Orders</h2>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
           <button onClick={() => setActiveTab('my')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'my' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-400'}`}>SELF</button>
           <button onClick={() => setActiveTab('group')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'group' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-400'}`}>FRIENDS</button>
        </div>
      </div>
      <div className="space-y-6">
        {currentDisplay.length === 0 ? (
          <div className="text-center py-32 flex flex-col items-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-slate-200 text-4xl shadow-sm border border-slate-100 mb-6"><i className="fa-solid fa-receipt"></i></div>
            <p className="font-black text-[10px] text-slate-300 uppercase tracking-[0.3em] mb-8">No Active Sessions</p>
            <button onClick={onGoToMenu} className="bg-orange-500 text-white px-10 py-5 rounded-[2rem] font-black text-xs tracking-widest shadow-xl shadow-orange-100">ORDER SOMETHING</button>
          </div>
        ) : (
          currentDisplay.map((order) => (
            <div key={order.orderId} className="flex flex-col bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4">
               <div className="flex gap-5 items-center">
                 <div className="w-20 h-20 rounded-3xl overflow-hidden bg-slate-50 shadow-inner border border-slate-100">
                   <img src={order.image_url} className="w-full h-full object-cover grayscale-[0.2]" alt="" />
                 </div>
                 <div className="flex-1">
                   <div className="flex justify-between items-start">
                     <h4 className="font-black text-slate-800 text-sm leading-tight uppercase tracking-tight">{order.name} <span className="text-orange-500 italic ml-1">x{order.quantity}</span></h4>
                     <span className={`text-[9px] px-3 py-1.5 rounded-xl font-black uppercase tracking-wider shadow-sm ${getStatusColor(order.status)}`}>{order.status}</span>
                   </div>
                   <div className="flex justify-between items-center mt-3">
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{order.orderTo !== 'Me' ? `Guest: ${order.orderTo}` : 'My Order'}</p>
                     <span className="text-[10px] text-slate-400 font-bold">{new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                 </div>
               </div>
               {order.customInstructions && (
                 <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100/20">
                   <p className="text-xs text-slate-600 font-bold italic leading-relaxed">"{order.customInstructions}"</p>
                 </div>
               )}
            </div>
          ))
        )}
      </div>

      {orders.length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 p-6 flex flex-col gap-4 max-w-xl mx-auto bg-white/80 backdrop-blur-2xl border-t border-slate-100 z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.05)] rounded-t-[3rem]">
          <div className="flex justify-between items-center px-4">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Running Total</span>
            <span className="text-2xl font-black italic tracking-tighter text-slate-900">₱{totalBill.toLocaleString()}</span>
          </div>
          <div className="flex gap-4">
            <button onClick={onPayNow} className="flex-[2] bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xs tracking-widest active:scale-95 shadow-2xl hover:bg-orange-600 transition-all">PAY NOW</button>
            <button className="flex-1 bg-slate-100 text-slate-400 py-5 rounded-[2rem] font-black text-xs tracking-widest active:scale-95">LATER</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersView;
