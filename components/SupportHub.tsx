import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MenuItem } from '../types';
import * as MenuService from '../services/menuService';

interface SupportHubProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  restaurantId: string;
  tableNumber: string;
}

type Mode = 'staff' | 'ai' | 'waiter';

const SupportHub: React.FC<SupportHubProps> = ({ isOpen, onClose, menuItems, restaurantId, tableNumber }) => {
  const [mode, setMode] = useState<Mode>('staff');
  const [messages, setMessages] = useState<{role: 'user' | 'model' | 'staff' | 'ai', text: string, created_at?: string}[]>([
    { role: 'model', text: "Greetings! I'm your Support Hub. You are currently chatting with our Staff." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [waiterStatus, setWaiterStatus] = useState<'idle' | 'calling' | 'done'>('idle');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, mode]);

  useEffect(() => {
    if (!isOpen) {
        setWaiterStatus('idle');
    }
  }, [isOpen]);

  // Real-time listener for Staff responses
  useEffect(() => {
    if (!restaurantId || !isOpen || mode === 'waiter') return;
    
    const channel = MenuService.supabase.channel('support-chat-live')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `restaurant_id=eq.${restaurantId}` 
      }, (payload) => {
        if (payload.new.table_number === tableNumber && payload.new.sender !== 'guest') {
            setMessages(prev => [...prev, { role: payload.new.sender as any, text: payload.new.text }]);
        }
      })
      .subscribe();

    return () => { MenuService.supabase.removeChannel(channel); };
  }, [restaurantId, isOpen, tableNumber, mode]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    
    if (mode === 'staff') {
        if (!restaurantId) {
            setMessages(prev => [...prev, { role: 'model', text: "Note: Live staff support is currently unavailable (No restaurant context detected)." }]);
            return;
        }
        try {
            await MenuService.sendLiveMessage({
                restaurant_id: restaurantId,
                table_number: tableNumber,
                customer_name: 'Guest',
                text: userMsg,
                sender: 'guest'
            });
        } catch (e) {
            setMessages(prev => [...prev, { role: 'model', text: "Message failed to reach the kitchen." }]);
        }
    } else if (mode === 'ai') {
        setLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const menuContext = menuItems.length > 0 
              ? menuItems.map(i => `${i.name} (₱${i.price}): ${i.description}`).join('\n')
              : "Menu is currently being updated.";
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: userMsg,
                config: {
                systemInstruction: `You are 'Gourmet Genie', a high-end food concierge for 'Foodie Premium'. 
                Rules: Recommend 1-3 specific dishes from the menu. Be concise. Tone: Professional yet friendly.`,
                },
            });

            setMessages(prev => [...prev, { role: 'ai', text: response.text || "I'm sorry, I'm having trouble thinking right now." }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: "Connection to Genie interrupted." }]);
        } finally {
            setLoading(false);
        }
    }
  };

  const handleCallWaiter = async () => {
    if (waiterStatus !== 'idle') return;
    setWaiterStatus('calling');
    try {
        await MenuService.sendLiveMessage({
            restaurant_id: restaurantId,
            table_number: tableNumber,
            customer_name: 'Guest',
            text: '🛎️ WAITER REQUESTED AT TABLE',
            sender: 'guest'
        });
        setTimeout(() => setWaiterStatus('done'), 1500);
    } catch (e) {
        alert("Request failed.");
        setWaiterStatus('idle');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center p-0 animate-fade-in font-jakarta">
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      
      <div className="relative bg-white w-full max-w-lg rounded-t-[3rem] h-[85vh] sm:h-[750px] flex flex-col overflow-hidden shadow-2xl animate-slide-up">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-4 shrink-0" />
        
        {/* Top Nav Tab Bar */}
        <div className="px-6 pb-4">
            <div className="bg-slate-100 p-1.5 rounded-2xl flex border border-slate-200 shadow-inner">
                <button 
                    onClick={() => setMode('staff')}
                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'staff' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <i className="fa-solid fa-user-tie"></i>
                    <span>Staff</span>
                </button>
                <button 
                    onClick={() => setMode('ai')}
                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'ai' ? 'bg-white text-[#FF6B00] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    <span>AI Genie</span>
                </button>
                <button 
                    onClick={() => setMode('waiter')}
                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'waiter' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <i className="fa-solid fa-bell"></i>
                    <span>Waiter</span>
                </button>
            </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
            {mode !== 'waiter' ? (
                <>
                    <header className={`p-4 flex items-center justify-between border-b border-slate-50 ${mode === 'staff' ? 'bg-indigo-50' : 'bg-orange-50'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${mode === 'staff' ? 'bg-indigo-600' : 'bg-[#FF6B00]'}`}>
                                <i className={`fa-solid ${mode === 'staff' ? 'fa-user-tie' : 'fa-wand-magic-sparkles'} text-xs text-white`}></i>
                            </div>
                            <div>
                                <h4 className={`text-sm font-black uppercase tracking-tight leading-none ${mode === 'staff' ? 'text-indigo-900' : 'text-orange-900'}`}>
                                    {mode === 'staff' ? 'Human Support' : 'AI Concierge'}
                                </h4>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Table {tableNumber}</p>
                            </div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </header>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-slate-50/50">
                        {messages.filter(m => mode === 'staff' ? (m.role === 'staff' || m.role === 'user' || m.role === 'model') : (m.role === 'ai' || m.role === 'user' || m.role === 'model')).map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                <div className={`max-w-[85%] p-5 rounded-[2.2rem] text-sm leading-relaxed shadow-sm ${
                                    m.role === 'user' 
                                    ? 'bg-slate-900 text-white rounded-tr-none' 
                                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                }`}>
                                    <p>{m.text}</p>
                                    {m.role !== 'user' && (
                                        <span className="block mt-2 text-[7px] font-black uppercase opacity-40 tracking-widest">
                                            {m.role === 'ai' ? 'Genie' : m.role === 'staff' ? 'Staff' : 'System'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start animate-pulse">
                                <div className="bg-white p-5 rounded-2xl rounded-tl-none border border-slate-100 flex gap-2">
                                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-white border-t border-slate-100 flex gap-3 items-center shrink-0">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={mode === 'staff' ? "Type message to staff..." : "Ask Genie for advice..."} 
                            className="flex-1 bg-slate-50 p-5 rounded-2xl text-sm font-bold outline-none shadow-inner"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="w-14 h-14 bg-[#FF6B00] text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:opacity-50"
                        >
                            <i className="fa-solid fa-paper-plane text-white"></i>
                        </button>
                    </div>
                </>
            ) : (
                <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
                    <div className={`w-32 h-32 rounded-[3rem] flex items-center justify-center text-5xl shadow-2xl transition-all duration-700 ${
                        waiterStatus === 'done' ? 'bg-emerald-500 text-white animate-bounce' : 'bg-slate-900 text-white group shadow-indigo-500/20'
                    }`}>
                        <i className={`fa-solid ${waiterStatus === 'done' ? 'fa-check' : 'fa-bell'} ${waiterStatus === 'calling' ? 'animate-ping' : ''}`}></i>
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
                            {waiterStatus === 'calling' ? 'Calling...' : waiterStatus === 'done' ? 'Staff Alerted' : 'Need Assistance?'}
                        </h3>
                        <p className="text-slate-500 text-sm font-medium italic max-w-[240px] mx-auto leading-relaxed">
                            {waiterStatus === 'done' 
                                ? "Great! A member of our team is now on their way to Table " + tableNumber + "." 
                                : "Tap below to instantly notify our staff that you need help at Table " + tableNumber + "."
                            }
                        </p>
                    </div>

                    {waiterStatus !== 'done' && (
                        <button 
                            onClick={handleCallWaiter}
                            disabled={waiterStatus === 'calling'}
                            className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 group"
                        >
                            <i className="fa-solid fa-hand-point-up group-hover:-translate-y-1 transition-transform"></i>
                            {waiterStatus === 'calling' ? 'Transmitting...' : 'Call Table Staff'}
                        </button>
                    )}

                    {waiterStatus === 'done' && (
                        <button 
                            onClick={() => setMode('staff')}
                            className="text-[10px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 px-8 py-3 rounded-xl border border-indigo-100"
                        >
                            Back to Chat
                        </button>
                    )}
                </div>
            )}
        </div>
      </div>

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
      `}</style>
    </div>
  );
};

export default SupportHub;