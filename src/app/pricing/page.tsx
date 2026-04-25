import LandingStyles from '@/components/landing/LandingStyles';
import LandingNav from '@/components/landing/LandingNav';
import PricingSection from '@/components/landing/PricingSection';
import FooterSection from '@/components/landing/FooterSection';

export default function PricingPage() {
  return (
    <div className="landingRoot">
      <LandingStyles />
      <LandingNav />
      <PricingSection />
      <FooterSection />
    </div>
  );
}
