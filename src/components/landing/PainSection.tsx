'use client';

import { useCallback, useState, type ReactNode } from 'react';

type StepId = '1' | '2' | '3' | '4';
type StepColor = 'green' | 'blue' | 'gold' | 'teal';

type StepConfig = {
  id: StepId;
  color: StepColor;
  railTitle: string;
  railSub: string;
  title: string;
  body: ReactNode;
};

const STEPS: StepConfig[] = [
  {
    id: '1',
    color: 'green',
    railTitle: 'Paycheck lands',
    railSub: 'Keipr opens the right cycle',
    title: 'Your money starts here.',
    body: (
      <>
        A paycheck creates a working cycle. Keipr opens the right window so you see what{' '}
        <em>this check</em> needs to cover before the next one arrives.
      </>
    ),
  },
  {
    id: '2',
    color: 'blue',
    railTitle: 'Bills claim their share',
    railSub: 'This check and next check stay separate',
    title: 'Each bill, the right paycheck.',
    body: (
      <>
        Rent, subscriptions, loans, utilities, and card payments land in the paycheck that pays
        them &mdash; this check stays separate from next check.
      </>
    ),
  },
  {
    id: '3',
    color: 'gold',
    railTitle: 'Big bills get staged',
    railSub: 'Real split behavior replaces guesswork',
    title: 'Splits use real behavior.',
    body: (
      <>
        Mortgage and loan patterns split using your actual transfer behavior. Real split staging
        instead of fake equal halves.
      </>
    ),
  },
  {
    id: '4',
    color: 'teal',
    railTitle: 'What is left is safe',
    railSub: 'Your Available number updates',
    title: 'One number, after everything.',
    body: (
      <>
        The Available number updates the moment a bill is claimed, a split is staged, or a deposit
        lands. No mental math, no spreadsheet reconciliation.
      </>
    ),
  },
];

function CoreFlowDemo() {
  const [activeId, setActiveId] = useState<StepId>('1');

  const handleStepClick = useCallback((id: StepId) => {
    setActiveId(id);
  }, []);

  const activeStep = STEPS.find((s) => s.id === activeId) ?? STEPS[0];

  return (
    <div className="demoWrap">
      {/* JOURNEY RAIL — now the interactive tabs */}
      <div className="journeyRail" role="tablist" aria-label="Keipr paycheck budgeting flow">
        {STEPS.map((step) => {
          const isActive = step.id === activeId;
          // Step 2 has no color modifier (default blue); all others get their color class
          const colorClass = step.color === 'blue' ? '' : ` ${step.color}`;
          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`journeyStep${colorClass}${isActive ? ' active' : ''}`}
              onClick={() => handleStepClick(step.id)}
            >
              <span>{step.id}</span>
              <strong>{step.railTitle}</strong>
              <small>{step.railSub}</small>
            </button>
          );
        })}
      </div>

      {/* DEMO PANEL — driven by the rail above */}
      <div className="demoPanel">
        <div className="demoStage">
          <div className="demoCopy">
            <h3>{activeStep.title}</h3>
            <p>{activeStep.body}</p>
          </div>

          <div className="demoMockSlot">
            <div className={`demoMock${activeId === '1' ? ' active' : ''}`} aria-hidden={activeId !== '1'}>
              <div className="paycheckMock">
                <div className="mockTop">
                  <span>Paycheck 2</span>
                  <strong>Apr 18 &ndash; May 1</strong>
                </div>
                <div className="mockDeposit">+$2,847</div>
                <div className="mockSplitLine"><span>Before deposit</span><strong>$1,243</strong></div>
                <div className="mockSplitLine"><span>After deposit</span><strong className="greenText">$4,090</strong></div>
              </div>
            </div>

            <div className={`demoMock${activeId === '2' ? ' active' : ''}`} aria-hidden={activeId !== '2'}>
              <div className="billStack">
                <div><span>Capital One Auto</span><strong>$545.54</strong></div>
                <div><span>OpenAI</span><strong>$21.31</strong></div>
                <div><span>FirstEnergy</span><strong>$145.20</strong></div>
                <div className="nextCheck"><span>Next check already reserved</span><strong>$340</strong></div>
              </div>
            </div>

            <div className={`demoMock${activeId === '3' ? ' active' : ''}`} aria-hidden={activeId !== '3'}>
              <div className="splitMock">
                <div className="splitHeader">
                  <span>Mortgage</span>
                  <strong>$2,000</strong>
                </div>
                <div className="splitPills">
                  <div><strong>$1,500</strong><span>Paycheck 1</span></div>
                  <div><strong>$500</strong><span>Paycheck 2</span></div>
                </div>
                <div className="splitBar"><i /></div>
              </div>
            </div>

            <div className={`demoMock${activeId === '4' ? ' active' : ''}`} aria-hidden={activeId !== '4'}>
              <div className="availableStoryCard">
                <div className="label">Available to spend</div>
                <div className="storyMoney">$1,327.90</div>
                <div className="mockSplitLine"><span>This check after bills</span><strong className="greenText">$582.48</strong></div>
                <div className="mockSplitLine"><span>Next check after bills</span><strong>$340</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PainSection() {
  return (
    <section id="story" className="section howWorksPage">
      <div className="pageShell">

        {/* HERO */}
        <div className="howHero">
          <div>
            <p className="storyEyebrow">How Keipr works</p>
            <h1>
              See what each paycheck can actually cover.
              <span>Then plan the month ahead.</span>
            </h1>
          </div>
          <p>
            Keipr keeps paycheck cycles and monthly overviews connected. Bills, splits, and future
            months all roll into one number: <strong>what is safe to spend now.</strong>
          </p>
        </div>

        {/* INTERACTIVE DEMO (rail tabs + mock) */}
        <CoreFlowDemo />

        {/* TIER STRIP (slim) */}
        <div className="tierBlock">
          <p className="tierIntro">
            The flow above runs on <strong>every Keipr account</strong>. Pick how much you want it
            to do for you.
          </p>

          <div className="tierGrid">
            <article className="tierCard free">
              <span className="tierBadge">Free &middot; no bank needed</span>
              <h3 className="tierName">Manual + simple.</h3>
              <p className="tierPrice"><strong>$0</strong> &middot; forever</p>
              <ul className="tierFeatures">
                <li>The full 4-step flow</li>
                <li>1 income source, 1 split bill</li>
                <li>This month&rsquo;s view</li>
              </ul>
            </article>

            <article className="tierCard pro">
              <span className="tierBadge">Pro &middot; still no bank needed</span>
              <h3 className="tierName">Plan months ahead.</h3>
              <p className="tierPrice"><strong>$7.99</strong>/mo &middot; $6.99/mo annual</p>
              <ul className="tierFeatures">
                <li>Unlimited income &amp; splits</li>
                <li>Forward planning + windfalls</li>
                <li>Trends &amp; CSV export</li>
              </ul>
            </article>

            <article className="tierCard ultra featured">
              <span className="tierBadge featuredBadge">Ultra &middot; bank-connected</span>
              <h3 className="tierName">Bank does the work.</h3>
              <p className="tierPrice"><strong>$11.99</strong>/mo &middot; $10.99/mo annual</p>
              <ul className="tierFeatures">
                <li>Everything in Pro</li>
                <li>Auto-match &amp; auto-verify</li>
                <li>AI Accountant cleanup</li>
              </ul>
            </article>
          </div>
        </div>

      </div>
    </section>
  );
}
