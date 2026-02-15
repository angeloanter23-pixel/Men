
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import RichTextMenu from '../../components/admin/RichTextMenu';

interface AdminLegalProps {
  restaurantId: string;
}

const AdminLegal: React.FC<AdminLegalProps> = ({ restaurantId }) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');
  const [content, setContent] = useState({ terms: '', privacy: '' });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (restaurantId) fetchLegalData();
  }, [restaurantId]);

  const fetchLegalData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('terms_content, privacy_content')
        .eq('id', restaurantId)
        .single();
      if (error) throw error;
      
      const terms = data.terms_content || '<div><h3>1. Our Responsibility</h3><p>We care about your experience...</p></div>';
      const privacy = data.privacy_content || '<div><h3>1. Your Privacy</h3><p>Your data is safe with us...</p></div>';
      
      setContent({ terms, privacy });
    } catch (e) {
      console.error("Legal fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!restaurantId || isSaving || !editorRef.current) return;
    setIsSaving(true);
    
    const html = editorRef.current.innerHTML;
    const updatedContent = { ...content, [activeTab]: html };
    setContent(updatedContent);

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          terms_content: updatedContent.terms,
          privacy_content: updatedContent.privacy
        })
        .eq('id', restaurantId);
      if (error) throw error;
      
      setToast("Document updated");
      setTimeout(() => setToast(null), 3000);
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormat = (type: string, value?: string) => {
    if (!editorRef.current) return;
    
    if (type === 'bold') document.execCommand('bold', false);
    if (type === 'italic') document.execCommand('italic', false);
    if (type === 'underline') document.execCommand('underline', false);
    if (type === 'color') document.execCommand('foreColor', false, value);
    if (type === 'size') {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const span = document.createElement('span');
            span.style.fontSize = value || '16px';
            range.surroundContents(span);
        }
    }
    editorRef.current.focus();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 font-jakarta">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Synchronizing documents...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in font-jakarta bg-[#F2F2F7] min-h-screen relative pb-40">
      {/* TABS FOR SUB-SECTIONS (Terms vs Privacy) - Integrated below main settings navigation */}
      <div className="flex justify-center p-4">
        <div className="bg-slate-200/50 p-1.5 rounded-2xl flex border border-slate-200 shadow-inner w-full max-w-sm gap-1">
            <button 
                onClick={() => setActiveTab('terms')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'terms' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
                Our Rules
            </button>
            <button 
                onClick={() => setActiveTab('privacy')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'privacy' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
                Privacy
            </button>
        </div>
      </div>

      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[4000] bg-slate-900 text-white px-8 py-3 rounded-full shadow-2xl animate-fade-in border border-white/10">
          <p className="text-[11px] font-bold uppercase tracking-widest leading-none">{toast}</p>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10 pt-4">
        <header className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-orange-500 tracking-[0.4em]">Official Records</p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              {activeTab === 'terms' ? 'Rules' : 'Privacy'}
            </h1>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all flex items-center gap-3"
          >
            {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
            Save changes
          </button>
        </header>

        <div className="space-y-6">
          <RichTextMenu isVisible={true} onFormat={handleFormat} />

          {/* RICH TEXT EDITOR SURFACE */}
          <div 
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            key={activeTab} // Force re-render when tab changes to load correct innerHTML
            className="w-full min-h-[600px] bg-white border border-slate-200 rounded-[2.5rem] p-10 md:p-14 text-[17px] font-medium leading-relaxed text-slate-700 outline-none focus:ring-4 ring-indigo-500/5 transition-all shadow-sm overflow-y-auto no-scrollbar prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: activeTab === 'terms' ? content.terms : content.privacy }}
          />
        </div>
      </div>

      <style>{`
        .prose h3 { font-size: 1.25rem; font-weight: 800; text-transform: uppercase; margin-top: 2rem; margin-bottom: 1rem; color: #0f172a; letter-spacing: -0.025em; }
        .prose p { margin-bottom: 1.25rem; color: #475569; }
        .prose ul { margin-bottom: 1.5rem; padding-left: 1.5rem; list-style-type: disc; }
        .prose li { margin-bottom: 0.5rem; color: #475569; }
        .prose b, .prose strong { color: #0f172a; font-weight: 900; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default AdminLegal;
