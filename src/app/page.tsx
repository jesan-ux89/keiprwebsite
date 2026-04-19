'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Zap,
  BarChart3,
  TrendingUp,
  Landmark,
  Globe,
  Menu,
  X,
  ChevronRight,
  Wallet,
  Brain
} from 'lucide-react';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

  useEffect(() => {
    if (!lightboxSrc) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeLightbox(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = ''; };
  }, [lightboxSrc, closeLightbox]);

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#EDF6FC', color: '#0C1E2C' }}>
      {/* ── BAR 1: Top Announcement Bar (Indigo Midnight) ── */}
      <div style={{ backgroundColor: '#0F3460' }} className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-center gap-2">
          <span className="text-xs sm:text-sm font-medium text-white/90 tracking-wide">
            Keipr is now on the web — budget smarter from any device
          </span>
          <Link href="/auth/signup" className="text-xs sm:text-sm font-semibold underline underline-offset-2 hover:text-white/80 transition flex items-center gap-0.5" style={{ color: '#38BDF8' }}>
            Get Started <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── BAR 2: Main Navigation (Black) ── */}
      <nav className="sticky top-0 z-50" style={{ backgroundColor: '#1A1814' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative">
          {/* Left: Logo */}
          <Link href="/" className="flex items-baseline gap-[2px] shrink-0">
            <span style={{ fontFamily: 'Georgia, serif' }} className="text-[36px] font-bold text-[#38BDF8]">k</span>
            <span className="text-[28px] font-light text-white tracking-[2px]">eipr</span>
          </Link>

          {/* Center: Nav Links + Sign In (desktop) — absolute so store badges don't shift it */}
          <div className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
            <a href="#features" className="text-sm font-medium text-white hover:text-white/80 tracking-wide transition">
              How It Works
            </a>
            <a href="#features" className="text-sm font-medium text-white hover:text-white/80 tracking-wide transition">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium text-white hover:text-white/80 tracking-wide transition">
              Pricing
            </a>
            <Link href="/faq" className="text-sm font-medium text-white hover:text-white/80 tracking-wide transition">
              FAQ
            </Link>
            <Link href="/auth/login" className="text-sm font-medium text-white hover:text-white/80 tracking-wide transition">
              Sign In
            </Link>
          </div>

          {/* Right: Store Buttons (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {/* App Store Button */}
            <Link href="/coming-soon?platform=ios" className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div className="flex flex-col">
                <span className="text-[8px] text-white/70 leading-none">Download on the</span>
                <span className="text-[12px] font-semibold text-white leading-tight">App Store</span>
              </div>
            </Link>

            {/* Google Play Button */}
            <Link href="/coming-soon?platform=android" className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92z" fill="#4285F4"/>
                <path d="M17.556 8.236L5.178.734C4.756.49 4.324.394 3.93.447l9.862 9.862 3.764-2.073z" fill="#EA4335"/>
                <path d="M17.556 15.764l-3.764-2.073L3.93 23.553c.394.053.826-.043 1.248-.287l12.378-7.502z" fill="#34A853"/>
                <path d="M20.778 12c0-.678-.378-1.28-.945-1.588l-2.277-1.376-4.014 2.214L14.792 12l-1.25.75 4.014 2.214 2.277-1.376c.567-.308.945-.91.945-1.588z" fill="#FBBC04"/>
              </svg>
              <div className="flex flex-col">
                <span className="text-[8px] text-white/70 leading-none">Get it on</span>
                <span className="text-[12px] font-semibold text-white leading-tight">Google Play</span>
              </div>
            </Link>
          </div>

          {/* Mobile: Hamburger */}
          <button
            className="md:hidden p-2 text-white/60"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/[0.08] px-4 pb-4" style={{ backgroundColor: '#1A1814' }}>
            <div className="flex flex-col gap-1 pt-2">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/[0.05] rounded-lg transition">
                How It Works
              </a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/[0.05] rounded-lg transition">
                Features
              </a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/[0.05] rounded-lg transition">
                Pricing
              </a>
              <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/[0.05] rounded-lg transition">
                FAQ
              </Link>
              <div className="border-t border-white/[0.08] mt-2 pt-3 flex flex-col gap-2">
                <Link href="/auth/login" className="px-4 py-3 text-sm text-white/80 hover:text-white rounded-lg transition text-center">
                  Sign In
                </Link>
                <div className="flex gap-2 justify-center pt-1">
                  <Link href="/coming-soon?platform=ios" className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                    <div className="flex flex-col"><span className="text-[7px] text-white/70 leading-none">Download on the</span><span className="text-[11px] font-semibold text-white leading-tight">App Store</span></div>
                  </Link>
                  <Link href="/coming-soon?platform=android" className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92z" fill="#4285F4"/><path d="M17.556 8.236L5.178.734C4.756.49 4.324.394 3.93.447l9.862 9.862 3.764-2.073z" fill="#EA4335"/><path d="M17.556 15.764l-3.764-2.073L3.93 23.553c.394.053.826-.043 1.248-.287l12.378-7.502z" fill="#34A853"/><path d="M20.778 12c0-.678-.378-1.28-.945-1.588l-2.277-1.376-4.014 2.214L14.792 12l-1.25.75 4.014 2.214 2.277-1.376c.567-.308.945-.91.945-1.588z" fill="#FBBC04"/></svg>
                    <div className="flex flex-col"><span className="text-[7px] text-white/70 leading-none">Get it on</span><span className="text-[11px] font-semibold text-white leading-tight">Google Play</span></div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section with Floating Cards */}
      <HeroWithFloatingCards />

      {/* Pain Point Section — 4-card story strip */}
      <PainSection />

      {/* How It Works */}
      <HowItWorks />

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 px-4 border-t" style={{ borderColor: 'rgba(12,74,110,0.1)', backgroundColor: '#E0F4FC' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#0C1E2C' }}>Built Around How You Actually Get Paid</h2>
            <p className="text-xl" style={{ color: 'rgba(12,30,44,0.6)' }}>Budget by paycheck, by month, or months ahead — your money, your way</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <FeatureCard icon={Calendar} title="Paycheck-Forward Budgeting" description="Budget by your pay cycles, not calendar months. Align your bills with your paychecks for stress-free planning." screenshot="/screen-dashboard.png" onScreenshotClick={setLightboxSrc} />

            {/* Feature 2 */}
            <FeatureCard icon={Zap} title="Split Bills Across Paychecks" description="Break large bills into smaller payments across multiple paychecks. Never feel the pain of a big expense again." screenshot="/screen-split.png" onScreenshotClick={setLightboxSrc} />

            {/* Feature 3 */}
            <FeatureCard icon={BarChart3} title="Bill Tracker" description="Track what's paid each paycheck cycle at a glance. Get instant visibility into your bill payment status." screenshot="/screen-tracker.png" onScreenshotClick={setLightboxSrc} />

            {/* Feature 4 */}
            <FeatureCard icon={TrendingUp} title="Forward Planning" description="Plan months ahead with confidence. See how your income and bills align across future paychecks." screenshot="/screen-plan.png" onScreenshotClick={setLightboxSrc} />

            {/* Feature 5 */}
            <FeatureCard icon={Landmark} title="Connected Banking" description="Auto-match transactions to your bills with Plaid. Ultra tier feature for seamless banking integration." screenshot="/screen-banking.png" onScreenshotClick={setLightboxSrc} />

            {/* Feature 6 */}
            <FeatureCard icon={Globe} title="Multi-Currency Support" description="Work with 7 currencies: USD, EUR, GBP, CAD, AUD, MXN, JPY. Perfect for global users." screenshot="/screen-currency.png" onScreenshotClick={setLightboxSrc} />

            {/* Feature 7 */}
            <FeatureCard icon={Wallet} title="One-Time Fund Tracking" description="Got a tax refund, bonus, or loan payout? Track it separately from your regular budget. Add spending items against it and watch the balance drain to zero — no impact on your paycheck calculations." screenshot="/screen-fund.png" onScreenshotClick={setLightboxSrc} />

            {/* Feature 8 */}
            <FeatureCard icon={Brain} title="AI Budget Intelligence" description="An AI Accountant that auto-classifies transactions, merges duplicates, assigns bills to the right paycheck, and detects savings patterns — so your budget stays accurate without the manual work." screenshot="/screen-ai.png" onScreenshotClick={setLightboxSrc} />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 px-4 border-t" style={{ borderColor: 'rgba(12,74,110,0.1)', backgroundColor: '#EDF6FC' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#0C1E2C' }}>Simple, Transparent Pricing</h2>
            <p className="text-xl" style={{ color: 'rgba(12,30,44,0.6)' }}>Choose the plan that fits your needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <PricingCard name="Free" price="$0" subtitle="Perfect to get started" features={['1 income source', '1 split bill', '1 month planning']} href="/auth/signup" />

            {/* Pro Tier */}
            <PricingCard name="Pro" price="$7.99" subtitle="Most features, most users" features={['Unlimited splits', 'Unlimited income sources', 'Unlimited month planning', 'Data export', 'Trends & insights']} href="/auth/signup" highlighted />

            {/* Ultra Tier */}
            <PricingCard name="Ultra" price="$11.99" subtitle="Everything + connected banking" features={['Everything in Pro', 'Connected Banking via Plaid', 'Auto-match transactions', 'Smart suggestions']} href="/auth/signup" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 mt-auto" style={{ borderColor: 'rgba(12,74,110,0.1)', backgroundColor: '#E0F4FC' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p style={{ color: 'rgba(12,30,44,0.45)', fontSize: '0.85rem' }}>
              &copy; 2026 Keipr. Paycheck-forward budgeting for everyone.
            </p>
            <div className="flex gap-6">
              <Link href="/faq" className="text-sm hover:underline" style={{ color: 'rgba(12,30,44,0.5)' }}>FAQ</Link>
              <Link href="/terms" className="text-sm hover:underline" style={{ color: 'rgba(12,30,44,0.5)' }}>Terms of Service</Link>
              <Link href="/privacy" className="text-sm hover:underline" style={{ color: 'rgba(12,30,44,0.5)' }}>Privacy Policy</Link>
              <a href="mailto:contact@keipr.app" className="text-sm hover:underline" style={{ color: 'rgba(12,30,44,0.5)' }}>Contact</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Lightbox Modal */}
      {lightboxSrc && (
        <div
          onClick={closeLightbox}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
            padding: '40px',
          }}
        >
          <button
            onClick={closeLightbox}
            style={{
              position: 'absolute',
              top: '20px',
              right: '24px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Close lightbox"
          >
            <X size={32} color="#fff" />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: '90vh',
              maxWidth: '400px',
              width: '90vw',
              borderRadius: '36px',
              border: '4px solid rgba(255,255,255,0.15)',
              overflow: 'hidden',
              background: '#1A1814',
              boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)',
              cursor: 'default',
            }}
          >
            <img
              src={lightboxSrc}
              alt="Full resolution screenshot"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ComponentType<{ size: number; className?: string; color?: string }>;
  title: string;
  description: string;
  screenshot?: string;
  onScreenshotClick?: (src: string) => void;
}

function FeatureCard({ icon: Icon, title, description, screenshot, onScreenshotClick }: FeatureCardProps) {
  return (
    <div className="rounded-xl border transition group hover:shadow-lg overflow-hidden" style={{ backgroundColor: '#222019', borderColor: 'rgba(255,255,255,0.08)' }}>
      {/* Text content on top */}
      <div className="p-7 pb-5">
        <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.2)' }}>
          <Icon size={22} color="#38BDF8" />
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: '#F5F3EF' }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,243,239,0.55)' }}>
          {description}
        </p>
      </div>
      {/* Screenshot below — clickable for full-res */}
      {screenshot && (
        <div className="px-7 pb-6 flex justify-center">
          <div
            onClick={() => onScreenshotClick?.(screenshot)}
            style={{
              width: '200px',
              borderRadius: '18px',
              overflow: 'hidden',
              border: '3px solid #3A3832',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              background: '#1A1814',
              cursor: 'zoom-in',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
          >
            <img
              src={screenshot}
              alt={`${title} screenshot`}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface PricingCardProps {
  name: string;
  price: string;
  subtitle: string;
  features: string[];
  href: string;
  highlighted?: boolean;
}

function PricingCard({ name, price, subtitle, features, href, highlighted = false }: PricingCardProps) {
  return (
    <div
      className="p-8 flex flex-col rounded-xl border"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: highlighted ? '#0C4A6E' : 'rgba(12,74,110,0.1)',
        borderWidth: highlighted ? '2px' : '1px',
      }}
    >
      {highlighted && (
        <div className="inline-block text-sm font-semibold px-3 py-1 rounded-full mb-4 w-fit" style={{ backgroundColor: '#0C4A6E', color: '#E8E5DC' }}>
          Popular
        </div>
      )}
      <h3 className="text-2xl font-bold mb-2" style={{ color: '#0C1E2C' }}>{name}</h3>
      <p className="mb-6" style={{ color: 'rgba(12,30,44,0.6)' }}>{subtitle}</p>
      <div className="mb-6">
        <span className="text-4xl font-bold" style={{ color: '#0C1E2C' }}>{price}</span>
        <span style={{ color: 'rgba(12,30,44,0.45)' }}>/month</span>
      </div>
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3" style={{ color: 'rgba(12,30,44,0.6)' }}>
            <span style={{ color: '#0C4A6E' }} className="mt-1">•</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="w-full py-2 rounded-lg font-semibold transition text-center inline-block hover:opacity-90"
        style={
          highlighted
            ? { backgroundColor: '#0C4A6E', color: '#E8E5DC' }
            : { border: '1px solid rgba(12,74,110,0.2)', color: '#0C1E2C' }
        }
      >
        Get Started
      </Link>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Pain Section — "Every budgeting app assumes the 1st"
   Centered headline + 4-card horizontal story strip
   ══════════════════════════════════════════════════════════ */
function PainSection() {
  const storyCardStyle: React.CSSProperties = {
    background: 'rgba(15,20,30,0.94)',
    border: '1px solid rgba(56,189,248,0.18)',
    borderRadius: '18px',
    padding: '22px 22px 26px',
    boxShadow: '0 8px 28px rgba(0,0,0,0.25), 0 0 12px rgba(56,189,248,0.04)',
  };
  const stepStyle = (bg: string): React.CSSProperties => ({
    width: '28px', height: '28px', borderRadius: '50%', background: bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.72rem', fontWeight: 800, color: '#fff', flexShrink: 0,
  });
  const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' };
  const checkDot: React.CSSProperties = { width: '18px', height: '18px', borderRadius: '50%', background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
  const progressTrack: React.CSSProperties = { width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: '6px' };

  return (
    <section className="border-t px-4" style={{ backgroundColor: '#F5F3EF', borderColor: 'rgba(12,74,110,0.08)', padding: '80px 24px 72px' }}>
      <div className="max-w-7xl mx-auto">
        {/* Headline */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#0C1E2C', lineHeight: 1.3 }}>
            Every budgeting app assumes you get paid on the 1st.<br />
            <span style={{ color: '#38BDF8' }}>You probably don&apos;t.</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(12,30,44,0.6)', lineHeight: 1.8 }}>
            Most people get paid biweekly, weekly, or twice a month — but every budgeting tool forces you into a calendar-month view.
            Bills don&apos;t line up. Money feels tight one week, fine the next. You&apos;re always guessing.
            Keipr flips the model: <strong style={{ color: '#0C1E2C' }}>your budget starts when your paycheck lands.</strong>
          </p>
        </div>

        {/* 4-card strip */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Connecting line (desktop only) */}
          <div className="hidden lg:block absolute" style={{ top: '28px', left: '60px', right: '60px', height: '2px', background: 'linear-gradient(90deg, #4ADE80, #38BDF8, #FBBF24, #0C4A6E)', opacity: 0.3, zIndex: 0 }} />

          {/* Card 1: Got Paid */}
          <div style={{ ...storyCardStyle, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={stepStyle('#16A34A')}>1</div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#4ADE80' }}>You Got Paid</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Paycheck 1 · Apr 10</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#4ADE80', marginBottom: '6px' }}>+$2,847</div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>Direct deposit from Acme Corp</div>
            <div style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(15,20,30,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={rowStyle}><span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)' }}>Before</span><span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#F5F3EF' }}>$1,243</span></div>
              <div style={rowStyle}><span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)' }}>After</span><span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4ADE80' }}>$4,090</span></div>
            </div>
          </div>

          {/* Card 2: Bills Mapped */}
          <div style={{ ...storyCardStyle, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={stepStyle('#38BDF8')}>2</div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#38BDF8' }}>Bills Mapped</span>
            </div>
            {[['Rent', '$850'], ['Car Payment', '$287'], ['Electric', '$145'], ['Internet', '$89']].map(([name, amt]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0' }}>
                <div style={checkDot}><span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>✓</span></div>
                <span style={{ fontSize: '0.78rem', color: '#F5F3EF', flex: 1 }}>{name}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>{amt}</span>
              </div>
            ))}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '6px 0' }} />
            <div style={rowStyle}><span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)' }}>Total due</span><span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#F5F3EF' }}>$1,371</span></div>
          </div>

          {/* Card 3: Split It */}
          <div style={{ ...storyCardStyle, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ ...stepStyle('#FBBF24'), color: '#1A1814' }}>3</div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#FBBF24' }}>Split It</span>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F5F3EF', marginBottom: '8px' }}>Mortgage · $2,000</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <div style={{ flex: 1, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.18)', borderRadius: '10px', padding: '8px 12px', textAlign: 'center' as const }}>
                <div style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.4)' }}>Check 1 · Apr 10</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4ADE80' }}>$1,200</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: '10px', padding: '8px 12px', textAlign: 'center' as const }}>
                <div style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.4)' }}>Check 2 · Apr 24</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FBBF24' }}>$800</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ADE80', flexShrink: 0 }} />
              <div style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg, #4ADE80, #FBBF24)' }} />
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#FBBF24', flexShrink: 0 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)' }}>Apr 10</span>
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)' }}>Apr 24</span>
            </div>
          </div>

          {/* Card 4: Plan Ahead */}
          <div style={{ ...storyCardStyle, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={stepStyle('#0C4A6E')}>4</div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#38BDF8' }}>Plan Ahead</span>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <div style={rowStyle}><span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F5F3EF' }}>May 2026</span><span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#38BDF8' }}>75%</span></div>
              <div style={progressTrack}><div style={{ width: '75%', height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #38BDF8, #0C4A6E)' }} /></div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>$1,875 of $2,495 funded</div>
            </div>
            <div>
              <div style={rowStyle}><span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F5F3EF' }}>June 2026</span><span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(56,189,248,0.6)' }}>30%</span></div>
              <div style={progressTrack}><div style={{ width: '30%', height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, rgba(56,189,248,0.5), rgba(12,74,110,0.5))' }} /></div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>$749 of $2,495 funded</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   How It Works — 3 steps
   ══════════════════════════════════════════════════════════ */
function HowItWorks() {
  const steps = [
    { num: '1', title: 'Tell Us When You Get Paid', desc: 'Set your pay schedule — biweekly, weekly, twice monthly, or monthly. Keipr builds your budget around YOUR pay dates, not arbitrary calendar months.' },
    { num: '2', title: 'Add Your Expenses', desc: 'Enter your bills manually or connect your bank to auto-detect recurring expenses. Keipr maps each bill to the right paycheck based on its due date.' },
    { num: '3', title: 'See What\'s Left', desc: 'Your dashboard shows exactly how much you can spend after every payday. Track payments, plan months ahead, and split big bills across paychecks.' },
  ];
  return (
    <section className="border-t px-4 py-20 md:py-28" style={{ backgroundColor: '#EDF6FC', borderColor: 'rgba(12,74,110,0.08)' }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-3" style={{ color: '#0C1E2C' }}>How Keipr Works</h2>
        <p className="text-lg text-center mb-14" style={{ color: 'rgba(12,30,44,0.5)' }}>Three steps to paycheck clarity</p>
        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((s) => (
            <div key={s.num} className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-5" style={{ backgroundColor: '#0C4A6E' }}>{s.num}</div>
              <h3 className="text-lg font-bold mb-3" style={{ color: '#0C1E2C' }}>{s.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(12,30,44,0.6)' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   Animated Story Cards — "Your finances, coming alive"
   5-scene loop: Paid → Bills Confirmed → Split → Pay Forward → Budget
   Desktop: 2 cards visible  |  Mobile: 1 card visible
   ══════════════════════════════════════════════════════════ */

/* ── Glassmorphic Card Shell — taller, with slide direction + glow pulse ── */

/* ══════════════════════════════════════════════════════════
   Hero — Phone on left, copy on right (matches splash-mockup.html)
   ══════════════════════════════════════════════════════════ */
function HeroWithFloatingCards() {
  return (
    <section className="relative overflow-hidden px-4" style={{
      background: 'linear-gradient(160deg, #0B1120 0%, #0F172A 40%, #162032 100%)',
      padding: '80px 24px 100px',
    }}>
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 50% at 30% 50%, rgba(56,189,248,0.06) 0%, transparent 70%)',
      }} />

      <div className="relative z-10 max-w-[1100px] mx-auto flex flex-col md:flex-row items-center gap-14">
        {/* Phone on LEFT */}
        <div className="flex-shrink-0 md:order-first order-first">
          <div style={{ position: 'relative', width: '300px' }}>
            <div style={{
              borderRadius: '36px',
              border: '4px solid rgba(255,255,255,0.15)',
              overflow: 'hidden',
              background: '#1A1814',
              boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05), 0 0 48px rgba(56,189,248,0.06)',
            }}>
              <img src="/screen-dashboard.png" alt="Keipr Dashboard — Available to Spend front and center" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
          </div>
        </div>

        {/* Copy on RIGHT */}
        <div className="flex-1 text-center md:text-left">
          <div style={{
            display: 'inline-block',
            padding: '6px 18px',
            borderRadius: '20px',
            background: 'rgba(56,189,248,0.1)',
            border: '1px solid rgba(56,189,248,0.25)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#38BDF8',
            letterSpacing: '0.08em',
            marginBottom: '28px',
          }}>
            PAYCHECK-FORWARD BUDGETING
          </div>

          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.2rem)', fontWeight: 800, color: '#F5F3EF', lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-0.5px' }}>
            Know What&apos;s Left <span style={{ color: '#38BDF8' }}>After Every Payday</span>
          </h1>

          <p style={{ fontSize: '1.1rem', color: 'rgba(245,243,239,0.5)', lineHeight: 1.75, maxWidth: '560px', marginBottom: '36px' }} className="mx-auto md:mx-0">
            Budget by your pay cycle — not the calendar month. See your bills, splits, and spending mapped to each paycheck so you always know what you can actually spend. <span style={{ color: '#38BDF8', fontWeight: 600 }}>Available to Spend</span> is front and center every time you open the app.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link
              href="/auth/signup"
              className="px-8 py-3.5 rounded-lg font-semibold hover:opacity-90 transition transform hover:scale-105 inline-block text-center"
              style={{ backgroundColor: '#38BDF8', color: '#0B1120', boxShadow: '0 4px 20px rgba(56,189,248,0.3)', fontSize: '1rem' }}
            >
              Start Budgeting Free
            </Link>
            <Link
              href="/app"
              className="px-8 py-3.5 rounded-lg border font-semibold hover:opacity-75 transition inline-block text-center"
              style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#F5F3EF', fontSize: '1rem' }}
            >
              Open Web App
            </Link>
          </div>
        </div>
      </div>

      {/* Responsive: smaller phone on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .relative.z-10.max-w-\\[1100px\\] > div:first-child > div { width: 240px !important; }
        }
      `}</style>
    </section>
  );
}
