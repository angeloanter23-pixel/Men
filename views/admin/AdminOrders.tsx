
import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as MenuService from '../../services/menuService';
import { supabase } from '../../lib/supabase';
import LiveOrdersConsole from './LiveOrdersConsole';
import AdminMessages from './AdminMessages';
import AdminSessions from './AdminSessions';
import AdminWaiterRequests from './AdminWaiterRequests';

type SubTab = 'Live orders' | 'Messages' | 'Waiter request' | 'Sessions';

export default function AdminOrders() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('Live orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [qrNodes, setQrNodes] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());
  
  const [isUpdating, setIsUpdating] = useState(false);
  
  const tabListRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const restaurantId = session?.restaurant?.id;

  const fetchData = async () => {
    if (!restaurantId || isSyncing.current) return;
    isSyncing.current = true;
    setIsUpdating(true);
    try { 
      const [ord, msg, ses, qrs] = await Promise.all([
        MenuService.getMerchantOrders(restaurantId),
        MenuService.getLiveMessages(restaurantId),
        MenuService.getActiveSessionsForRestaurant(restaurantId),
        MenuService.getQRCodes(restaurantId)
      ]);
      setOrders(ord || []); 
      setMessages(msg || []); 
      setActiveSessions(ses || []);
      setQrNodes(qrs || []);
    } catch (e: any) { 
        console.error("Sync error", e);
    } finally {
        setIsUpdating(false);
        isSyncing.current = false;
    }
  };

  useEffect(() => {
    if (!restaurantId) return;
    fetchData();

    const channel = supabase.channel(`admin-sync-${restaurantId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `restaurant_id=eq.${restaurantId}` 
      }, (payload) => {
        setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            // Decode the message text from the raw DB payload
            const msg = { 
                ...payload.new, 
                text: MenuService.decodeMessage(payload.new.text) 
            };
            return [...prev, msg];
        });
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'messages', 
        filter: `restaurant_id=eq.${restaurantId}` 
      }, (payload) => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...payload.new, text: MenuService.decodeMessage(payload.new.text) } : m));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'table_sessions' }, fetchData)
      .subscribe();

    const clock = setInterval(() => setNow(new Date()), 10000); 
    return () => { 
      supabase.removeChannel(channel); 
      clearInterval(clock); 
    };
  }, [restaurantId]);

  const handleTabClick = (tab: SubTab, event: React.MouseEvent) => {
    setActiveSubTab(tab);
    event.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const unreadCount = useMemo(() => {
    const threads: Record<string, boolean> = {};
    messages.forEach(m => {
        if (m.sender === 'waiter') return;
        const key = m.session_id || m.table_number || 'guest-unidentified';
        if (m.sender === 'guest' && m.is_read === false) {
            threads[key] = true;
        }
    });
    return Object.keys(threads).length;
  }, [messages]);

  const waiterRequests = useMemo(() => {
    return messages.filter(m => m.sender === 'waiter').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [messages]);

  const getRelativeTime = (ts: string) => {
    const diff = Math.floor((now.getTime() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-jakarta pb-40">
      <div className="max-w-2xl mx-auto px-6 pt-12 space-y-10">
        <header className="px-2 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none uppercase italic">Console</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase mt-2 tracking-[0.2em] italic">Live order management & guest communications</p>
          </div>
          <button onClick={fetchData} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-300 hover:text-indigo-600 shadow-sm border border-slate-200 active:rotate-180 transition-all">
            <i className={`fa-solid fa-arrows-rotate ${isUpdating ? 'animate-spin text-indigo-600' : ''}`}></i>
          </button>
        </header>

        <div className="bg-slate-200/50 p-1.5 rounded-2xl flex border border-slate-200 shadow-inner overflow-x-auto no-scrollbar gap-1" ref={tabListRef}>
          {(['Live orders', 'Messages', 'Waiter request', 'Sessions'] as SubTab[]).map(tab => {
            const badge = tab === 'Messages' ? unreadCount : (tab === 'Waiter request' ? waiterRequests.length : tab === 'Sessions' ? activeSessions.length : 0);
            return (
              <button 
                key={tab}
                onClick={(e) => handleTabClick(tab, e)} 
                className={`flex-1 min-w-[110px] py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all relative ${activeSubTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
              >
                {tab}
                {badge > 0 && <span className={`absolute top-1.5 right-1.5 text-white text-[7px] px-1.5 py-0.5 rounded-full min-w-[14px] ${tab === 'Waiter request' ? 'bg-rose-500' : 'bg-indigo-600'}`}>{badge}</span>}
              </button>
            );
          })}
        </div>

        {activeSubTab === 'Live orders' && (
          <LiveOrdersConsole orders={orders} onRefresh={fetchData} />
        )}

        {activeSubTab === 'Messages' && (
          <AdminMessages messages={messages} restaurantId={restaurantId} onRefresh={fetchData} />
        )}

        {activeSubTab === 'Waiter request' && (
            <AdminWaiterRequests 
                requests={waiterRequests} 
                onRefresh={fetchData} 
                getRelativeTime={getRelativeTime} 
            />
        )}

        {activeSubTab === 'Sessions' && (
            <AdminSessions 
              activeSessions={activeSessions} 
              qrNodes={qrNodes} 
              onRefresh={fetchData} 
              getRelativeTime={getRelativeTime} 
            />
        )}
      </div>

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
