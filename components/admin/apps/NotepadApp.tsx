import React, { useState, useEffect, useRef } from 'react';
import RichTextMenu from '../RichTextMenu';
import { encryptData, decryptData } from '../../../src/utils/encryption';

interface NotepadAppProps {
    onClose?: () => void;
}

const NotepadApp: React.FC<NotepadAppProps> = ({ onClose }) => {
    const [notes, setNotes] = useState<{id: string, title: string, content: string, updated: string}[]>([]);
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showEditor, setShowEditor] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
    
    // Editor State
    const [editorTitle, setEditorTitle] = useState('');
    const [tempContent, setTempContent] = useState('');
    const editorRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const savedRange = useRef<Range | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    
    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('foodie_admin_notes');
        if (saved) {
            try {
                setNotes(JSON.parse(saved));
            } catch (e) { console.error("Failed to load notes"); }
        }
        document.execCommand('styleWithCSS', false, 'true');
    }, []);

    // Save to local storage whenever notes change
    useEffect(() => {
        localStorage.setItem('foodie_admin_notes', JSON.stringify(notes));
    }, [notes]);

    useEffect(() => {
        if (showEditor && editorRef.current) {
            editorRef.current.innerHTML = tempContent;
        }
    }, [showEditor]);

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

    const handleCreateNote = () => {
        const newNote = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substr(2, 9),
            title: 'Untitled Note',
            content: '',
            updated: new Date().toISOString()
        };
        setNotes([newNote, ...notes]);
        openEditor(newNote);
    };

    const openEditor = (note: any) => {
        setActiveNoteId(note.id);
        setEditorTitle(note.title);
        setTempContent(note.content);
        setShowEditor(true);
    };

    const handleSave = () => {
        if (!activeNoteId) return;
        
        const contentToSave = editorRef.current?.innerHTML || tempContent;

        const updatedNotes = notes.map(n => {
            if (n.id === activeNoteId) {
                return {
                    ...n,
                    title: editorTitle || 'Untitled Note',
                    content: contentToSave,
                    updated: new Date().toISOString()
                };
            }
            return n;
        });
        
        // Move updated note to top
        const current = updatedNotes.find(n => n.id === activeNoteId);
        const others = updatedNotes.filter(n => n.id !== activeNoteId);
        
        if (current) {
            setNotes([current, ...others]);
        } else {
            setNotes(updatedNotes);
        }
        setShowEditor(false);
    };

    const confirmDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteConfirmation(id);
    };

    const executeDelete = () => {
        if (deleteConfirmation) {
            setNotes(notes.filter(n => n.id !== deleteConfirmation));
            if (activeNoteId === deleteConfirmation) setShowEditor(false);
            setDeleteConfirmation(null);
        }
    };

    const handleExport = (note: any) => {
        const encrypted = encryptData([note]);
        const blob = new Blob([encrypted], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `note_${note.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.fde`;
        link.click();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                let imported;
                
                try {
                    imported = decryptData(content);
                } catch (e) {
                    // Fallback
                    try {
                        imported = JSON.parse(content);
                    } catch (jsonErr) {
                        throw new Error("Invalid file");
                    }
                }

                if (Array.isArray(imported)) {
                    // Merge imported notes with existing ones, avoiding duplicates
                    setNotes(prev => {
                        const existingIds = new Set(prev.map(n => n.id));
                        const uniqueImported = imported.filter((n: any) => !existingIds.has(n.id));
                        
                        // If we want to update existing notes instead of ignoring them:
                        // const importedIds = new Set(imported.map((n: any) => n.id));
                        // const keptExisting = prev.filter(n => !importedIds.has(n.id));
                        // return [...imported, ...keptExisting];
                        
                        // Current strategy: Add only new IDs (to prevent overwriting unsaved work if IDs match accidentally, 
                        // though with UUIDs collision is unlikely unless it's the same note).
                        // However, for "restore", we might want to overwrite. 
                        // Let's use a safe merge: if ID exists, we treat it as a conflict. 
                        // To fix the "duplicate key" error simply:
                        
                        const merged = [...imported];
                        const importedIds = new Set(imported.map((n: any) => n.id));
                        
                        prev.forEach(n => {
                            if (!importedIds.has(n.id)) {
                                merged.push(n);
                            }
                        });
                        
                        return merged;
                    });
                    alert("Notes imported successfully!");
                }
            } catch (err) {
                alert("Invalid backup file");
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
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
            setTempContent(editorRef.current.innerHTML);
        }
    };

    const filteredNotes = notes.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[5000] bg-white animate-fade-in flex flex-col font-jakarta">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                    </button>
                    <div>
                        <h3 className="font-bold text-slate-900 leading-none">Notepad</h3>
                        <p className="text-[10px] font-medium text-slate-400 mt-1">{notes.length} notes stored locally</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input 
                        type="file" 
                        id="note-import" 
                        accept=".json,.fde" 
                        className="hidden" 
                        onChange={handleImport}
                    />
                    <button 
                        onClick={() => document.getElementById('note-import')?.click()}
                        className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-all"
                        title="Import Notes"
                    >
                        <i className="fa-solid fa-file-import"></i>
                    </button>
                    <button 
                        onClick={handleCreateNote}
                        className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center gap-2"
                    >
                        <i className="fa-solid fa-plus"></i> New Note
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex relative">
                {/* Sidebar List */}
                <div className={`${showEditor ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-r border-slate-100 flex-col bg-slate-50/50`}>
                    <div className="p-4 border-b border-slate-100">
                        <div className="relative">
                            <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                            <input 
                                type="text" 
                                placeholder="Search notes..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:border-indigo-300 transition-all shadow-sm"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {filteredNotes.length === 0 ? (
                            <div className="text-center py-20 text-slate-400">
                                <p className="text-sm font-medium">No notes found</p>
                            </div>
                        ) : (
                            filteredNotes.map(note => (
                                <div 
                                    key={note.id}
                                    onClick={() => openEditor(note)}
                                    className="group p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-md cursor-pointer transition-all relative"
                                >
                                    <h4 className="text-sm font-bold text-slate-900 truncate pr-8 mb-1">{note.title}</h4>
                                    <div className="text-xs text-slate-500 truncate h-4 overflow-hidden opacity-70" dangerouslySetInnerHTML={{ __html: note.content || 'No content' }} />
                                    <p className="text-[10px] text-slate-400 mt-3 font-mono uppercase tracking-wider">{new Date(note.updated).toLocaleDateString()}</p>
                                    
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleExport(note); }}
                                            className="text-slate-300 hover:text-indigo-500 p-1"
                                            title="Download Note"
                                        >
                                            <i className="fa-solid fa-download text-xs"></i>
                                        </button>
                                        <button 
                                            onClick={(e) => confirmDelete(e, note.id)}
                                            className="text-slate-300 hover:text-rose-500 p-1"
                                            title="Delete Note"
                                        >
                                            <i className="fa-solid fa-trash-can text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Editor / Preview */}
                <div className={`${!showEditor ? 'hidden md:flex' : 'flex'} absolute md:relative inset-0 md:inset-auto w-full md:w-auto flex-1 bg-white flex-col z-20`}>
                    {showEditor ? (
                        <div className="flex flex-col h-full animate-fade-in bg-white">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                                <div className="flex items-center gap-4 flex-1">
                                    <button 
                                        onClick={() => setShowEditor(false)}
                                        className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all md:hidden"
                                    >
                                        <i className="fa-solid fa-arrow-left"></i>
                                    </button>
                                    <input 
                                        type="text" 
                                        value={editorTitle}
                                        onChange={(e) => setEditorTitle(e.target.value)}
                                        placeholder="Note Title"
                                        className="text-xl font-bold text-slate-900 outline-none bg-transparent w-full placeholder:text-slate-300"
                                    />
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                    <button 
                                        onClick={() => setShowEditor(false)}
                                        className="hidden md:block px-4 py-2 text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-wider"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSave}
                                        className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                    >
                                        Save Note
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 relative overflow-y-auto no-scrollbar bg-white">
                                <div 
                                    ref={editorRef} 
                                    contentEditable
                                    suppressContentEditableWarning
                                    onFocus={() => { setShowMenu(true); persistSelection(); }}
                                    onMouseUp={persistSelection}
                                    onKeyUp={persistSelection}
                                    onClick={() => setShowMenu(true)}
                                    onInput={() => setTempContent(editorRef.current?.innerHTML || '')}
                                    className="w-full min-h-full p-6 md:p-12 text-lg font-medium text-slate-800 leading-relaxed outline-none prose prose-slate max-w-none"
                                    data-placeholder="Start typing..."
                                />
                            </div>
                            
                            <RichTextMenu ref={menuRef} isVisible={showMenu} onFormat={handleFormat} />
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 p-8 text-center bg-slate-50/30">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <i className="fa-regular fa-file-lines text-4xl opacity-30"></i>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Select a note to view</h3>
                            <p className="text-sm font-medium max-w-xs mx-auto leading-relaxed">Choose a note from the sidebar or create a new one to get started.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmation && (
                <div className="fixed inset-0 z-[6000] bg-black/50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4 mx-auto">
                            <i className="fa-solid fa-trash-can text-xl"></i>
                        </div>
                        <h3 className="text-center font-bold text-slate-900 text-lg mb-2">Delete Note?</h3>
                        <p className="text-center text-slate-500 text-sm mb-6">
                            Are you sure you want to delete this note? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setDeleteConfirmation(null)}
                                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={executeDelete}
                                className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .prose h3 { font-size: 1.25rem; font-weight: 800; text-transform: uppercase; margin-top: 2rem; margin-bottom: 1rem; color: #0f172a; letter-spacing: -0.025em; }
                .prose p { margin-bottom: 1.25rem; color: #475569; }
                .prose ul { margin-bottom: 1.5rem; padding-left: 1.5rem; list-style-type: disc; }
                .prose ol { margin-bottom: 1.5rem; padding-left: 1.5rem; list-style-type: decimal; }
                .prose li { margin-bottom: 0.5rem; color: #475569; }
                .prose b, .prose strong { color: #0f172a; font-weight: 900; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #cbd5e1;
                    cursor: text;
                }
            `}</style>
        </div>
    );
};

export default NotepadApp;
