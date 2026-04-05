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

/* ── Floating Card Shell (glassmorphic) ── */
function FloatingCard({ children, rotate = 0, glass = false }: { children: React.ReactNode; rotate?: number; glass?: boolean }) {
  return (
    <div style={{
      background: glass ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.95)',
      borderRadius: '18px',
      padding: '20px 24px',
      boxShadow: glass
        ? '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)'
        : '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)',
      border: `1px solid ${glass ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.6)'}`,
      transform: `rotate(${rotate}deg)`,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      minWidth: '160px',
    }}>
      {children}
    </div>
  );
}

/* ── Label helpers ── */
const cardLabel: React.CSSProperties = { fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' };
const glassLabel = { ...cardLabel, color: 'rgba(255,255,255,0.55)' };
const solidLabel = { ...cardLabel, color: 'rgba(12,30,44,0.45)' };

/* ── Mini Bar Chart ── */
function MiniBarChart({ bars, glass = false }: { bars: { label: string; value: number; max: number; color: string }[]; glass?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '56px' }}>
      {bars.map((bar) => (
        <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <div style={{
            width: '22px',
            height: `${(bar.value / bar.max) * 48}px`,
            background: bar.color,
            borderRadius: '4px 4px 0 0',
            minHeight: '4px',
          }} />
          <span style={{ fontSize: '0.55rem', color: glass ? 'rgba(255,255,255,0.45)' : 'rgba(12,30,44,0.4)' }}>{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Mini Donut (SVG) ── */
function MiniDonut({ segments, size = 72 }: { segments: { pct: number; color: string; label: string }[]; size?: number }) {
  const r = 26; const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
      {segments.map((seg) => {
        const dash = (seg.pct / 100) * circ;
        const gap = circ - dash;
        const el = <circle key={seg.label} cx="36" cy="36" r={r} fill="none" stroke={seg.color} strokeWidth="9" strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset} strokeLinecap="round" transform="rotate(-90 36 36)" />;
        offset += dash;
        return el;
      })}
      <text x="36" y="34" textAnchor="middle" fill="#F5F3EF" fontSize="9" fontWeight="700">$2,495</text>
      <text x="36" y="44" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="6">Total</text>
    </svg>
  );
}

/* ── Spending Chart Card ── */
function SpendingChartCard({ glass = false }: { glass?: boolean }) {
  const bars = [
    { label: 'Jan', value: 2100, max: 2600, color: '#38BDF8' },
    { label: 'Feb', value: 2400, max: 2600, color: '#38BDF8' },
    { label: 'Mar', value: 1900, max: 2600, color: '#38BDF8' },
    { label: 'Apr', value: 2495, max: 2600, color: '#0C4A6E' },
    { label: 'May', value: 2200, max: 2600, color: 'rgba(56,189,248,0.35)' },
    { label: 'Jun', value: 2300, max: 2600, color: 'rgba(56,189,248,0.35)' },
  ];
  return (
    <>
      <div style={glass ? glassLabel : solidLabel}>Monthly Spending</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: glass ? '#F5F3EF' : '#0C1E2C', marginBottom: '4px' }}>$2,495</div>
      <div style={{ fontSize: '0.7rem', color: '#16A34A', marginBottom: '10px' }}>
        <span style={{ marginRight: '4px' }}>&#8599;</span>$105 less than last month
      </div>
      <MiniBarChart bars={bars} glass={glass} />
    </>
  );
}

/* ── Category Donut Card ── */
function CategoryDonutCard() {
  const segs = [
    { pct: 40, color: '#0C4A6E', label: 'Housing' },
    { pct: 22, color: '#38BDF8', label: 'Insurance' },
    { pct: 18, color: '#16A34A', label: 'Utilities' },
    { pct: 20, color: '#F59E0B', label: 'Other' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <MiniDonut segments={segs} />
      <div>
        <div style={glassLabel}>Bill Breakdown</div>
        {segs.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)' }}>{s.label}</span>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Paycheck Summary Card ── */
function PaycheckCard({ glass = false }: { glass?: boolean }) {
  const lbl = glass ? glassLabel : solidLabel;
  const primary = glass ? '#38BDF8' : '#0C4A6E';
  const text = glass ? '#F5F3EF' : '#0C1E2C';
  const sub = glass ? 'rgba(255,255,255,0.45)' : 'rgba(12,30,44,0.5)';
  return (
    <>
      <div style={lbl}>Next Paycheck</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: primary }}>$5,000</div>
      <div style={{ fontSize: '0.75rem', color: sub, marginTop: '2px' }}>Paycheck 1 &middot; Apr 10 – Apr 23</div>
      <div style={{ marginTop: '10px', display: 'flex', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '0.6rem', color: sub }}>Bills</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: text }}>$470</div>
        </div>
        <div>
          <div style={{ fontSize: '0.6rem', color: sub }}>Remaining</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#16A34A' }}>$4,530</div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   Hero with Floating Cards — Dark Background Edition
   ══════════════════════════════════════════════════════════ */
function HeroWithFloatingCards() {
  const [mobileSlide, setMobileSlide] = useState(0);
  const totalSlides = 4;

  useEffect(() => {
    const timer = setInterval(() => setMobileSlide((s) => (s + 1) % totalSlides), 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden px-4 py-20 md:py-32 lg:py-40" style={{
      background: 'linear-gradient(160deg, #0B1120 0%, #0F172A 40%, #162032 100%)',
      minHeight: '640px',
    }}>
      {/* Subtle radial glow behind center */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(56,189,248,0.06) 0%, transparent 70%)',
      }} />

      {/* ── Desktop: 6 floating cards (lg+) ── */}
      <div className="hidden lg:block">
        {/* Top-left: Spending chart (glass) */}
        <div className="absolute" style={{ top: '8%', left: '3%', animation: 'floatA 6s ease-in-out infinite' }}>
          <FloatingCard rotate={-4} glass>
            <SpendingChartCard glass />
          </FloatingCard>
        </div>

        {/* Top-right: Category donut (glass) */}
        <div className="absolute" style={{ top: '5%', right: '3%', animation: 'floatB 7s ease-in-out infinite' }}>
          <FloatingCard rotate={3} glass>
            <CategoryDonutCard />
          </FloatingCard>
        </div>

        {/* Mid-left: Paycheck summary (solid white) */}
        <div className="absolute" style={{ top: '50%', left: '2%', animation: 'floatC 5.5s ease-in-out infinite' }}>
          <FloatingCard rotate={3}>
            <PaycheckCard />
          </FloatingCard>
        </div>

        {/* Mid-right: Split card (solid white) */}
        <div className="absolute" style={{ top: '52%', right: '2%', animation: 'floatA 6.5s ease-in-out infinite' }}>
          <FloatingCard rotate={-3}>
            <div style={solidLabel}>Mortgage Split</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ background: '#E6F7ED', borderRadius: '10px', padding: '8px 14px', textAlign: 'center' as const }}>
                <div style={{ fontSize: '0.6rem', color: 'rgba(12,30,44,0.45)' }}>Check 1</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#16A34A' }}>$1,200</div>
              </div>
              <div style={{ background: '#FEF3C7', borderRadius: '10px', padding: '8px 14px', textAlign: 'center' as const }}>
                <div style={{ fontSize: '0.6rem', color: 'rgba(12,30,44,0.45)' }}>Check 2</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#B45309' }}>$800</div>
              </div>
            </div>
            <div style={{ fontSize: '0.65rem', color: '#16A34A', marginTop: '8px' }}>&#10003; Amounts add up to $2,000</div>
          </FloatingCard>
        </div>

        {/* Bottom-left: Tracker (glass) */}
        <div className="absolute" style={{ bottom: '6%', left: '12%', animation: 'floatB 5s ease-in-out infinite' }}>
          <FloatingCard rotate={2} glass>
            <div style={glassLabel}>Paid This Month</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(56,189,248,0.2)', border: '2px solid #38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#38BDF8', fontSize: '0.95rem', fontWeight: 700 }}>2</span>
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F5F3EF' }}>of 4 bills</div>
                <div style={{ width: '70px', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', marginTop: '4px' }}>
                  <div style={{ width: '50%', height: '100%', borderRadius: '3px', background: '#38BDF8' }} />
                </div>
              </div>
            </div>
          </FloatingCard>
        </div>

        {/* Bottom-right: After Bills (glass) */}
        <div className="absolute" style={{ bottom: '8%', right: '10%', animation: 'floatC 7.5s ease-in-out infinite' }}>
          <FloatingCard rotate={-2} glass>
            <div style={glassLabel}>After Bills</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 700, color: '#4ADE80' }}>$2,505</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>available for spending &amp; savings</div>
          </FloatingCard>
        </div>
      </div>

      {/* ── Mobile: Rotating card with cross-fade (below lg) ── */}
      <div className="lg:hidden flex justify-center mb-8" style={{ minHeight: '150px', position: 'relative' }}>
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} style={{
            position: idx === 0 ? 'relative' : 'absolute',
            opacity: mobileSlide === idx ? 1 : 0,
            transition: 'opacity 0.6s ease-in-out',
            animation: mobileSlide === idx ? 'floatA 6s ease-in-out infinite' : 'none',
            pointerEvents: mobileSlide === idx ? 'auto' : 'none',
          }}>
            {idx === 0 && <FloatingCard glass><SpendingChartCard glass /></FloatingCard>}
            {idx === 1 && <FloatingCard glass><CategoryDonutCard /></FloatingCard>}
            {idx === 2 && <FloatingCard glass><PaycheckCard glass /></FloatingCard>}
            {idx === 3 && (
              <FloatingCard glass>
                <div style={glassLabel}>Mortgage Split</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ background: 'rgba(22,163,74,0.15)', borderRadius: '10px', padding: '6px 12px', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)' }}>Check 1</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4ADE80' }}>$1,200</div>
                  </div>
                  <div style={{ background: 'rgba(245,158,11,0.15)', borderRadius: '10px', padding: '6px 12px', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)' }}>Check 2</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FBBF24' }}>$800</div>
                  </div>
                </div>
              </FloatingCard>
            )}
          </div>
        ))}
      </div>

      {/* Dot indicators (mobile) */}
      <div className="lg:hidden flex justify-center gap-2 mb-8">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <div key={i} style={{
            width: i === mobileSlide ? '18px' : '6px',
            height: '6px',
            borderRadius: '3px',
            background: i === mobileSlide ? '#38BDF8' : 'rgba(255,255,255,0.2)',
            transition: 'all 0.4s',
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
        @keyframes floatA {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-18px); }
        }
        @keyframes floatC {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-11px); }
        }
      `}</style>
    </section>
  );
}
