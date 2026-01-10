
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

  return (
    <div className="p-6 pb-48 min-h-screen animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black text-slate-800">Order Status</h2>
        <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
           <button onClick={() => setActiveTab('my')} className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${activeTab === 'my' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}>MY</button>
           <button onClick={() => setActiveTab('group')} className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${activeTab === 'group' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}>FRIENDS</button>
        </div>
      </div>
      <div className="space-y-6">
        {currentDisplay.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center">
            <i className="fa-solid fa-receipt text-6xl mb-4 text-slate-100"></i>
            <p className="font-bold text-slate-300 mb-8">No active orders yet.</p>
            <button onClick={onGoToMenu} className="bg-orange-500 text-white px-10 py-4 rounded-2xl font-black text-xs tracking-widest shadow-lg shadow-orange-100">ORDER SOMETHING</button>
          </div>
        ) : (
          currentDisplay.map((order) => (
            <div key={order.orderId} className="flex flex-col bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
               <div className="flex gap-4 items-center">
                 <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50"><img src={order.image_url} className="w-full h-full object-cover grayscale-[0.5]" alt="" /></div>
                 <div className="flex-1">
                   <div className="flex justify-between items-start">
                     <h4 className="font-bold text-slate-800 text-sm">{order.name} <span className="text-[10px] text-slate-300">x{order.quantity}</span></h4>
                     <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>{order.status}</span>
                   </div>
                   <div className="flex justify-between items-center mt-2">
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{order.orderTo !== 'Me' ? `For: ${order.orderTo}` : 'In Kitchen'}</p>
                     <span className="text-[10px] text-slate-400 font-bold">{new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                 </div>
               </div>
               {order.customInstructions && (
                 <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100/30">
                   <p className="text-xs text-slate-600 font-medium italic">"{order.customInstructions}"</p>
                 </div>
               )}
            </div>
          ))
        )}
      </div>
      {orders.length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 p-6 flex gap-3 max-w-xl mx-auto bg-white/80 backdrop-blur-md border-t border-slate-50 z-50">
          <button onClick={onPayNow} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs tracking-widest active:scale-95">PAY NOW</button>
          <button className="flex-1 bg-white border border-slate-200 text-slate-800 py-4 rounded-2xl font-black text-xs tracking-widest">PAY LATER</button>
        </div>
      )}
    </div>
  );
};

export default OrdersView;
