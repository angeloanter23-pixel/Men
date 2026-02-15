
import React, { useState } from 'react';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 last:border-none">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 px-4 flex items-center justify-between text-left active:bg-slate-50 transition-colors"
      >
        <span className="text-[16px] font-bold text-slate-900 pr-6">{question}</span>
        <i className={`fa-solid fa-chevron-right text-slate-300 transition-transform duration-300 text-sm ${isOpen ? 'rotate-90' : ''}`}></i>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="px-4 pb-6 text-[14px] text-slate-500 font-medium leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
};

interface MenuFAQProps {
  onBack: () => void;
  title?: string;
  subtitle?: string;
  items?: { q: string; a: string }[];
}

const MenuFAQ: React.FC<MenuFAQProps> = ({ 
  onBack,
  title = "Catalog FAQs",
  items = []
}) => {
  const [supportMessage, setSupportMessage] = useState('');
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  const handleSendSupport = () => {
    if (!supportMessage.trim()) return;
    const subject = encodeURIComponent(`Creation Stepper Support: ${title}`);
    const body = encodeURIComponent(`Hello Support Team,\n\nI am currently using the Creation Wizard in the ${title} step and need help with the following:\n\n"${supportMessage}"\n\nPlease reach out to me.\n\nThank you.`);
    window.location.href = `mailto:geloelolo@gmail.com?subject=${subject}&body=${body}`;
    setIsSupportModalOpen(false);
    setSupportMessage('');
  };

  return (
    <div className="animate-fade-in space-y-10">
      <header className="flex items-center justify-center py-6 relative border-b border-slate-100/50">
        <button onClick={onBack} className="absolute left-4 w-11 h-11 rounded-2xl bg-white border border-slate-200/60 flex items-center justify-center shadow-sm active:scale-90 transition-all">
          <i className="fa-solid fa-chevron-left text-slate-900"></i>
        </button>
        <h2 className="text-[17px] font-black tracking-tight text-slate-900 uppercase">{title}</h2>
      </header>

      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200/60 overflow-hidden divide-y divide-slate-50">
        {items.map((item, idx) => (
          <FAQItem key={idx} question={item.q} answer={item.a} />
        ))}
      </div>

      <button 
        onClick={() => setIsSupportModalOpen(true)}
        className="w-full bg-white border border-slate-200/60 p-8 rounded-[1.5rem] text-left shadow-sm group active:bg-slate-50 transition-all flex items-center justify-between"
      >
         <div className="space-y-1">
            <h4 className="text-lg font-black uppercase tracking-tight text-slate-900">Need a hand?</h4>
            <p className="text-xs font-medium text-slate-400 leading-relaxed">Message our specialists for expert help.</p>
         </div>
         <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-active:scale-90 transition-all">
            <i className="fa-solid fa-message text-sm"></i>
         </div>
      </button>

      {isSupportModalOpen && (
        <div className="fixed inset-0 z-[5000] flex items-end justify-center font-jakarta animate-fade-in">
          <div onClick={() => setIsSupportModalOpen(false)} className="absolute inset-0 backdrop-blur-md" />
          <div className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] shadow-2xl flex flex-col p-8 space-y-8 animate-slide-up pb-12">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2 shrink-0" />
            
            <header className="text-center">
              <h3 className="text-xl font-black uppercase text-slate-900 leading-none">Creation Assistance</h3>
            </header>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Support Request</label>
                <textarea 
                  value={supportMessage} 
                  onChange={e => setSupportMessage(e.target.value)}
                  className="w-full bg-white border border-slate-200 p-6 rounded-none font-medium text-sm outline-none focus:border-indigo-600 transition-all h-40 resize-none" 
                  placeholder="Tell us what you're stuck on..." 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={handleSendSupport}
                disabled={!supportMessage.trim()}
                className="w-full py-6 bg-slate-900 text-white rounded-none font-black uppercase text-[12px] tracking-[0.4em] shadow-xl active:scale-95 transition-all disabled:opacity-50"
              >
                Send Request
              </button>
              <button 
                onClick={() => setIsSupportModalOpen(false)}
                className="w-full py-5 text-slate-400 font-bold uppercase text-[10px] tracking-widest active:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
      `}</style>
    </div>
  );
};

export default MenuFAQ;
