
import React, { useState, useRef, useEffect } from 'react';
import { Feedback } from '../types';
import * as MenuService from '../services/menuService';

interface FeedbackFormProps {
  restaurantId?: string;
  initialRestaurantName?: string;
  onSubmit: (feedback: Feedback) => void;
  onCancel: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ restaurantId, initialRestaurantName, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [restName, setRestName] = useState(initialRestaurantName || '');
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsRendered(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0 || isSubmitting) return;
    setIsSubmitting(true);

    const feedbackData: any = {
      name: name.trim() || 'Anonymous Guest',
      restaurant_name: restName.trim(),
      scores: { "Overall": rating },
      note: note.trim(),
      image_url: image,
      restaurant_id: restaurantId,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      const { data, error } = await MenuService.upsertFeedback(feedbackData);
      if (!error && data) onSubmit(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center font-jakarta">
      {/* Backdrop */}
      <div 
        onClick={onCancel} 
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-500 ${isRendered ? 'opacity-100' : 'opacity-0'}`} 
      />
      
      {/* Bottom Sheet */}
      <div 
        className={`relative bg-white w-full max-w-lg rounded-t-[3rem] shadow-2xl flex flex-col p-8 pb-12 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] max-h-[90vh] overflow-y-auto no-scrollbar
          ${isRendered ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 shrink-0" />
        
        <header className="text-center mb-10">
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase italic">How was it?</h2>
          <p className="text-slate-400 text-[13px] font-medium mt-2">Help us make your experience better.</p>
        </header>

        <div className="space-y-8">
          {/* Rating Section */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Your Rating</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star} 
                  onClick={() => setRating(star)}
                  className={`text-4xl transition-all active:scale-90 ${rating >= star ? 'text-amber-400' : 'text-slate-100'}`}
                >
                  <i className="fa-solid fa-star"></i>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Optional"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white transition-all shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Restaurant</label>
                <input 
                  type="text" 
                  value={restName}
                  onChange={(e) => setRestName(e.target.value)}
                  placeholder="e.g. Noir Kitchen"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:bg-white transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Comments</label>
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tell us what you liked..."
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-medium outline-none focus:bg-white transition-all shadow-inner h-28 resize-none"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Share a Photo</label>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-white hover:border-indigo-400 transition-all group overflow-hidden relative"
              >
                {image ? (
                  <img src={image} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <>
                    <i className="fa-solid fa-camera text-2xl text-slate-200 group-hover:text-indigo-400 transition-colors"></i>
                    <span className="text-[10px] font-bold text-slate-300 group-hover:text-indigo-600">Add Image (Optional)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button 
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="w-full py-6 bg-slate-900 text-white rounded-full font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
            >
              {isSubmitting ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Submit Feedback'}
            </button>
            <button 
              onClick={onCancel}
              className="w-full py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-rose-500 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;
