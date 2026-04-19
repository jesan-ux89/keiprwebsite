'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Menu, X, Mail } from 'lucide-react';

/* ── FAQ Data ── */
const FAQ_SECTIONS = [
  {
    title: 'Getting Started',
    questions: [
      {
        q: 'What is Keipr?',
        a: 'Keipr is a paycheck-first budgeting app. Instead of forcing your finances into calendar months, Keipr lets you budget around your actual pay cycles — so you always know exactly what\'s left after each payday. You can also view your budget by month or plan months into the future.',
      },
      {
        q: 'How do I get started?',
        a: 'Create a free account, set up your pay schedule (biweekly, weekly, twice monthly, or monthly), and add your expenses. Keipr automatically assigns each bill to the right paycheck based on its due date. You\'ll instantly see what\'s left after every payday.',
      },
      {
        q: 'Is Keipr available on my device?',
        a: 'Keipr is available as an Android app and a full web app at keipr.app. Your budget syncs across all devices — sign in with the same account and everything stays up to date. iOS is coming soon.',
      },
      {
        q: 'What pay frequencies are supported?',
        a: 'Keipr supports biweekly (every 2 weeks), weekly, twice monthly (1st and 15th), and monthly pay schedules. You can also track multiple income sources with different frequencies if you have a side gig or freelance work (Pro and Ultra).',
      },
      {
        q: 'What if I get paid biweekly?',
        a: 'Keipr was built for exactly this. Set biweekly as your pay frequency and your bills automatically sort into the right paycheck period. You can even split large bills like rent or mortgage across two paychecks so no single payday takes the hit.',
      },
    ],
  },
  {
    title: 'Pricing & Plans',
    questions: [
      {
        q: 'How much does Keipr cost?',
        a: 'Keipr has three tiers: Free ($0 forever), Pro ($7.99/mo or $6.99/mo billed annually), and Ultra ($11.99/mo or $10.99/mo billed annually). The Free tier includes everything you need to get started — Pro and Ultra unlock more powerful features as you grow.',
      },
      {
        q: 'What\'s included in the Free plan?',
        a: 'The Free plan includes paycheck and monthly dashboard views, bill entry with due-day alerts, dark/light theme, multi-currency support, 1 income source, 1 bill split, and 1 month of forward planning.',
      },
      {
        q: 'What does Pro add?',
        a: 'Pro removes all limits: unlimited income sources, unlimited bill splits, unlimited forward month planning, one-time fund tracking (tax refunds, bonuses), paycheck cycle view, spending trends & insights, and budget export to PDF & CSV.',
      },
      {
        q: 'What does Ultra add?',
        a: 'Ultra includes everything in Pro plus connected banking via Plaid — your bank transactions sync automatically, recurring expenses are auto-detected, bills are matched and verified from bank data, you get live account balances, full transaction history with merchant logos, spending velocity tracking, and AI-powered budget optimization.',
      },
      {
        q: 'Can I try before I buy?',
        a: 'Yes. The Free plan is fully functional with no time limit. When you\'re ready for more, upgrade to Pro or Ultra anytime from Settings. You can also start a 7-day free trial of Ultra when you connect your bank during onboarding.',
      },
      {
        q: 'What happens if I cancel my subscription?',
        a: 'Your data is preserved. You drop back to the Free tier and can still access your budget — you just lose access to Pro/Ultra features. Upgrade again anytime and everything is right where you left it.',
      },
    ],
  },
  {
    title: 'Features',
    questions: [
      {
        q: 'How does bill splitting work?',
        a: 'Toggle "Split across paychecks" when adding or editing a bill. Keipr splits the total across your paychecks — for example, a $2,000 mortgage can be split $1,200 from Paycheck 1 and $800 from Paycheck 2. You choose the amounts, and each split shows up in the correct paycheck on your Dashboard and Tracker. Free users get 1 split per bill; Pro and Ultra get unlimited.',
      },
      {
        q: 'What is Forward Planning?',
        a: 'Forward Planning lets you budget months ahead. The current month shows as "Live" with real income and expense data. Future months appear as "Drafts" so you can preview what\'s coming. Rollover balances carry forward automatically. Free users can plan 1 month ahead; Pro and Ultra get unlimited months.',
      },
      {
        q: 'What is the Tracker?',
        a: 'The Tracker is your paycheck-by-paycheck checklist. It shows every bill due in each pay period with a checkbox to mark it as paid. The summary at the top shows total bills, how many are paid, and how many are pending. For Ultra users, bills matched to bank transactions are auto-verified — no manual check-offs needed.',
      },
      {
        q: 'What currencies does Keipr support?',
        a: 'Keipr supports 7 currencies: USD, EUR, GBP, CAD, AUD, MXN, and JPY. You can change your currency anytime in Settings.',
      },
      {
        q: 'How does AI-powered budget optimization work?',
        a: 'Ultra subscribers get an AI-powered assistant that analyzes your transaction patterns to auto-confirm obvious recurring expenses, fix miscategorized transactions, assign bills to the right paychecks, and detect savings patterns. It runs automatically after you connect your bank and after new transactions sync. All AI processing uses redacted data (no personal identifiers are sent to the AI model), and you can review, undo, or override any change the AI makes. You can disable AI features entirely in Settings.',
      },
    ],
  },
  {
    title: 'Connected Banking & Security',
    questions: [
      {
        q: 'How does connected banking work?',
        a: 'Ultra users can connect their bank accounts through Plaid — the same secure service used by Venmo, Robinhood, and thousands of other apps. Once connected, Keipr automatically syncs your transactions, detects recurring expenses, matches bank payments to your bills, and shows live account balances.',
      },
      {
        q: 'Is my bank data safe?',
        a: 'Yes. Bank connections use Plaid\'s 256-bit encryption — Keipr never sees or stores your bank login credentials. Authentication is powered by Firebase with optional multi-factor authentication. All data is encrypted in transit (TLS) and at rest. You can disconnect your bank or delete your data at any time.',
      },
      {
        q: 'What banks are supported?',
        a: 'Plaid supports thousands of financial institutions across the US including Chase, Bank of America, Wells Fargo, Capital One, Citi, US Bank, PNC, and most credit unions. When you connect, you\'ll search for your institution by name.',
      },
      {
        q: 'Does Keipr sell my data?',
        a: 'No. Keipr does not sell, share, or monetize your financial data. Your data is used solely to provide the budgeting service. See our Privacy Policy for full details.',
      },
    ],
  },
  {
    title: 'Account & Billing',
    questions: [
      {
        q: 'How do I change my plan?',
        a: 'Go to Settings > Subscription to upgrade, downgrade, or manage your plan. Changes take effect immediately for upgrades and at the end of your current billing period for downgrades.',
      },
      {
        q: 'Can I export my data?',
        a: 'Yes. Pro and Ultra users can export their budget to PDF or CSV from the app. You can also request a full data export or deletion at any time through Settings or by contacting support.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Settings > Account > Delete Account. This permanently removes all your data including bills, income sources, payment history, and any connected bank data. This action cannot be undone.',
      },
      {
        q: 'How do I contact support?',
        a: 'Email us at contact@keipr.app. We typically respond within 24 hours.',
      },
    ],
  },
];

/* ── Accordion Item ── */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        borderBottom: '1px solid rgba(12,74,110,0.08)',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          gap: '16px',
        }}
      >
        <span style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0C1E2C', lineHeight: 1.4 }}>
          {question}
        </span>
        <span
          style={{
            flexShrink: 0,
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            color: '#0C4A6E',
          }}
        >
          <ChevronDown size={20} />
        </span>
      </button>
      <div
        style={{
          maxHeight: open ? '500px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, opacity 0.3s ease',
          opacity: open ? 1 : 0,
        }}
      >
        <p style={{
          fontSize: '0.95rem',
          lineHeight: 1.7,
          color: 'rgba(12,30,44,0.65)',
          paddingBottom: '20px',
          paddingRight: '40px',
        }}>
          {answer}
        </p>
      </div>
    </div>
  );
}

/* ── Main FAQ Page ── */
export default function FAQPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

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
            <Link href="/faq" className="text-sm font-medium text-white hover:text-white tracking-wide transition">FAQ</Link>
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
              <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm text-white hover:bg-white/[0.05] rounded-lg transition">FAQ</Link>
              <div className="border-t border-white/[0.08] mt-2 pt-3">
                <Link href="/auth/login" className="px-4 py-3 text-sm text-white/80 hover:text-white rounded-lg transition text-center block">Sign In</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="px-4 pt-16 pb-8 text-center" style={{ backgroundColor: '#EDF6FC' }}>
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#0C1E2C' }}>
          Frequently Asked Questions
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(12,30,44,0.6)' }}>
          Everything you need to know about Keipr. Can&apos;t find what you&apos;re looking for? Reach out to our team.
        </p>
      </section>

      {/* ── Category Pills ── */}
      <div className="px-4 pb-8">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-2">
          {FAQ_SECTIONS.map((section) => (
            <button
              key={section.title}
              onClick={() => {
                const el = document.getElementById(section.title.replace(/\s+/g, '-').toLowerCase());
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setActiveSection(section.title);
              }}
              style={{
                padding: '8px 18px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: activeSection === section.title ? '1px solid #0C4A6E' : '1px solid rgba(12,74,110,0.15)',
                backgroundColor: activeSection === section.title ? '#0C4A6E' : 'white',
                color: activeSection === section.title ? 'white' : '#0C4A6E',
              }}
            >
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {/* ── FAQ Sections ── */}
      <section className="px-4 pb-20 flex-1">
        <div className="max-w-3xl mx-auto">
          {FAQ_SECTIONS.map((section) => (
            <div key={section.title} id={section.title.replace(/\s+/g, '-').toLowerCase()} className="mb-12">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#0C4A6E' }}>
                {section.title}
              </h2>
              <div
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '4px 28px',
                  border: '1px solid rgba(12,74,110,0.08)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {section.questions.map((item) => (
                  <FAQItem key={item.q} question={item.q} answer={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Contact CTA ── */}
      <section className="px-4 pb-20">
        <div
          className="max-w-3xl mx-auto text-center"
          style={{
            background: 'white',
            borderRadius: '20px',
            padding: '48px 32px',
            border: '1px solid rgba(12,74,110,0.08)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: 'rgba(56,189,248,0.1)' }}
          >
            <Mail size={24} color="#0C4A6E" />
          </div>
          <h3 className="text-2xl font-bold mb-3" style={{ color: '#0C1E2C' }}>Still have questions?</h3>
          <p className="mb-6" style={{ color: 'rgba(12,30,44,0.6)', maxWidth: '460px', margin: '0 auto 24px' }}>
            We&apos;re here to help. Send us a message and we&apos;ll get back to you within 24 hours.
          </p>
          <a
            href="mailto:contact@keipr.app"
            className="inline-block px-8 py-3 rounded-lg font-semibold transition hover:opacity-90"
            style={{ backgroundColor: '#0C4A6E', color: 'white' }}
          >
            Contact Support
          </a>
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
