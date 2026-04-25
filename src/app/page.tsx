'use client';

import { useCallback, useEffect, useState } from 'react';
import LandingStyles from '@/components/landing/LandingStyles';
import LandingNav from '@/components/landing/LandingNav';
import HeroSection from '@/components/landing/HeroSection';
import PainSection from '@/components/landing/PainSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import PricingSection from '@/components/landing/PricingSection';
import FooterSection from '@/components/landing/FooterSection';
import LightboxModal from '@/components/landing/LightboxModal';

export default function Home() {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

  useEffect(() => {
    if (!lightboxSrc) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLightbox();
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [lightboxSrc, closeLightbox]);

  return (
    <div className="landingRoot">
      <LandingStyles />
      <LandingNav />
      <HeroSection />
      <PainSection />
      <FeaturesSection onScreenshotClick={setLightboxSrc} />
      <PricingSection />
      <FooterSection />
      <LightboxModal src={lightboxSrc} onClose={closeLightbox} />
    </div>
  );
}
