'use client';

import Link from 'next/link';
import { useState } from 'react';
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

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#FFFFFF', color: '#1A1814' }}>
      {/* ── BAR 1: Top Utility / Announcement Bar ── */}
      <div style={{ backgroundColor: '#0C4A6E' }} className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-center gap-2">
          <span className="text-xs sm:text-sm font-medium text-white/90 tracking-wide">
            Keipr is now on the web — budget smarter from any device
          </span>
          <Link href="/auth/signup" className="text-xs sm:text-sm font-semibold text-white underline underline-offset-2 hover:text-white/80 transition flex items-center gap-0.5">
            Get Started <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── BAR 2: Main Navigation (White / Clean) ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-black/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Logo */}
          <Link href="/" className="flex items-baseline gap-[2px] shrink-0">
            <span style={{ fontFamily: 'Georgia, serif' }} className="text-[26px] font-bold text-[#38BDF8]">k</span>
            <span className="text-[21px] font-light text-[#1A1814] tracking-[2px]">eipr</span>
          </Link>

          {/* Center: Nav Links (desktop) */}
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-medium text-[#1A1814]/55 hover:text-[#1A1814] tracking-wide transition">
              How It Works
            </a>
            <a href="#features" className="text-sm font-medium text-[#1A1814]/55 hover:text-[#1A1814] tracking-wide transition">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium text-[#1A1814]/55 hover:text-[#1A1814] tracking-wide transition">
              Pricing
            </a>
          </div>

          {/* Right: Actions + Store Buttons (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1A1814]/70 hover:text-[#1A1814] transition">
              Sign In
            </Link>

            {/* App Store Button */}
            <Link href="/coming-soon?platform=ios" className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1814] rounded-lg hover:bg-[#2A2724] transition">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div className="flex flex-col">
                <span className="text-[8px] text-white/70 leading-none">Download on the</span>
                <span className="text-[12px] font-semibold text-white leading-tight">App Store</span>
              </div>
            </Link>

            {/* Google Play Button */}
            <Link href="/coming-soon?platform=android" className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1814] rounded-lg hover:bg-[#2A2724] transition">
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
            className="md:hidden p-2 text-[#1A1814]/60"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-black/[0.08] bg-white px-4 pb-4">
            <div className="flex flex-col gap-1 pt-2">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm text-[#1A1814]/70 hover:text-[#1A1814] hover:bg-black/[0.03] rounded-lg transition">
                How It Works
              </a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm text-[#1A1814]/70 hover:text-[#1A1814] hover:bg-black/[0.03] rounded-lg transition">
                Features
              </a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm text-[#1A1814]/70 hover:text-[#1A1814] hover:bg-black/[0.03] rounded-lg transition">
                Pricing
              </a>
              <div className="border-t border-black/[0.06] mt-2 pt-3 flex flex-col gap-2">
                <Link href="/auth/login" className="px-4 py-3 text-sm text-[#1A1814]/80 hover:text-[#1A1814] rounded-lg transition text-center">
                  Sign In
                </Link>
                <div className="flex gap-2 justify-center pt-1">
                  <Link href="/coming-soon?platform=ios" className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1814] rounded-lg">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                    <div className="flex flex-col"><span className="text-[7px] text-white/70 leading-none">Download on the</span><span className="text-[11px] font-semibold text-white leading-tight">App Store</span></div>
                  </Link>
                  <Link href="/coming-soon?platform=android" className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1814] rounded-lg">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92z" fill="#4285F4"/><path d="M17.556 8.236L5.178.734C4.756.49 4.324.394 3.93.447l9.862 9.862 3.764-2.073z" fill="#EA4335"/><path d="M17.556 15.764l-3.764-2.073L3.93 23.553c.394.053.826-.043 1.248-.287l12.378-7.502z" fill="#34A853"/><path d="M20.778 12c0-.678-.378-1.28-.945-1.588l-2.277-1.376-4.014 2.214L14.792 12l-1.25.75 4.014 2.214 2.277-1.376c.567-.308.945-.91.945-1.588z" fill="#FBBC04"/></svg>
                    <div className="flex flex-col"><span className="text-[7px] text-white/70 leading-none">Get it on</span><span className="text-[11px] font-semibold text-white leading-tight">Google Play</span></div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20 md:py-32" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight" style={{ color: '#1A1814' }}>
            Budget Around Your Paychecks, <span style={{ color: '#38BDF8' }}>Not the Calendar</span>
          </h1>
          <p className="text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(26,24,20,0.55)' }}>
            Stop forcing your finances into calendar months. Keipr helps you plan around your pay cycles, split large bills across paychecks, and track every dollar with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link
              href="/auth/signup"
              className="px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition transform hover:scale-105 inline-block text-center"
              style={{ backgroundColor: '#38BDF8', color: '#0C4A6E' }}
            >
              Get Started Free
            </Link>
            <Link
              href="/app"
              className="px-8 py-3 rounded-lg border font-semibold hover:opacity-75 transition inline-block text-center"
              style={{ borderColor: 'rgba(26,24,20,0.15)', color: '#1A1814' }}
            >
              Open Web App
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 px-4 border-t" style={{ borderColor: 'rgba(26,24,20,0.06)', backgroundColor: '#F8F8F6' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#1A1814' }}>Powerful Features Built for Paycheck Planning</h2>
            <p className="text-xl" style={{ color: 'rgba(26,24,20,0.55)' }}>Everything you need to master your finances around your pay cycles</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <FeatureCard icon={Calendar} title="Paycheck-Forward Budgeting" description="Budget by your pay cycles, not calendar months. Align your bills with your paychecks for stress-free planning." />

            {/* Feature 2 */}
            <FeatureCard icon={Zap} title="Split Bills Across Paychecks" description="Break large bills into smaller payments across multiple paychecks. Never feel the pain of a big expense again." />

            {/* Feature 3 */}
            <FeatureCard icon={BarChart3} title="Bill Tracker" description="Track what's paid each paycheck cycle at a glance. Get instant visibility into your bill payment status." />

            {/* Feature 4 */}
            <FeatureCard icon={TrendingUp} title="Forward Planning" description="Plan months ahead with confidence. See how your income and bills align across future paychecks." />

            {/* Feature 5 */}
            <FeatureCard icon={Landmark} title="Connected Banking" description="Auto-match transactions to your bills with Plaid. Ultra tier feature for seamless banking integration." />

            {/* Feature 6 */}
            <FeatureCard icon={Globe} title="Multi-Currency Support" description="Work with 7 currencies: USD, EUR, GBP, CAD, AUD, MXN, JPY. Perfect for global users." />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 px-4 border-t" style={{ borderColor: 'rgba(26,24,20,0.06)', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#1A1814' }}>Simple, Transparent Pricing</h2>
            <p className="text-xl" style={{ color: 'rgba(26,24,20,0.55)' }}>Choose the plan that fits your needs</p>
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
      <footer className="border-t py-8 px-4 mt-auto" style={{ borderColor: 'rgba(26,24,20,0.06)', backgroundColor: '#F8F8F6' }}>
        <div className="max-w-7xl mx-auto text-center" style={{ color: 'rgba(26,24,20,0.45)' }}>
          <p>2026 Keipr. Paycheck-forward budgeting for everyone.</p>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ComponentType<{ size: number; className?: string; color?: string }>;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="p-8 rounded-xl border transition group hover:shadow-md" style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(26,24,20,0.08)' }}>
      <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition" style={{ backgroundColor: 'rgba(56,189,248,0.1)' }}>
        <Icon size={24} color="#0C4A6E" />
      </div>
      <h3 className="text-xl font-semibold mb-3" style={{ color: '#1A1814' }}>{title}</h3>
      <p style={{ color: 'rgba(26,24,20,0.55)' }}>
        {description}
      </p>
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
        borderColor: highlighted ? '#38BDF8' : 'rgba(26,24,20,0.08)',
        borderWidth: highlighted ? '2px' : '1px',
      }}
    >
      {highlighted && (
        <div className="inline-block text-sm font-semibold px-3 py-1 rounded-full mb-4 w-fit" style={{ backgroundColor: '#38BDF8', color: '#0C4A6E' }}>
          Popular
        </div>
      )}
      <h3 className="text-2xl font-bold mb-2" style={{ color: '#1A1814' }}>{name}</h3>
      <p className="mb-6" style={{ color: 'rgba(26,24,20,0.55)' }}>{subtitle}</p>
      <div className="mb-6">
        <span className="text-4xl font-bold" style={{ color: '#1A1814' }}>{price}</span>
        <span style={{ color: 'rgba(26,24,20,0.45)' }}>/month</span>
      </div>
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3" style={{ color: 'rgba(26,24,20,0.55)' }}>
            <span style={{ color: '#38BDF8' }} className="mt-1">•</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="w-full py-2 rounded-lg font-semibold transition text-center inline-block hover:opacity-90"
        style={
          highlighted
            ? { backgroundColor: '#38BDF8', color: '#0C4A6E' }
            : { border: '1px solid rgba(26,24,20,0.15)', color: '#1A1814' }
        }
      >
        Get Started
      </Link>
    </div>
  );
}
