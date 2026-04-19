'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ChevronRight } from 'lucide-react';

export default function TermsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#EDF6FC', color: '#0C1E2C' }}>
      {/* ── Top Announcement Bar ── */}
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

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50" style={{ backgroundColor: '#1A1814' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-[2px] shrink-0">
            <span style={{ fontFamily: 'Georgia, serif' }} className="text-[36px] font-bold text-[#38BDF8]">k</span>
            <span className="text-[28px] font-light text-white tracking-[2px]">eipr</span>
          </Link>
          <div className="hidden md:flex items-center gap-10">
            <Link href="/#features" className="text-sm font-medium text-white/70 hover:text-white tracking-wide transition">Features</Link>
            <Link href="/#pricing" className="text-sm font-medium text-white/70 hover:text-white tracking-wide transition">Pricing</Link>
            <Link href="/faq" className="text-sm font-medium text-white/70 hover:text-white tracking-wide transition">FAQ</Link>
            <Link href="/auth/login" className="text-sm font-medium text-white/70 hover:text-white tracking-wide transition">Sign In</Link>
          </div>
          <button className="md:hidden p-2 text-white/60" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/[0.08] px-4 pb-4" style={{ backgroundColor: '#1A1814' }}>
            <div className="flex flex-col gap-1 pt-2">
              <Link href="/#features" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/[0.05] rounded-lg transition">Features</Link>
              <Link href="/#pricing" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/[0.05] rounded-lg transition">Pricing</Link>
              <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/[0.05] rounded-lg transition">FAQ</Link>
              <div className="border-t border-white/[0.08] mt-2 pt-3">
                <Link href="/auth/login" className="px-4 py-3 text-sm text-white/80 hover:text-white rounded-lg transition text-center block">Sign In</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Content ── */}
      <section className="px-4 py-16 flex-1">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-2" style={{ color: '#0C1E2C' }}>
            Terms of Service
          </h1>
          <p className="mb-10" style={{ color: 'rgba(12,30,44,0.45)', fontSize: '0.9rem' }}>
            Effective Date: April 18, 2026 &middot; Last Updated: April 18, 2026
          </p>

          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '40px 36px',
              border: '1px solid rgba(12,74,110,0.08)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              lineHeight: 1.8,
              fontSize: '0.95rem',
              color: 'rgba(12,30,44,0.75)',
            }}
          >
            <p className="mb-6">
              Welcome to Keipr. These Terms of Service (&quot;Terms&quot;) govern your use of the Keipr mobile application, web application at keipr.app, and related services (collectively, the &quot;Service&quot;) operated by Keipr (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
            </p>
            <p className="mb-8">
              By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the Service.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>1. Eligibility</h2>
            <p className="mb-6">
              You must be at least 18 years old to use Keipr. By using the Service, you represent that you meet this requirement and have the legal capacity to enter into these Terms.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>2. Your Account</h2>
            <p className="mb-6">
              You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You agree to provide accurate, current information during registration and to update it as necessary. You must notify us immediately at contact@keipr.app if you suspect unauthorized access to your account.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>3. The Service</h2>
            <p className="mb-4">
              Keipr is a personal budgeting tool that helps you organize expenses around your pay cycles. Certain features (available to Ultra subscribers) use AI-powered analysis to categorize transactions and optimize bill assignments — see our <Link href="/privacy" style={{ color: '#0C4A6E', textDecoration: 'underline' }}>Privacy Policy</Link> for details on how this data is processed. The Service is provided &quot;as is&quot; and is intended for personal, informational use only.
            </p>
            <p className="mb-6">
              <strong style={{ color: '#0C1E2C' }}>Keipr is not a financial advisor, bank, or money transmitter.</strong> We do not provide financial, investment, tax, or legal advice. Any figures, projections, or summaries shown in the app are estimates based on data you provide and should not be relied upon as financial guidance. Always consult a qualified professional for financial decisions.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>4. Subscriptions & Payments</h2>
            <p className="mb-4">
              Keipr offers Free, Pro, and Ultra subscription tiers. Paid subscriptions are billed through our payment processor, Lemon Squeezy, on a monthly or annual basis. Prices are displayed in the app and on our website.
            </p>
            <p className="mb-4">
              Subscriptions renew automatically unless you cancel before the end of the current billing period. You can cancel anytime from Settings &gt; Subscription. Upon cancellation, you retain access to your paid tier until the end of the billing period, then revert to the Free tier.
            </p>
            <p className="mb-6">
              We reserve the right to change pricing with 30 days&apos; notice. Price changes do not affect your current billing period.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>5. Connected Banking (Ultra)</h2>
            <p className="mb-4">
              Ultra subscribers may connect bank accounts through Plaid, Inc., a third-party service provider. By connecting your bank, you authorize Plaid to access your financial data on your behalf and share it with Keipr for the purposes described in our <Link href="/privacy" style={{ color: '#0C4A6E', textDecoration: 'underline' }}>Privacy Policy</Link>.
            </p>
            <p className="mb-6">
              Keipr never receives or stores your bank login credentials. Your use of Plaid is also subject to <a href="https://plaid.com/legal/" target="_blank" rel="noopener noreferrer" style={{ color: '#0C4A6E', textDecoration: 'underline' }}>Plaid&apos;s End User Privacy Policy</a>.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>6. Acceptable Use</h2>
            <p className="mb-4">You agree not to:</p>
            <p className="mb-6" style={{ paddingLeft: '20px' }}>
              Use the Service for any illegal purpose or in violation of any applicable law; attempt to gain unauthorized access to the Service, other accounts, or our systems; reverse-engineer, decompile, or disassemble any part of the Service; use automated means (bots, scrapers) to access the Service; or interfere with the Service&apos;s operation or other users&apos; experience.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>7. Intellectual Property</h2>
            <p className="mb-6">
              All content, features, and functionality of the Service — including text, graphics, logos, icons, and software — are owned by Keipr and protected by applicable intellectual property laws. You may not copy, modify, distribute, or create derivative works without our written permission. Your budget data remains yours; we claim no ownership of the financial information you enter.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>8. Data & Privacy</h2>
            <p className="mb-6">
              Your privacy is important to us. Our collection and use of personal information is described in our <Link href="/privacy" style={{ color: '#0C4A6E', textDecoration: 'underline' }}>Privacy Policy</Link>, which is incorporated into these Terms by reference. By using the Service, you consent to the data practices described in that policy.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>9. Disclaimers</h2>
            <p className="mb-4">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="mb-6">
              We do not guarantee that the Service will be uninterrupted, error-free, or secure. Account balances, transaction data, and budget calculations may contain inaccuracies or delays, particularly when sourced from third-party providers like Plaid. You should verify all financial information independently.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>10. Limitation of Liability</h2>
            <p className="mb-6">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, KEIPR SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM RELATED TO THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>11. Termination</h2>
            <p className="mb-6">
              We may suspend or terminate your access to the Service at any time for violation of these Terms or for any reason with reasonable notice. You may delete your account at any time through Settings. Upon termination, your right to use the Service ceases, though provisions that by their nature should survive (such as liability limitations and intellectual property rights) will remain in effect.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>12. Changes to These Terms</h2>
            <p className="mb-6">
              We may update these Terms from time to time. If we make material changes, we will notify you by email or through the Service at least 30 days before the changes take effect. Your continued use of the Service after the effective date constitutes acceptance of the updated Terms.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>13. Governing Law</h2>
            <p className="mb-6">
              These Terms are governed by the laws of the State of New Jersey, United States, without regard to conflict-of-law principles. Any disputes arising from these Terms or the Service shall be resolved in the state or federal courts located in New Jersey.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>14. Contact Us</h2>
            <p>
              If you have questions about these Terms, contact us at <a href="mailto:contact@keipr.app" style={{ color: '#0C4A6E', textDecoration: 'underline' }}>contact@keipr.app</a>.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
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
    </div>
  );
}
