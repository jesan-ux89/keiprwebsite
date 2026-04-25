'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="landingNav">
      <div className="brandGroup">
        <Link className="brandMark" href="/" onClick={closeMenu}>
          <span className="word"><span className="k">K</span>eipr</span>
        </Link>
        <div className="brandTagline">Paycheck-forward budgeting</div>
      </div>

      <div className="navLinks">
        <a href="#story">How it works</a>
        <a href="#product">Product</a>
        <a href="#pricing">Pricing</a>
        <Link href="/faq">FAQ</Link>
      </div>

      <div className="navActions">
        <Link className="ghostBtn" href="/auth/login">Sign in</Link>
        <Link className="solidBtn" href="/auth/signup">Start free</Link>
      </div>

      <button
        className="mobileMenuButton"
        type="button"
        onClick={() => setMobileMenuOpen((open) => !open)}
        aria-label="Toggle navigation menu"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {mobileMenuOpen && (
        <div className="mobileMenu">
          <a href="#story" onClick={closeMenu}>How it works</a>
          <a href="#product" onClick={closeMenu}>Product</a>
          <a href="#pricing" onClick={closeMenu}>Pricing</a>
          <Link href="/faq" onClick={closeMenu}>FAQ</Link>
          <Link href="/auth/login" onClick={closeMenu}>Sign in</Link>
          <Link className="solidBtn" href="/auth/signup" onClick={closeMenu}>Start free</Link>
        </div>
      )}
    </nav>
  );
}
