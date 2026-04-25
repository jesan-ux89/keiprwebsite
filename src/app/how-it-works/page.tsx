import LandingStyles from '@/components/landing/LandingStyles';
import LandingNav from '@/components/landing/LandingNav';
import PainSection from '@/components/landing/PainSection';
import FooterSection from '@/components/landing/FooterSection';

export default function HowItWorksPage() {
  return (
    <div className="landingRoot">
      <LandingStyles />
      <LandingNav />
      <PainSection />
      <FooterSection />
    </div>
  );
}
