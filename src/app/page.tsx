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
  Search,
  User,
  Menu,
  X,
  ChevronRight
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


      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 px-4 border-t" style={{ borderColor: 'rgba(12,74,110,0.1)', backgroundColor: '#E0F4FC' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#0C1E2C' }}>Powerful Features Built for Paycheck Planning</h2>
            <p className="text-xl" style={{ color: 'rgba(12,30,44,0.6)' }}>Everything you need to master your finances around your pay cycles</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <FeatureCard icon={Calendar} title="Paycheck-Forward Budgeting" description="Budget by your pay cycles, not calendar months. Align your bills with your paychecks for stress-free planning." screenshot="/screenshots/Paycheck-Forward-Budgeting.jpg" onScreenshotClick={setLightboxSrc} />

            {/* Feature 2 */}
            <FeatureCard icon={Zap} title="Split Bills Across Paychecks" description="Break large bills into smaller payments across multiple paychecks. Never feel the pain of a big expense again." screenshot="/screenshots/Split-Bills.jpg" onScreenshotClick={setLightboxSrc} />

            {/* Feature 3 */}
            <FeatureCard icon={BarChart3} title="Bill Tracker" description="Track what's paid each paycheck cycle at a glance. Get instant visibility into your bill payment status." screenshot="/screenshots/Bill-Tracker.jpg" onScreenshotClick={setLightboxSrc} />

            {/* Feature 4 */}
            <FeatureCard icon={TrendingUp} title="Forward Planning" description="Plan months ahead with confidence. See how your income and bills align across future paychecks." screenshot="/screenshots/Forward-Planning.jpg" onScreenshotClick={setLightboxSrc} />

            {/* Feature 5 */}
            <FeatureCard icon={Landmark} title="Connected Banking" description="Auto-match transactions to your bills with Plaid. Ultra tier feature for seamless banking integration." screenshot="/screenshots/Connected-Banking.jpg" onScreenshotClick={setLightboxSrc} />

            {/* Feature 6 */}
            <FeatureCard icon={Globe} title="Multi-Currency Support" description="Work with 7 currencies: USD, EUR, GBP, CAD, AUD, MXN, JPY. Perfect for global users." screenshot="/screenshots/Currency.jpg" onScreenshotClick={setLightboxSrc} />
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
        <div className="max-w-7xl mx-auto text-center" style={{ color: 'rgba(12,30,44,0.45)' }}>
          <p>2026 Keipr. Paycheck-forward budgeting for everyone.</p>
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
          <img
            src={lightboxSrc}
            alt="Full resolution screenshot"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: '90vh',
              maxWidth: '90vw',
              borderRadius: '16px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
              cursor: 'default',
            }}
          />
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
   Animated Story Cards — "Your finances, coming alive"
   5-scene loop: Paid → Bills Confirmed → Split → Pay Forward → Budget
   Desktop: 2 cards visible  |  Mobile: 1 card visible
   ══════════════════════════════════════════════════════════ */

/* ── Glassmorphic Card Shell — taller, with slide direction + glow pulse ── */
function StoryCard({ children, side, visible }: { children: React.ReactNode; side: 'left' | 'right' | 'center'; visible: boolean }) {
  const rotate = side === 'left' ? -3 : side === 'right' ? 3 : 0;
  const slideX = side === 'left' ? -24 : side === 'right' ? 24 : 0;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.10)',
      borderRadius: '22px',
      padding: '32px 32px 38px',
      boxShadow: visible
        ? '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 20px rgba(56,189,248,0.08)'
        : '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
      border: visible ? '1px solid rgba(56,189,248,0.25)' : '1px solid rgba(255,255,255,0.15)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      minWidth: '240px',
      maxWidth: '340px',
      transform: visible
        ? `rotate(${rotate}deg) scale(1) translateX(0px)`
        : `rotate(${rotate}deg) scale(0.92) translateX(${slideX}px)`,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1), border-color 0.7s, box-shadow 0.7s',
      pointerEvents: visible ? 'auto' as const : 'none' as const,
      animation: visible ? 'storyFloat 5s ease-in-out infinite' : 'none',
    }}>
      {children}
    </div>
  );
}

/* ── Animated counting number ── */
function AnimatedNumber({ target, prefix = '$', duration = 1200, active }: { target: number; prefix?: string; duration?: number; active: boolean }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) { setValue(0); return; }
    const start = performance.now();
    let raf: number;
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return <>{prefix}{value.toLocaleString()}</>;
}

/* ── Progress bar that fills ── */
function AnimatedBar({ pct, color, delay = 0, active }: { pct: number; color: string; delay?: number; active: boolean }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!active) { setWidth(0); return; }
    const t = setTimeout(() => setWidth(pct), delay + 100);
    return () => clearTimeout(t);
  }, [active, pct, delay]);
  return (
    <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <div style={{ width: `${width}%`, height: '100%', borderRadius: '3px', background: color, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
    </div>
  );
}

/* ── Check item that appears with delay ── */
function CheckItem({ label, amount, delay, active }: { label: string; amount: string; delay: number; active: boolean }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!active) { setShow(false); return; }
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [active, delay]);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0',
      opacity: show ? 1 : 0, transform: show ? 'translateX(0)' : 'translateX(-8px)',
      transition: 'opacity 0.4s, transform 0.4s',
    }}>
      <div style={{
        width: '20px', height: '20px', borderRadius: '50%',
        background: show ? '#16A34A' : 'rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.3s', flexShrink: 0,
      }}>
        <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>{show ? '\u2713' : ''}</span>
      </div>
      <span style={{ fontSize: '0.85rem', color: '#F5F3EF', flex: 1 }}>{label}</span>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{amount}</span>
    </div>
  );
}

/* ── Mini Donut (SVG) with animated segments ── */
function StoryDonut({ segments, active, size = 80 }: { segments: { pct: number; color: string; label: string }[]; active: boolean; size?: number }) {
  const r = 28; const circ = 2 * Math.PI * r;
  let offset = 0;
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!active) { setProgress(0); return; }
    const t = setTimeout(() => setProgress(1), 200);
    return () => clearTimeout(t);
  }, [active]);
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      {segments.map((seg) => {
        const dash = (seg.pct / 100) * circ * progress;
        const gap = circ - dash;
        const el = (
          <circle key={seg.label} cx="40" cy="40" r={r} fill="none" stroke={seg.color} strokeWidth="10"
            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset * progress}
            strokeLinecap="round" transform="rotate(-90 40 40)"
            style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1), stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
          />
        );
        offset += (seg.pct / 100) * circ;
        return el;
      })}
      <text x="40" y="38" textAnchor="middle" fill="#F5F3EF" fontSize="10" fontWeight="700" style={{ opacity: progress, transition: 'opacity 0.6s' }}>
        $2,495
      </text>
      <text x="40" y="49" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7" style={{ opacity: progress, transition: 'opacity 0.6s 0.3s' }}>
        Total
      </text>
    </svg>
  );
}

/* ── Mini Bar Chart with growing bars ── */
function StoryBarChart({ active }: { active: boolean }) {
  const bars = [
    { label: 'Jan', value: 2100, max: 2600, color: '#38BDF8' },
    { label: 'Feb', value: 2400, max: 2600, color: '#38BDF8' },
    { label: 'Mar', value: 1900, max: 2600, color: '#38BDF8' },
    { label: 'Apr', value: 2495, max: 2600, color: '#0C4A6E' },
    { label: 'May', value: 2200, max: 2600, color: 'rgba(56,189,248,0.35)' },
    { label: 'Jun', value: 2300, max: 2600, color: 'rgba(56,189,248,0.35)' },
    { label: 'Jul', value: 2150, max: 2600, color: 'rgba(56,189,248,0.2)' },
  ];
  const [grow, setGrow] = useState(false);
  useEffect(() => {
    if (!active) { setGrow(false); return; }
    const t = setTimeout(() => setGrow(true), 300);
    return () => clearTimeout(t);
  }, [active]);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '72px' }}>
      {bars.map((bar, i) => (
        <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <div style={{
            width: '26px',
            height: grow ? `${(bar.value / bar.max) * 60}px` : '0px',
            background: bar.color,
            borderRadius: '4px 4px 0 0',
            transition: `height 0.6s cubic-bezier(0.4,0,0.2,1) ${i * 80}ms`,
          }} />
          <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)' }}>{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Scene label chip ── */
const sceneLabel: React.CSSProperties = { fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: '10px' };

/* ── SCENE CONTENT DEFINITIONS ── */

/* Scene 0: You Got Paid! */
function SceneGotPaidA({ active }: { active: boolean }) {
  return (
    <>
      <div style={{ ...sceneLabel, color: '#4ADE80', fontSize: '0.7rem' }}>You Got Paid!</div>
      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Paycheck 1 &middot; Apr 10</div>
      <div style={{ fontSize: '2.1rem', fontWeight: 700, color: '#4ADE80' }}>
        +<AnimatedNumber target={2847} prefix="$" active={active} />
      </div>
      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>Direct deposit from Acme Corp</div>
      {/* Account summary */}
      <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Before</span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>$1,243</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>After</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4ADE80' }}><AnimatedNumber target={4090} active={active} duration={1400} /></span>
        </div>
      </div>
      <div style={{ marginTop: '10px', fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)' }}>Next paycheck in 14 days</div>
    </>
  );
}
function SceneGotPaidB({ active }: { active: boolean }) {
  return (
    <>
      <div style={sceneLabel}>Paycheck Breakdown</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Income</span>
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F5F3EF' }}><AnimatedNumber target={2847} active={active} /></span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Bills Due</span>
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F87171' }}>-<AnimatedNumber target={1492} active={active} /></span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Savings</span>
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FBBF24' }}>-<AnimatedNumber target={300} active={active} /></span>
      </div>
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Remaining</span>
        <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#4ADE80' }}><AnimatedNumber target={1055} active={active} /></span>
      </div>
      <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '10px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)' }}>
        <div style={{ fontSize: '0.68rem', color: '#4ADE80', fontWeight: 600 }}>37% of paycheck available to spend</div>
      </div>
    </>
  );
}

/* Scene 1: Bills Confirmed */
function SceneBillsA({ active }: { active: boolean }) {
  return (
    <>
      <div style={sceneLabel}>Bills This Paycheck</div>
      <CheckItem label="Rent" amount="$850" delay={200} active={active} />
      <CheckItem label="Car Payment" amount="$287" delay={500} active={active} />
      <CheckItem label="Electric" amount="$145" delay={800} active={active} />
      <CheckItem label="Internet" amount="$89" delay={1100} active={active} />
      <CheckItem label="Insurance" amount="$121" delay={1400} active={active} />
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>Total due</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F5F3EF' }}><AnimatedNumber target={1492} active={active} /></span>
      </div>
    </>
  );
}
function SceneBillsB({ active }: { active: boolean }) {
  return (
    <>
      <div style={sceneLabel}>Payment Progress</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '14px' }}>
        <span style={{ fontSize: '2.2rem', fontWeight: 700, color: '#38BDF8' }}>
          <AnimatedNumber target={5} prefix="" active={active} duration={2200} />
        </span>
        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>of 5 confirmed</span>
      </div>
      <AnimatedBar pct={100} color="#38BDF8" delay={1800} active={active} />
      <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)' }}>
        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Total confirmed</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F5F3EF' }}><AnimatedNumber target={1492} active={active} /></span>
      </div>
      <div style={{ fontSize: '0.7rem', color: '#4ADE80', marginTop: '10px', opacity: active ? 1 : 0, transition: 'opacity 0.4s 2.2s' }}>
        $47 less than last pay period
      </div>
    </>
  );
}

/* Scene 2: Split Bill */
function SceneSplitA({ active }: { active: boolean }) {
  const [split, setSplit] = useState(false);
  useEffect(() => {
    if (!active) { setSplit(false); return; }
    const t = setTimeout(() => setSplit(true), 600);
    return () => clearTimeout(t);
  }, [active]);
  return (
    <>
      <div style={sceneLabel}>Splitting Mortgage</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#F5F3EF', marginBottom: '10px' }}>$2,000</div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <div style={{
          flex: 1, background: 'rgba(74,222,128,0.12)', borderRadius: '12px', padding: '10px 14px',
          textAlign: 'center' as const, border: '1px solid rgba(74,222,128,0.2)',
          transform: split ? 'translateX(0)' : 'translateX(30px)', opacity: split ? 1 : 0,
          transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)' }}>Check 1 &middot; Apr 10</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#4ADE80' }}>$1,200</div>
        </div>
        <div style={{
          flex: 1, background: 'rgba(251,191,36,0.12)', borderRadius: '12px', padding: '10px 14px',
          textAlign: 'center' as const, border: '1px solid rgba(251,191,36,0.2)',
          transform: split ? 'translateX(0)' : 'translateX(-30px)', opacity: split ? 1 : 0,
          transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1) 0.15s',
        }}>
          <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)' }}>Check 2 &middot; Apr 24</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FBBF24' }}>$800</div>
        </div>
      </div>
      {/* Timeline connector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '4px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ADE80', flexShrink: 0 }} />
        <div style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg, #4ADE80, #FBBF24)' }} />
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FBBF24', flexShrink: 0 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)' }}>Apr 10</span>
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)' }}>Apr 24</span>
      </div>
    </>
  );
}
function SceneSplitB({ active }: { active: boolean }) {
  return (
    <>
      <div style={sceneLabel}>Per-Paycheck Load</div>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Mortgage &middot; Check 1</span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>42%</span>
        </div>
        <AnimatedBar pct={42} color="#38BDF8" delay={400} active={active} />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Mortgage &middot; Check 2</span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>28%</span>
        </div>
        <AnimatedBar pct={28} color="#FBBF24" delay={700} active={active} />
      </div>
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '6px 0 10px' }} />
      {/* Second split example */}
      <div style={{ marginBottom: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Car Insurance &middot; 60/40</span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>21%</span>
        </div>
        <AnimatedBar pct={21} color="#A78BFA" delay={1000} active={active} />
      </div>
      <div style={{ fontSize: '0.68rem', color: '#4ADE80', marginTop: '8px' }}>
        All paychecks balanced under 50%
      </div>
    </>
  );
}

/* Scene 3: Pay Forward */
function SceneForwardA({ active }: { active: boolean }) {
  const [pctMay, setPctMay] = useState(0);
  const [pctJun, setPctJun] = useState(0);
  useEffect(() => {
    if (!active) { setPctMay(0); setPctJun(0); return; }
    const t1 = setTimeout(() => setPctMay(75), 400);
    const t2 = setTimeout(() => setPctJun(30), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [active]);
  return (
    <>
      <div style={sceneLabel}>Planning Ahead</div>
      {/* May */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F5F3EF' }}>May 2026</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#38BDF8' }}>75%</span>
        </div>
        <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ width: `${pctMay}%`, height: '100%', borderRadius: '4px', background: 'linear-gradient(90deg, #38BDF8, #0C4A6E)', transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
        </div>
        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>$1,875 of $2,495 funded</div>
      </div>
      {/* June */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F5F3EF' }}>June 2026</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(56,189,248,0.6)' }}>30%</span>
        </div>
        <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ width: `${pctJun}%`, height: '100%', borderRadius: '4px', background: 'linear-gradient(90deg, rgba(56,189,248,0.5), rgba(12,74,110,0.5))', transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
        </div>
        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>$749 of $2,495 funded</div>
      </div>
    </>
  );
}
function SceneForwardB({ active }: { active: boolean }) {
  return (
    <>
      <div style={sceneLabel}>You&apos;re Ahead</div>
      <div style={{ fontSize: '2.4rem', fontWeight: 700, color: '#38BDF8', lineHeight: 1.1 }}>
        <AnimatedNumber target={2} prefix="" active={active} duration={800} />
      </div>
      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', marginBottom: '14px' }}>weeks ahead of schedule</div>
      <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.18)', marginBottom: '10px' }}>
        <div style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 600 }}>Next month is 75% covered</div>
      </div>
      {/* Savings streak */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
        <span style={{ fontSize: '1rem' }}>&#x1F525;</span>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#FBBF24' }}>4-month saving streak</div>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)' }}>You&apos;ve planned ahead every month since Jan</div>
        </div>
      </div>
    </>
  );
}

/* Scene 4: Budget Charts */
function SceneBudgetA({ active }: { active: boolean }) {
  return (
    <>
      <div style={sceneLabel}>Monthly Spending</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#F5F3EF', marginBottom: '2px' }}>
        <AnimatedNumber target={2495} active={active} />
      </div>
      <div style={{ fontSize: '0.7rem', color: '#16A34A', marginBottom: '12px' }}>
        <span style={{ marginRight: '4px' }}>&#8599;</span>$105 less than last month
      </div>
      <StoryBarChart active={active} />
      {/* Top category callout */}
      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)' }}>
        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>Highest</span>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Housing &middot; $998</span>
      </div>
    </>
  );
}
function SceneBudgetB({ active }: { active: boolean }) {
  const segs = [
    { pct: 40, color: '#0C4A6E', label: 'Housing' },
    { pct: 22, color: '#38BDF8', label: 'Insurance' },
    { pct: 18, color: '#16A34A', label: 'Utilities' },
    { pct: 20, color: '#F59E0B', label: 'Other' },
  ];
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
        <StoryDonut segments={segs} active={active} />
        <div>
          <div style={sceneLabel}>Breakdown</div>
          {segs.map((s) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)' }}>{s.label}</span>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
      {/* Spending change callout */}
      <div style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.15)' }}>
        <div style={{ fontSize: '0.7rem', color: '#4ADE80', fontWeight: 600 }}>Utilities down 12% this month</div>
        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>Saved $18 vs. March</div>
      </div>
    </>
  );
}

/* ── Scene config ── */
const SCENES = [
  { title: 'You Got Paid!',      A: SceneGotPaidA, B: SceneGotPaidB },
  { title: 'Bills Confirmed',    A: SceneBillsA,   B: SceneBillsB },
  { title: 'Split Bill',         A: SceneSplitA,    B: SceneSplitB },
  { title: 'Pay Forward',        A: SceneForwardA,  B: SceneForwardB },
  { title: 'Budget Overview',    A: SceneBudgetA,   B: SceneBudgetB },
];

const SCENE_DURATION = 4000;

/* ══════════════════════════════════════════════════════════
   Hero with Animated Story Cards
   ══════════════════════════════════════════════════════════ */
function HeroWithFloatingCards() {
  const [scene, setScene] = useState(0);
  const [paused, setPaused] = useState(false);
  const totalScenes = SCENES.length;

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setScene((s) => (s + 1) % totalScenes), SCENE_DURATION);
    return () => clearInterval(timer);
  }, [paused, totalScenes]);

  return (
    <section className="relative overflow-hidden px-4 py-20 md:py-32 lg:py-40" style={{
      background: 'linear-gradient(160deg, #0B1120 0%, #0F172A 40%, #162032 100%)',
      minHeight: '640px',
    }}>
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(56,189,248,0.06) 0%, transparent 70%)',
      }} />

      {/* ── Scene title badge (centered, glowing) ── */}
      <div className="flex justify-center mb-6 lg:mb-0 lg:absolute lg:top-6 lg:left-1/2 lg:-translate-x-1/2" style={{ position: 'relative', zIndex: 10 }}>
        <div style={{
          padding: '6px 20px',
          borderRadius: '20px',
          background: 'rgba(56,189,248,0.1)',
          border: '1px solid rgba(56,189,248,0.25)',
          boxShadow: '0 0 16px rgba(56,189,248,0.15)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: '#38BDF8' }}>
            {SCENES[scene].title}
          </span>
        </div>
      </div>

      {/* ── Desktop: 2 cards, left + right (lg+) ── */}
      <div className="hidden lg:block" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        {/* Left card slot */}
        <div className="absolute" style={{ top: '15%', left: '3%' }}>
          <div style={{ position: 'relative', minHeight: '340px', minWidth: '300px' }}>
            {SCENES.map((s, i) => {
              const CardA = s.A;
              return (
                <div key={`left-${i}`} style={{ position: i === 0 ? 'relative' : 'absolute', top: 0, left: 0 }}>
                  <StoryCard side="left" visible={scene === i}><CardA active={scene === i} /></StoryCard>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right card slot */}
        <div className="absolute" style={{ top: '12%', right: '3%' }}>
          <div style={{ position: 'relative', minHeight: '340px', minWidth: '300px' }}>
            {SCENES.map((s, i) => {
              const CardB = s.B;
              return (
                <div key={`right-${i}`} style={{ position: i === 0 ? 'relative' : 'absolute', top: 0, right: 0 }}>
                  <StoryCard side="right" visible={scene === i}><CardB active={scene === i} /></StoryCard>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Mobile: 1 card, centered (below lg) ── */}
      <div className="lg:hidden flex justify-center mb-6" onTouchStart={() => setPaused(true)} onTouchEnd={() => { const t = setTimeout(() => setPaused(false), 2000); return () => clearTimeout(t); }}>
        <div style={{ position: 'relative', minHeight: '280px', minWidth: '280px' }}>
          {SCENES.map((s, i) => {
            const CardA = s.A;
            return (
              <div key={`mob-${i}`} style={{ position: i === 0 ? 'relative' : 'absolute', top: 0, left: 0, width: '100%' }}>
                <StoryCard side="center" visible={scene === i}><CardA active={scene === i} /></StoryCard>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scene indicator dots */}
      <div className="flex justify-center gap-2 mb-6 lg:mb-0 lg:absolute lg:bottom-8 lg:left-1/2 lg:-translate-x-1/2" style={{ position: 'relative', zIndex: 10 }}>
        {SCENES.map((_, i) => (
          <button key={i} onClick={() => setScene(i)} aria-label={`Scene ${i + 1}`} style={{
            width: i === scene ? '24px' : '8px',
            height: '8px',
            borderRadius: '4px',
            background: i === scene ? '#38BDF8' : 'rgba(255,255,255,0.2)',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.4s',
            padding: 0,
          }} />
        ))}
      </div>

      {/* ── Center content ── */}
      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6 md:space-y-8">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight" style={{ color: '#F5F3EF' }}>
          Budget Around Your Paychecks, <span style={{ color: '#38BDF8' }}>Not the Calendar</span>
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(245,243,239,0.55)' }}>
          Stop forcing your finances into calendar months. Keipr helps you plan around your pay cycles, split large bills across paychecks, and track every dollar with confidence.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Link
            href="/auth/signup"
            className="px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition transform hover:scale-105 inline-block text-center"
            style={{ backgroundColor: '#38BDF8', color: '#0B1120', boxShadow: '0 4px 20px rgba(56,189,248,0.3)' }}
          >
            Get Started Free
          </Link>
          <Link
            href="/app"
            className="px-8 py-3 rounded-lg border font-semibold hover:opacity-75 transition inline-block text-center"
            style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#F5F3EF' }}
          >
            Open Web App
          </Link>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes storyFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </section>
  );
}
