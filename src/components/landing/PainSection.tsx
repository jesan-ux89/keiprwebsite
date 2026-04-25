'use client';

type MatchRow = {
  name: string;
  amount: string;
  detail: string;
  logo?: string;
  logoText?: string;
  logoClass?: string;
  chase?: boolean;
};

const matchRows: MatchRow[] = [
  {
    name: 'Netflix',
    amount: '$24.99',
    detail: 'Matched to your Netflix bill',
    logoText: 'N',
    logoClass: 'netflixTile',
  },
  {
    name: 'Spotify',
    amount: '$10.99',
    detail: 'Matched to your Spotify bill',
    logoText: 'S',
    logoClass: 'spotifyTile',
  },
  {
    name: 'Mortgage',
    amount: '$2,000',
    detail: 'Matched your bill split staging',
    logo: '/chase-logo.jpg',
    chase: true,
  },
];

export default function PainSection() {
  return (
    <section id="story" className="section howWorksPage">
      <div className="pageShell">
        <div className="howHero">
          <div>
            <p className="storyEyebrow">How Keipr works</p>
            <h1>
              See what each paycheck can actually cover.
              <span>Then plan the month ahead.</span>
            </h1>
          </div>
          <p>
            Keipr keeps paycheck cycles and monthly overviews connected. Bills, splits, bank
            matches, and future months all roll into one number: <strong>what is safe to spend now.</strong>
          </p>
        </div>

        <div className="journeyRail" aria-label="Keipr paycheck budgeting flow">
          <div className="journeyStep green">
            <span>1</span>
            <strong>Paycheck lands</strong>
            <small>Keipr opens the right cycle</small>
          </div>
          <div className="journeyStep blue">
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

        <div className="walkthroughGrid">
          <article className="walkthroughCard featureLarge">
            <div className="featureCopy">
              <p className="stepLabel">01 - Paycheck cycle</p>
              <h2>Keipr starts where your money starts.</h2>
              <p>
                A paycheck creates a working cycle. Instead of asking whether April is on track,
                Keipr asks what this paycheck needs to cover before the next one arrives.
              </p>
            </div>
            <div className="paycheckMock">
              <div className="mockTop">
                <span>Paycheck 2</span>
                <strong>Apr 18 - May 1</strong>
              </div>
              <div className="mockDeposit">+$2,847</div>
              <div className="mockSplitLine">
                <span>Before deposit</span>
                <strong>$1,243</strong>
              </div>
              <div className="mockSplitLine">
                <span>After deposit</span>
                <strong className="greenText">$4,090</strong>
              </div>
            </div>
          </article>

          <article className="walkthroughCard">
            <p className="stepLabel">02 - Bills mapped</p>
            <h2>Bills are assigned to the paycheck that actually pays them.</h2>
            <p>
              Rent, subscriptions, loans, utilities, and card payments land in the right paycheck
              view so the user sees obligations before they spend.
            </p>
            <div className="billStack">
              <div><span>Capital One Auto</span><strong>$545.54</strong></div>
              <div><span>OpenAI</span><strong>$21.31</strong></div>
              <div><span>FirstEnergy</span><strong>$145.20</strong></div>
              <div className="nextCheck"><span>Next check already reserved</span><strong>$340</strong></div>
            </div>
          </article>

          <article className="walkthroughCard">
            <p className="stepLabel">03 - Split bills</p>
            <h2>Large bills can be staged across real paychecks.</h2>
            <p>
              Mortgage and loan patterns can be split using observed transfer behavior instead of
              fake equal halves.
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

          <article className="walkthroughCard featureWide">
            <div className="featureCopy">
              <p className="stepLabel">04 - Bank verified</p>
              <h2>Tracker payments verify themselves.</h2>
              <p>
                When bank transactions match bills, Keipr marks the right bill or split row with
                clean evidence instead of making the user manually check everything off.
              </p>
            </div>
            <div className="bankMatchPanel">
              {matchRows.map((row) => (
                <div className="bankMatchLine" key={row.name}>
                  <div className="logoChip">
                    {row.logo ? (
                      <img className={row.chase ? 'chaseLogo' : ''} src={row.logo} alt="" />
                    ) : (
                      <span className={row.logoClass}>{row.logoText}</span>
                    )}
                  </div>
                  <div>
                    <strong>{row.name} {row.amount}</strong>
                    <span>{row.detail}</span>
                  </div>
                  <em>Auto-verified</em>
                </div>
              ))}
            </div>
          </article>

          <article className="walkthroughCard availableStory">
            <p className="stepLabel">05 - Available to Spend</p>
            <h2>The number updates after bills are spoken for.</h2>
            <div className="availableStoryCard">
              <div className="label">Available to spend</div>
              <div className="storyMoney">$1,327.90</div>
              <div className="mockSplitLine"><span>Checking balance</span><strong>$1,327.90</strong></div>
              <div className="mockSplitLine"><span>Available this check after bills</span><strong className="greenText">$582.48</strong></div>
              <div className="mockSplitLine"><span>Available next check after bills</span><strong>$340</strong></div>
            </div>
          </article>

          <article className="walkthroughCard">
            <p className="stepLabel">06 - AI Accountant</p>
            <h2>Quiet cleanup runs after syncs.</h2>
            <p>
              Keipr can spot duplicate bills, weird categories, staging transfers, and split
              patterns. It cleans up the budget without turning the app into a spreadsheet.
            </p>
            <div className="aiList">
              <span>Duplicate card payment found</span>
              <span>Mortgage staging chain detected</span>
              <span>Subscription moved to the right paycheck</span>
            </div>
          </article>

          <article className="walkthroughCard">
            <p className="stepLabel">07 - Forward planning</p>
            <h2>Plan months ahead before expenses hit.</h2>
            <p>
              Draft future months, simulate new bills, and see how the next paycheck changes before
              committing to anything.
            </p>
            <div className="futureBars">
              <div><span>May 2026</span><strong>75%</strong><i style={{ width: '75%' }} /></div>
              <div><span>June 2026</span><strong>42%</strong><i style={{ width: '42%' }} /></div>
              <div><span>July 2026</span><strong>18%</strong><i style={{ width: '18%' }} /></div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
