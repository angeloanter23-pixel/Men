
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MenuItem } from '../types';
import * as MenuService from '../services/menuService';
import SupportMessages from './support/SupportMessages';
import WaiterRequest from './support/WaiterRequest';

interface SupportHubProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  restaurantId: string;
  tableNumber: string;
  sessionId?: string;
  qrToken?: string;
}

type Mode = 'staff' | 'ai' | 'waiter';

interface Message {
    id?: string;
    role: 'Guest' | 'Admin' | 'Waiter' | 'ai' | 'System-Error';
    text: string;
    created_at: string;
}

const FAQS = {
    staff: [
        { q: "How long is the wait?", a: "Orders usually take 15 to 25 minutes. It can take longer when we are busy." },
        { q: "Can I change my order?", a: "Please message us quickly. We can change it if the kitchen has not started cooking." },
        { q: "Need extra chairs?", a: "You can ask for more chairs or join tables here." },
        { q: "Is there Wi-Fi?", a: "Yes. Connect to 'Guest_WiFi' with password 'foodie2025'." }
    ],
    ai: [
        { q: "What is the best dish?", a: "Our Classic Chicken Adobo is the most popular choice." },
        { q: "Any gluten-free food?", a: "The Pork Sinigang is a good choice. I can check other items for you." },
        { q: "What drinks are good?", a: "The Spanish Latte is great for coffee lovers. We also have fresh juices." }
    ]
};

const getDeviceId = () => {
    let id = localStorage.getItem('foodie_device_id');
    if (!id) {
        id = `dev_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;
        localStorage.setItem('foodie_device_id', id);
    }
    return id;
};

const SupportHub: React.FC<SupportHubProps> = ({ isOpen, onClose, menuItems, restaurantId, tableNumber, sessionId, qrToken }) => {
  const [mode, setMode] = useState<Mode>('staff');
  const [staffMessages, setStaffMessages] = useState<Message[]>([]);
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [waiterStatus, setWaiterStatus] = useState<'idle' | 'calling' | 'done'>('idle');
  const [hasInteracted, setHasInteracted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!restaurantId || !sessionId || !isOpen) return;
    
    const fetchHistory = async () => {
        try {
            const { data, error } = await MenuService.supabase
                .from('messages')
                .select('*')
                .eq('device_id', getDeviceId())
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            const raw = (data || []);
            
            if (raw.length > 0) setHasInteracted(true);
            
            const staffHistory = raw
                .filter(m => m.sender === 'guest' || m.sender === 'admin' || m.sender === 'waiter')
                .map(m => ({ 
                    id: m.id, 
                    role: m.sender === 'guest' ? 'Guest' : m.sender === 'admin' ? 'Admin' : 'Waiter', 
                    text: MenuService.decodeMessage(m.text), 
                    created_at: m.created_at 
                } as Message));

            setStaffMessages([{ role: 'Admin', text: "Hello! How can we help you today?", created_at: new Date(0).toISOString() }, ...staffHistory]);
            if (aiMessages.length === 0) {
                setAiMessages([{ role: 'ai', text: "Hello! I am your AI assistant. Ask me anything about our menu.", created_at: new Date(0).toISOString() }]);
            }
        } catch (e: any) { 
            setStaffMessages(prev => [...prev, { role: 'System-Error', text: "Connection error. Please try again.", created_at: new Date().toISOString() }]);
        }
    };
    fetchHistory();
  }, [restaurantId, sessionId, isOpen]);

  useEffect(() => {
    if (!restaurantId || !isOpen || !sessionId) return;
    const deviceId = getDeviceId();
    const channel = MenuService.supabase.channel(`guest-hub-${deviceId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `device_id=eq.${deviceId}` }, (payload) => {
        const msg = payload.new;
        const decodedText = MenuService.decodeMessage(msg.text);
        
        if (msg.sender === 'admin') {
            setStaffMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, { id: msg.id, role: 'Admin', text: decodedText, created_at: msg.created_at }]));
        } else if (msg.sender === 'guest') {
            const gMsg = { id: msg.id, role: 'Guest' as const, text: decodedText, created_at: msg.created_at };
            setStaffMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, gMsg]);
        }
      })
      .subscribe();
    return () => { MenuService.supabase.removeChannel(channel); };
  }, [restaurantId, isOpen, sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [staffMessages, aiMessages, mode]);

  const handleSend = async () => {
    const txt = input.trim();
    if (!txt || loading) return;

    if (!sessionId || !restaurantId) {
        setStaffMessages(prev => [...prev, { role: 'System-Error', text: "Please scan a table QR code first.", created_at: new Date().toISOString() }]);
        return;
    }

    const nowTs = new Date().toISOString();
    setInput('');
    setHasInteracted(true);

    if (mode === 'staff') {
        const tempId = `temp-${Date.now()}`;
        setStaffMessages(prev => [...prev, { id: tempId, role: 'Guest', text: txt, created_at: nowTs }]);
        try {
            await MenuService.sendLiveMessage({ 
                restaurant_id: restaurantId, 
                table_number: tableNumber, 
                customer_name: 'Guest', 
                text: txt, 
                sender: 'guest', 
                session_id: sessionId, 
                qr_token: qrToken || '',
                device_id: getDeviceId()
            });
        } catch (e: any) {
            setStaffMessages(prev => [
                ...prev.filter(m => m.id !== tempId),
                { role: 'System-Error', text: "Message could not be sent.", created_at: new Date().toISOString() }
            ]);
        }
    } else if (mode === 'ai') {
        setAiMessages(prev => [...prev, { role: 'Guest', text: txt, created_at: nowTs }]);
        setLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const menuContext = menuItems.map(i => `${i.name}: ${i.description}`).join('\n');
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: txt,
                config: { systemInstruction: `Support assistant for Table ${tableNumber}. Use simple English. Be helpful. Menu:\n${menuContext}` }
            });
            setAiMessages(prev => [...prev, { role: 'ai', text: response.text || "I am not sure how to answer that.", created_at: new Date().toISOString() }]);
        } catch (error: any) {
            setAiMessages(prev => [...prev, { role: 'System-Error', text: "AI is busy. Please try later.", created_at: new Date().toISOString() }]);
        } finally { setLoading(false); }
    }
  };

  const handleCallWaiter = async () => {
    if (waiterStatus !== 'idle') return;
    if (!sessionId) {
        setMode('staff');
        setStaffMessages(prev => [...prev, { role: 'System-Error', text: "Please scan a table QR code first.", created_at: new Date().toISOString() }]);
        return;
    }
    setWaiterStatus('calling');
    try {
        await MenuService.sendLiveMessage({ 
            restaurant_id: restaurantId, 
            table_number: tableNumber, 
            customer_name: 'Guest', 
            text: 'I need help at my table', 
            sender: 'waiter', 
            session_id: sessionId, 
            qr_token: qrToken || '',
            device_id: getDeviceId()
        });
        setWaiterStatus('done');
        setTimeout(() => setWaiterStatus('idle'), 5000);
    } catch (e: any) { 
        setStaffMessages(prev => [...prev, { role: 'System-Error', text: "Could not alert staff.", created_at: new Date().toISOString() }]);
        setWaiterStatus('idle'); 
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center p-0 font-jakarta transition-all duration-300">
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" />
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl h-[85vh] sm:h-[700px] flex flex-col overflow-hidden shadow-2xl animate-slide-up border-t border-slate-100">
        <header className="bg-white px-8 pt-8 pb-4 shrink-0 border-b border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300 ${mode === 'staff' ? 'bg-slate-100 text-slate-900' : mode === 'ai' ? 'bg-orange-50 text-[#FF6B00]' : 'bg-rose-50 text-rose-600'}`}>
                  <i className={`fa-solid ${mode === 'staff' ? 'fa-user-tie' : mode === 'ai' ? 'fa-wand-magic-sparkles' : 'fa-bell'} text-lg`}></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight uppercase leading-none text-slate-900">
                    {mode === 'staff' ? 'Staff Help' : mode === 'ai' ? 'AI Helper' : 'Service'}
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 leading-none">Table {tableNumber}</p>
                </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90 border border-slate-100"><i className="fa-solid fa-xmark"></i></button>
          </div>
          
          <div className="bg-slate-100/60 p-1 rounded-2xl flex border border-slate-100 shadow-inner">
            <button onClick={() => setMode('staff')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'staff' ? 'bg-white text-[#FF6B00] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Staff</button>
            <button onClick={() => setMode('ai')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'ai' ? 'bg-white text-[#FF6B00] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>AI Hub</button>
            <button onClick={() => setMode('waiter')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'waiter' ? 'bg-white text-[#FF6B00] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Request</button>
          </div>
        </header>
        
        <div className="flex-1 flex flex-col overflow-hidden bg-[#FBFBFD]">
            {mode !== 'waiter' ? (
                <SupportMessages 
                  mode={mode}
                  messages={mode === 'ai' ? aiMessages : staffMessages}
                  input={input}
                  setInput={setInput}
                  onSend={handleSend}
                  loading={loading}
                  hasInteracted={hasInteracted}
                  faqs={FAQS[mode]}
                  scrollRef={scrollRef}
                />
            ) : (
                <WaiterRequest 
                  waiterStatus={waiterStatus}
                  onCallWaiter={handleCallWaiter}
                  tableNumber={tableNumber}
                />
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
