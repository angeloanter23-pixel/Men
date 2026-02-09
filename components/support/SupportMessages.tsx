
import React from 'react';

interface Message {
    id?: string;
    role: 'Guest' | 'Admin' | 'Waiter' | 'ai' | 'System-Error';
    text: string;
    created_at: string;
}

interface SupportMessagesProps {
  mode: 'staff' | 'ai';
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  loading: boolean;
  hasInteracted: boolean;
  faqs: { q: string; a: string }[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

const SupportMessages: React.FC<SupportMessagesProps> = ({
  mode,
  messages,
  input,
  setInput,
  onSend,
  loading,
  hasInteracted,
  faqs,
  scrollRef
}) => {
  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        {messages.map((m, i) => (
          <div key={m.id || i} className={`flex ${m.role === 'Guest' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm shadow-sm ${
              m.role === 'Guest' ? 'bg-slate-900 text-white rounded-tr-none' 
              : m.role === 'System-Error' ? 'bg-rose-50 text-rose-600 rounded-tl-none font-bold border border-rose-100'
              : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
            }`}>
              <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
              <div className={`flex items-center gap-2 mt-2 opacity-30 tracking-widest ${m.role === 'Guest' ? 'justify-end text-white' : 'text-slate-400'}`}>
                <span className="text-[7px] font-black uppercase">{m.role}</span>
                <span className="text-[7px] font-black">
                  {m.created_at !== new Date(0).toISOString() ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'SYSTEM'}
                </span>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white p-5 rounded-[2rem] rounded-tl-none border border-slate-100 flex gap-2">
              <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        {!hasInteracted && (
          <div className="pt-10 border-t border-slate-200/50 space-y-4">
            <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] px-2">Common Questions</h4>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-white/60 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <button onClick={() => setInput(faq.q)} className="w-full text-left p-4 hover:bg-white transition-colors">
                    <p className="text-[11px] font-bold text-slate-700">{faq.q}</p>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="p-6 bg-white border-t border-slate-100 flex gap-3 items-center shrink-0">
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && onSend()} 
          placeholder={mode === 'ai' ? "Ask AI about menu..." : "Message Staff..."} 
          className="flex-1 bg-slate-50 p-5 rounded-2xl text-sm font-bold outline-none shadow-inner" 
        />
        <button 
          onClick={onSend} 
          disabled={!input.trim() || loading} 
          className={`w-14 h-14 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all ${mode === 'staff' ? 'bg-indigo-600' : 'bg-[#FF6B00]'}`}
        >
          <i className="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </>
  );
};

export default SupportMessages;
