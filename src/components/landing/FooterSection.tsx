'use client';

import Link from 'next/link';

export default function FooterSection() {
  return (
    <footer className="landingFooter">
      <div className="pageShell landingFooterInner">
        <span>&copy; 2026 Keipr</span>
        <span>
          <Link href="/terms">Terms</Link> &middot; <Link href="/privacy">Privacy</Link> &middot; <a href="mailto:support@keipr.app">Contact</a>
        </span>
      </div>
    </footer>
  );
}
