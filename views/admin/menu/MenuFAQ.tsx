
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
        className="w-full py-6 px-5 flex items-center justify-between text-left active:bg-slate-50 transition-colors group"
      >
        <span className="text-[17px] font-bold text-slate-900 pr-8 group-hover:text-indigo-600 transition-colors">{question}</span>
        <i className={`fa-solid fa-chevron-right text-slate-300 transition-transform duration-300 text-sm ${isOpen ? 'rotate-90 text-indigo-500' : ''}`}></i>
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="px-5 pb-8 text-[15px] text-slate-500 font-medium leading-relaxed">
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
  title = "Console Support", 
  items = []
}) => {
  const [supportMessage, setSupportMessage] = useState('');
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  const handleSendSupport = () => {
    if (!supportMessage.trim()) return;
    const subject = encodeURIComponent(`Support Request: ${title}`);
    const body = encodeURIComponent(`Hello Support Team,\n\nI am currently in the ${title} section and have the following concern:\n\n"${supportMessage}"\n\nPlease assist me as soon as possible.\n\nBest regards.`);
    window.location.href = `mailto:geloelolo@gmail.com?subject=${subject}&body=${body}`;
    setIsSupportModalOpen(false);
    setSupportMessage('');
  };

  const defaultItems = [
    ...items,
    { 
      q: "Where can I find icon classes?", 
      a: "We use FontAwesome 6.4.0. You can visit fontawesome.com/search?o=r&m=free to browse free icons. Copy the class name like 'fa-utensils' or 'fa-mug-saucer' and paste it into the category icon field." 
    }
  ];

  return (
    <div className="animate-fade-in space-y-12">
      <header className="flex items-center justify-center py-6 relative border-b border-slate-100/50">
        <button onClick={onBack} className="absolute left-4 w-11 h-11 rounded-2xl bg-white border border-slate-200/60 flex items-center justify-center shadow-sm active:scale-90 transition-all">
          <i className="fa-solid fa-chevron-left text-slate-900"></i>
        </button>
        <h2 className="text-[17px] font-black tracking-tight text-slate-900 uppercase">{title}</h2>
      </header>

      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200/60 overflow-hidden divide-y divide-slate-50">
        {defaultItems.map((item, idx) => (
          <FAQItem key={idx} question={item.q} answer={item.a} />
        ))}
      </div>

      <button 
        onClick={() => setIsSupportModalOpen(true)}
        className="w-full bg-white border border-slate-200/60 p-8 rounded-[1.5rem] text-left shadow-sm group active:bg-slate-50 transition-all flex items-center justify-between"
      >
         <div className="space-y-1">
            <h4 className="text-xl font-black uppercase tracking-tight text-slate-900">Need closer assistance?</h4>
            <p className="text-sm font-medium text-slate-400 leading-relaxed">Describe your issue and we'll help via email.</p>
         </div>
         <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-active:scale-90 transition-all">
            <i className="fa-solid fa-message"></i>
         </div>
      </button>

      {isSupportModalOpen && (
        <div className="fixed inset-0 z-[5000] flex items-end justify-center font-jakarta animate-fade-in">
          <div onClick={() => setIsSupportModalOpen(false)} className="absolute inset-0 backdrop-blur-md" />
          <div className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] shadow-2xl flex flex-col p-8 space-y-8 animate-slide-up pb-12">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2 shrink-0" />
            
            <header className="text-center">
              <h3 className="text-2xl font-black uppercase text-slate-900 leading-none">Contact Support</h3>
            </header>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Your Message</label>
                <textarea 
                  value={supportMessage} 
                  onChange={e => setSupportMessage(e.target.value)}
                  className="w-full bg-white border border-slate-200 p-6 rounded-none font-medium text-base outline-none focus:border-indigo-600 transition-all h-40 resize-none" 
                  placeholder="What can we help you with?" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={handleSendSupport}
                disabled={!supportMessage.trim()}
                className="w-full py-6 bg-slate-900 text-white rounded-none font-black uppercase text-[12px] tracking-[0.4em] shadow-xl active:scale-95 transition-all disabled:opacity-30"
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

      <footer className="text-center pt-8 opacity-20 pb-12">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.8em]">CORE KNOWLEDGE BASE</p>
      </footer>
      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
      `}</style>
    </div>
  );
};

export default MenuFAQ;
