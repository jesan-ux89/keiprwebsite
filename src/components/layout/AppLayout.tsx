'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  Receipt,
  CheckSquare,
  Calendar,
  Settings,
  Landmark,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '../ui/Button';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { label: 'Bills', href: '/app/bills', icon: Receipt },
  { label: 'Tracker', href: '/app/tracker', icon: CheckSquare },
  { label: 'Plan', href: '/app/plan', icon: Calendar },
  { label: 'Settings', href: '/app/settings', icon: Settings },
  { label: 'Banking', href: '/app/banking', icon: Landmark },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { colors } = useTheme();
  const { user, loading, signOut } = useAuth();
  const { incomeSources, incomeLoading } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Redirect to onboarding if user has no income sources (not already on onboarding page)
  useEffect(() => {
    if (!loading && !incomeLoading && user && !pathname.startsWith('/onboarding')) {
      if (incomeSources.length === 0) {
        router.push('/onboarding/pay-schedule');
      }
    }
  }, [user, loading, incomeLoading, incomeSources, pathname, router]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: colors.background, color: colors.text }}>
        Loading...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="app-layout">
      {/* Mobile menu button */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        style={{
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 1001,
          background: colors.card,
          border: `1px solid ${colors.divider}`,
          borderRadius: '8px',
          cursor: 'pointer',
          color: colors.text,
          padding: '0.5rem',
          display: 'none', // overridden by CSS media query below
        }}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar overlay for mobile */}
      <div
        className="sidebar-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          opacity: sidebarOpen ? 1 : 0,
          pointerEvents: sidebarOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
          display: 'none', // overridden by CSS media query below
        }}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <nav
        className="app-sidebar"
        style={{
          width: '280px',
          backgroundColor: colors.navBg,
          borderRight: `1px solid ${colors.divider}`,
          padding: '2rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          zIndex: 1000,
          transition: 'transform 0.3s ease',
        }}
      >
        <div style={{ flex: 1 }}>
          {/* Logo/Brand */}
          <div
            style={{
              marginBottom: '2rem',
              paddingBottom: '1.5rem',
              borderBottom: `1px solid ${colors.divider}`,
            }}
          >
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: colors.electric,
                margin: 0,
              }}
            >
              Keipr
            </h1>
          </div>

          {/* Navigation links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    textDecoration: 'none',
                    color: isActive ? colors.navActive : colors.navIcon,
                    backgroundColor: isActive ? `${colors.electric}20` : 'transparent',
                    transition: 'all 0.2s ease',
                    fontSize: '0.95rem',
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* User section at bottom */}
        <div
          style={{
            paddingTop: '1.5rem',
            borderTop: `1px solid ${colors.divider}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {user && (
            <div
              style={{
                paddingBottom: '1rem',
                borderBottom: `1px solid ${colors.divider}`,
              }}
            >
              <p
                style={{
                  fontSize: '0.875rem',
                  color: colors.textMuted,
                  margin: '0 0 0.5rem 0',
                }}
              >
                Signed in as
              </p>
              <p
                style={{
                  fontSize: '0.95rem',
                  color: colors.text,
                  margin: 0,
                  wordBreak: 'break-all',
                }}
              >
                {user.email}
              </p>
            </div>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSignOut}
            style={{
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <LogOut size={18} />
            Sign Out
          </Button>
        </div>
      </nav>

      {/* Main content */}
      <main
        className="app-main"
        style={{
          flex: 1,
          marginLeft: '280px',
          padding: '2rem',
          overflowY: 'auto',
        }}
      >
        {children}
      </main>

      <style>{`
        .app-layout {
          display: flex;
          min-height: 100vh;
          background-color: ${colors.background};
        }

        @media (max-width: 768px) {
          .mobile-menu-toggle {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }

          .sidebar-overlay {
            display: block !important;
          }

          .app-sidebar {
            transform: ${sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'};
          }

          .app-main {
            margin-left: 0 !important;
            padding-top: 4rem !important;
          }
        }
      `}</style>
    </div>
  );
}
