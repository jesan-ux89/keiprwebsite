'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LandingStyles from '@/components/landing/LandingStyles';
import LandingNav from '@/components/landing/LandingNav';
import HeroSection from '@/components/landing/HeroSection';
import FooterSection from '@/components/landing/FooterSection';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If the visitor is already signed in, send them to the app instead of the
  // marketing home page. router.replace (vs push) keeps the home page out of
  // browser history so the back button doesn't bounce them between / and /app.
  useEffect(() => {
    if (!loading && user) {
      router.replace('/app');
    }
  }, [loading, user, router]);

  return (
    <div className="landingRoot">
      <LandingStyles />
      <LandingNav />
      <HeroSection />
      <FooterSection />
    </div>
  );
}
