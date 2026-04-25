'use client';

import { useState } from 'react';
import LandingStyles from '@/components/landing/LandingStyles';
import LandingNav from '@/components/landing/LandingNav';
import FooterSection from '@/components/landing/FooterSection';

type QA = { q: string; a: string };
type FaqSection = { title: string; questions: QA[] };

const FAQ_SECTIONS: FaqSection[] = [
  {
    title: 'Getting Started',
    questions: [
      {
        q: 'What is Keipr?',
        a: "Keipr is a paycheck-first budgeting app. Instead of forcing your finances into calendar months, Keipr lets you budget around your actual pay cycles — so you always know exactly what's left after each payday. You can also view your budget by month or plan months into the future.",
      },
      {
        q: 'How do I get started?',
        a: "Create a free account, set up your pay schedule (biweekly, weekly, twice monthly, or monthly), and add your expenses. Keipr automatically assigns each bill to the right paycheck based on its due date. You'll instantly see what's left after every payday.",
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
        q: "What's included in the Free plan?",
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
        a: "Yes. The Free plan is fully functional with no time limit. When you're ready for more, upgrade to Pro or Ultra anytime from Settings. You can also start a 7-day free trial of Ultra when you connect your bank during onboarding.",
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
        a: 'Toggle "Split across paychecks" when adding or editing a bill. Keipr splits the total across your paychecks — for example, a $2,000 mortgage can be split $1,500 from Paycheck 1 and $500 from Paycheck 2. You choose the amounts, and each split shows up in the correct paycheck on your Dashboard and Tracker. Free users get 1 split per bill; Pro and Ultra get unlimited.',
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
        a: "Yes. Bank connections use Plaid's 256-bit encryption — Keipr never sees or stores your bank login credentials. Authentication is powered by Firebase with optional multi-factor authentication. All data is encrypted in transit (TLS) and at rest. You can disconnect your bank or delete your data at any time.",
      },
      {
        q: 'What banks are supported?',
        a: "Plaid supports thousands of financial institutions across the US including Chase, Bank of America, Wells Fargo, Capital One, Citi, US Bank, PNC, and most credit unions. When you connect, you'll search for your institution by name.",
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

const slugFor = (title: string) => title.replace(/\s+/g, '-').toLowerCase();

function FAQItem({ q, a }: QA) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faqItem${open ? ' open' : ''}`}>
      <button
        type="button"
        className="faqQ"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <svg className="faqChevron" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M5 7.5l5 5 5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </button>
      {open && (
        <div className="faqA">
          <p>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handlePillClick = (title: string) => {
    const id = slugFor(title);
    if (typeof document !== 'undefined') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActiveSection(title);
  };

  return (
    <div className="landingRoot">
      <LandingStyles />
      <LandingNav />

      <section id="faq" className="section faqPage">
        <div className="pageShell">

          {/* HERO */}
          <div className="howHero">
            <p className="storyEyebrow">Help &amp; answers</p>
            <h1>
              Frequently asked questions.
              <span>Everything you need to know.</span>
            </h1>
          </div>

          {/* CATEGORY PILLS */}
          <div className="faqPills" role="tablist" aria-label="FAQ categories">
            {FAQ_SECTIONS.map((section) => {
              const isActive = activeSection === section.title;
              return (
                <button
                  key={section.title}
                  type="button"
                  className={`faqPill${isActive ? ' active' : ''}`}
                  onClick={() => handlePillClick(section.title)}
                >
                  {section.title}
                </button>
              );
            })}
          </div>

          {/* SECTIONS */}
          <div className="faqContent">
            {FAQ_SECTIONS.map((section) => (
              <div key={section.title} id={slugFor(section.title)} className="faqSection">
                <h2 className="faqSectionTitle">{section.title}</h2>
                <div className="faqGroup">
                  {section.questions.map((item) => (
                    <FAQItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CONTACT CTA */}
          <div className="faqContact">
            <h3>Still have questions?</h3>
            <p>
              We&rsquo;re here to help. Send us a message and we&rsquo;ll get back within 24 hours.
            </p>
            <a href="mailto:contact@keipr.app" className="solidBtn">Contact support</a>
          </div>

        </div>
      </section>

      <FooterSection />
    </div>
  );
}
