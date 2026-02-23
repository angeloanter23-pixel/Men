
import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as MenuService from '../../services/menuService';
import { supabase } from '../../lib/supabase';

interface AdminMessagesProps {
  messages: any[];
  restaurantId: string;
  onRefresh: () => void;
}

export default function AdminMessages({ messages, restaurantId, onRefresh }: AdminMessagesProps) {
  const [selectedChatThread, setSelectedChatThread] = useState<any | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [threadActionTarget, setThreadActionTarget] = useState<any | null>(null);
  const [threadToDelete, setThreadToDelete] = useState<any | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<number | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
        chatScrollRef.current.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [selectedChatThread, messages]);

  const getRelativeTime = (ts: string) => {
    const diff = Math.floor((now.getTime() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const updateMessageReadStatus = async (deviceId: string, status: boolean) => {
    try {
        await supabase
            .from('messages')
            .update({ is_read: status })
            .eq('device_id', deviceId)
            .eq('sender', 'guest');
        onRefresh();
    } catch (e) {
        console.error("Failed to update message read status");
    }
  };

  const handleSelectThread = (thread: any) => {
      setSelectedChatThread(thread);
      if (thread.unread) {
          updateMessageReadStatus(thread.device_id, true);
      }
  };

  const handleSendReply = async () => {
    const txt = chatInput.trim();
    if (!txt || !selectedChatThread || !restaurantId || isSending) return;
    
    setIsSending(true);
    setChatInput('');

    try {
        await MenuService.sendLiveMessage({
            restaurant_id: restaurantId,
            table_number: selectedChatThread.table,
            customer_name: 'Staff',
            text: txt,
            sender: 'admin', 
            session_id: selectedChatThread.session_id,
            qr_token: selectedChatThread.qr_token || '',
            device_id: selectedChatThread.device_id,
            is_read: true
        });
        onRefresh();
    } catch (e: any) { 
        console.error("Send error", e);
    } finally { 
        setIsSending(false); 
    }
  };

  const handleDeleteConversation = async (deviceId: string) => {
    try {
        await supabase.from('messages').delete().eq('device_id', deviceId);
        setThreadToDelete(null);
        onRefresh();
    } catch (e) {
        console.error("Delete failed");
    }
  };

  const chatThreads = useMemo(() => {
    const threads: Record<string, any> = {};
    messages.forEach(m => {
        if (m.sender === 'waiter') return;
        const key = m.device_id || m.session_id || m.table_number || 'guest-unidentified';
        if (!threads[key]) {
            threads[key] = { id: key, table: m.table_number, latest: m, count: 0, session_id: m.session_id, device_id: m.device_id, unread: false };
        }
        threads[key].count++;
        if (new Date(m.created_at) >= new Date(threads[key].latest.created_at)) {
            threads[key].latest = m;
        }
        if (m.sender === 'guest' && m.is_read === false) {
            threads[key].unread = true;
        }
    });
    return Object.values(threads).sort((a: any, b: any) => new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime());
  }, [messages]);

  const startLongPress = (thread: any) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
        if ('vibrate' in navigator) navigator.vibrate(50);
        setThreadActionTarget(thread);
    }, 600);
  };

  const endLongPress = () => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
        <div className="grid grid-cols-1 gap-1 bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm">
            {chatThreads.map((thread, idx) => (
                <button 
                    key={thread.id} 
                    onClick={() => handleSelectThread(thread)} 
                    onMouseDown={() => startLongPress(thread)}
                    onMouseUp={endLongPress}
                    onMouseLeave={endLongPress}
                    onTouchStart={() => startLongPress(thread)}
                    onTouchEnd={endLongPress}
                    className={`w-full p-6 flex items-center justify-between group transition-all active:bg-slate-50 select-none ${idx !== chatThreads.length - 1 ? 'border-b border-slate-50' : ''}`}
                >
                    <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg ${thread.unread ? 'bg-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                            <i className="fa-solid fa-user text-lg"></i>
                        </div>
                        <div className="text-left min-w-0">
                            <h4 className={`text-[17px] tracking-tight leading-none mb-1 ${thread.unread ? 'font-black text-slate-900' : 'font-medium text-slate-400'}`}>{thread.table}</h4>
                            <p className={`text-[14px] truncate max-w-[180px] leading-tight ${thread.unread ? 'font-black text-slate-700' : 'font-medium text-slate-400'}`}>
                                {thread.latest.sender === 'admin' ? 'You: ' : ''}{thread.latest.text}
                            </p>
                        </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-tighter shrink-0 ml-2">{getRelativeTime(thread.latest.created_at)}</span>
                </button>
            ))}
            {chatThreads.length === 0 && <div className="py-24 text-center opacity-20 italic">Inbox Empty</div>}
        </div>

        {selectedChatThread && (
          <div className="fixed inset-0 z-[1000] flex items-end justify-center animate-fade-in font-jakarta">
              <div onClick={() => setSelectedChatThread(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
              <div className="relative bg-[#F2F2F7] w-full max-w-lg rounded-t-[2.5rem] shadow-2xl flex flex-col h-[94vh] overflow-hidden animate-slide-up">
                  <header className="px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex justify-between items-center shrink-0">
                      <button onClick={() => setSelectedChatThread(null)} className="text-indigo-600 text-[17px] font-bold uppercase tracking-widest"><i className="fa-solid fa-chevron-left mr-1"></i> Back</button>
                      <div className="text-center">
                          <h2 className="text-[17px] font-black tracking-tight leading-none uppercase italic">{selectedChatThread.table}</h2>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-widest">Live Console</p>
                      </div>
                      <div className="w-16" />
                  </header>
                  <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-4 py-8 space-y-4 no-scrollbar">
                      {messages.filter(m => m.device_id === selectedChatThread.device_id && (m.sender === 'guest' || m.sender === 'admin')).map((m, i) => (
                          <div key={m.id || i} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] px-5 py-3 rounded-[2rem] text-[15px] shadow-sm ${m.sender === 'admin' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                                  <p>{m.text}</p>
                                  <span className={`block mt-1 text-[7px] font-black uppercase opacity-30 ${m.sender === 'admin' ? 'text-white' : 'text-slate-400'}`}>
                                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                              </div>
                          </div>
                      ))}
                  </div>
                  <div className="p-4 pb-8 bg-white border-t border-slate-100 flex gap-3 items-center shrink-0">
                      <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendReply()} placeholder="Type reply..." className="flex-1 bg-slate-50 border border-slate-200 px-6 py-3 rounded-full text-sm font-bold outline-none transition-all focus:bg-white" />
                      <button onClick={handleSendReply} disabled={!chatInput.trim() || isSending} className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center active:scale-90 transition-all disabled:opacity-30">
                        {isSending ? <i className="fa-solid fa-spinner animate-spin text-sm"></i> : <i className="fa-solid fa-paper-plane text-sm"></i>}
                      </button>
                  </div>
              </div>
          </div>
        )}

        {threadActionTarget && (
            <div className="fixed inset-0 z-[2000] flex items-end justify-center animate-fade-in p-4">
                <div onClick={() => setThreadActionTarget(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" />
                <div className="relative w-full max-w-lg space-y-3 animate-slide-up">
                    <div className="bg-white/95 backdrop-blur-2xl rounded-[1.5rem] overflow-hidden flex flex-col divide-y divide-slate-100 shadow-2xl">
                        <div className="px-6 py-5 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Conversation Options</p>
                            <h4 className="text-sm font-bold text-slate-900">Manage {threadActionTarget.table}</h4>
                        </div>
                        <button 
                            onClick={() => { updateMessageReadStatus(threadActionTarget.device_id, !threadActionTarget.unread); setThreadActionTarget(null); }} 
                            className="w-full py-5 text-[#007AFF] font-bold text-[18px] active:bg-slate-100 transition-colors"
                        >
                            Mark as {threadActionTarget.unread ? 'Read' : 'Unread'}
                        </button>
                        <button 
                            onClick={() => { 
                                setThreadToDelete(threadActionTarget);
                                setThreadActionTarget(null); 
                            }} 
                            className="w-full py-5 text-rose-500 font-bold text-[18px] active:bg-slate-100 transition-colors"
                        >
                            Delete Chat
                        </button>
                    </div>
                    <button onClick={() => setThreadActionTarget(null)} className="w-full bg-white py-5 rounded-[1.5rem] font-bold text-[18px] text-slate-900 active:scale-[0.98] transition-all shadow-xl">Cancel</button>
                </div>
            </div>
        )}

        {threadToDelete && (
            <div className="fixed inset-0 z-[3000] flex items-end justify-center animate-fade-in p-4">
                <div onClick={() => setThreadToDelete(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
                <div className="relative w-full max-w-lg space-y-3 animate-slide-up">
                    <div className="bg-white/95 backdrop-blur-2xl rounded-[1.5rem] overflow-hidden flex flex-col shadow-2xl">
                        <div className="px-10 py-10 text-center">
                            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl shadow-inner">
                                <i className="fa-solid fa-trash-can"></i>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-3">Confirm Deletion</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">
                                Permanently delete the conversation with <span className="font-bold text-slate-900">{threadToDelete.table}</span>?
                            </p>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
                            <button 
                                onClick={() => handleDeleteConversation(threadToDelete.device_id)} 
                                className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-[14px] uppercase tracking-[0.2em] shadow-xl shadow-rose-100 active:scale-95 transition-all"
                            >
                                Permanently Purge
                            </button>
                            <button 
                                onClick={() => setThreadToDelete(null)} 
                                className="w-full py-4 text-slate-400 font-bold text-[14px] uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
