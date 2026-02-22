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
  onStart: () => void;
  onCreateMenu: () => void;
  onImportMenu: (config: any) => void;
  onMenuClick: () => void;
  onAffiliateAuth: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onStart, onCreateMenu, onAffiliateAuth }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<'pricing' | 'about' | 'contact' | 'terms' | 'investment' | 'shop' | 'enterprise' | 'careers' | 'guides' | 'caseStudies' | 'helpCenter' | 'privacy' | 'nodeRegistry' | 'compliance' | null>(null);

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

      <HeroSection onStart={onStart} onCreateMenu={onCreateMenu} onAffiliateAuth={onAffiliateAuth} />
      
      <BlueprintStepper />
      
      <FeedbackSection />

      <LibrarySection />
      
      <LandingFaq onContactClick={() => setActiveOverlay('contact')} />
      
      <LandingFooter 
        onStart={onStart} 
        onCreateMenu={onCreateMenu} 
        onInvestmentClick={() => setActiveOverlay('investment')}
        onCareerClick={() => setActiveOverlay('careers')}
        onShopClick={() => setActiveOverlay('shop')}
        onEnterpriseClick={() => setActiveOverlay('enterprise')}
        onGuidesClick={() => setActiveOverlay('guides')}
        onCaseStudiesClick={() => setActiveOverlay('caseStudies')}
        onHelpCenterClick={() => setActiveOverlay('helpCenter')}
        onPrivacyClick={() => setActiveOverlay('privacy')}
        onTermsClick={() => setActiveOverlay('terms')}
        onNodeRegistryClick={() => setActiveOverlay('nodeRegistry')}
        onComplianceClick={() => setActiveOverlay('compliance')}
      />

      {/* Detail Overlays */}
      <LandingOverlay 
        isOpen={activeOverlay === 'pricing'} 
        onClose={() => setActiveOverlay(null)} 
      >
        <PricingSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'shop'} 
        onClose={() => setActiveOverlay(null)} 
      >
        <ShopSection />
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

      <LandingOverlay 
        isOpen={activeOverlay === 'investment'} 
        onClose={() => setActiveOverlay(null)} 
      >
        <InvestmentSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'enterprise'} 
        onClose={() => setActiveOverlay(null)} 
      >
        <EnterpriseSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'careers'} 
        onClose={() => setActiveOverlay(null)} 
      >
        <CareersSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'guides'} 
        onClose={() => setActiveOverlay(null)} 
      >
        <GuidesSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'caseStudies'} 
        onClose={() => setActiveOverlay(null)} 
      >
        <CaseStudiesSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'helpCenter'} 
        onClose={() => setActiveOverlay(null)} 
      >
        <HelpCenterSection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'privacy'} 
        onClose={() => setActiveOverlay(null)} 
      >
        <PrivacySection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'nodeRegistry'} 
        onClose={() => setActiveOverlay(null)} 
      >
        <NodeRegistrySection />
      </LandingOverlay>

      <LandingOverlay 
        isOpen={activeOverlay === 'compliance'} 
        onClose={() => setActiveOverlay(null)} 
      >
        <ComplianceSection />
      </LandingOverlay>
    </div>
  );
};

export default LandingView;