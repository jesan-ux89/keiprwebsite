'use client';

import Link from 'next/link';
import { useState } from 'react';

type BillingPeriod = 'monthly' | 'annual';

type PlanRate = { price: string; note: string };

type Plan = {
  name: string;
  subtitle: string;
  monthly: PlanRate;
  annual: PlanRate;
  cadence?: string;
  features: string[];
  plus?: string;
  footerNote?: string;
  cta: string;
  href: string;
  featured?: boolean;
};

const plans: Plan[] = [
  {
    name: 'Free',
    subtitle: 'Get started with the basics',
    monthly: { price: '$0', note: 'Free forever' },
    annual:  { price: '$0', note: 'Free forever' },
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
    monthly: { price: '$7.99', note: 'Billed monthly · Cancel anytime' },
    annual:  { price: '$6.99', note: 'Billed annually ($83.88/yr) · save $12' },
    cadence: '/month',
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
    monthly: { price: '$11.99', note: 'Billed monthly · Cancel anytime' },
    annual:  { price: '$10.99', note: 'Billed annually ($131.88/yr) · save $12' },
    cadence: '/month',
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
  const [period, setPeriod] = useState<BillingPeriod>('annual');

  return (
    <section id="pricing" className="pricingBand">
      <div className="pageShell">
        <div className="pricingPanel">
          <div className="pricingPanelHeader">
            <div className="pricingHeading">
              <h2>Simple, Transparent Pricing</h2>
              <p className="heroCopy">No hidden fees. Cancel anytime.</p>
            </div>
            <div className="billingToggle" role="tablist" aria-label="Billing period">
              <button
                type="button"
                role="tab"
                aria-selected={period === 'monthly'}
                className={`billingToggleBtn${period === 'monthly' ? ' active' : ''}`}
                onClick={() => setPeriod('monthly')}
              >
                Monthly
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={period === 'annual'}
                className={`billingToggleBtn${period === 'annual' ? ' active' : ''}`}
                onClick={() => setPeriod('annual')}
              >
                Annual <span className="billingSave">save $12</span>
              </button>
            </div>
          </div>

          <div className="priceGrid">
            {plans.map((plan) => {
              const rate = plan[period];
              return (
                <div key={plan.name} className={`priceCard${plan.featured ? ' featured' : ''}`}>
                  {plan.featured && <div className="recommended">Recommended</div>}
                  <div className="priceTop">
                    <h3 className="planName">{plan.name}</h3>
                    <p className="planFine">{plan.subtitle}</p>
                    <div className="price">
                      {rate.price}
                      {plan.cadence && <small>{plan.cadence}</small>}
                    </div>
                    <p className="planFine">{rate.note}</p>
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
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
