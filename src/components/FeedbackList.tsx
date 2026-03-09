import React from 'react';
import { Feedback } from '../types';

interface FeedbackListProps {
  feedback: Feedback[];
  onEdit: (f: Feedback) => void;
  onDelete: (id: string) => void;
  currentCustomerId: string | null;
}

export const FeedbackList: React.FC<FeedbackListProps> = ({ feedback, onEdit, onDelete, currentCustomerId }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Customer Feedback</h3>
      {feedback.length === 0 ? (
        <p className="text-slate-500">No feedback yet.</p>
      ) : (
        <div className="space-y-4">
          {feedback.map((f) => {
            const avgScore = Object.values(f.scores).length > 0
              ? (Object.values(f.scores).reduce((a, b) => a + b, 0) / Object.values(f.scores).length).toFixed(1)
              : '0.0';
            const isOwner = f.customer_id === currentCustomerId;
            return (
              <div key={f.id} className="p-4 bg-slate-50 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-900">{f.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#FF6B00] font-bold">★ {avgScore}</span>
                    {isOwner && (
                      <>
                        <button onClick={() => onEdit(f)} className="text-xs text-slate-500 underline">Edit</button>
                        <button onClick={() => onDelete(f.id)} className="text-xs text-red-500 underline">Delete</button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-slate-600 text-sm mb-2">{f.note}</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(f.scores).map(([cat, score]) => (
                    <span key={cat} className="text-[10px] bg-white px-2 py-1 rounded-md border border-slate-100 text-slate-500">
                      {cat}: <span className="font-bold text-slate-900">{score.toFixed(1)}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
