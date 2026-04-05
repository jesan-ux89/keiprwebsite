'use client';

import Link from 'next/link';
import {
  Calendar,
  Zap,
  BarChart3,
  TrendingUp,
  Landmark,
  Globe
} from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen text-primary">
      {/* Navigation */}
      <nav style={{ borderColor: 'var(--border-dark)' }} className="border-b sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-opacity-60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-electric flex items-center justify-center">
              <span className="brand-midnight font-bold text-sm">K</span>
            </div>
            <span className="text-xl font-bold">Keipr</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" style={{ color: 'var(--text-muted-dark)' }} className="hover:text-primary transition">
              Features
            </a>
            <a href="#pricing" style={{ color: 'var(--text-muted-dark)' }} className="hover:text-primary transition">
              Pricing
            </a>
            <Link
              href="/auth/signin"
              className="px-4 py-2 rounded-lg text-primary hover:opacity-75 transition"
              style={{ backgroundColor: 'var(--border-dark)' }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
            Budget Around Your Paychecks, <span className="brand-electric">Not the Calendar</span>
          </h1>
          <p style={{ color: 'var(--text-muted-dark)' }} className="text-xl max-w-2xl mx-auto leading-relaxed">
            Stop forcing your finances into calendar months. Keipr helps you plan around your pay cycles, split large bills across paychecks, and track every dollar with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link
              href="/auth/signup"
              className="px-8 py-3 rounded-lg bg-electric brand-midnight font-semibold hover:opacity-90 transition transform hover:scale-105 inline-block text-center"
            >
              Get Started Free
            </Link>
            <Link
              href="/app"
              style={{ borderColor: 'var(--border-dark)' }}
              className="px-8 py-3 rounded-lg border text-primary font-semibold hover:opacity-75 transition inline-block text-center"
            >
              Open Web App
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ borderColor: 'var(--border-dark)' }} className="py-20 md:py-32 px-4 border-t">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features Built for Paycheck Planning</h2>
            <p style={{ color: 'var(--text-muted-dark)' }} className="text-xl">Everything you need to master your finances around your pay cycles</p>
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
      <section id="pricing" style={{ borderColor: 'var(--border-dark)' }} className="py-20 md:py-32 px-4 border-t">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p style={{ color: 'var(--text-muted-dark)' }} className="text-xl">Choose the plan that fits your needs</p>
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
      <footer style={{ borderColor: 'var(--border-dark)' }} className="border-t py-8 px-4 mt-auto">
        <div className="max-w-7xl mx-auto text-center text-muted">
          <p>2026 Keipr. Paycheck-forward budgeting for everyone.</p>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ComponentType<{ size: number; className: string }>;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="card-base p-8 hover:border-electric transition group">
      <div className="w-12 h-12 rounded-lg bg-electric/10 flex items-center justify-center mb-4 group-hover:bg-electric/20 transition">
        <Icon className="brand-electric" size={24} />
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted">
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
    <div className="card-base p-8 flex flex-col" style={highlighted ? { borderColor: 'var(--electric)', borderWidth: '2px' } : {}}>
      {highlighted && (
        <div className="inline-block bg-electric brand-midnight text-sm font-semibold px-3 py-1 rounded-full mb-4 w-fit">
          Popular
        </div>
      )}
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <p className="text-muted mb-6">{subtitle}</p>
      <div className="mb-6">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-muted">
          /month
        </span>
      </div>
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-muted">
            <span className="brand-electric mt-1">•</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`w-full py-2 rounded-lg font-semibold transition text-center inline-block ${
          highlighted
            ? 'bg-electric brand-midnight hover:opacity-90'
            : 'border text-primary hover:opacity-75'
        }`}
        style={
          highlighted
            ? undefined
            : { borderColor: 'var(--border-dark)' }
        }
      >
        Get Started
      </Link>
    </div>
  );
}
