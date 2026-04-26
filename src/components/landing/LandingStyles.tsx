'use client';

export default function LandingStyles() {
  return (
    <style>{`
      .landingRoot {
        --bg: #0f0d0b;
        --panel: #17130f;
        --panel-2: #1d1813;
        --ink: #fff8ef;
        --muted: #b4aba0;
        --quiet: #8f867c;
        --blue: #35c3f5;
        --green: #38d99f;
        --gold: #ffb018;
        --red: #ff5d61;
        --border: rgba(255, 248, 239, 0.11);
        min-height: 100vh;
        color: var(--ink);
        background:
          radial-gradient(circle at 16% 8%, rgba(53, 195, 245, 0.19), transparent 31rem),
          radial-gradient(circle at 82% 12%, rgba(56, 217, 159, 0.10), transparent 27rem),
          radial-gradient(circle at 70% 80%, rgba(255, 176, 24, 0.08), transparent 30rem),
          linear-gradient(135deg, #0f0d0b 0%, #17120f 52%, #11100d 100%);
      }

      .landingRoot a { color: inherit; text-decoration: none; }
      .pageShell { width: min(1200px, calc(100% - 44px)); margin: 0 auto; }

      .landingNav {
        position: sticky;
        top: 16px;
        z-index: 20;
        width: min(1200px, calc(100% - 44px));
        margin: 16px auto 0;
        min-height: 68px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 0 18px 0 24px;
        border: 1px solid var(--border);
        border-radius: 24px;
        background: rgba(15, 13, 11, 0.78);
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.22);
        backdrop-filter: blur(20px);
      }

      .brandGroup { display: flex; align-items: center; gap: 18px; min-width: 0; }
      .brandMark { display: inline-flex; align-items: baseline; font-size: 36px; font-weight: 950; letter-spacing: -0.07em; color: var(--ink); }
      .brandMark .k { color: var(--blue); letter-spacing: -0.12em; }
      .brandMark .word { position: relative; padding-right: 4px; padding-bottom: 7px; }
      .brandMark .word::after {
        content: "";
        position: absolute;
        left: 0.95em;
        right: 0.05em;
        bottom: 0;
        height: 4px;
        border-radius: 999px;
        background: var(--blue);
        box-shadow: 0 0 24px rgba(53, 195, 245, 0.25);
      }
      .brandTagline {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #9be7ff;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.13em;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .brandTagline::before {
        content: "";
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--blue);
        box-shadow: 0 0 22px rgba(53, 195, 245, 0.6);
      }
      .navLinks { display: flex; gap: 30px; color: rgba(255, 248, 239, 0.66); font-weight: 780; font-size: 14px; }
      .navActions { display: flex; align-items: center; gap: 10px; }

      .ghostBtn,
      .solidBtn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        border-radius: 15px;
        padding: 0 18px;
        font-weight: 850;
        border: 1px solid var(--border);
      }
      .ghostBtn { color: var(--ink); background: rgba(255, 255, 255, 0.035); }
      .solidBtn { color: #071019; background: var(--blue); border-color: transparent; box-shadow: 0 16px 40px rgba(53, 195, 245, 0.22); }
      .mobileMenuButton { display: none; border: 0; color: var(--ink); background: transparent; }
      .mobileMenu { display: none; }

      .hero {
        min-height: calc(100vh - 84px);
        display: grid;
        grid-template-columns: minmax(0, 0.98fr) minmax(520px, 0.9fr);
        gap: 48px;
        align-items: center;
        padding: 58px 0 62px;
      }
      .hero h1 {
        margin: 0;
        max-width: 720px;
        font-size: clamp(45px, 5.15vw, 72px);
        line-height: 0.96;
        letter-spacing: -0.07em;
        font-weight: 950;
      }
      .hero h1 span { color: var(--blue); }
      .heroCopy {
        max-width: 610px;
        margin: 24px 0 32px;
        color: var(--muted);
        font-size: 20px;
        line-height: 1.55;
      }
      .heroActions { display: flex; gap: 14px; flex-wrap: wrap; }
      .trustRow { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 26px; }
      .trustPill {
        border: 1px solid rgba(255, 248, 239, 0.09);
        background: rgba(255, 255, 255, 0.035);
        border-radius: 999px;
        padding: 9px 13px;
        color: rgba(255, 248, 239, 0.58);
        font-size: 13px;
        font-weight: 760;
      }

      .productStage {
        position: relative;
        display: grid;
        grid-template-columns: 1fr;
        gap: 22px;
        align-items: stretch;
        padding: 22px;
        border-radius: 36px;
        background:
          radial-gradient(circle at 12% 18%, rgba(53, 195, 245, 0.17), transparent 20rem),
          linear-gradient(135deg, rgba(53, 195, 245, 0.1), transparent 42%),
          rgba(255, 255, 255, 0.035);
        border: 1px solid rgba(255, 248, 239, 0.08);
        box-shadow: 0 38px 110px rgba(0,0,0,0.38);
      }
      .productStage::after {
        content: "";
        position: absolute;
        inset: 18px;
        border-radius: 28px;
        pointer-events: none;
        background-image:
          linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
        background-size: 28px 28px;
        mask-image: linear-gradient(135deg, black, transparent 72%);
        opacity: 0.45;
      }
      .dashboardCard {
        position: relative;
        z-index: 1;
        width: 100%;
        border-radius: 30px;
        padding: 22px;
        background: linear-gradient(135deg, rgba(53, 195, 245, 0.13), transparent 42%), #17130f;
        border: 1px solid var(--border);
        box-shadow: 0 32px 90px rgba(0, 0, 0, 0.38);
      }
      .cardTop { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; color: var(--quiet); font-weight: 850; font-size: 14px; }
      .availableCard { border-radius: 24px; padding: 24px; background: linear-gradient(135deg, rgba(53, 195, 245, 0.19), transparent 52%), rgba(255, 255, 255, 0.045); border: 1px solid rgba(255, 248, 239, 0.11); }
      .label { color: var(--quiet); font-size: 12px; font-weight: 950; letter-spacing: 0.13em; text-transform: uppercase; }
      .bigMoney { margin: 12px 0 18px; color: #44c7f4; font-size: 56px; line-height: 1; font-weight: 950; letter-spacing: -0.06em; }
      .smallLine,
      .metricLine { display: flex; align-items: center; justify-content: space-between; color: var(--muted); font-weight: 780; font-size: 14px; padding: 6px 0; gap: 16px; }
      .dot { width: 9px; height: 9px; border-radius: 999px; display: inline-block; margin-right: 8px; background: var(--blue); }
      .miniGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 12px; }
      .miniMetric { min-height: 88px; border-radius: 18px; padding: 14px; background: rgba(255, 255, 255, 0.045); border: 1px solid rgba(255, 248, 239, 0.08); }
      .miniMetric b { display: block; margin-top: 8px; color: var(--ink); font-size: 21px; letter-spacing: -0.04em; }

      .floatingMatch {
        grid-column: 1 / -1;
        position: relative;
        z-index: 1;
        width: 100%;
        border-radius: 24px;
        padding: 18px 20px;
        background: rgba(23, 19, 15, 0.84);
        border: 1px solid rgba(255, 248, 239, 0.11);
        box-shadow: 0 28px 90px rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(18px);
        display: grid;
        grid-template-columns: 136px minmax(0, 1fr);
        gap: 20px;
        align-items: start;
      }
      .matchBadge { display: inline-flex; align-items: center; gap: 7px; color: #9be7ff; font-size: 12px; font-weight: 950; letter-spacing: 0.1em; text-transform: uppercase; }
      .matchRows { display: grid; gap: 12px; }
      .matchRow { min-width: 0; display: grid; grid-template-columns: 42px minmax(0, 1fr) auto; gap: 12px; align-items: center; }
      .logoChip { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.035)), #14110e; border: 1px solid rgba(255,248,239,0.09); overflow: hidden; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.25); }
      .logoChip img { width: 100%; height: 100%; object-fit: contain; padding: 7px; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.28)); }
      .logoChip img.chaseLogo { width: 74%; height: 74%; padding: 0; object-fit: cover; max-width: none; border-radius: 6px; }
      .netflixTile,
      .spotifyTile {
        display: grid;
        place-items: center;
        width: 100%;
        height: 100%;
        font-size: 26px;
        line-height: 1;
        font-weight: 950;
      }
      .netflixTile {
        color: #e50914;
        font-family: Arial Black, Arial, sans-serif;
      }
      .spotifyTile {
        color: #1ed760;
        font-size: 22px;
        border-radius: 999px;
      }
      .matchCopy { min-width: 0; color: var(--muted); font-size: 15px; line-height: 1.35; font-weight: 780; }
      .matchCopy strong { display: block; color: var(--ink); white-space: nowrap; overflow: visible; text-overflow: clip; }
      .matchCopy span { display: block; color: var(--quiet); font-size: 13px; margin-top: 2px; }
      .matchStatus { text-align: right; color: var(--green); font-size: 15px; font-weight: 950; white-space: nowrap; }
      .splitStatus { grid-column: 2 / -1; display: flex; gap: 8px; justify-content: flex-start; flex-wrap: wrap; margin-top: -4px; }
      .splitPill { border-radius: 999px; padding: 7px 12px; background: rgba(255,255,255,0.055); border: 1px solid rgba(255,248,239,0.1); color: var(--green); font-size: 13px; font-weight: 900; white-space: nowrap; line-height: 1.1; }
      .splitPill span { display: block; margin-top: 3px; color: var(--quiet); font-size: 10px; font-weight: 850; }

      .section { padding: 92px 0; }
      .howWorksPage {
        min-height: calc(100vh - 112px);
        padding: 78px 0 110px;
        border-top: 1px solid rgba(255, 248, 239, 0.08);
        background:
          radial-gradient(circle at 12% 8%, rgba(53, 195, 245, 0.13), transparent 31rem),
          radial-gradient(circle at 88% 2%, rgba(56, 217, 159, 0.09), transparent 30rem),
          linear-gradient(180deg, #101614 0%, #120f0c 48%, #0f0d0b 100%);
      }
      .howHero {
        display: block;
        max-width: 760px;
        margin: 12px auto 32px;
        text-align: center;
      }
      .storyEyebrow {
        margin: 0 0 12px;
        color: #9be7ff;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .howHero h1 {
        margin: 0 auto;
        max-width: 700px;
        font-size: clamp(28px, 2.6vw, 42px);
        line-height: 1.1;
        letter-spacing: -0.035em;
        font-weight: 900;
      }
      .howHero h1 span {
        display: block;
        color: var(--blue);
      }
      .journeyRail {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin: 0 0 16px;
      }
      .journeyStep {
        position: relative;
        min-height: 106px;
        padding: 16px;
        border-radius: 18px;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.026)),
          rgba(31, 27, 23, 0.88);
        border: 1px solid rgba(255, 248, 239, 0.1);
        box-shadow: 0 20px 70px rgba(0, 0, 0, 0.24);
        /* Make button-styled steps blend in cleanly */
        display: block;
        width: 100%;
        font: inherit;
        color: inherit;
        text-align: left;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        transition: border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
      }
      .journeyStep:hover {
        border-color: rgba(53, 195, 245, 0.32);
        transform: translateY(-2px);
      }
      .journeyStep:focus-visible {
        outline: 2px solid var(--blue);
        outline-offset: 3px;
      }
      .journeyStep.active {
        border-color: rgba(53, 195, 245, 0.6);
        box-shadow: 0 26px 80px rgba(53, 195, 245, 0.22), 0 20px 70px rgba(0, 0, 0, 0.24);
      }
      .journeyStep.green.active {
        border-color: rgba(56, 217, 159, 0.6);
        box-shadow: 0 26px 80px rgba(56, 217, 159, 0.20), 0 20px 70px rgba(0, 0, 0, 0.24);
      }
      .journeyStep.gold.active {
        border-color: rgba(255, 176, 24, 0.6);
        box-shadow: 0 26px 80px rgba(255, 176, 24, 0.20), 0 20px 70px rgba(0, 0, 0, 0.24);
      }
      .journeyStep.teal.active {
        border-color: rgba(97, 226, 207, 0.6);
        box-shadow: 0 26px 80px rgba(97, 226, 207, 0.18), 0 20px 70px rgba(0, 0, 0, 0.24);
      }
      .journeyStep span {
        display: grid;
        place-items: center;
        width: 30px;
        height: 30px;
        margin-bottom: 14px;
        border-radius: 999px;
        color: #071019;
        background: var(--blue);
        font-weight: 950;
      }
      .journeyStep.green span { background: var(--green); }
      .journeyStep.gold  span { background: var(--gold); }
      .journeyStep.teal  span { background: #61e2cf; }
      .journeyStep strong {
        display: block;
        color: #fff5e8;
        font-size: 15px;
        letter-spacing: -0.02em;
      }
      .journeyStep small {
        display: block;
        margin-top: 6px;
        color: #bfb5aa;
        line-height: 1.35;
        font-weight: 620;
      }
      /* ============ Interactive core-flow demo ============ */
      .demoWrap { margin: 0 0 60px; }
      .demoPanel {
        padding: 28px;
        border-radius: 26px;
        background:
          radial-gradient(circle at 90% 6%, rgba(53,195,245,0.13), transparent 25rem),
          linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.022)),
          rgba(29, 25, 21, 0.94);
        border: 1px solid rgba(255,248,239,0.14);
        box-shadow: 0 28px 90px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05);
      }
      .demoStage {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(360px, 0.85fr);
        gap: 28px;
        align-items: center;
      }
      .demoCopy h3 {
        margin: 0 0 12px;
        font-size: clamp(22px, 2.2vw, 30px);
        line-height: 1.1;
        letter-spacing: -0.03em;
        font-weight: 880;
        color: #fff4e7;
      }
      .demoCopy p {
        margin: 0 0 18px;
        color: #d6ccc1;
        font-size: 15px;
        line-height: 1.6;
      }
      .demoCopy p em {
        color: var(--ink);
        font-style: italic;
      }
      .demoMockSlot { min-height: 240px; }
      .demoMockSlot > .demoMock { display: none; }
      .demoMockSlot > .demoMock.active {
        display: block;
        animation: keiprFade 280ms ease;
      }
      @keyframes keiprFade {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* ============ Mock surfaces (shared by demo) ============ */
      .paycheckMock,
      .splitMock,
      .availableStoryCard {
        border-radius: 20px;
        border: 1px solid rgba(255, 248, 239, 0.11);
        background:
          linear-gradient(135deg, rgba(53, 195, 245, 0.13), transparent 52%),
          rgba(255, 255, 255, 0.04);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
      }
      .paycheckMock { padding: 22px; }
      .mockTop,
      .splitHeader {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        color: var(--quiet);
        font-weight: 850;
        font-size: 13px;
      }
      .mockDeposit {
        margin: 16px 0;
        color: var(--green);
        font-size: 38px;
        line-height: 1;
        font-weight: 950;
        letter-spacing: -0.06em;
      }
      .mockSplitLine {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        padding: 8px 0;
        color: #d4cabe;
        font-weight: 680;
        font-size: 14px;
      }
      .greenText { color: var(--green); }

      .billStack {
        display: grid;
        gap: 8px;
      }
      .billStack > div {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 13px 14px;
        border-radius: 14px;
        color: var(--muted);
        background: rgba(255, 255, 255, 0.035);
        border: 1px solid rgba(255, 248, 239, 0.07);
        font-weight: 700;
        font-size: 14px;
      }
      .billStack strong { color: var(--ink); }
      .billStack .nextCheck {
        color: #9be7ff;
        background: rgba(53, 195, 245, 0.07);
      }
      .billStack .nextCheck strong { color: var(--blue); }

      .splitMock { padding: 18px; }
      .splitHeader strong { color: var(--ink); font-size: 19px; }
      .splitPills {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin: 14px 0 12px;
      }
      .splitPills > div {
        min-height: 76px;
        border-radius: 16px;
        padding: 12px 14px;
        background: rgba(56, 217, 159, 0.08);
        border: 1px solid rgba(56, 217, 159, 0.22);
      }
      .splitPills > div + div {
        background: rgba(255, 176, 24, 0.08);
        border-color: rgba(255, 176, 24, 0.22);
      }
      .splitPills strong {
        display: block;
        color: var(--green);
        font-size: 22px;
        font-weight: 950;
      }
      .splitPills > div + div strong { color: var(--gold); }
      .splitPills span {
        display: block;
        margin-top: 4px;
        color: var(--quiet);
        font-weight: 800;
        font-size: 12px;
      }
      .splitBar {
        overflow: hidden;
        height: 8px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.12);
      }
      .splitBar i {
        display: block;
        width: 75%;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--green), var(--gold));
      }

      .availableStoryCard { padding: 22px; }
      .availableStoryCard .label {
        color: var(--quiet);
        font-weight: 850;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      .storyMoney {
        margin: 10px 0 14px;
        color: var(--blue);
        font-size: 44px;
        line-height: 1;
        font-weight: 950;
        letter-spacing: -0.06em;
      }

      /* ============ Tier strip (Free / Pro / Ultra — slim) ============ */
      .tierBlock {
        margin-top: 24px;
        padding-top: 36px;
        border-top: 1px solid var(--border);
      }
      .tierIntro {
        margin: 0 auto 24px;
        max-width: 720px;
        text-align: center;
        font-size: 16px;
        color: #c9c0b5;
        font-weight: 700;
        line-height: 1.55;
      }
      .tierIntro strong { color: var(--ink); font-weight: 900; }
      .tierGrid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }
      .tierCard {
        padding: 22px;
        border-radius: 22px;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)),
          rgba(29, 25, 21, 0.94);
        border: 1px solid rgba(255,248,239,0.12);
        box-shadow: 0 22px 68px rgba(0,0,0,0.22);
        display: flex;
        flex-direction: column;
      }
      .tierCard.featured {
        border-color: rgba(53,195,245,0.4);
        box-shadow: 0 26px 80px rgba(53,195,245,0.16), 0 22px 68px rgba(0,0,0,0.28);
      }
      /* Eyebrow style — matches .storyEyebrow at top of page */
      .tierBadge {
        display: inline-block;
        margin-bottom: 12px;
        color: #9be7ff;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .tierCard.free  .tierBadge { color: #bfb5aa; }
      .tierCard.pro   .tierBadge { color: #6ee2b1; }
      .tierCard.ultra .tierBadge { color: #9be7ff; }
      /* tierName matches .demoCopy h3 above */
      .tierName {
        margin: 0 0 8px;
        font-size: clamp(22px, 2.2vw, 30px);
        line-height: 1.1;
        letter-spacing: -0.03em;
        font-weight: 880;
        color: #fff4e7;
      }
      /* tierPrice + tierFeatures li match .demoCopy p above */
      .tierPrice {
        margin: 0 0 18px;
        color: #d6ccc1;
        font-size: 15px;
        line-height: 1.6;
        font-weight: 600;
      }
      .tierPrice strong { color: #fff4e7; font-weight: 900; }
      .tierFeatures {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 10px;
      }
      .tierFeatures li {
        display: grid;
        grid-template-columns: 16px 1fr;
        gap: 12px;
        color: #d6ccc1;
        font-size: 15px;
        line-height: 1.6;
        font-weight: 600;
      }
      .tierFeatures li::before {
        content: "";
        margin-top: 7px;
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: #b4aba0;
        grid-column: 1;
        align-self: start;
        justify-self: center;
      }
      .tierCard.free  .tierFeatures li::before { background: #b4aba0; }
      .tierCard.pro   .tierFeatures li::before { background: var(--green); box-shadow: 0 0 10px rgba(56,217,159,0.5); }
      .tierCard.ultra .tierFeatures li::before { background: var(--blue);  box-shadow: 0 0 10px rgba(53,195,245,0.5); }
      .paycheckStory {
        border-top: 1px solid rgba(255, 248, 239, 0.08);
        border-bottom: 1px solid rgba(255, 248, 239, 0.08);
        background: radial-gradient(circle at 14% 22%, rgba(53, 195, 245, 0.12), transparent 30rem), linear-gradient(180deg, rgba(23,19,15,0.8), rgba(17,15,13,0.82));
      }
      .sectionHead { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 420px); gap: 48px; align-items: end; margin-bottom: 42px; }
      .sectionHead h2 { margin: 0; font-size: clamp(38px, 4.4vw, 62px); line-height: 0.98; letter-spacing: -0.065em; font-weight: 950; }
      .sectionHead h2 span { color: var(--blue); }
      .sectionHead p { margin: 0; color: var(--muted); line-height: 1.7; font-size: 17px; }
      .paycheckStory .sectionHead,
      .productStrip .sectionHead { display: block; max-width: 820px; margin: 0 auto 42px; text-align: center; }
      .paycheckStory .sectionHead { max-width: 700px; margin-bottom: 46px; }
      .paycheckStory .sectionHead h2,
      .productStrip .sectionHead h2 { max-width: 700px; margin: 0 auto; font-size: clamp(26px, 2.25vw, 34px); line-height: 1.12; letter-spacing: -0.03em; }
      .paycheckStory .sectionHead h2 span { display: block; margin-top: 4px; }
      .paycheckStory .sectionHead p { max-width: 620px; margin: 18px auto 0; font-size: 15px; line-height: 1.75; }
      .paycheckStory .sectionHead p strong { color: var(--blue); font-weight: 950; }

      .flowGrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
      .paycheckStory .flowGrid { max-width: 1180px; margin: 0 auto; gap: 18px; }
      .flowCard { min-height: 208px; border-radius: 20px; padding: 22px; background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02)), #14110e; border: 1px solid var(--border); box-shadow: 0 24px 70px rgba(0,0,0,0.26); }
      .flowTitle { display: flex; align-items: center; gap: 9px; color: var(--blue); font-size: 11px; font-weight: 950; letter-spacing: 0.11em; text-transform: uppercase; margin-bottom: 24px; }
      .num { display: inline-grid; place-items: center; width: 30px; height: 30px; border-radius: 999px; background: var(--blue); color: #071019; font-weight: 950; letter-spacing: 0; }
      .flowCard.green .flowTitle { color: var(--green); }
      .flowCard.green .num { background: var(--green); }
      .flowCard.gold .flowTitle { color: var(--gold); }
      .flowCard.gold .num { background: var(--gold); }
      .flowMoney { margin: 8px 0 8px; color: var(--green); font-size: 34px; font-weight: 950; letter-spacing: -0.06em; }
      .progress { overflow: hidden; height: 8px; border-radius: 999px; background: rgba(255,255,255,0.12); }
      .progress i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--green), var(--blue)); }

      .productStrip {
        padding-bottom: 56px;
        background:
          radial-gradient(circle at 50% 22%, rgba(53, 195, 245, 0.14), transparent 34rem),
          radial-gradient(circle at 18% 72%, rgba(44, 227, 166, 0.08), transparent 28rem);
      }
      .screenEyebrow {
        margin: 0 0 14px;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #9be7ff;
      }
      .screenEyebrow.blue  { color: #9be7ff; }
      .screenEyebrow.gold  { color: #ffd684; }
      .screenEyebrow.green { color: #6ee2b1; }
      .productCta {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin-top: 44px;
        flex-wrap: wrap;
      }
      .screenGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
      .screenCard { border-radius: 30px; padding: 28px 26px 24px; position: relative; overflow: hidden; background: radial-gradient(circle at 50% 64%, rgba(53, 195, 245, 0.13), transparent 12rem), linear-gradient(135deg, rgba(53,195,245,0.12), transparent 44%), linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018)), #161b1f; border: 1px solid rgba(53, 195, 245, 0.18); box-shadow: 0 28px 90px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.06); display: flex; flex-direction: column; }
      .screenCard::before { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg, rgba(255,255,255,0.05), transparent 34%); opacity: 0.55; }
      .screenCard h3 { position: relative; z-index: 1; margin: 0 0 10px; font-size: clamp(22px, 2.2vw, 30px); line-height: 1.1; letter-spacing: -0.03em; font-weight: 880; color: #fff4e7; }
      .screenCard p { position: relative; z-index: 1; color: #d6ccc1; font-size: 15px; line-height: 1.6; font-weight: 600; margin: 0 0 22px; }
      .screenShot { position: relative; z-index: 1; display: block; width: min(220px, 82%); margin: 0 auto; border-radius: 28px; border: 4px solid rgba(255,255,255,0.12); box-shadow: 0 0 44px rgba(53,195,245,0.12), 0 26px 58px rgba(0,0,0,0.46); cursor: zoom-in; }

      .pricingBand { padding: 90px 0 110px; background: radial-gradient(circle at 50% 18%, rgba(53, 195, 245, 0.12), transparent 30rem), linear-gradient(180deg, #0f0d0b 0%, #111820 100%); }
      .pricingPanel { max-width: 1180px; margin: 0 auto; }
      .pricingPanelHeader {
        margin: 0 0 72px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }
      .pricingHeading { text-align: center; }
      .pricingPanel h2 { max-width: 760px; margin: 0 auto 10px; text-align: center; font-size: clamp(28px, 2.7vw, 42px); line-height: 1.08; letter-spacing: -0.04em; font-weight: 950; }
      .pricingPanelHeader .heroCopy { max-width: 640px; margin: 0 auto; text-align: center; font-size: 16px; color: var(--muted); }
      /* Billing toggle (centered below heading) */
      .billingToggle {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px;
        border-radius: 999px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,248,239,0.14);
        box-shadow: 0 12px 40px rgba(0,0,0,0.22);
      }
      .billingToggleBtn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: #b4aba0;
        font: inherit;
        font-size: 13px;
        font-weight: 850;
        letter-spacing: 0.01em;
        cursor: pointer;
        transition: background 160ms ease, color 160ms ease;
      }
      .billingToggleBtn:hover { color: var(--ink); }
      .billingToggleBtn:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
      .billingToggleBtn.active {
        background: rgba(53,195,245,0.22);
        color: #fff4e7;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
      }
      .billingSave {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 999px;
        background: rgba(56,217,159,0.18);
        color: #6ee2b1;
        font-size: 10.5px;
        font-weight: 950;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .priceGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px; align-items: stretch; }
      .priceCard { position: relative; min-height: 660px; display: flex; flex-direction: column; border-radius: 10px; padding: 34px 32px 30px; background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.022)), #161b1f; border: 1px solid rgba(255,248,239,0.12); box-shadow: 0 24px 80px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05); }
      .priceCard.featured { background: radial-gradient(circle at 80% 0%, rgba(53,195,245,0.12), transparent 18rem), linear-gradient(180deg, rgba(53,195,245,0.055), rgba(255,255,255,0.022)), #161b1f; border: 2px solid rgba(53,195,245,0.74); box-shadow: 0 28px 90px rgba(0,0,0,0.34), 0 0 0 1px rgba(53,195,245,0.08), inset 0 1px 0 rgba(255,255,255,0.07); }
      .priceTop { margin-bottom: 20px; }
      .planName { margin: 0; font-size: 28px; letter-spacing: -0.035em; font-weight: 900; }
      .price { color: var(--blue); margin-top: 28px; font-size: 42px; font-weight: 950; letter-spacing: -0.04em; white-space: nowrap; }
      .price small { color: var(--muted); font-size: 16px; letter-spacing: 0; font-weight: 700; }
      .recommended { display: inline-flex; width: fit-content; border-radius: 999px; padding: 7px 12px; margin-bottom: 18px; background: #0d5a7d; color: white; font-size: 12px; font-weight: 950; }
      .planList { display: grid; gap: 17px; margin: 28px 0 26px; color: var(--muted); font-size: 16px; font-weight: 700; line-height: 1.35; }
      .planList span::before { content: "-"; margin-right: 14px; color: var(--blue); font-weight: 950; }
      .planFine { color: var(--quiet); font-size: 12px; line-height: 1.4; }
      .planDivider { height: 1px; background: rgba(255,248,239,0.1); margin: 8px 0 20px; }
      .planPlus { color: var(--quiet); font-size: 11px; font-weight: 950; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 14px; }
      .planFooter { margin-top: auto; display: grid; gap: 22px; }
      /* ============ FAQ page ============ */
      .faqPage { padding: 78px 0 60px; border-top: 1px solid rgba(255,248,239,0.08); }
      .faqPills {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px;
        margin: 0 auto 48px;
      }
      .faqPill {
        display: inline-flex;
        align-items: center;
        padding: 8px 16px;
        border: 1px solid rgba(255, 248, 239, 0.14);
        background: rgba(255, 255, 255, 0.04);
        border-radius: 999px;
        color: #c9c0b5;
        font: inherit;
        font-size: 13px;
        font-weight: 850;
        cursor: pointer;
        transition: background 160ms ease, color 160ms ease, border-color 160ms ease;
      }
      .faqPill:hover { color: var(--ink); border-color: rgba(53, 195, 245, 0.4); }
      .faqPill:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
      .faqPill.active {
        background: rgba(53, 195, 245, 0.18);
        border-color: rgba(53, 195, 245, 0.5);
        color: #fff4e7;
      }
      .faqContent { max-width: 820px; margin: 0 auto; }
      .faqSection { margin-bottom: 40px; scroll-margin-top: 90px; }
      .faqSection:last-child { margin-bottom: 0; }
      .faqSectionTitle {
        margin: 0 0 16px;
        font-size: 22px;
        font-weight: 880;
        letter-spacing: -0.025em;
        color: #9be7ff;
      }
      .faqGroup {
        border-radius: 22px;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
          rgba(29, 25, 21, 0.94);
        border: 1px solid rgba(255, 248, 239, 0.12);
        box-shadow: 0 22px 68px rgba(0, 0, 0, 0.22);
        overflow: hidden;
      }
      .faqItem { border-bottom: 1px solid rgba(255, 248, 239, 0.07); }
      .faqItem:last-child { border-bottom: 0; }
      .faqQ {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        width: 100%;
        padding: 18px 22px;
        border: 0;
        background: transparent;
        color: #fff4e7;
        font: inherit;
        font-size: 15.5px;
        font-weight: 700;
        text-align: left;
        cursor: pointer;
        transition: background 160ms ease;
      }
      .faqQ:hover { background: rgba(255, 255, 255, 0.025); }
      .faqQ:focus-visible { outline: 2px solid var(--blue); outline-offset: -2px; }
      .faqChevron {
        flex-shrink: 0;
        color: #9be7ff;
        transition: transform 200ms ease;
      }
      .faqItem.open .faqChevron { transform: rotate(180deg); }
      .faqA {
        padding: 0 22px 18px;
        color: #d6ccc1;
        font-size: 14.5px;
        line-height: 1.65;
      }
      .faqA p { margin: 0; }
      .faqContact {
        max-width: 640px;
        margin: 56px auto 0;
        padding: 36px 32px;
        border-radius: 22px;
        text-align: center;
        background:
          radial-gradient(circle at 50% 0%, rgba(53, 195, 245, 0.12), transparent 22rem),
          linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02)),
          rgba(29, 25, 21, 0.94);
        border: 1px solid rgba(255, 248, 239, 0.12);
      }
      .faqContact h3 {
        margin: 0 0 8px;
        font-size: 22px;
        font-weight: 900;
        letter-spacing: -0.025em;
      }
      .faqContact p {
        margin: 0 auto 22px;
        max-width: 480px;
        color: #c9c0b5;
        font-size: 15px;
        line-height: 1.55;
      }

      .landingFooter { border-top: 1px solid var(--border); color: var(--quiet); padding: 32px 0 48px; }
      .landingFooterInner { display: flex; justify-content: space-between; gap: 18px; flex-wrap: wrap; }

      @media (max-width: 1120px) {
        .brandTagline { display: none; }
        .navLinks { gap: 18px; }
        .hero { grid-template-columns: 1fr; }
        .productStage { max-width: 640px; margin: 0 auto; }
      }

      @media (max-width: 980px) {
        .navLinks, .navActions { display: none; }
        .mobileMenuButton { display: inline-flex; align-items: center; justify-content: center; }
        .landingNav { top: 10px; width: min(100% - 24px, 1200px); }
        .mobileMenu {
          display: grid;
          gap: 8px;
          position: absolute;
          top: calc(100% + 10px);
          left: 0;
          right: 0;
          padding: 14px;
          border: 1px solid var(--border);
          border-radius: 18px;
          background: rgba(15, 13, 11, 0.96);
          box-shadow: 0 24px 70px rgba(0,0,0,0.36);
        }
        .hero, .sectionHead, .pricingPanel { grid-template-columns: 1fr; }
        .floatingMatch { grid-template-columns: 1fr; text-align: left; }
        .matchRow { grid-template-columns: 42px minmax(0, 1fr); }
        .matchStatus { grid-column: 2; text-align: left; }
        .splitStatus { grid-column: 2; }
        .flowGrid, .screenGrid, .priceGrid, .journeyRail, .tierGrid { grid-template-columns: 1fr; }
        .demoStage { grid-template-columns: 1fr; gap: 22px; }
        .demoMockSlot { min-height: 0; }
        .priceCard { min-height: auto; }
      }

      @media (max-width: 640px) {
        .pageShell { width: min(100% - 28px, 1200px); }
        .landingNav { min-height: 62px; padding: 0 14px; border-radius: 20px; }
        .brandMark { font-size: 30px; }
        .hero { padding: 42px 0 56px; gap: 30px; }
        .hero h1 { font-size: clamp(44px, 14vw, 60px); }
        .heroCopy { font-size: 17px; }
        .howWorksPage { padding: 64px 0 82px; }
        .howHero { margin-top: 8px; }
        .howHero h1 { font-size: clamp(28px, 8vw, 38px); }
        .journeyStep { min-height: auto; }
        .demoPanel { padding: 20px; border-radius: 22px; }
        .demoCopy h3 { font-size: 22px; }
        .journeyStep { min-height: auto; padding: 14px; }
        .tierCard { padding: 20px; }
        .splitPills { grid-template-columns: 1fr; }
        .storyMoney { font-size: 40px; }
        .productStage { padding: 14px; border-radius: 28px; }
        .dashboardCard { padding: 16px; border-radius: 24px; }
        .availableCard { padding: 18px; }
        .bigMoney { font-size: 42px; }
        .smallLine { align-items: flex-start; font-size: 12px; }
        .miniGrid { grid-template-columns: 1fr; }
        .floatingMatch { padding: 16px; }
        .section { padding: 70px 0; }
        .screenCard { min-height: auto; }
      }
    `}</style>
  );
}
