'use client';

import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    subtitle: 'Get started with the basics',
    price: '$0',
    note: 'Free forever',
    features: [
      'Paycheck-forward dashboard',
      '1 income source',
      '1 bill split',
      '1 month of forward planning',
      'Bill tracker with progress ring',
      'Dark mode & multi-currency',
    ],
    footerNote: 'Requires manual expense entry',
    cta: 'Get Started',
    href: '/auth/signup',
  },
  {
    name: 'Pro',
    subtitle: 'Unlimited budgeting power',
    price: '$6.99',
    cadence: '/month',
    note: 'Billed annually ($83.88/yr) - save $12',
    features: [
      'Unlimited income sources',
      'Unlimited bill splits',
      'Unlimited forward month planning',
      'Paycheck cycle view',
      'One-time fund tracking',
      'Budget export (PDF & CSV)',
      'Spending trends & insights',
      'Priority support',
    ],
    plus: 'Plus everything in Free',
    footerNote: 'Requires manual expense entry',
    cta: 'Start Free Trial',
    href: '/auth/signup',
  },
  {
    name: 'Ultra',
    subtitle: 'Full automation with your bank',
    price: '$10.99',
    cadence: '/month',
    note: 'Billed annually ($131.88/yr) - save $12',
    features: [
      'Connected banking via Plaid',
      'Auto-detected recurring expenses',
      'Bank-verified bill payments',
      'Live account balances',
      'Full transaction history',
      'Spending velocity per paycheck',
      'Category spending breakdowns',
      'AI-powered budget optimization',
    ],
    plus: 'Plus everything in Pro',
    cta: 'Start Free Trial',
    href: '/auth/signup',
    featured: true,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="pricingBand">
      <div className="pageShell">
        <div className="pricingPanel">
          <h2>Simple, Transparent Pricing</h2>
          <p className="heroCopy">No hidden fees. Cancel anytime.</p>

          <div className="priceGrid">
            {plans.map((plan) => (
              <div key={plan.name} className={`priceCard${plan.featured ? ' featured' : ''}`}>
                {plan.featured && <div className="recommended">Recommended</div>}
                <div className="priceTop">
                  <h3 className="planName">{plan.name}</h3>
                  <p className="planFine">{plan.subtitle}</p>
                  <div className="price">{plan.price}{plan.cadence && <small>{plan.cadence}</small>}</div>
                  <p className="planFine">{plan.note}</p>
                </div>

                <div className="planList">
                  {plan.features.map((feature) => (
                    <span key={feature}>{feature}</span>
                  ))}
                </div>

                <div className="planFooter">
                  <div>
                    {plan.plus && (
                      <>
                        <div className="planDivider" />
                        <div className="planPlus">{plan.plus}</div>
                      </>
                    )}
                    {plan.footerNote && <p className="planFine"><em>{plan.footerNote}</em></p>}
                  </div>
                  <Link className={plan.featured ? 'solidBtn' : 'ghostBtn'} style={{ width: '100%' }} href={plan.href}>
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
