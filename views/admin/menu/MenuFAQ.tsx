
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
}

const MenuFAQ: React.FC<MenuFAQProps> = ({ onBack }) => {
  const faqData = [
    {
      q: "What is the difference between a Dish and a Group?",
      a: "A Single Dish is an item with one set price, like 'Espresso'. A Dish Group is a container for items that come in different sizes or formats, like 'French Fries' which contains 'Regular', 'Large', and 'Bucket' as individual variants."
    },
    {
      q: "How do I add variants to a group?",
      a: "Go to the 'Dish Groups' tab and click the '+' button on any group header. This will open the editor where you can add a sub-item like 'Small' or 'Medium' with its own specific price."
    },
    {
      q: "Can I rearrange the sections on my menu?",
      a: "Yes. Sections appear in the order they were created. You can delete and re-add them if you wish to change the sequence, or contact support for a custom sort order update."
    },
    {
      q: "What does 'Show on Menu' do?",
      a: "Toggling this off immediately hides the item from your customers. This is perfect for items that are temporarily out of stock or seasonal dishes."
    },
    {
      q: "How do Add-ons work?",
      a: "Add-ons allow guests to customize their order. You can create groups like 'Select Toppings' and decide if they are required and how many a guest can pick."
    },
    {
      q: "What image size should I use?",
      a: "We recommend square (1:1) images with a minimum resolution of 600x600 pixels. Our system automatically optimizes them for fast loading on guest phones."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-jakarta animate-fade-in">
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/40 h-24 flex items-center px-6 md:px-12 gap-6">
        <button onClick={onBack} className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm active:scale-90 transition-all">
          <i className="fa-solid fa-chevron-left text-slate-900"></i>
        </button>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-none">Menu Editor FAQs</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Guide & Support</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-12">
        <section className="space-y-4">
          <h3 className="px-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Commonly Asked</h3>
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200/60 overflow-hidden divide-y divide-slate-50">
            {faqData.map((item, idx) => (
              <FAQItem key={idx} question={item.q} answer={item.a} />
            ))}
          </div>
        </section>

        <section className="p-8 bg-indigo-600 rounded-[2rem] text-white space-y-4 shadow-xl shadow-indigo-100">
           <h4 className="text-xl font-black uppercase tracking-tight italic">Still need help?</h4>
           <p className="text-sm font-medium opacity-80 leading-relaxed">Our support team is available 24/7 to help you set up your digital restaurant ecosystem.</p>
           <button className="bg-white text-indigo-600 px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
             Contact Support
           </button>
        </section>

        <footer className="text-center pt-10 opacity-30 pb-20">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.5em]">Foodie Support Archive</p>
        </footer>
      </main>
    </div>
  );
};

export default MenuFAQ;
