import React, { useState, useEffect, useMemo } from 'react';
import * as MenuService from '../../services/menuService';
import { supabase } from '../../lib/supabase';

type SubTab = 'orders' | 'messages' | 'requests' | 'tables';

interface OrderStatusOption {
  id: string;
  label: string;
  desc: string;
  color: string;
}

const STATUS_PRESETS: OrderStatusOption[] = [
  { id: 'Pending', label: 'Pending', desc: 'Order received but not yet processed', color: 'bg-slate-500' },
  { id: 'Preparing', label: 'Preparing', desc: 'Kitchen is preparing the order', color: 'bg-indigo-600' },
  { id: 'Serving', label: 'Ready', desc: 'Order ready for pickup or delivery', color: 'bg-orange-500' },
  { id: 'Served', label: 'Served', desc: 'Order served to customer (for dine-in)', color: 'bg-emerald-500' }
];

const AdminOrders: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('orders');
  const [filter, setFilter] = useState<'All' | 'Preparing' | 'Serving' | 'Served'>('All');
  const [orders, setOrders] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [qrNodes, setQrNodes] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());
  
  // Modals / Selection States
  const [statusDialogOrder, setStatusDialogOrder] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [customStatus, setCustomStatus] = useState({ label: '', desc: '' });
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');

  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const restaurantId = session?.restaurant?.id;

  const simulatedRequests = [
    { id: 1, table: 'Table 5', type: 'Assistance Needed', time: '1 min ago', priority: 'high' },
    { id: 2, table: 'Table 8', type: 'Bill Request', time: '8 mins ago', priority: 'normal' },
  ];

  const fetchLiveOrders = async () => {
    if (!restaurantId) return;
    try { 
      const data = await MenuService.getMerchantOrders(restaurantId); 
      setOrders(data); 
      const msgs = await MenuService.getLiveMessages(restaurantId);
      setMessages(msgs);
      const qrs = await MenuService.getQRCodes(restaurantId);
      setQrNodes(qrs);
      const sessions = await MenuService.getActiveSessionsForRestaurant(restaurantId);
      setActiveSessions(sessions);
    } catch (err) { 
      console.error("Queue sync failure", err); 
    }
  };

  useEffect(() => {
    if (!restaurantId) return;
    fetchLiveOrders();
    const orderChannel = supabase.channel('kitchen-view-full')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` }, () => fetchLiveOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'table_sessions' }, () => fetchLiveOrders())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `restaurant_id=eq.${restaurantId}` }, () => fetchLiveOrders())
      .subscribe();
    
    const interval = setInterval(() => setNow(new Date()), 30000); 
    return () => { 
      supabase.removeChannel(orderChannel); 
      clearInterval(interval); 
    };
  }, [restaurantId]);

  const updateOrderData = async (id: string, updates: any) => { 
    setIsProcessing(id);
    try { 
      await MenuService.updateOrder(id, updates); 
      await fetchLiveOrders();
      setStatusDialogOrder(null);
    } catch (e) { 
      alert("Database error."); 
    } finally {
      setIsProcessing(null);
    }
  };

  const deleteOrder = async () => {
    if (!deleteConfirmId) return;
    setIsProcessing(deleteConfirmId);
    try {
      await MenuService.deleteOrder(deleteConfirmId);
      await fetchLiveOrders();
      setDeleteConfirmId(null);
    } catch (e) {
      alert("Deletion failed.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReply = async () => {
    if (!replyingTo || !replyText.trim()) return;
    try {
        await MenuService.sendLiveMessage({
            restaurant_id: restaurantId,
            table_number: replyingTo.table_number,
            customer_name: replyingTo.customer_name,
            text: replyText,
            sender: 'admin'
        });
        await MenuService.markMessageRead(replyingTo.id);
        setReplyText('');
        setReplyingTo(null);
        fetchLiveOrders();
    } catch (e) {
        alert("Reply failed.");
    }
  };

  const handleToggleOccupancy = async (qrId: string, currentOccupied: boolean) => {
    try {
        await MenuService.toggleTableOccupancy(qrId, !currentOccupied);
        await fetchLiveOrders();
    } catch (err) {
        alert("Occupancy update failed.");
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Math.floor((now.getTime() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff === 1) return '1 min ago';
    return `${diff} mins ago`;
  };

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (filter !== 'All') list = orders.filter(o => o.order_status === filter);
    return list;
  }, [orders, filter]);

  const getTableStatus = (qrId: string, label: string) => {
    const session = activeSessions.find(s => s.qr_id === qrId);
    const tableOrders = orders.filter(o => o.table_number === label);
    const active = tableOrders.filter(o => !['Served'].includes(o.order_status));
    const total = tableOrders.reduce((s, o) => s + o.amount, 0);
    
    return { 
        occupied: !!session, 
        customer: active.length > 0 ? active[0].customer_name : null, 
        total,
        sessionStarted: session?.session_started_at
    };
  };

  const unreadMessagesCount = useMemo(() => messages.filter(m => m.sender === 'guest' && !m.is_read).length, [messages]);

  return (
    <div className="flex flex-col h-full animate-fade-in font-jakarta bg-slate-50/30 min-h-screen pb-40">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-[45] px-4 md:px-6 py-4 shadow-sm overflow-x-auto no-scrollbar shrink-0">
        <div className="flex gap-2 max-w-5xl mx-auto">
          {[
            { id: 'orders', label: 'Live Orders', icon: 'fa-fire-burner', count: orders.filter(o => ['Pending', 'Preparing', 'Serving'].includes(o.order_status)).length },
            { id: 'messages', label: 'Messages', icon: 'fa-comment-dots', count: unreadMessagesCount },
            { id: 'requests', label: 'Waiter Request', icon: 'fa-bell', count: simulatedRequests.length },
            { id: 'tables', label: 'Tables', icon: 'fa-map' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveSubTab(tab.id as SubTab)} 
              className={`flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeSubTab === tab.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
            >
              <i className={`fa-solid ${tab.icon} text-xs`}></i>
              <span className="hidden xs:inline">{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && <span className={`px-2 py-0.5 rounded-full text-[9px] ${activeSubTab === tab.id ? 'bg-white text-indigo-600' : 'bg-orange-500 text-white'}`}>{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-10 no-scrollbar">
        {activeSubTab === 'orders' && (
          <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto">
             <div className="flex overflow-x-auto no-scrollbar gap-2 bg-white/50 p-1.5 rounded-[2rem] border border-slate-200 w-fit">
                {['All', 'Preparing', 'Serving', 'Served'].map(f => (
                  <button key={f} onClick={() => setFilter(f as any)} className={`px-6 md:px-8 py-2.5 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}>{f === 'Serving' ? 'Ready' : f}</button>
                ))}
             </div>

             <div className="grid grid-cols-1 gap-4 md:gap-5">
               {filteredOrders.map(order => (
                 <div key={order.id} className={`bg-white p-5 md:p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-xl transition-all ${isProcessing === order.id ? 'opacity-40 pointer-events-none' : ''}`}>
                   <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                      <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center shrink-0 italic border border-slate-100">
                        <span className="text-[18px] md:text-[20px] font-black text-slate-800">x{order.quantity}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight italic leading-none mb-1.5 truncate">{order.item_name}</h4>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                          <span className="text-[9px] md:text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-2.5 py-1 rounded-lg">Table {order.table_number}</span>
                          <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">{order.customer_name} • {getTimeAgo(order.created_at)}</span>
                        </div>
                        {order.instructions && (
                            <div className="mt-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                                <p className="text-[8px] font-black uppercase text-indigo-400 mb-1">Kitchen Note</p>
                                <p className="text-[10px] text-slate-600 font-bold italic line-clamp-1">"{order.instructions}"</p>
                            </div>
                        )}
                      </div>
                   </div>

                   <div className="flex flex-wrap items-center gap-2 md:gap-3 border-t lg:border-t-0 pt-4 lg:pt-0">
                     {/* Paid Toggle */}
                     <button 
                        onClick={() => updateOrderData(order.id, { payment_status: order.payment_status === 'Paid' ? 'Unpaid' : 'Paid' })}
                        className={`h-11 md:h-12 px-4 md:px-5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all flex items-center gap-2 ${order.payment_status === 'Paid' ? 'bg-emerald-500 text-white border-emerald-400 shadow-md' : 'bg-white text-rose-500 border-rose-100'}`}
                     >
                        <i className={`fa-solid ${order.payment_status === 'Paid' ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
                        {order.payment_status}
                     </button>

                     {/* Status Trigger */}
                     <button 
                        onClick={() => setStatusDialogOrder(order)} 
                        className={`flex-1 lg:flex-none h-11 md:h-12 px-5 md:px-6 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                        order.order_status === 'Preparing' ? 'bg-indigo-600' : order.order_status === 'Serving' ? 'bg-orange-500' : order.order_status === 'Served' ? 'bg-emerald-500' : 'bg-slate-500'
                        }`}
                     >
                        {order.order_status === 'Serving' ? 'Ready' : order.order_status} <i className="fa-solid fa-caret-down"></i>
                     </button>

                     {/* Delete Action */}
                     <button 
                        onClick={() => setDeleteConfirmId(order.id)}
                        className="w-11 md:w-12 h-11 md:h-12 bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all flex items-center justify-center border border-slate-100"
                     >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                     </button>
                   </div>
                 </div>
               ))}
               {filteredOrders.length === 0 && <div className="py-40 text-center opacity-20 italic uppercase font-black tracking-[0.4em]">Empty Queue</div>}
             </div>
          </div>
        )}

        {activeSubTab === 'messages' && (
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.filter(m => m.sender === 'guest').map(msg => (
              <div key={msg.id} className={`bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-start gap-5 transition-all hover:shadow-md ${!msg.is_read ? 'ring-2 ring-indigo-500/20' : ''}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${!msg.is_read ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-100 text-slate-400'}`}><i className="fa-solid fa-comment-dots"></i></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-black text-indigo-600 uppercase">Table {msg.table_number} • {msg.customer_name}</p>
                    <p className="text-[9px] font-bold text-slate-300 uppercase">{getTimeAgo(msg.created_at)}</p>
                  </div>
                  <p className="text-slate-700 text-sm font-medium italic">"{msg.text}"</p>
                  <div className="mt-4 flex gap-2">
                     <button onClick={() => setReplyingTo(msg)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Reply</button>
                     {!msg.is_read && <button onClick={() => MenuService.markMessageRead(msg.id).then(fetchLiveOrders)} className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest">Mark Read</button>}
                  </div>
                </div>
              </div>
            ))}
            {messages.filter(m => m.sender === 'guest').length === 0 && <div className="py-40 text-center opacity-20 italic uppercase font-black tracking-widest">No guest inquiries</div>}
          </div>
        )}

        {activeSubTab === 'requests' && (
          <div className="max-w-2xl mx-auto space-y-4">
            {simulatedRequests.map(req => (
              <div key={req.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl flex items-center justify-between group">
                <div className="flex items-center gap-6">
                   <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-2xl animate-pulse shadow-inner ${req.priority === 'high' ? 'bg-rose-50 text-rose-500' : 'bg-orange-50 text-orange-500'}`}><i className="fa-solid fa-bell"></i></div>
                   <div>
                     <h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">{req.type}</h4>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{req.table} • {req.time}</p>
                   </div>
                </div>
                <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl group-hover:bg-indigo-600 transition-all">Attend</button>
              </div>
            ))}
          </div>
        )}

        {activeSubTab === 'tables' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {qrNodes.map(qr => {
              const status = getTableStatus(qr.id, qr.label);
              return (
                <div key={qr.id} className={`bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-2xl relative overflow-hidden group`}>
                  <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-start">
                       <h4 className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none">{qr.label}</h4>
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${status.occupied ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}><i className={`fa-solid ${status.occupied ? 'fa-user-group animate-pulse' : 'fa-check'}`}></i></div>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t border-slate-50">
                       <button 
                        onClick={() => handleToggleOccupancy(qr.id, status.occupied)}
                        className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${status.occupied ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-emerald-500 hover:text-white'}`}
                       >
                         {status.occupied ? 'Release Table' : 'Mark Occupied'}
                       </button>

                       {status.occupied && (
                         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Live Session</p>
                            <p className="text-sm font-black text-slate-700 uppercase italic truncate">{status.customer || 'Active Session'}</p>
                            {status.sessionStarted && (
                                <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold">Since {new Date(status.sessionStarted).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            )}
                            <p className="text-lg font-black text-indigo-600 mt-2">₱{status.total.toLocaleString()}</p>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {replyingTo && (
        <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in" onClick={() => setReplyingTo(null)}>
            <div className="bg-white w-full max-w-md rounded-[3rem] p-8 md:p-10 shadow-2xl relative animate-scale" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-4">Reply to Table {replyingTo.table_number}</h3>
                <div className="bg-slate-50 p-5 rounded-2xl mb-6 border border-slate-100 italic text-slate-500 text-sm">"{replyingTo.text}"</div>
                <textarea 
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Enter message to guest..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 text-sm font-bold h-32 outline-none focus:ring-4 ring-indigo-500/5 mb-6"
                />
                <button onClick={handleReply} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Send Reply</button>
            </div>
        </div>
      )}

      {/* Logistics Status Modal */}
      {statusDialogOrder && (
        <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in" onClick={() => setStatusDialogOrder(null)}>
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 md:p-10 shadow-2xl relative animate-scale max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="mb-10 text-center">
               <h3 className="text-2xl font-black uppercase italic tracking-tighter">Update Tracking</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{statusDialogOrder.item_name}</p>
            </div>
            
            <div className="space-y-3">
               {STATUS_PRESETS.map(s => (
                 <button 
                  key={s.id}
                  onClick={() => updateOrderData(statusDialogOrder.id, { order_status: s.id, instructions: s.desc })}
                  className={`w-full p-6 rounded-3xl border flex items-center gap-6 transition-all group ${statusDialogOrder.order_status === s.id ? 'border-indigo-600 bg-indigo-50/30 shadow-inner' : 'border-slate-100 hover:border-slate-300'}`}
                 >
                    <div className={`w-10 h-10 rounded-xl ${s.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}><i className="fa-solid fa-check text-xs"></i></div>
                    <div className="text-left">
                       <p className="text-sm font-black text-slate-900 uppercase leading-none mb-1.5">{s.label}</p>
                       <p className="text-[10px] text-slate-400 font-medium leading-tight">{s.desc}</p>
                    </div>
                 </button>
               ))}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
               <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest text-center">Custom Milestone</p>
               <input 
                type="text" 
                placeholder="Label (e.g. On Delivery)" 
                value={customStatus.label}
                onChange={e => setCustomStatus({...customStatus, label: e.target.value})}
                className="w-full bg-slate-50 p-4 rounded-xl font-bold text-sm outline-none shadow-inner"
               />
               <input 
                type="text" 
                placeholder="Description..." 
                value={customStatus.desc}
                onChange={e => setCustomStatus({...customStatus, desc: e.target.value})}
                className="w-full bg-slate-50 p-4 rounded-xl font-bold text-[10px] outline-none shadow-inner"
               />
               <button 
                onClick={() => updateOrderData(statusDialogOrder.id, { order_status: customStatus.label, instructions: customStatus.desc })}
                disabled={!customStatus.label}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl disabled:opacity-20 active:scale-95 transition-all"
               >
                 Commit Custom Status
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[700] bg-rose-900/40 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl space-y-8 animate-scale">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto text-3xl shadow-inner"><i className="fa-solid fa-trash-can"></i></div>
                <div className="space-y-4">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Purge Record?</h3>
                    <p className="text-slate-400 text-sm font-medium italic">This order will be permanently removed from the database and archive.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
                    <button onClick={deleteOrder} className="flex-1 py-5 bg-rose-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-100">Delete</button>
                </div>
            </div>
        </div>
      )}

      <style>{` @keyframes scale { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } } .animate-scale { animation: scale 0.3s cubic-bezier(0.23, 1, 0.32, 1) forwards; } `}</style>
    </div>
  );
};

export default AdminOrders;