
import React from 'react';

interface LegalViewProps {
  title: string;
}

const LegalView: React.FC<LegalViewProps> = ({ title }) => (
  <div className="p-8 animate-fade-in">
    <h2 className="text-2xl font-black text-slate-800 mb-6">{title}</h2>
    <div className="prose prose-slate max-w-none text-slate-500 text-sm leading-relaxed space-y-4">
      <p>Last updated: June 2024</p>
      <p>Foodie Premium is committed to providing the highest quality dining experience. By using our application, you agree to the terms outlined below.</p>
      <p>We value your privacy and only collect necessary information for order processing and account management.</p>
    </div>
  </div>
);

export default LegalView;
