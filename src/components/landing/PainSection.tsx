'use client';

type MatchRow = {
  name: string;
  amount: string;
  logoText: string;
  logoClass: string;
};

const matchRows: MatchRow[] = [
  { name: 'Netflix',  amount: '$24.99', logoText: 'N', logoClass: 'netflix' },
  { name: 'Spotify',  amount: '$10.99', logoText: 'S', logoClass: 'spotify' },
  { name: 'Mortgage', amount: '$2,000', logoText: 'C', logoClass: 'chase' },
];

export default function PainSection() {
  return (
    <section id="story" className="section howWorksPage">
      <div className="pageShell">

        {/* ============ HERO (kept) ============ */}
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

        {/* ============ JOURNEY RAIL 1-4 (kept) ============ */}
        <div className="journeyRail" aria-label="Keipr paycheck budgeting flow">
          <div className="journeyStep green">
            <span>1</span>
            <strong>Paycheck lands</strong>
            <small>Keipr opens the right cycle</small>
          </div>
          <div className="journeyStep">
            <span>2</span>
            <strong>Bills claim their share</strong>
            <small>This check and next check stay separate</small>
          </div>
          <div className="journeyStep gold">
            <span>3</span>
            <strong>Big bills get staged</strong>
            <small>Real split behavior replaces guesswork</small>
          </div>
          <div className="journeyStep teal">
            <span>4</span>
            <strong>What is left is safe</strong>
            <small>Your Available number updates</small>
          </div>
        </div>

        {/* ============ Section: Core flow expanded ============ */}
        <div className="sectionHeader">
          <h2>The four steps, <em>up close</em>.</h2>
          <p>
            These run on <strong>every</strong> Keipr account &mdash; Free, Pro, or Ultra. No bank
            connection required. The math behind the Available number is the same whether you type
            your bills in by hand or let Keipr detect them automatically.
          </p>
        </div>

        <div className="coreGrid">

          {/* Step 1 */}
          <article className="coreCard">
            <span className="stepBadge green"><i>1</i> Paycheck cycle</span>
            <h3>Keipr starts where your money starts.</h3>
            <p>
              A paycheck creates a working cycle. Instead of asking whether April is on track, Keipr
              asks what <em>this paycheck</em> needs to cover before the next one arrives.
            </p>
            <div className="paycheckMock">
              <div className="mockTop">
                <span>Paycheck 2</span>
                <strong>Apr 18 &ndash; May 1</strong>
              </div>
              <div className="mockDeposit">+$2,847</div>
              <div className="mockSplitLine"><span>Before deposit</span><strong>$1,243</strong></div>
              <div className="mockSplitLine"><span>After deposit</span><strong className="greenText">$4,090</strong></div>
            </div>
          </article>

          {/* Step 2 */}
          <article className="coreCard">
            <span className="stepBadge blue"><i>2</i> Bills claim their share</span>
            <h3>Bills get assigned to the paycheck that pays them.</h3>
            <p>
              Rent, subscriptions, loans, utilities, and card payments land in the right paycheck
              view, so you see obligations before you spend.
            </p>
            <div className="billStack">
              <div><span>Capital One Auto</span><strong>$545.54</strong></div>
              <div><span>OpenAI</span><strong>$21.31</strong></div>
              <div><span>FirstEnergy</span><strong>$145.20</strong></div>
              <div className="nextCheck"><span>Next check already reserved</span><strong>$340</strong></div>
            </div>
          </article>

          {/* Step 3 */}
          <article className="coreCard">
            <span className="stepBadge gold"><i>3</i> Big bills get staged</span>
            <h3>Large bills can split across real paychecks.</h3>
            <p>
              Mortgage and loan patterns split using your actual transfer behavior &mdash; not fake
              equal halves.
            </p>
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
          </article>

          {/* Step 4 (was card 05; now correctly placed as the climax) */}
          <article className="coreCard">
            <span className="stepBadge teal"><i>4</i> Available to spend</span>
            <h3>One number, after everything is spoken for.</h3>
            <p>
              The Available number updates the moment a bill is claimed, a split is staged, or a
              deposit lands. No mental math, no spreadsheet reconciliation.
            </p>
            <div className="availableStoryCard">
              <div className="label">Available to spend</div>
              <div className="storyMoney">$1,327.90</div>
              <div className="mockSplitLine"><span>Checking balance</span><strong>$1,327.90</strong></div>
              <div className="mockSplitLine"><span>Available this check after bills</span><strong className="greenText">$582.48</strong></div>
              <div className="mockSplitLine"><span>Available next check after bills</span><strong>$340</strong></div>
            </div>
          </article>

        </div>

        {/* ============ Section: Tier breakdown ============ */}
        <div className="sectionHeader">
          <h2>Pick how much Keipr should <em>do for you</em>.</h2>
          <p>
            The flow above is the same for everyone. These are the layers you can stack on top
            &mdash; depending on how hands-on you want to be, and whether you want to connect a bank.
          </p>
        </div>

        <div className="tierGrid">

          {/* Free */}
          <article className="tierCard free">
            <span className="tierBadge">Free</span>
            <h3 className="tierName">Manual + simple.</h3>
            <p className="tierPrice"><strong>$0</strong> &middot; forever</p>
            <p className="tierTagline">
              For people who&rsquo;d rather not connect a bank &mdash; or just want to try Keipr&rsquo;s
              paycheck math first.
            </p>
            <hr className="tierBoundary" />
            <ul className="tierFeatures">
              <li>The full 4-step flow above</li>
              <li>1 income source, 1 split bill</li>
              <li>This month&rsquo;s planning view</li>
              <li>Manual entry &mdash; no bank credentials shared</li>
            </ul>
          </article>

          {/* Pro */}
          <article className="tierCard pro">
            <span className="tierBadge">Pro</span>
            <h3 className="tierName">Plan months ahead.</h3>
            <p className="tierPrice">
              <strong>$7.99</strong>/mo &middot;{' '}
              <span className="tierPriceMuted">$6.99/mo annual</span>
            </p>
            <p className="tierTagline">
              Everything in Free, plus forward planning, unlimited splits, trends, and CSV export.
              Still fully manual &mdash; no bank connection needed.
            </p>
            <hr className="tierBoundary" />
            <ul className="tierFeatures">
              <li>Unlimited income sources &amp; splits</li>
              <li>Plan months ahead with rollover, tight-month warnings, and bill-ending windfalls</li>
              <li>Spending trends + CSV export</li>
            </ul>
            <div className="miniMock">
              <p className="miniLabel">Forward projection</p>
              <div className="futureBars">
                <div className="row"><span>May 2026</span><strong>+$420</strong><i style={{ width: '75%' }} /></div>
                <div className="row"><span>Jun 2026</span><strong>+$210</strong><i style={{ width: '42%' }} /></div>
                <div className="row"><span>Jul 2026</span><strong>+$680</strong><i style={{ width: '88%' }} /></div>
              </div>
            </div>
          </article>

          {/* Ultra (featured) */}
          <article className="tierCard ultra featured">
            <span className="tierBadge featuredBadge">Ultra &middot; most automated</span>
            <h3 className="tierName">Bank does the work.</h3>
            <p className="tierPrice">
              <strong>$11.99</strong>/mo &middot;{' '}
              <span className="tierPriceMuted">$10.99/mo annual</span>
            </p>
            <p className="tierTagline">
              Connect a bank and Keipr matches transactions to bills, verifies the tracker, and
              quietly cleans up your budget after every sync.
            </p>
            <hr className="tierBoundary" />
            <ul className="tierFeatures">
              <li>Everything in Pro</li>
              <li>Bank match &mdash; transactions auto-link to bills &amp; split rows</li>
              <li>Tracker self-verifies (no manual check-offs)</li>
              <li>AI Accountant &mdash; quiet cleanup of duplicates, miscategorizations, and staging chains</li>
              <li>Detected expenses banner for new recurring patterns</li>
            </ul>
            <div className="miniMock">
              <p className="miniLabel">Bank match &mdash; auto-verified</p>
              <div className="ultraMatch">
                {matchRows.map((row) => (
                  <div className="ultraMatchRow" key={row.name}>
                    <span className={`chip ${row.logoClass}`}>{row.logoText}</span>
                    <span className="name">{row.name} &middot; {row.amount}</span>
                    <span className="verified">&#10003; Auto</span>
                  </div>
                ))}
              </div>
            </div>
          </article>

        </div>

        {/* ============ Privacy callout ============ */}
        <div className="privacyStrip">
          <div>
            <h4>Don&rsquo;t want to connect a bank? You don&rsquo;t have to.</h4>
            <p>
              Free and Pro never ask for bank credentials. The 4-step paycheck math is identical
              &mdash; Ultra just adds automation on top of the same engine. You decide how hands-off
              you want to be.
            </p>
          </div>
          <span className="pill">Manual-friendly</span>
        </div>

      </div>
    </section>
  );
}
