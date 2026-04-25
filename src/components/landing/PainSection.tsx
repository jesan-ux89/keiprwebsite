'use client';

export default function PainSection() {
  return (
    <section id="story" className="section paycheckStory">
      <div className="pageShell">
        <div className="sectionHead">
          <h2>Budgeting apps assume you get paid on the 1st. <span>You probably don&apos;t.</span></h2>
          <p>
            Most people get paid biweekly, weekly, or twice a month &mdash; but every budgeting tool forces you into a calendar-month view. Bills don&apos;t line up. Money feels tight one week, fine the next. You&apos;re always guessing. Keipr flips the model: <strong>your budget starts when your paycheck lands.</strong>
          </p>
        </div>

        <div className="flowGrid">
          <div className="flowCard green">
            <div className="flowTitle"><span className="num">1</span>You got paid</div>
            <div className="label">Paycheck 1 - Apr 10</div>
            <div className="flowMoney">+$2,847</div>
            <div className="metricLine"><span>Before</span><strong>$1,243</strong></div>
            <div className="metricLine"><span>After</span><strong style={{ color: 'var(--green)' }}>$4,090</strong></div>
          </div>

          <div className="flowCard green">
            <div className="flowTitle"><span className="num">2</span>Bills mapped</div>
            <div className="metricLine"><span>Rent</span><strong>$850</strong></div>
            <div className="metricLine"><span>Car payment</span><strong>$287</strong></div>
            <div className="metricLine"><span>Electric</span><strong>$145</strong></div>
            <div className="metricLine"><span>Internet</span><strong>$89</strong></div>
          </div>

          <div className="flowCard gold">
            <div className="flowTitle"><span className="num">3</span>Split it</div>
            <h3 style={{ margin: '0 0 14px', fontSize: '24px' }}>Mortgage - $2,000</h3>
            <div className="metricLine"><span>Check 1</span><strong style={{ color: 'var(--green)' }}>$1,200</strong></div>
            <div className="metricLine"><span>Check 2</span><strong style={{ color: 'var(--gold)' }}>$800</strong></div>
            <div className="progress"><i style={{ width: '72%' }} /></div>
          </div>

          <div className="flowCard">
            <div className="flowTitle"><span className="num">4</span>Plan ahead</div>
            <div className="metricLine"><span>May 2026</span><strong style={{ color: 'var(--blue)' }}>75%</strong></div>
            <div className="progress"><i style={{ width: '75%', background: 'var(--blue)' }} /></div>
            <div className="metricLine" style={{ marginTop: '16px' }}><span>June 2026</span><strong style={{ color: 'var(--blue)' }}>30%</strong></div>
            <div className="progress"><i style={{ width: '30%', background: 'var(--blue)' }} /></div>
          </div>
        </div>
      </div>
    </section>
  );
}
