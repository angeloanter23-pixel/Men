
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MenuItem } from '../types';

interface AIAssistantViewProps {
  menuItems: MenuItem[];
  onItemSelect: (item: MenuItem) => void;
  onGoBack: () => void;
}

const AIAssistantView: React.FC<AIAssistantViewProps> = ({ menuItems, onItemSelect, onGoBack }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai' | 'model', text: string}[]>([
    { role: 'model', text: "Greetings! I am Gourmet Genie, your personal culinary concierge. I know everything about our menu. What are you in the mood for today?" }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsThinking(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const menuContext = menuItems.map(i => `- ${i.name} (₱${i.price}): ${i.description}`).join('\n');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: `You are 'Gourmet Genie', an elite food concierge for 'Foodie Premium'. 
          Your tone is elegant, helpful, and sophisticated.
          
          Current Menu Context:
          ${menuContext}
          
          Instructions:
          1. Provide personalized recommendations based on the user's mood or request.
          2. Recommend 2-3 items from the menu.
          3. If the user mentions a dish name, format it in **BOLD** so they can identify it.
          4. Suggest drink pairings if they are ordering food.
          5. Be concise but warm.`,
        },
      });

      const aiText = response.text || "I apologize, my culinary intuition is momentarily clouded. How else may I assist you?";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Forgive me, the kitchen connection is slightly unstable. Please try again in a moment." }]);
    } finally {
      setIsThinking(false);
    }
  };

  // Helper to find item by name in text (simple match)
  const renderMessageContent = (text: string) => {
    // This is a simple implementation. In a production app, we might use a more robust parsing.
    return (
      <div className="space-y-4">
        <p className="whitespace-pre-wrap">{text}</p>
        <div className="flex flex-wrap gap-2">
            {menuItems.filter(item => text.toLowerCase().includes(item.name.toLowerCase())).map(item => (
                <button 
                    key={item.id}
                    onClick={() => onItemSelect(item)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900/5 hover:bg-[#FF6B00]/10 border border-slate-200 rounded-full transition-all group"
                >
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-white">
                        <img src={item.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 group-hover:text-[#FF6B00]">View {item.name}</span>
                    <i className="fa-solid fa-arrow-right text-[8px] text-slate-300 group-hover:text-[#FF6B00]"></i>
                </button>
            ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#FBFBFD] font-jakarta animate-fade-in overflow-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-2xl border-b border-slate-100 p-6 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-4">
            <button onClick={onGoBack} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90">
                <i className="fa-solid fa-chevron-left"></i>
            </button>
            <div>
                <h1 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Gourmet<span className="text-[#FF6B00]">Genie</span></h1>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Personal AI Concierge</p>
            </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-[#FF6B00]/5 border border-[#FF6B00]/10 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse"></div>
            <span className="text-[9px] font-black uppercase text-[#FF6B00] tracking-widest">Live Sync</span>
        </div>
      </header>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar pb-32">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[85%] md:max-w-[70%] p-6 rounded-[2.5rem] shadow-sm transition-all ${
              m.role === 'user' 
              ? 'bg-slate-900 text-white rounded-tr-none shadow-xl shadow-slate-200' 
              : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
            }`}>
              {m.role === 'user' ? <p className="text-sm font-medium leading-relaxed">{m.text}</p> : renderMessageContent(m.text)}
              <span className={`block mt-3 text-[7px] font-black uppercase opacity-30 tracking-[0.2em] ${m.role === 'user' ? 'text-white' : 'text-slate-400'}`}>
                {m.role === 'user' ? 'Requested' : 'Gourmet Genie v3.0'}
              </span>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white p-6 rounded-[2.5rem] rounded-tl-none border border-slate-100 flex flex-col gap-4 shadow-sm min-w-[120px]">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 bg-[#FF6B00] rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-[#FF6B00] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                   <div className="w-2 h-2 bg-[#FF6B00] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Genie is crafting your meal...</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-3xl border-t border-slate-100 p-6 md:p-8 z-[60]">
        <div className="max-w-2xl mx-auto relative group">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tell Genie your cravings..." 
            className="w-full bg-slate-50 p-6 pr-20 rounded-3xl text-sm font-bold outline-none border border-transparent focus:border-[#FF6B00]/20 focus:bg-white transition-all shadow-inner group-hover:shadow-md"
          />
          <button 
            onClick={handleSend}
            disabled={isThinking || !input.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-[#FF6B00] text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-30 disabled:grayscale"
          >
            <i className="fa-solid fa-wand-magic-sparkles text-lg"></i>
          </button>
        </div>
        
        <div className="flex justify-center gap-4 mt-6 overflow-x-auto no-scrollbar pb-2">
            {[
                { label: "What's Popular?", icon: "fa-fire" },
                { label: "Pair with Wine", icon: "fa-wine-glass" },
                { label: "Healthy Picks", icon: "fa-leaf" },
                { label: "Surprise Me", icon: "fa-dice" }
            ].map((suggest) => (
                <button 
                    key={suggest.label}
                    onClick={() => { setInput(suggest.label); handleSend(); }}
                    className="shrink-0 px-5 py-2.5 bg-white border border-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-[#FF6B00] hover:border-[#FF6B00]/20 transition-all shadow-sm flex items-center gap-2"
                >
                    <i className={`fa-solid ${suggest.icon} text-[10px]`}></i>
                    {suggest.label}
                </button>
            ))}
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default AIAssistantView;
