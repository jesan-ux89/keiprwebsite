'use client';

import Link from 'next/link';

interface FeaturesSectionProps {
  onScreenshotClick: (src: string) => void;
}

export default function FeaturesSection({ onScreenshotClick }: FeaturesSectionProps) {
  return (
    <section id="product" className="section productStrip">
      <div className="pageShell">
        <div className="sectionHead">
          <h2>The app stays quiet. <span>The numbers stay honest.</span></h2>
        </div>

        <div className="screenGrid">
          <article className="screenCard">
            <p className="screenEyebrow blue">Dashboard</p>
            <h3>Safe-to-spend is the hero.</h3>
            <p>No hunting through categories. The first thing users see is what is left after the paycheck is spoken for.</p>
            <img
              className="screenShot"
              src="/screen-dashboard.png"
              alt="Dashboard screenshot"
              onClick={() => onScreenshotClick('/screen-dashboard.png')}
            />
          </article>

          <article className="screenCard">
            <p className="screenEyebrow gold">Split bills</p>
            <h3>Big bills become staged.</h3>
            <p>Mortgage, loans, and transfers can be split by real paycheck behavior instead of neat but fake equal halves.</p>
            <img
              className="screenShot"
              src="/screen-split.png"
              alt="Split bill screenshot"
              onClick={() => onScreenshotClick('/screen-split.png')}
            />
          </article>

          <article className="screenCard">
            <p className="screenEyebrow green">Tracker</p>
            <h3>Payments verify themselves.</h3>
            <p>Bank-matched bills get clear status so the tracker feels reliable, not like another manual checklist.</p>
            <img
              className="screenShot"
              src="/screen-tracker.png"
              alt="Tracker screenshot"
              onClick={() => onScreenshotClick('/screen-tracker.png')}
            />
          </article>
        </div>

        <div className="productCta">
          <Link className="ghostBtn" href="/how-it-works">See how the math works &rarr;</Link>
          <Link className="solidBtn" href="/auth/signup">Start free &rarr;</Link>
        </div>
      </div>
    </section>
  );
}
