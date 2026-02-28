
import React, { useState } from 'react';

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
  needsScan?: boolean;
  onScanQR?: () => void;
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
  scrollRef,
  needsScan,
  onScanQR
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar font-jakarta">
        {/* COLLAPSIBLE FAQS AT THE TOP */}
        <div className="space-y-2 mb-10">
          <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.4em] px-2 mb-3">Quick Help</p>
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm transition-all">
              <button 
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full px-5 py-4 flex items-center justify-between text-left group active:bg-slate-50 transition-colors"
              >
                <span className={`text-[14px] font-bold tracking-tight transition-colors ${openFaq === idx ? 'text-[#FF6B00]' : 'text-slate-800'}`}>{faq.q}</span>
                <i className={`fa-solid fa-chevron-down text-[10px] text-slate-300 transition-transform duration-300 ${openFaq === idx ? 'rotate-180 text-[#FF6B00]' : ''}`}></i>
              </button>
              <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${openFaq === idx ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-5 pb-5 pt-1 text-[13px] text-slate-500 font-medium leading-relaxed">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 px-2">
            <div className="h-px bg-slate-100 flex-1"></div>
            <span className="text-[8px] font-black text-slate-200 uppercase tracking-[0.5em]">Live Chat</span>
            <div className="h-px bg-slate-100 flex-1"></div>
        </div>

        {messages.map((m, i) => (
          <div key={m.id || i} className={`flex ${m.role === 'Guest' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[85%] p-5 rounded-2xl text-[14px] shadow-sm ${
              m.role === 'Guest' 
                ? 'bg-slate-900 text-white rounded-tr-none' 
                : m.role === 'System-Error' 
                ? 'bg-rose-50 text-rose-600 rounded-tl-none font-bold border border-rose-100'
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
            }`}>
              <p className="leading-relaxed whitespace-pre-wrap font-medium">{m.text}</p>
              <div className={`flex items-center gap-2 mt-3 opacity-30 tracking-widest ${m.role === 'Guest' ? 'justify-end text-white' : 'text-slate-400'}`}>
                <span className="text-[8px] font-black uppercase">{m.role}</span>
                <span className="text-[8px] font-black uppercase">
                  {m.created_at !== new Date(0).toISOString() ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'SYSTEM'}
                </span>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white p-5 rounded-2xl rounded-tl-none border border-slate-100 flex gap-2 shadow-sm">
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>
      
      {needsScan && (
        <div className="p-4 bg-orange-50 border-t border-orange-100 flex flex-col items-center justify-center gap-3 shrink-0">
            <p className="text-[11px] font-bold text-slate-600 text-center">Scan a table QR code to link your orders and messages to your table.</p>
            <button 
                onClick={onScanQR}
                className="px-6 py-3 bg-[#FF6B00] text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md active:scale-95 transition-all flex items-center gap-2"
            >
                <i className="fa-solid fa-qrcode"></i> Scan QR Now
            </button>
        </div>
      )}

      <div className="p-6 md:p-8 bg-white border-t border-slate-50 flex gap-3 items-center shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && onSend()} 
          placeholder={mode === 'ai' ? "Ask about the menu..." : "Message our staff..."} 
          className="flex-1 bg-slate-50 p-5 rounded-2xl text-sm font-bold outline-none border border-transparent focus:bg-white focus:border-slate-200 transition-all shadow-inner" 
        />
        <button 
          onClick={onSend} 
          disabled={!input.trim()} 
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all active:scale-90 disabled:opacity-30 bg-[#FF6B00] shadow-orange-500/20`}
        >
          <i className="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </>
  );
};

export default SupportMessages;
