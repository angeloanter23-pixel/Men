
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MenuItem } from '../types';

interface GourmetAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
}

const GourmetAssistant: React.FC<GourmetAssistantProps> = ({ isOpen, onClose, menuItems, onSelectItem }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: "Hello! I'm your Gourmet Genie. Not sure what to order? Ask me for recommendations based on your mood or cravings!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const menuContext = menuItems.map(i => `${i.name} (₱${i.price}): ${i.description}`).join('\n');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: `You are 'Gourmet Genie', a high-end food concierge for 'Foodie Premium'. 
          You are helpful, elegant, and expert in food pairings.
          Here is our current menu:
          ${menuContext}
          
          Rules:
          1. Recommend 1-3 specific dishes from the menu above.
          2. Be concise and use a professional yet friendly tone.
          3. Mention ingredients if asked.
          4. If a dish isn't on the menu, politely suggest the closest alternative we have.`,
        },
      });

      const aiText = response.text || "I'm sorry, I'm having trouble thinking right now. Let me check the kitchen...";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Pardon me, my connection to the kitchen was interrupted. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fade-in">
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      
      <div className="relative bg-white w-full max-w-lg sm:rounded-[3rem] h-[85vh] sm:h-[600px] flex flex-col overflow-hidden shadow-2xl animate-slide-up">
        <header className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
              <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter leading-none">Gourmet Genie</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">AI Food Concierge</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-slate-50/50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed shadow-sm ${
                m.role === 'user' 
                ? 'bg-slate-900 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-white p-5 rounded-[2rem] rounded-tl-none border border-slate-100 flex gap-2">
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
            placeholder="What should I eat today?" 
            className="flex-1 bg-slate-50 p-5 rounded-2xl text-sm font-bold outline-none border border-transparent focus:border-brand-primary/20 transition-all shadow-inner"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-14 h-14 bg-brand-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-primary/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
      `}</style>
    </div>
  );
};

export default GourmetAssistant;
