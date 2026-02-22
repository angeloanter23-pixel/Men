import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import MenuFAQ from './menu/MenuFAQ';

interface AboutValue {
  icon: string;
  label: string;
  description: string;
}

interface AboutData {
  title: string;
  intro: string;
  story: string;
  values: AboutValue[];
  different: string;
  thank_you: string;
}

const DEFAULT_CONTENT: AboutData = {
  title: "Elevating the digital dining experience",
  intro: "We bridge the gap between human hospitality and intelligent technology.",
  story: "Our journey began with a simple observation: the most precious part of dining is the conversation, yet guests often spend their time waiting for service. We built this platform to put the power of the menu directly into your hands, allowing our staff to focus on what truly matters—your experience.",
  different: "Unlike traditional menus, our digital ecosystem is cloud-synced to our kitchen. When you order, our chefs see it in less than a second. This precision reduces errors and ensures your meal arrives at the perfect temperature, every time.",
  thank_you: "Thank you for choosing to dine with us today.",
  values: [
    { icon: "fa-bolt", label: "Speed", description: "Sub-second synchronization between your table and our kitchen staff." },
    { icon: "fa-shield-halved", label: "Privacy", description: "Your dining session is private. We only collect the data needed to serve your meal." },
    { icon: "fa-leaf", label: "Sustainability", description: "Going digital eliminates paper waste and helps us manage inventory more efficiently." }
  ]
};

const Reveal: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms`, transform: isVisible ? 'translateY(0)' : 'translateY(20px)', opacity: isVisible ? 1 : 0 }} className="transition-all duration-[1000ms] ease-out">
      {children}
    </div>
  );
};

const AdminAbout: React.FC<{ restaurantId: string; onBack: () => void }> = ({ restaurantId, onBack }) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [data, setData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showFaq, setShowFaq] = useState(false);
  
  const [editingField, setEditingField] = useState<keyof AboutData | null>(null);
  const [tempText, setTempText] = useState('');
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [editingValueIdx, setEditingValueIdx] = useState<number | null>(null);
  const [valueForm, setValueForm] = useState<AboutValue>({ icon: 'fa-heart', label: '', description: '' });
  const [showDemoBlock, setShowDemoBlock] = useState(false);

  const isDemoAccount = restaurantId === 'aeec6204-496e-46c4-adfb-ba154fa92153';
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (restaurantId) fetchAboutData();
  }, [restaurantId]);

  const fetchAboutData = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase
        .from('restaurants')
        .select('about_content')
        .eq('id', restaurantId)
        .single();
      
      if (error) throw error;
      if (res?.about_content && res.about_content.title) setData(res.about_content);
      else setData({ ...DEFAULT_CONTENT });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (newData?: AboutData) => {
    if (isDemoAccount) {
        setShowDemoBlock(true);
        return;
    }
    setSaving(true);
    try {
      const payload = newData || data;
      const { error } = await supabase
        .from('restaurants')
        .update({ about_content: payload })
        .eq('id', restaurantId);
      if (error) throw error;
      setToast("Identity Saved");
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const commitField = () => {
    if (!editingField || !data) return;
    if (isDemoAccount) {
        setShowDemoBlock(true);
        return;
    }
    const nextData = { ...data, [editingField]: tempText };
    setData(nextData);
    setEditingField(null);
    handleSave(nextData);
  };

  const openValueEditor = (idx: number | null) => {
    if (idx !== null && data) {
      setEditingValueIdx(idx);
      setValueForm(data.values[idx]);
    } else {
      setEditingValueIdx(null);
      setValueForm({ icon: 'fa-heart', label: '', description: '' });
    }
    setIsValueModalOpen(true);
  };

  const saveValue = () => {
    if (!data) return;
    if (isDemoAccount) {
        setShowDemoBlock(true);
        return;
    }
    const nextValues = [...data.values];
    if (editingValueIdx !== null) nextValues[editingValueIdx] = valueForm;
    else nextValues.push(valueForm);
    const nextData = { ...data, values: nextValues };
    setData(nextData);
    setIsValueModalOpen(false);
    handleSave(nextData);
  };

  const EditorBlock: React.FC<{ label: string; field: keyof AboutData }> = ({ label, field }) => (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">{label}</label>
      <div 
        onClick={() => { setEditingField(field); setTempText(String(data?.[field] || '')); }}
        className="w-full bg-white border border-slate-200 p-6 rounded-2xl h-32 overflow-hidden cursor-pointer hover:shadow-lg transition-all"
      >
        <p className="text-[14px] text-slate-500 font-medium line-clamp-3">
          {String(data?.[field] || 'Click to edit...')}
        </p>
      </div>
    </div>
  );

  const aboutFaqs = [
    { q: "What is Brand Identity?", a: "This section defines how your guests see your restaurant. It's the primary content for your 'About' page on the mobile menu." },
    { q: "What are Core Values?", a: "Core values are brief highlights of what makes your restaurant special, like 'Speed', 'Quality', or 'Ethical Sourcing'." },
    { q: "How do I add a new value?", a: "Click '+ Add New' in the Core Values section of the editor. You can pick an icon and write a short title and description." }
  ];

  if (showFaq) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <MenuFAQ 
          onBack={() => setShowFaq(false)} 
          title="Identity Support" 
          items={aboutFaqs}
        />
      </div>
    );
  }

  if (loading || !data) return <div className="py-20 text-center font-bold text-slate-300 animate-pulse uppercase tracking-widest">Loading...</div>;

  return (
    <div className="animate-fade-in bg-[#F2F2F7] min-h-screen relative font-jakarta pb-40">
      
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[4000] bg-slate-900 text-white px-8 py-3 rounded-full shadow-2xl animate-fade-in border border-white/10">
          <p className="text-[11px] font-bold uppercase tracking-widest leading-none">{toast}</p>
        </div>
      )}

      {/* TOP BAR NAVIGATION */}
      <div className="flex items-center justify-between px-6 py-6 max-w-4xl mx-auto w-full">
          <button 
            onClick={onBack}
            className="group flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-95"
          >
            <i className="fa-solid fa-arrow-left text-[8px] group-hover:-translate-x-0.5 transition-transform"></i>
            Back to Identity
          </button>

          <button 
            onClick={() => handleSave()}
            disabled={saving}
            className="rounded-none px-6 py-3 font-black text-[11px] tracking-[0.2em] text-slate-900 hover:text-indigo-600 transition-all disabled:opacity-30 active:scale-95"
          >
            {saving ? <i className="fa-solid fa-spinner animate-spin"></i> : 'save'}
          </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 space-y-12">
        <header className="px-2 text-center">
          <p className="text-[10px] font-bold uppercase text-orange-500 tracking-[0.4em] mb-2">About Page</p>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">Restaurant Info</h1>
          <p className="text-slate-500 text-[17px] font-medium mt-3 leading-relaxed">
            Tell your story to your guests.
            <button onClick={() => setShowFaq(true)} className="ml-1.5 text-[#007AFF] font-bold hover:underline">FAQs</button>
          </p>
        </header>

        {/* INTERNAL VIEW TOGGLE (Editor vs Preview) */}
        <div className="flex justify-center">
          <div className="bg-[#E8E8ED] p-1.5 rounded-2xl flex border border-slate-200/50 shadow-inner w-full max-w-sm gap-1">
              <button 
                  onClick={() => setActiveTab('editor')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'editor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
              >
                  Edit Mode
              </button>
              <button 
                  onClick={() => setActiveTab('preview')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
              >
                  Live Preview
              </button>
          </div>
        </div>

        {activeTab === 'editor' ? (
          <div className="space-y-12 animate-fade-in pt-4 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <EditorBlock label="Main Headline" field="title" />
              <EditorBlock label="Short Intro" field="intro" />
              <div className="md:col-span-2">
                <EditorBlock label="Our Story" field="story" />
              </div>
              <div className="md:col-span-2">
                <div className="space-y-3">
                   <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Core Values</label>
                      <button onClick={() => openValueEditor(null)} className="text-[#007AFF] text-[10px] font-bold uppercase tracking-widest">+ Add New</button>
                   </div>
                   <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2">
                      {data.values.map((v, i) => (
                        <button key={i} onClick={() => openValueEditor(i)} className="shrink-0 bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 hover:border-indigo-500/20 transition-all group min-w-[200px] shadow-sm">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all"><i className={`fa-solid ${v.icon} text-base`}></i></div>
                          <p className="text-[13px] font-bold text-slate-800 uppercase pr-4">{v.label}</p>
                        </button>
                      ))}
                   </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <EditorBlock label="What makes us different" field="different" />
              </div>
              <div className="md:col-span-2">
                <EditorBlock label="Thank You Message" field="thank_you" />
              </div>
            </div>
          </div>
        ) : (
          /* LIVE PREVIEW - DOCUMENT FLOW */
          <div className="bg-white animate-fade-in rounded-[3rem] shadow-sm border border-slate-200/50 mb-40">
            <div className="max-w-2xl mx-auto px-10 py-24 space-y-16">
              <header>
                <Reveal>
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-2 h-2 rounded-full bg-slate-900"></div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Official Records</p>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 uppercase leading-none mb-8">
                    {data.title}
                  </h1>
                  <div className="h-1 w-12 bg-indigo-600"></div>
                </Reveal>
              </header>

              <Reveal delay={100}>
                <section className="space-y-6">
                  <p className="text-[20px] md:text-[24px] text-slate-800 font-bold leading-snug">
                    {data.intro}
                  </p>
                </section>
              </Reveal>

              <Reveal delay={200}>
                <section className="space-y-6">
                  <div className="text-[16px] text-slate-600 font-medium leading-relaxed">
                    {data.story}
                  </div>
                </section>
              </Reveal>

              {data.values.length > 0 && (
                <Reveal delay={300}>
                  <section className="space-y-8">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Core Values</h3>
                    <div className="space-y-8">
                      {data.values.map((v, i) => (
                        <div key={i} className="flex gap-6 items-start">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                             <i className={`fa-solid ${v.icon} text-sm`}></i>
                          </div>
                          <div className="space-y-2">
                             <h4 className="text-[15px] font-bold text-slate-900 uppercase tracking-tight leading-none">{v.label}</h4>
                             <p className="text-[14px] text-slate-500 font-medium leading-relaxed">{v.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </Reveal>
              )}

              <Reveal delay={400}>
                <section className="space-y-6 pt-8 border-t border-slate-50">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">What makes us different</h3>
                  <div className="text-[16px] text-slate-600 font-medium leading-relaxed">
                    {data.different}
                  </div>
                </section>
              </Reveal>

              <Reveal delay={500}>
                <div className="text-center pt-20 border-t border-slate-100">
                  <p className="text-[13px] font-medium text-slate-400 uppercase tracking-widest leading-none">{data.thank_you}</p>
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mx-auto mt-8 animate-pulse"></div>
                </div>
              </Reveal>
            </div>
          </div>
        )}
      </div>

      {/* FULL PAGE EDITOR MODAL */}
      {editingField && (
        <div className="fixed inset-0 z-[5000] bg-white animate-fade-in flex flex-col">
           {/* Header */}
           <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <button onClick={() => setEditingField(null)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                <i className="fa-solid fa-xmark"></i>
              </button>
              <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">{editingField.replace('_', ' ')}</p>
              <button onClick={commitField} className="px-6 py-2.5 bg-slate-900 text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                Update
              </button>
           </div>
           
           {/* Textarea */}
           <div className="flex-1 relative">
             <textarea 
                ref={textareaRef} 
                autoFocus 
                value={tempText} 
                onChange={e => setTempText(e.target.value)}
                className="w-full h-full p-6 md:p-8 text-lg md:text-xl font-medium text-slate-800 leading-relaxed outline-none resize-none placeholder:text-slate-300"
                placeholder="Start typing your content here..."
             />
           </div>
        </div>
      )}

      {/* DEMO BLOCK MODAL */}
      {showDemoBlock && (
        <div className="fixed inset-0 z-[6000] flex items-end justify-center animate-fade-in" onClick={() => setShowDemoBlock(false)}>
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <div className="relative bg-white w-full max-w-lg rounded-t-2xl shadow-2xl p-6 pb-10 animate-slide-up flex flex-col gap-6" onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto shrink-0" />
                <div className="text-center space-y-4 py-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 text-2xl">
                        <i className="fa-solid fa-lock"></i>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-lg font-bold text-slate-900">Action Restricted</h4>
                        <p className="text-sm text-slate-500 font-medium px-4">This is a demo account. Content updates are disabled to preserve the experience for other users.</p>
                    </div>
                    <button 
                        onClick={() => setShowDemoBlock(false)}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all"
                    >
                        Understood
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* CORE VALUE MODAL */}
      {isValueModalOpen && (
        <div className="fixed inset-0 z-[6000] flex items-end justify-center animate-fade-in font-jakarta">
          <div onClick={() => setIsValueModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
          <div className="relative bg-white w-full max-w-lg rounded-t-[3.5rem] shadow-2xl flex flex-col p-10 space-y-10 animate-slide-up pb-16 overflow-y-auto max-h-[90vh]">
             <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2 shrink-0" />
             <header className="flex justify-between items-start">
               <div>
                 <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Value detail.</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Adjust core parameter</p>
               </div>
               <button onClick={() => setIsValueModalOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 hover:text-slate-900 shadow-sm"><i className="fa-solid fa-xmark"></i></button>
             </header>
             <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-4">Icon (FA)</label>
                      <input value={valueForm.icon} onChange={e => setValueForm({...valueForm, icon: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-bold text-sm outline-none focus:bg-white shadow-inner" placeholder="fa-heart" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-4">Label</label>
                      <input value={valueForm.label} onChange={e => setValueForm({...valueForm, label: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-bold text-sm outline-none focus:bg-white shadow-inner uppercase" placeholder="e.g. Speed" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-4">Description</label>
                   <textarea value={valueForm.description} onChange={e => setValueForm({...valueForm, description: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-6 rounded-3xl font-medium text-[15px] outline-none h-32 resize-none focus:bg-white shadow-inner leading-relaxed" placeholder="Short description..." />
                </div>
             </div>
             <div className="flex gap-4 pt-4">
                {editingValueIdx !== null && (
                  <button onClick={() => { const next = data?.values.filter((_, i) => i !== editingValueIdx); if(next) { setData({...data, values: next}); handleSave({...data, values: next}); } setIsValueModalOpen(false); }} className="flex-1 py-5 bg-rose-50 text-rose-500 rounded-3xl font-bold uppercase text-[10px] tracking-widest">Delete</button>
                )}
                <button onClick={saveValue} className="flex-[2] py-5 bg-slate-900 text-white rounded-3xl font-bold uppercase text-[10px] tracking-[0.4em] shadow-xl active:scale-95 transition-all">Confirm</button>
             </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default AdminAbout;