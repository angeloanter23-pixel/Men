
import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as MenuService from '../../services/menuService';

interface LiveOrdersConsoleProps {
  orders: any[];
  onRefresh: () => void;
}

type SortMode = 'time' | 'table';

export default function LiveOrdersConsole({ orders, onRefresh }: LiveOrdersConsoleProps) {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [modalTab, setModalTab] = useState<'info' | 'actions'>('info');
  const [sortMode, setSortMode] = useState<SortMode>('time');
  const [showFinished, setShowFinished] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Preparing' | 'Serving' | 'Served'>('All');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [now, setNow] = useState(Date.now());
  
  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string | number>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Local state for pending changes
  const [localNote, setLocalNote] = useState('');
  const [localStatus, setLocalStatus] = useState('');
  const [localPayment, setLocalPayment] = useState<'Paid' | 'Unpaid'>('Unpaid');
  const [isSaving, setIsSaving] = useState(false);

  // Update "now" every minute to keep relative times fresh
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Reset selection mode when orders change or filter changes
  useEffect(() => {
      if (orders.length === 0) {
          setIsSelectionMode(false);
          setSelectedOrderIds(new Set());
      }
  }, [orders]);

  const handleOrderInteraction = (order: any, type: 'click' | 'press') => {
      if (isSelectionMode) {
          toggleSelection(order.id);
      } else {
          if (type === 'click') {
              handleOrderClick(order);
          } else if (type === 'press') {
              setIsSelectionMode(true);
              toggleSelection(order.id);
          }
      }
  };

  const handleTouchStart = (orderId: string | number) => {
      if (!isSelectionMode) {
          longPressTimer.current = setTimeout(() => {
              handleOrderInteraction({ id: orderId }, 'press');
          }, 500);
      }
  };

  const handleTouchEnd = () => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
  };

  const toggleSelection = (id: string | number) => {
      setSelectedOrderIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) newSet.delete(id);
          else newSet.add(id);
          
          if (newSet.size === 0) setIsSelectionMode(false);
          return newSet;
      });
  };

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order);
    setModalTab('info');
    setLocalNote(order.description || '');
    setLocalStatus(order.order_status || 'Pending');
    setLocalPayment(order.payment_status || 'Unpaid');
  };

  const handleSaveAllChanges = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    
    try {
      const updates: any = { 
        order_status: localStatus,
        payment_status: localPayment,
        description: localNote
      };

      // Set paid_at timestamp if marking as Paid for the first time or if missing
      if (localPayment === 'Paid' && !selectedOrder.paid_at) {
        updates.paid_at = new Date().toISOString();
      } else if (localPayment === 'Unpaid') {
        updates.paid_at = null; // Reset if accidentally marked paid
      }

      // Set served_at timestamp if marking as Served
      if (localStatus === 'Served' && !selectedOrder.served_at) {
        updates.served_at = new Date().toISOString();
      } else if (localStatus !== 'Served') {
        updates.served_at = null; // Reset if downgraded status
      }

      await MenuService.updateOrder(selectedOrder.id, updates);
      onRefresh();
      setSelectedOrder(null);
    } catch (e) {
      console.error("Save failed", e);
    } finally {
      setIsSaving(false);
    }
  };

  const removeOrder = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    try {
      await MenuService.deleteOrder(selectedOrder.id);
      onRefresh();
      setShowDeleteConfirm(false);
      setSelectedOrder(null);
    } catch (e) {
      console.error("Delete failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkDelete = async () => {
      setIsSaving(true);
      try {
          for (const id of Array.from(selectedOrderIds)) {
              await MenuService.deleteOrder(id.toString());
          }
          onRefresh();
          setShowBulkDeleteConfirm(false);
          setIsSelectionMode(false);
          setSelectedOrderIds(new Set());
      } catch (e) {
          console.error("Bulk delete failed", e);
      } finally {
          setIsSaving(false);
      }
  };

  const getFormattedTime = (ts: string) => {
    const date = new Date(ts);
    const dateMs = date.getTime();
    const diffMs = now - dateMs;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    const isCurrentYear = date.getFullYear() === new Date().getFullYear();
    if (isCurrentYear) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const processedOrders = useMemo(() => {
    let filtered = [...orders];
    
    if (statusFilter !== 'All') {
        filtered = filtered.filter(o => (o.order_status || 'Pending') === statusFilter);
    } else if (!showFinished) {
        filtered = filtered.filter(o => o.order_status !== 'Served');
    }

    return filtered.sort((a, b) => {
      const aIsServed = a.order_status === 'Served' ? 1 : 0;
      const bIsServed = b.order_status === 'Served' ? 1 : 0;
      
      if (aIsServed !== bIsServed) return aIsServed - bIsServed;

      if (sortMode === 'time') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return a.table_number.toString().localeCompare(b.table_number.toString(), undefined, {numeric: true});
      }
    });
  }, [orders, sortMode, showFinished, statusFilter]);

  const groupedOrders = useMemo(() => {
    const groups: { table: string, orders: any[] }[] = [];
    processedOrders.forEach(order => {
      const table = order.table_number ? `Table ${order.table_number}` : 'Unassigned';
      let group = groups.find(g => g.table === table);
      if (!group) {
        group = { table, orders: [] };
        groups.push(group);
      }
      group.orders.push(order);
    });
    return groups;
  }, [processedOrders]);

  return (
    <div className="space-y-6 animate-fade-in font-jakarta">
      <div className="flex items-center justify-between px-4">
        <p className="text-[11px] font-bold text-slate-400 tracking-tight">
          {isSelectionMode ? `${selectedOrderIds.size} selected` : `${processedOrders.length} ${processedOrders.length === 1 ? 'order' : 'orders'} total`}
        </p>
        
        <div className="bg-slate-200/50 p-1 rounded-xl flex border border-slate-200/60 shadow-inner">
          {isSelectionMode ? (
              <>
                <button 
                    onClick={() => { setIsSelectionMode(false); setSelectedOrderIds(new Set()); }}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all text-slate-400 hover:text-slate-600"
                >
                    <i className="fa-solid fa-xmark text-xs"></i>
                </button>
                <div className="w-px h-4 bg-slate-300 mx-1 self-center opacity-40"></div>
                <button 
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    disabled={selectedOrderIds.size === 0}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all bg-rose-500 text-white shadow-sm disabled:opacity-50 disabled:bg-slate-300"
                >
                    <i className="fa-solid fa-trash-can text-xs"></i>
                </button>
              </>
          ) : (
              <>
                <button 
                    onClick={onRefresh}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all text-slate-400 hover:text-indigo-600 active:rotate-180 duration-500"
                >
                    <i className="fa-solid fa-rotate text-xs"></i>
                </button>
                <div className="w-px h-4 bg-slate-300 mx-1 self-center opacity-40"></div>
                <button 
                    onClick={() => setSortMode('time')}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${sortMode === 'time' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <i className="fa-solid fa-clock-rotate-left text-xs"></i>
                </button>
                <button 
                    onClick={() => setSortMode('table')}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${sortMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <i className="fa-solid fa-chair text-xs"></i>
                </button>
                <div className="w-px h-4 bg-slate-300 mx-1 self-center opacity-40"></div>
                <button 
                    onClick={() => setShowStatusModal(true)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${statusFilter !== 'All' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <i className="fa-solid fa-filter text-xs"></i>
                </button>
                <button 
                    onClick={() => setShowFinished(!showFinished)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${showFinished ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <i className={`fa-solid ${showFinished ? 'fa-circle-check' : 'fa-eye-slash'} text-xs`}></i>
                </button>
              </>
          )}
        </div>
      </div>

      <div className="px-1 space-y-3">
        {groupedOrders.map(group => (
          <div key={group.table} className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="bg-slate-50/80 px-3 py-2 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
                <i className="fa-solid fa-chair text-[9px]"></i>
                {group.table}
              </h3>
              <span className="text-[9px] font-medium text-slate-400">{group.orders.length} items</span>
            </div>
            <div className="divide-y divide-slate-100">
              {group.orders.map(order => {
                const isServed = order.order_status === 'Served';
                const isPending = order.order_status === 'Pending' || !order.order_status;
                const isSelected = selectedOrderIds.has(order.id);
                
                return (
                  <div 
                    key={order.id} 
                    className={`w-full px-3 py-3.5 flex items-center justify-between active:bg-slate-50 transition-colors text-left relative group select-none ${isServed ? 'opacity-40 grayscale-[0.5]' : ''} ${isSelected ? 'bg-indigo-50/50' : ''}`}
                    onClick={() => handleOrderInteraction(order, 'click')}
                    onTouchStart={() => handleTouchStart(order.id)}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={() => handleTouchStart(order.id)}
                    onMouseUp={handleTouchEnd}
                    onMouseLeave={handleTouchEnd}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {isSelectionMode && (
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                              {isSelected && <i className="fa-solid fa-check text-white text-[10px]"></i>}
                          </div>
                      )}
                      
                      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border transition-all ${isServed ? 'bg-slate-50 border-slate-200 text-slate-400' : isPending ? 'bg-rose-50 border-rose-100 text-rose-500 shadow-lg shadow-rose-100/50' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                        <span className="text-[13px] font-bold leading-none">x{order.quantity}</span>
                      </div>

                      <div className="flex flex-col min-w-0">
                        <h4 className="text-[15px] font-bold text-slate-900 tracking-tight leading-none mb-1 truncate">
                          {order.item_name}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-slate-400 tabular-nums">
                              {getFormattedTime(order.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold tracking-tight border ${
                          isServed ? 'bg-slate-100 text-slate-400 border-slate-200' 
                          : isPending ? 'bg-rose-50 text-rose-500 border-rose-100 animate-pulse' 
                          : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                      }`}>
                          {order.order_status || 'Pending'}
                      </span>
                      <div className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${order.payment_status === 'Paid' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                          <span className={`text-[9px] font-bold ${order.payment_status === 'Paid' ? 'text-emerald-600' : 'text-orange-600'}`}>
                              {order.payment_status}
                          </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {processedOrders.length === 0 && (
          <div className="py-20 text-center space-y-2">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto text-lg shadow-inner">
                <i className="fa-solid fa-inbox"></i>
            </div>
            <p className="text-[9px] font-bold text-slate-300 tracking-widest italic tracking-[0.1em]">queue is clear</p>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[1500] flex items-end justify-center animate-fade-in font-jakarta">
          <div onClick={() => !isSaving && setSelectedOrder(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" />
          <div className="relative bg-[#F2F2F7] w-full max-w-lg rounded-t-2xl shadow-2xl flex flex-col h-[88vh] animate-slide-up overflow-hidden">
            
            <header className="px-6 pt-6 pb-4 bg-white border-b border-slate-100 shrink-0">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-none italic">{selectedOrder.item_name}</h3>
                  <p className="text-[10px] font-bold text-indigo-600 mt-2 tracking-widest leading-none">Table {selectedOrder.table_number} • Qty {selectedOrder.quantity}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-300 hover:text-slate-900 transition-colors flex items-center justify-center border border-slate-100 shadow-sm"><i className="fa-solid fa-xmark text-lg"></i></button>
              </div>
              <div className="bg-[#E8E8ED] p-1 rounded-xl flex border border-slate-100 shadow-inner">
                <button onClick={() => setModalTab('info')} className={`flex-1 py-3 rounded-lg text-[10px] font-bold tracking-widest transition-all ${modalTab === 'info' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Order info</button>
                <button onClick={() => setModalTab('actions')} className={`flex-1 py-3 rounded-lg text-[10px] font-bold tracking-widest transition-all ${modalTab === 'actions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Update status</button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-6">
              {modalTab === 'info' ? (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-white rounded-xl p-6 border border-white shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                      <span className="text-[10px] font-bold text-slate-400 tracking-widest leading-none">Customer</span>
                      <span className="text-sm font-bold text-slate-900 italic">{selectedOrder.customer_name}</span>
                    </div>
                    
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-slate-400 tracking-widest leading-none ml-2">Payment status</span>
                      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                        <button 
                          onClick={() => setLocalPayment('Paid')}
                          className={`flex-1 py-3 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-2 ${localPayment === 'Paid' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          <i className="fa-solid fa-circle-check"></i> 
                          Paid
                        </button>
                        <button 
                          onClick={() => setLocalPayment('Unpaid')}
                          className={`flex-1 py-3 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-2 ${localPayment === 'Unpaid' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          <i className="fa-solid fa-clock"></i> 
                          Unpaid
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[10px] font-bold text-slate-400 tracking-widest leading-none">Total price</span>
                      <span className="text-2xl font-black text-slate-900 italic tracking-tighter">₱{selectedOrder.amount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200/40 shadow-inner">
                    <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-2 leading-none italic">Guest instructions</p>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed italic">"{selectedOrder.instructions || 'No specific requests.'}"</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-fade-in">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 tracking-widest ml-4 leading-none">Current phase</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'Pending', label: 'Order received', icon: 'fa-envelope' },
                        { id: 'Preparing', label: 'Cooking now', icon: 'fa-fire' },
                        { id: 'Serving', label: 'Ready for service', icon: 'fa-bell' },
                        { id: 'Served', label: 'Finished / served', icon: 'fa-check-circle' }
                      ].map(status => (
                        <button 
                          key={status.id} 
                          onClick={() => setLocalStatus(status.id)}
                          className={`w-full py-4 rounded-xl font-bold text-[11px] tracking-widest transition-all flex items-center justify-between px-6 border-2 ${
                            localStatus === status.id 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-100' 
                            : 'bg-white border-white text-slate-300 hover:border-slate-100'
                          }`}
                        >
                          <span>{status.label}</span>
                          <i className={`fa-solid ${status.icon} text-sm`}></i>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 tracking-widest ml-4 italic leading-none">Note to guest</h4>
                    <textarea 
                      value={localNote} 
                      onChange={e => setLocalNote(e.target.value)} 
                      placeholder="e.g. 'Your food is almost ready!'" 
                      className="w-full bg-white border border-white rounded-xl p-6 text-sm font-medium outline-none focus:ring-4 ring-indigo-500/5 transition-all shadow-sm h-24 resize-none"
                    />
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <button onClick={() => setShowDeleteConfirm(true)} className="w-full py-4 text-rose-500 font-bold text-[12px] tracking-widest hover:bg-rose-50 rounded-xl transition-colors">Delete order</button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-slate-100 shrink-0">
              <button 
                onClick={handleSaveAllChanges} 
                disabled={isSaving}
                className="w-full py-5 bg-slate-900 text-white rounded-xl font-bold text-[12px] tracking-widest shadow-2xl active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? <i className="fa-solid fa-spinner animate-spin mr-2"></i> : 'Confirm changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && (
        <div className="fixed inset-0 z-[1500] flex items-end justify-center animate-fade-in font-jakarta">
          <div onClick={() => setShowStatusModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
          <div className="relative bg-white w-full max-w-lg rounded-t-2xl shadow-2xl flex flex-col animate-slide-up overflow-hidden">
            <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Filter by status</h3>
              <button onClick={() => setShowStatusModal(false)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
            </header>
            <div className="p-4">
              <div className="flex flex-col gap-1">
                {[
                  { id: 'All', label: 'All orders', icon: 'fa-list' },
                  { id: 'Pending', label: 'Pending', icon: 'fa-envelope' },
                  { id: 'Preparing', label: 'Preparing', icon: 'fa-fire' },
                  { id: 'Serving', label: 'Serving', icon: 'fa-bell' },
                  { id: 'Served', label: 'Served', icon: 'fa-check-circle' }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => { setStatusFilter(tab.id as any); setShowStatusModal(false); }}
                    className={`w-full py-4 px-6 rounded-xl flex items-center justify-between transition-all ${statusFilter === tab.id ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <i className={`fa-solid ${tab.icon} text-xs`}></i>
                      <span className="text-[13px]">{tab.label}</span>
                    </div>
                    {statusFilter === tab.id && <i className="fa-solid fa-check text-xs"></i>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center animate-fade-in font-jakarta">
            <div onClick={() => setShowDeleteConfirm(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <div className="relative bg-white w-full max-w-lg rounded-t-2xl p-6 pb-10 shadow-2xl animate-slide-up space-y-6">
                <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mx-auto text-xl">
                    <i className="fa-solid fa-trash-can"></i>
                </div>
                <div className="text-center space-y-1">
                    <h3 className="text-xl font-bold tracking-tight">Delete order?</h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">This action will permanently remove this order. This cannot be undone.</p>
                </div>
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={removeOrder}
                        disabled={isSaving}
                        className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold text-[12px] tracking-widest shadow-xl shadow-rose-200 active:scale-95 transition-all"
                    >
                        {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Confirm delete'}
                    </button>
                    <button 
                        onClick={() => setShowDeleteConfirm(false)}
                        className="w-full py-4 bg-slate-100 text-slate-500 rounded-xl font-bold text-[12px] tracking-widest active:scale-95 transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
      )}

      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center animate-fade-in font-jakarta">
            <div onClick={() => setShowBulkDeleteConfirm(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <div className="relative bg-white w-full max-w-lg rounded-t-2xl p-6 pb-10 shadow-2xl animate-slide-up space-y-6">
                <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mx-auto text-xl">
                    <i className="fa-solid fa-trash-can"></i>
                </div>
                <div className="text-center space-y-1">
                    <h3 className="text-xl font-bold tracking-tight">Delete live orders?</h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">This will permanently delete {selectedOrderIds.size} selected orders.</p>
                </div>
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={handleBulkDelete}
                        disabled={isSaving}
                        className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold text-[12px] tracking-widest shadow-xl shadow-rose-200 active:scale-95 transition-all"
                    >
                        {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Confirm delete'}
                    </button>
                    <button 
                        onClick={() => setShowBulkDeleteConfirm(false)}
                        className="w-full py-4 bg-slate-100 text-slate-500 rounded-xl font-bold text-[12px] tracking-widest active:scale-95 transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
