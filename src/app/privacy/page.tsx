'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ChevronRight } from 'lucide-react';

export default function PrivacyPage() {
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
            Privacy Policy
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
              Keipr (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and share your information when you use the Keipr mobile app, web app at keipr.app, and related services (the &quot;Service&quot;).
            </p>
            <p className="mb-8">
              By using the Service, you consent to the data practices described in this policy. If you do not agree, please do not use the Service.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>1. Information We Collect</h2>

            <h3 className="text-lg font-semibold mb-2 mt-4" style={{ color: '#0C4A6E' }}>Information You Provide</h3>
            <p className="mb-4">
              When you create an account, we collect your email address and display name. When you use the Service, we store the financial information you enter: income sources, bills, expense amounts, due dates, payment records, categories, and budget preferences. This data is necessary to provide the budgeting service.
            </p>

            <h3 className="text-lg font-semibold mb-2 mt-4" style={{ color: '#0C4A6E' }}>Information from Connected Banks (Ultra)</h3>
            <p className="mb-4">
              If you connect a bank account, we receive transaction data, account balances, and account metadata through Plaid, Inc. This includes transaction amounts, dates, merchant names, and Plaid-assigned categories. We <strong style={{ color: '#0C1E2C' }}>never</strong> receive or store your bank login credentials — Plaid handles authentication directly with your bank using 256-bit encryption.
            </p>

            <h3 className="text-lg font-semibold mb-2 mt-4" style={{ color: '#0C4A6E' }}>Information Collected Automatically</h3>
            <p className="mb-6">
              We collect basic usage data to maintain and improve the Service, including: device type, operating system, app version, and crash reports. We use Firebase Authentication for account management, which may collect authentication-related metadata (login timestamps, authentication method). We do not use third-party advertising trackers or sell data to advertisers.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>2. How We Use Your Information</h2>
            <p className="mb-4">We use your information to:</p>
            <p className="mb-6" style={{ paddingLeft: '20px' }}>
              Provide and operate the budgeting Service; sync and display your financial data across devices; detect recurring expenses and match transactions to bills (Ultra); send you notifications about detected expenses, payment reminders, and account activity; process subscription payments through Lemon Squeezy; respond to support requests; and improve the Service based on aggregate usage patterns.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>3. How We Store and Protect Your Data</h2>
            <p className="mb-4">
              Your data is stored in a PostgreSQL database hosted by Supabase with encryption at rest. All data transmitted between your device and our servers uses TLS (Transport Layer Security) encryption. Bank connections are secured through Plaid&apos;s infrastructure with 256-bit encryption.
            </p>
            <p className="mb-6">
              Authentication is provided by Firebase with support for multi-factor authentication (MFA). We implement rate limiting, input validation, and access controls to protect against unauthorized access.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>4. Third-Party Services</h2>
            <p className="mb-4">We use the following third-party services to operate Keipr:</p>
            <p className="mb-6" style={{ paddingLeft: '20px' }}>
              <strong style={{ color: '#0C1E2C' }}>Plaid, Inc.</strong> — Bank account connections, transaction syncing, and balance retrieval for Ultra subscribers. Plaid&apos;s privacy policy: <a href="https://plaid.com/legal/" target="_blank" rel="noopener noreferrer" style={{ color: '#0C4A6E', textDecoration: 'underline' }}>plaid.com/legal</a>.
              <br /><br />
              <strong style={{ color: '#0C1E2C' }}>Firebase (Google)</strong> — Authentication and user account management. Firebase&apos;s privacy policy: <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#0C4A6E', textDecoration: 'underline' }}>firebase.google.com/support/privacy</a>.
              <br /><br />
              <strong style={{ color: '#0C1E2C' }}>Supabase</strong> — Database hosting and storage. Supabase&apos;s privacy policy: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#0C4A6E', textDecoration: 'underline' }}>supabase.com/privacy</a>.
              <br /><br />
              <strong style={{ color: '#0C1E2C' }}>Lemon Squeezy</strong> — Subscription billing and payment processing. Lemon Squeezy acts as our merchant of record. Their privacy policy: <a href="https://www.lemonsqueezy.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#0C4A6E', textDecoration: 'underline' }}>lemonsqueezy.com/privacy</a>.
              <br /><br />
              <strong style={{ color: '#0C1E2C' }}>Resend</strong> — Transactional emails (MFA codes, notifications). Resend&apos;s privacy policy: <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#0C4A6E', textDecoration: 'underline' }}>resend.com/legal/privacy-policy</a>.
              <br /><br />
              <strong style={{ color: '#0C1E2C' }}>Railway</strong> — Backend server hosting. Railway&apos;s privacy policy: <a href="https://railway.app/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#0C4A6E', textDecoration: 'underline' }}>railway.app/legal/privacy</a>.
              <br /><br />
              <strong style={{ color: '#0C1E2C' }}>Vercel</strong> — Website hosting. Vercel&apos;s privacy policy: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#0C4A6E', textDecoration: 'underline' }}>vercel.com/legal/privacy-policy</a>.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>5. Data Sharing</h2>
            <p className="mb-4">
              <strong style={{ color: '#0C1E2C' }}>We do not sell your personal or financial data.</strong> We do not share your data with advertisers or data brokers.
            </p>
            <p className="mb-6">
              We may share data only in the following circumstances: with the third-party service providers listed above, solely to operate the Service; if required by law, regulation, or legal process; to protect the rights, safety, or property of Keipr, our users, or the public; or in connection with a merger, acquisition, or sale of assets (in which case you would be notified).
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>6. Your Rights and Choices</h2>
            <p className="mb-4">You have the right to:</p>
            <p className="mb-6" style={{ paddingLeft: '20px' }}>
              <strong style={{ color: '#0C1E2C' }}>Access your data</strong> — Export your budget data to PDF or CSV (Pro/Ultra), or request a full data export by contacting us.
              <br /><br />
              <strong style={{ color: '#0C1E2C' }}>Correct your data</strong> — Edit your bills, income, and profile information at any time through the app.
              <br /><br />
              <strong style={{ color: '#0C1E2C' }}>Delete your data</strong> — Delete your account through Settings, which permanently removes all your data. You can also disconnect bank accounts at any time.
              <br /><br />
              <strong style={{ color: '#0C1E2C' }}>Opt out of emails</strong> — Adjust notification preferences in Settings to control what emails you receive. You can set notifications to real-time, daily, weekly, or off.
              <br /><br />
              <strong style={{ color: '#0C1E2C' }}>Disconnect your bank</strong> — Remove bank connections at any time from Settings. This revokes Plaid&apos;s access to your bank data.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>7. Data Retention</h2>
            <p className="mb-6">
              We retain your data for as long as your account is active. If you delete your account, we permanently delete all associated data — including bills, income sources, payment history, bank connections, and transaction data — within 30 days. Anonymized, aggregated data (which cannot identify you) may be retained for analytics purposes.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>8. Children&apos;s Privacy</h2>
            <p className="mb-6">
              Keipr is not intended for use by anyone under the age of 18. We do not knowingly collect personal information from children. If we learn that we have collected data from a child under 18, we will delete it promptly. If you believe a child has provided us with personal information, please contact us at contact@keipr.app.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>9. California Residents (CCPA)</h2>
            <p className="mb-6">
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect, the right to request deletion, and the right to opt out of the &quot;sale&quot; of personal information. We do not sell personal information. To exercise your rights, contact us at contact@keipr.app.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>10. International Users</h2>
            <p className="mb-6">
              Keipr is operated from the United States. If you access the Service from outside the US, your data may be transferred to and processed in the United States, where data protection laws may differ from your jurisdiction. By using the Service, you consent to this transfer.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>11. Changes to This Policy</h2>
            <p className="mb-6">
              We may update this Privacy Policy from time to time. If we make material changes, we will notify you by email or through the Service at least 30 days before the changes take effect. Your continued use of the Service after the effective date constitutes acceptance of the updated policy.
            </p>

            <h2 className="text-xl font-bold mb-3 mt-8" style={{ color: '#0C1E2C' }}>12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or your data, contact us at <a href="mailto:contact@keipr.app" style={{ color: '#0C4A6E', textDecoration: 'underline' }}>contact@keipr.app</a>.
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
