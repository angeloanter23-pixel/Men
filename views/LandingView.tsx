import React, { useState, useEffect } from 'react';
import { LandingNav } from '../landing-page/LandingNav';
import { HeroSection } from '../landing-page/HeroSection';
import { BlueprintStepper } from '../landing-page/BlueprintStepper';
import { FeedbackSection } from '../landing-page/FeedbackSection';
import { LibrarySection } from '../landing-page/LibrarySection';
import { LandingFaq } from '../landing-page/LandingFaq';
import { LandingFooter } from '../landing-page/LandingFooter';
import { LandingMenu } from '../landing-page/LandingMenu';
import { LandingOverlay } from '../landing-page/LandingOverlay';

// Informational Content Components
import { AboutSection } from '../landing-page/AboutSection';
import { PricingSection } from '../landing-page/PricingSection';
import { ContactSection } from '../landing-page/ContactSection';
import { TermsSection } from '../landing-page/TermsSection';
import { InvestmentSection } from '../landing-page/InvestmentSection';
import { ShopSection } from '../landing-page/ShopSection';
import { EnterpriseSection } from '../landing-page/EnterpriseSection';
import { CareersSection } from '../landing-page/CareersSection';
import { GuidesSection } from '../landing-page/GuidesSection';
import { CaseStudiesSection } from '../landing-page/CaseStudiesSection';
import { HelpCenterSection } from '../landing-page/HelpCenterSection';
import { PrivacySection } from '../landing-page/PrivacySection';
import { NodeRegistrySection } from '../landing-page/NodeRegistrySection';
import { ComplianceSection } from '../landing-page/ComplianceSection';

interface LandingViewProps {
  initialOverlay?: string | null;
  onOverlayChange?: (overlay: string | null) => void;
  onStart: () => void;
  onCreateMenu: () => void;
  onImportMenu: (config: any) => void;
  onMenuClick: () => void;
  onAffiliateAuth: () => void;
  onAdminAuth: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({ initialOverlay, onOverlayChange, onStart, onCreateMenu, onAffiliateAuth, onAdminAuth }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<string | null>(initialOverlay || null);

  useEffect(() => {
    setActiveOverlay(initialOverlay || null);
  }, [initialOverlay]);

  const handleOverlayChange = (overlay: string | null) => {
    setActiveOverlay(overlay);
    if (onOverlayChange) {
      onOverlayChange(overlay);
    }
  };

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
        onSelect={(id) => {
          if (id === 'merchant-access') onAdminAuth();
          else handleOverlayChange(id);
        }}
      />

      <HeroSection onStart={onStart} onCreateMenu={onCreateMenu} onAffiliateAuth={onAffiliateAuth} />
      
      <BlueprintStepper />
      
      <FeedbackSection />

      <LibrarySection />
      
      <LandingFaq onContactClick={() => handleOverlayChange('contact')} />
      
      <LandingFooter 
        onStart={onStart} 
        onCreateMenu={onCreateMenu} 
        onInvestmentClick={() => handleOverlayChange('investment')}
        onCareerClick={() => handleOverlayChange('careers')}
        onShopClick={() => handleOverlayChange('shop')}
        onEnterpriseClick={() => handleOverlayChange('enterprise')}
        onGuidesClick={() => handleOverlayChange('guides')}
        onCaseStudiesClick={() => handleOverlayChange('case-studies')}
        onHelpCenterClick={() => handleOverlayChange('help-center')}
        onPrivacyClick={() => handleOverlayChange('privacy')}
        onTermsClick={() => handleOverlayChange('terms')}
        onNodeRegistryClick={() => handleOverlayChange('node-registry')}
        onComplianceClick={() => handleOverlayChange('compliance')}
      />

      {/* Detail Overlays */}
      <LandingOverlay 
        isOpen={activeOverlay === 'pricing'} 
        onClose={() => handleOverlayChange(null)} 
      >
        <PricingSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'shop'} 
        onClose={() => handleOverlayChange(null)} 
      >
        <ShopSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'about'} 
        onClose={() => handleOverlayChange(null)} 
      >
        <AboutSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'contact'} 
        onClose={() => handleOverlayChange(null)} 
      >
        <ContactSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'terms'} 
        onClose={() => handleOverlayChange(null)} 
      >
        <TermsSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'investment'} 
        onClose={() => handleOverlayChange(null)} 
      >
        <InvestmentSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'enterprise'} 
        onClose={() => handleOverlayChange(null)} 
      >
        <EnterpriseSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'careers'} 
        onClose={() => handleOverlayChange(null)} 
      >
        <CareersSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'guides'} 
        onClose={() => handleOverlayChange(null)} 
      >
        <GuidesSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'case-studies'} 
        onClose={() => handleOverlayChange(null)} 
      >
        <CaseStudiesSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'help-center'} 
        onClose={() => handleOverlayChange(null)} 
      >
        <HelpCenterSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'privacy'} 
        onClose={() => handleOverlayChange(null)} 
      >
        <PrivacySection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'node-registry'} 
        onClose={() => handleOverlayChange(null)} 
      >
        <NodeRegistrySection />
      </LandingOverlay>
    </div>
  );
};

export default LandingView;