
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import RichTextMenu from '../../components/admin/RichTextMenu';
import MenuFAQ from './menu/MenuFAQ';

interface AdminLegalProps {
  restaurantId: string;
  initialDocType?: 'terms' | 'privacy';
  onBack: () => void;
}

const AdminLegal: React.FC<AdminLegalProps> = ({ restaurantId, initialDocType = 'terms', onBack }) => {
  const [docType] = useState<'terms' | 'privacy'>(initialDocType);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [content, setContent] = useState({ terms: '', privacy: '' });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);

  useEffect(() => {
    if (restaurantId) fetchLegalData();
    document.execCommand('styleWithCSS', false, 'true');
  }, [restaurantId]);

  useEffect(() => {
    if (!loading && editorRef.current && viewMode === 'edit') {
      const targetContent = docType === 'terms' ? content.terms : content.privacy;
      editorRef.current.innerHTML = targetContent;
      savedRange.current = null;
    }
  }, [docType, viewMode, loading]);

  const persistSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        savedRange.current = range.cloneRange();
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!editorRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLegalData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('terms_content, privacy_content')
        .eq('id', restaurantId)
        .single();
      if (error) throw error;
      setContent({ 
        terms: data.terms_content || '<div><h3>1. Terms of Service</h3><p>Enter your rules here...</p></div>', 
        privacy: data.privacy_content || '<div><h3>1. Privacy Policy</h3><p>Describe how you handle data...</p></div>' 
      });
    } catch (e) {
      console.error("Legal fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!restaurantId || isSaving) return;
    setIsSaving(true);
    
    let html = content[docType];
    if (viewMode === 'edit' && editorRef.current) {
        html = editorRef.current.innerHTML;
    }

    const updatedContent = { ...content, [docType]: html };
    setContent(updatedContent);
    
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ terms_content: updatedContent.terms, privacy_content: updatedContent.privacy })
        .eq('id', restaurantId);
      if (error) throw error;
      setToast("Records Synchronized");
      setTimeout(() => setToast(null), 3000);
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormat = (type: string, value?: string) => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    let range: Range | null = selection?.rangeCount ? selection.getRangeAt(0) : null;

    if (!range && savedRange.current) range = savedRange.current;
    if (!range) { editorRef.current.focus(); return; }

    selection?.removeAllRanges();
    selection?.addRange(range);

    if (['bold', 'italic', 'underline'].includes(type)) {
        document.execCommand(type, false);
    } else if (type === 'bullet') {
        document.execCommand('insertUnorderedList', false);
    } else if (type === 'number') {
        document.execCommand('insertOrderedList', false);
    } else if (type === 'size') {
        if (!range.collapsed) {
            const span = document.createElement('span');
            span.style.fontSize = value || '16px';
            try {
                const fragment = range.extractContents();
                span.appendChild(fragment);
                range.insertNode(span);
                const newRange = document.createRange();
                newRange.selectNodeContents(span);
                savedRange.current = newRange;
                selection?.removeAllRanges();
                selection?.addRange(newRange);
            } catch (e) { console.error(e); }
        }
    }
    
    if (editorRef.current) {
        setContent(prev => ({ ...prev, [docType]: editorRef.current!.innerHTML }));
    }
  };

  const legalFaqs = [
    { q: "Where do these documents appear?", a: "These documents are linked in the guest's mobile view sidebar and the landing page footer. Updating them here reflects changes instantly for all users." },
    { q: "Can I use images in my policy?", a: "The current editor focuses on rich text formatting (bold, lists, sizes) to ensure high performance and fast loading for mobile guests." },
    { q: "Is there a template available?", a: "We provide basic starters, but we recommend consulting with a legal professional to ensure your terms match your local business laws." }
  ];

  if (showFaq) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <MenuFAQ 
          onBack={() => setShowFaq(false)} 
          title="Legal Support" 
          items={legalFaqs}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessing Vault...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in font-jakarta bg-[#F2F2F7] min-h-screen relative pb-60">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[4000] bg-slate-900 text-white px-8 py-3 rounded-full shadow-2xl animate-fade-in border border-white/10">
          <p className="text-[11px] font-bold uppercase tracking-widest leading-none">{toast}</p>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <div className="flex items-center justify-between px-6 py-6 max-w-3xl mx-auto w-full">
          <button 
            onClick={onBack}
            className="group flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-95"
          >
            <i className="fa-solid fa-arrow-left text-[8px] group-hover:-translate-x-0.5 transition-transform"></i>
            Back to Identity
          </button>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-none px-6 py-3 font-black text-[11px] tracking-[0.2em] text-slate-900 hover:text-indigo-600 transition-all disabled:opacity-30 active:scale-95"
          >
            {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : 'save'}
          </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-4 space-y-12">
        <header className="px-2 text-center">
          <p className="text-[10px] font-bold uppercase text-orange-500 tracking-[0.4em] mb-2">Legal Rules</p>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">Legal Documents</h1>
          <p className="text-slate-500 text-[17px] font-medium mt-3 leading-relaxed">
            Edit your store rules and privacy info.
            <button onClick={() => setShowFaq(true)} className="ml-1.5 text-[#007AFF] font-bold hover:underline">FAQs</button>
          </p>
        </header>

        {/* SUB-TABS (EDITOR VS PREVIEW) */}
        <div className="bg-[#E8E8ED] p-1.5 rounded-2xl flex border border-slate-200/50 shadow-inner max-w-md mx-auto gap-1">
          <button 
            onClick={() => setViewMode('edit')}
            className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'edit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
          >
            {docType === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}
          </button>
          <button 
            onClick={() => setViewMode('preview')}
            className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
          >
            Preview
          </button>
        </div>

        <div className="space-y-6">
          {viewMode === 'edit' ? (
            <div 
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onFocus={() => { setShowMenu(true); persistSelection(); }}
              onMouseUp={persistSelection}
              onKeyUp={persistSelection}
              onClick={() => setShowMenu(true)}
              onInput={() => setContent(prev => ({ ...prev, [docType]: editorRef.current!.innerHTML }))}
              className="w-full min-h-[600px] bg-white border border-slate-200 rounded-[2.5rem] p-10 md:p-14 text-[17px] font-medium leading-relaxed text-slate-700 outline-none focus:ring-4 ring-indigo-500/5 transition-all shadow-sm overflow-y-auto no-scrollbar prose prose-slate max-w-none"
            />
          ) : (
            <div className="w-full min-h-[600px] bg-white border border-slate-200 rounded-[2.5rem] p-10 md:p-14 overflow-y-auto no-scrollbar prose prose-slate max-w-none shadow-sm">
                <div dangerouslySetInnerHTML={{ __html: content[docType] }} />
            </div>
          )}
        </div>
      </div>

      {viewMode === 'edit' && <RichTextMenu ref={menuRef} isVisible={showMenu} onFormat={handleFormat} />}

      <style>{`
        .prose h3 { font-size: 1.25rem; font-weight: 800; text-transform: uppercase; margin-top: 2rem; margin-bottom: 1rem; color: #0f172a; letter-spacing: -0.025em; }
        .prose p { margin-bottom: 1.25rem; color: #475569; }
        .prose ul { margin-bottom: 1.5rem; padding-left: 1.5rem; list-style-type: disc; }
        .prose ol { margin-bottom: 1.5rem; padding-left: 1.5rem; list-style-type: decimal; }
        .prose li { margin-bottom: 0.5rem; color: #475569; }
        .prose b, .prose strong { color: #0f172a; font-weight: 900; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default AdminLegal;
