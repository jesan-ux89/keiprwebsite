'use client';

import Link from 'next/link';

export default function HeroSection() {
  return (
    <main className="pageShell">
      <section className="hero">
        <div className="story">
          <h1>Your paycheck has a <span>dashboard now.</span></h1>
          <p className="heroCopy">
            Every paycheck gets its own budget. Keipr calculates what&apos;s safe to spend in real time &mdash; after this check&apos;s bills and next check&apos;s bills are already set aside. No more guessing at end of month. See exactly what you have now and what&apos;s ahead. Your built-in AI accountant handles the rest.
          </p>
          <div className="heroActions">
            <Link className="solidBtn" href="/auth/signup">Start Budgeting Free</Link>
            <Link className="ghostBtn" href="/app">Open Web App</Link>
          </div>
          <div className="trustRow">
            <div className="trustPill">Bank sync with Plaid</div>
            <div className="trustPill">Optional AI cleanup</div>
            <div className="trustPill">No spreadsheet mode required</div>
          </div>
        </div>

        <div className="productStage">
          <div className="dashboardCard">
            <div className="cardTop">
              <span>Ultra Dashboard</span>
              <span>Updated just now</span>
            </div>
            <div className="availableCard">
              <div className="label">Available to spend</div>
              <div className="bigMoney">$1,327.90</div>
              <div className="smallLine"><span><i className="dot" />Checking balance</span><strong>$1,327.90</strong></div>
              <div className="smallLine"><span><i className="dot" style={{ background: 'var(--green)' }} />Available this check after bills</span><strong style={{ color: 'var(--green)' }}>$582.48</strong></div>
              <div className="smallLine"><span><i className="dot" style={{ background: 'var(--quiet)' }} />Available next check after bills</span><strong>$340</strong></div>
            </div>
            <div className="miniGrid">
              <div className="miniMetric"><span className="label">Income</span><b style={{ color: 'var(--green)' }}>$3,920</b></div>
              <div className="miniMetric"><span className="label">Bills</span><b style={{ color: 'var(--gold)' }}>$3,337</b></div>
              <div className="miniMetric"><span className="label">Spent</span><b style={{ color: 'var(--red)' }}>$226</b></div>
            </div>
          </div>

          <div className="floatingMatch">
            <div className="matchBadge">Bank match found</div>
            <div className="matchRows">
              <div className="matchRow">
                <div className="logoChip">
                  <img src="https://keipr-backend-production.up.railway.app/api/logos/netflix.com?v=2" alt="Netflix logo" />
                </div>
                <div className="matchCopy">
                  <strong>Netflix $24.99</strong>
                  <span>Matched to your Netflix bill</span>
                </div>
                <div className="matchStatus">Auto-verified</div>
              </div>

              <div className="matchRow">
                <div className="logoChip">
                  <img src="https://keipr-backend-production.up.railway.app/api/logos/spotify.com?v=2" alt="Spotify logo" />
                </div>
                <div className="matchCopy">
                  <strong>Spotify $10.99</strong>
                  <span>Matched to your Spotify bill</span>
                </div>
                <div className="matchStatus">Auto-verified</div>
              </div>

              <div className="matchRow">
                <div className="logoChip">
                  <img className="chaseLogo" src="/chase-logo.jpg" alt="Chase logo" />
                </div>
                <div className="matchCopy">
                  <strong>Mortgage $2,000</strong>
                  <span>Matched your bill split staging</span>
                </div>
                <div className="matchStatus">Auto-verified</div>
                <div className="splitStatus">
                  <span className="splitPill">$1,500<span>Paycheck 1</span></span>
                  <span className="splitPill">$500<span>Paycheck 2</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
