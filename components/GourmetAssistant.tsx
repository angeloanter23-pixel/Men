
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

const GourmetAssistantComponent: React.FC<SupportHubProps> = ({ isOpen, onClose, menuItems, restaurantId, tableNumber }) => {
  const [mode, setMode] = useState<'staff' | 'ai'>('staff');
  const [messages, setMessages] = useState<{role: 'user' | 'model' | 'staff' | 'ai', text: string, created_at?: string}[]>([
    { role: 'model', text: "Welcome! I'm your Support Hub. You can chat with our Staff for immediate assistance, or switch to AI for personalized dish recommendations!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getDeviceId = () => {
      let id = localStorage.getItem('foodie_device_id');
      if (!id) {
          id = `dev_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;
          localStorage.setItem('foodie_device_id', id);
      }
      return id;
  };

  useEffect(() => {
    if (!restaurantId || mode !== 'staff') return;
    const deviceId = getDeviceId();
    
    const channel = MenuService.supabase.channel('guest-chat-live-old')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `device_id=eq.${deviceId}` 
      }, (payload) => {
        if (payload.new.sender !== 'guest') {
            setMessages(prev => [...prev, { role: payload.new.sender as any, text: payload.new.text }]);
        }
      })
      .subscribe();

    return () => { MenuService.supabase.removeChannel(channel); };
  }, [restaurantId, mode]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    
    if (mode === 'staff') {
        try {
            await MenuService.sendLiveMessage({
                restaurant_id: restaurantId,
                table_number: tableNumber,
                customer_name: 'Guest',
                text: userMsg,
                sender: 'guest',
                device_id: getDeviceId()
            });
        } catch (e) {
            console.error("Message delivery failed");
        }
    } else {
        setLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const menuContext = menuItems.map(i => `${i.name} (₱${i.price}): ${i.description}`).join('\n');
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: userMsg,
                config: {
                systemInstruction: `You are 'Gourmet Genie', a high-end food concierge. Current menu:\n${menuContext}`
                }
            });

            const aiText = response.text || "I apologize, my culinary intuition is momentarily clouded.";
            setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: "Connection issues." }]);
        } finally {
            setLoading(false);
        }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fade-in">
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      
      <div className="relative bg-white w-full max-w-lg sm:rounded-[3rem] h-[85vh] sm:h-[650px] flex flex-col overflow-hidden shadow-2xl animate-slide-up">
        <header className="bg-slate-900 p-6 md:p-8 text-white flex flex-col shrink-0">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${mode === 'staff' ? 'bg-indigo-600' : 'bg-[#FF6B00]'}`}>
                <i className={`fa-solid ${mode === 'staff' ? 'fa-user-tie' : 'fa-wand-magic-sparkles'} text-xl`}></i>
                </div>
                <div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter leading-none">{mode === 'staff' ? 'Staff Support' : 'Gourmet AI'}</h3>
                </div>
            </div>
          </div>

          <div className="bg-white/10 p-1.5 rounded-2xl flex border border-white/5 shadow-inner">
            <button onClick={() => setMode('staff')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'staff' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-white'}`}>Staff</button>
            <button onClick={() => setMode('ai')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'ai' ? 'bg-white text-[#FF6B00] shadow-xl' : 'text-slate-400 hover:text-white'}`}>AI Hub</button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed shadow-sm ${
                m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
              }`}>
                <p>{m.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex gap-3 items-center shrink-0">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Type..." className="flex-1 bg-slate-50 p-5 rounded-2xl text-sm font-bold outline-none" />
          <button onClick={handleSend} disabled={loading || !input.trim()} className={`w-14 h-14 text-white rounded-2xl flex items-center justify-center ${mode === 'staff' ? 'bg-indigo-600' : 'bg-[#FF6B00]'}`}><i className="fa-solid fa-paper-plane"></i></button>
        </div>
      </div>
      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
      `}</style>
    </div>
  );
};

export default GourmetAssistantComponent;
