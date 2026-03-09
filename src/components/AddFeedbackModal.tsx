import React, { useState } from 'react';
import { Feedback } from '../types';

interface AddFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, scores: Record<string, number>, note: string) => void;
  categories: string[];
  initialFeedback?: Feedback;
}

export const AddFeedbackModal: React.FC<AddFeedbackModalProps> = ({ isOpen, onClose, onSubmit, categories, initialFeedback }) => {
  const [name, setName] = useState(initialFeedback?.name || '');
  const [note, setNote] = useState(initialFeedback?.note || '');
  const [scores, setScores] = useState<Record<string, number>>(
    initialFeedback?.scores || categories.reduce((acc, cat) => ({ ...acc, [cat]: 3 }), {})
  );

  // Update state if initialFeedback changes
  React.useEffect(() => {
    if (initialFeedback) {
        setName(initialFeedback.name);
        setNote(initialFeedback.note);
        setScores(initialFeedback.scores);
    } else {
        setName('');
        setNote('');
        setScores(categories.reduce((acc, cat) => ({ ...acc, [cat]: 3 }), {}));
    }
  }, [initialFeedback, categories]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/50">
      <div className="w-full max-w-md bg-white rounded-t-3xl p-6 space-y-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-900">Add Feedback</h2>
          <button onClick={onClose} className="text-slate-400 font-bold">Close</button>
        </div>
        
        <div className="space-y-4">
          <label className="block text-sm font-bold text-slate-900">Your Name</label>
          <input 
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-slate-200 rounded-2xl"
            placeholder="Enter your name"
          />
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-bold text-slate-900">Ratings</label>
          {categories.map(cat => (
            <div key={cat} className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>{cat}</span>
                <span>{scores[cat].toFixed(1)}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="5" 
                step="0.5"
                value={scores[cat]} 
                onChange={(e) => setScores({...scores, [cat]: parseFloat(e.target.value)})}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#FF6B00]"
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-900">Comment</label>
          <textarea 
            value={note} 
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-3 border border-slate-200 rounded-2xl"
            rows={4}
          />
        </div>

        <button 
          onClick={() => { onSubmit(name, scores, note); onClose(); }}
          className="w-full py-4 bg-[#FF6B00] text-white font-bold rounded-2xl"
        >
          Submit Feedback
        </button>
      </div>
    </div>
  );
};
