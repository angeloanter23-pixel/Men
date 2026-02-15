
import React, { useState, useEffect } from 'react';
import { LandingNav } from '../landing-page/LandingNav';
import { HeroSection } from '../landing-page/HeroSection';
import { KeyFeatures } from '../landing-page/KeyFeatures';
import { BlueprintStepper } from '../landing-page/BlueprintStepper';
import { FeedbackSection } from '../landing-page/FeedbackSection';
import { ArticlesSection } from '../landing-page/ArticlesSection';
import { LandingFaq } from '../landing-page/LandingFaq';
import { LandingFooter } from '../landing-page/LandingFooter';
import { LandingMenu } from '../landing-page/LandingMenu';
import { LandingOverlay } from '../landing-page/LandingOverlay';

// Informational Content Components
import { AboutSection } from '../landing-page/AboutSection';
import { PricingSection } from '../landing-page/PricingSection';
import { ContactSection } from '../landing-page/ContactSection';
import { TermsSection } from '../landing-page/TermsSection';

interface LandingViewProps {
  onStart: () => void;
  onCreateMenu: () => void;
  onImportMenu: (config: any) => void;
  onMenuClick: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onStart, onCreateMenu }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<'pricing' | 'about' | 'contact' | 'terms' | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-jakarta text-slate-900 selection:bg-orange-100 overflow-x-hidden scroll-smooth">
      <LandingNav isScrolled={isScrolled} onOpenMenu={() => setIsMenuOpen(true)} />
      
      <LandingMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onSelect={(id) => setActiveOverlay(id)}
      />

      <HeroSection onStart={onStart} onCreateMenu={onCreateMenu} />
      
      <BlueprintStepper />
      
      <FeedbackSection />
      
      <KeyFeatures onPricingClick={() => setActiveOverlay('pricing')} />

      <ArticlesSection />

      <LandingFaq onContactClick={() => setActiveOverlay('contact')} />
      
      <LandingFooter onStart={onStart} onCreateMenu={onCreateMenu} />

      {/* Detail Overlays - Simplified Header */}
      <LandingOverlay 
        isOpen={activeOverlay === 'pricing'} 
        onClose={() => setActiveOverlay(null)} 
      >
        <PricingSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'about'} 
        onClose={() => setActiveOverlay(null)} 
      >
        <AboutSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'contact'} 
        onClose={() => setActiveOverlay(null)} 
      >
        <ContactSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'terms'} 
        onClose={() => setActiveOverlay(null)} 
      >
        <TermsSection />
      </LandingOverlay>
    </div>
  );
};

export default LandingView;
