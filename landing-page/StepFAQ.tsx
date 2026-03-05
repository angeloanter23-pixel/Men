import React from 'react';

interface StepFAQProps {
  step: string;
  onClose: () => void;
}

export const StepFAQ: React.FC<StepFAQProps> = ({ step, onClose }) => {
  const faqContent: Record<string, { question: string; answer: string }[]> = {
    'Restaurant Info': [
      { question: 'Why do you need my restaurant name?', answer: 'We use it to personalize your digital menu and QR codes.' },
      { question: 'Is my email secure?', answer: 'Yes, we use industry-standard encryption for all user data.' }
    ],
    'Pricing': [
      { question: 'Can I change plans later?', answer: 'Yes, you can upgrade or downgrade your plan at any time from your dashboard.' },
      { question: 'Are there hidden fees?', answer: 'No, our pricing is transparent with no hidden costs.' }
    ],
    'Payment': [
      { question: 'What payment methods do you accept?', answer: 'We currently support GCash and Maya for secure payments.' },
      { question: 'Is my payment secure?', answer: 'Yes, we use secure, PCI-compliant payment gateways.' }
    ],
    'Verification': [
      { question: 'Didn\'t receive the code?', answer: 'Please check your spam folder or click "Resend Code" to try again.' },
      { question: 'How long is the code valid?', answer: 'The verification code is valid for 10 minutes.' }
    ]
  };

  const faqs = faqContent[step] || [];

  return (
    <div className="fixed inset-0 z-[6000] bg-white p-8 overflow-y-auto">
      <button onClick={onClose} className="text-slate-500 font-bold mb-8">← Back</button>
      <h2 className="text-2xl font-black text-slate-900 mb-6">{step} FAQs</h2>
      <div className="space-y-6">
        {faqs.map((faq, i) => (
          <div key={i} className="space-y-2">
            <h4 className="font-bold text-slate-900">{faq.question}</h4>
            <p className="text-slate-500 text-sm">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
