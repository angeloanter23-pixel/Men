
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
        { q: "How long is the wait?", a: "Standard preparation takes 15-25 minutes. Busy hours may vary." },
        { q: "Change my order?", a: "Please message us immediately. If cooking hasn't started, we can modify it." },
        { q: "Table for more?", a: "Request extra chairs or table joins directly here." },
        { q: "Wi-Fi Access?", a: "Connect to 'Guest_WiFi' using password 'foodie2025'." }
    ],
    ai: [
        { q: "Chef's Special?", a: "The Classic Chicken Adobo is currently our most requested authentic dish." },
        { q: "What's gluten-free?", a: "I can check specific items. The Pork Sinigang is a great naturally GF choice." },
        { q: "Mild drink pairing?", a: "I recommend the Spanish Latte with breakfast or a fresh fruit juice for mains." }
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

  // Sync History
  useEffect(() => {
    if (!restaurantId || !sessionId || !isOpen) return;
    
    const fetchHistory = async () => {
        try {
            const { data, error } = await MenuService.supabase
                .from('messages')
                .select('*')
                .eq('session_id', sessionId)
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

            setStaffMessages([{ role: 'Admin', text: "Hello! You're connected to our staff. How can we help you today?", created_at: new Date(0).toISOString() }, ...staffHistory]);
            if (aiMessages.length === 0) {
                setAiMessages([{ role: 'ai', text: "Greetings! I'm your AI Concierge. Ask me about the menu or for recommendations.", created_at: new Date(0).toISOString() }]);
            }
        } catch (e: any) { 
            const errMsg = e.message || JSON.stringify(e);
            setStaffMessages(prev => [...prev, { role: 'System-Error', text: `Sync Error: ${errMsg}`, created_at: new Date().toISOString() }]);
        }
    };
    fetchHistory();
  }, [restaurantId, sessionId, isOpen]);

  // Real-time listener
  useEffect(() => {
    if (!restaurantId || !isOpen || !sessionId) return;
    const channel = MenuService.supabase.channel(`guest-hub-${sessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${sessionId}` }, (payload) => {
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
        setStaffMessages(prev => [...prev, { role: 'System-Error', text: "Session error. Please scan the table QR code first.", created_at: new Date().toISOString() }]);
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
                { role: 'System-Error', text: `Message Failed: ${e.message}`, created_at: new Date().toISOString() }
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
                config: { systemInstruction: `Culinary Guide. Table ${tableNumber}. Menu:\n${menuContext}` }
            });
            setAiMessages(prev => [...prev, { role: 'ai', text: response.text || "...", created_at: new Date().toISOString() }]);
        } catch (error: any) {
            setAiMessages(prev => [...prev, { role: 'System-Error', text: `AI Error: ${error.message}`, created_at: new Date().toISOString() }]);
        } finally { setLoading(false); }
    }
  };

  const handleCallWaiter = async () => {
    if (waiterStatus !== 'idle') return;

    if (!sessionId) {
        setMode('staff');
        setStaffMessages(prev => [...prev, { role: 'System-Error', text: "Identify your table first by scanning the table QR code.", created_at: new Date().toISOString() }]);
        return;
    }
    
    setWaiterStatus('calling');
    try {
        await MenuService.sendLiveMessage({ 
            restaurant_id: restaurantId, 
            table_number: tableNumber, 
            customer_name: 'Guest', 
            text: '🛎️ PHYSICAL ASSISTANCE REQUESTED', 
            sender: 'waiter', 
            session_id: sessionId, 
            qr_token: qrToken || '',
            device_id: getDeviceId()
        });
        
        setWaiterStatus('done');
        setTimeout(() => {
            setWaiterStatus('idle');
        }, 5000);

    } catch (e: any) { 
        setStaffMessages(prev => [...prev, { role: 'System-Error', text: `Service Error: ${e.message}`, created_at: new Date().toISOString() }]);
        setWaiterStatus('idle'); 
        setMode('staff');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center p-0 animate-fade-in font-jakarta">
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <div className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] h-[85vh] sm:h-[700px] flex flex-col overflow-hidden shadow-2xl animate-slide-up">
        <header className="bg-slate-900 p-6 text-white shrink-0">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${mode === 'staff' ? 'bg-indigo-600' : mode === 'ai' ? 'bg-[#FF6B00]' : 'bg-rose-50'}`}>
                  <i className={`fa-solid ${mode === 'staff' ? 'fa-user-tie' : mode === 'ai' ? 'fa-wand-magic-sparkles' : 'fa-bell'} text-xl ${mode === 'waiter' ? 'text-rose-500' : 'text-white'}`}></i>
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter leading-none">
                    {mode === 'staff' ? 'Staff Hub' : mode === 'ai' ? 'Gourmet AI' : 'Table Service'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Table {tableNumber}</p>
                </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"><i className="fa-solid fa-xmark text-lg"></i></button>
          </div>
          <div className="bg-white/5 p-1.5 rounded-2xl flex border border-white/5 shadow-inner">
            <button onClick={() => setMode('staff')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'staff' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-white'}`}>Staff</button>
            <button onClick={() => setMode('ai')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'ai' ? 'bg-white text-[#FF6B00] shadow-xl' : 'text-slate-400 hover:text-white'}`}>AI Hub</button>
            <button onClick={() => setMode('waiter')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'waiter' ? 'bg-white text-rose-500 shadow-xl' : 'text-slate-400 hover:text-white'}`}>Call</button>
          </div>
        </header>
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
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
