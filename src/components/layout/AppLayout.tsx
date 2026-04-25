'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { aiAPI } from '@/lib/api';
import {
  LayoutDashboard,
  Receipt,
  CheckSquare,
  Calendar,
  Settings,
  Landmark,
  CreditCard,
  BarChart3,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Shield,
  Users,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '../ui/Button';

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  section: string;
  hasBadge?: boolean;
};

// Free/Pro: Dashboard, Bills, Tracker, Plan, Settings
const FREE_PRO_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/app', icon: LayoutDashboard, section: 'Overview' },
  { label: 'Expenses', href: '/app/bills', icon: Receipt, section: 'Planning' },
  { label: 'Tracker', href: '/app/tracker', icon: CheckSquare, section: 'Planning' },
  { label: 'Plan', href: '/app/plan', icon: Calendar, section: 'Planning' },
];

// Ultra: Dashboard, Accounts, Transactions, Budget, Tracker, Reports
const ULTRA_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/app', icon: LayoutDashboard, section: 'Overview' },
  { label: 'Accounts', href: '/app/banking', icon: Landmark, section: 'Overview' },
  { label: 'Transactions', href: '/app/banking/transactions', icon: CreditCard, section: 'Overview' },
  { label: 'Budget', href: '/app/bills', icon: BarChart3, section: 'Planning', hasBadge: true },
  { label: 'Tracker', href: '/app/tracker', icon: CheckSquare, section: 'Planning' },
  { label: 'Reports', href: '/app/reports', icon: TrendingUp, section: 'Insights' },
];

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  showMonthNav?: boolean;
  topBarActions?: React.ReactNode;
}

export default function AppLayout({
  children,
  pageTitle,
  showMonthNav = false,
  topBarActions,
}: AppLayoutProps) {
  const { colors, isDark, setThemeMode } = useTheme();
  const { user, loading, signOut } = useAuth();
  const { incomeSources, incomeLoading, incomeFetchSucceeded, isUltra, isPro, detectedCount, initialDataLoaded } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [aiSettingsAvailable, setAiSettingsAvailable] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Redirect to onboarding if user has no income sources (not already on onboarding page)
  // Wait for initialDataLoaded AND incomeFetchSucceeded to prevent false redirect
  // when the API call fails (e.g., rate limiting, network error)
  useEffect(() => {
    if (!loading && initialDataLoaded && incomeFetchSucceeded && user && !pathname.startsWith('/onboarding')) {
      if (incomeSources.length === 0) {
        router.push('/onboarding/pay-schedule');
      }
    }
  }, [user, loading, initialDataLoaded, incomeFetchSucceeded, incomeSources, pathname, router]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Check if AI Settings and Admin features are available
  useEffect(() => {
    if (!loading && user) {
      // Check AI settings availability
      aiAPI.getSettings().then(() => setAiSettingsAvailable(true)).catch(() => setAiSettingsAvailable(false));

      // Check admin access
      aiAPI.adminGetSettings().then(() => setIsAdmin(true)).catch(() => setIsAdmin(false));
    }
  }, [user, loading]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Get tier badge text
  const getTierBadge = () => {
    if (isUltra) return 'Ultra';
    if (isPro) return 'Pro';
    return 'Free';
  };

  // Get initials for avatar
  const getInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  // Handle month navigation
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthString = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const sidebarDivider = isDark ? colors.divider : 'rgba(255,255,255,0.10)';
  const sidebarText = isDark ? colors.text : '#FFFFFF';
  const sidebarFaint = isDark ? colors.textFaint : 'rgba(255,255,255,0.42)';
  const sidebarTierBg = isDark ? `${colors.electric}1F` : 'rgba(125,211,252,0.14)';

  // Group nav items by section
  const navItems = isUltra ? ULTRA_NAV : FREE_PRO_NAV;
  const sections = [...new Set(navItems.map(item => item.section))];

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
          borderRadius: '0.5rem',
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
          width: '240px',
          backgroundColor: colors.navBg,
          borderRight: `1px solid ${sidebarDivider}`,
          padding: '1.5rem 1rem',
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
          {/* Logo/Brand with Tier Badge */}
          <div
            style={{
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: `1px solid ${sidebarDivider}`,
            }}
          >
            <h1
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: sidebarText,
                margin: 0,
                marginBottom: '0.5rem',
                letterSpacing: '-0.03em',
              }}
            >
              keipr
            </h1>
            {/* Tier Badge */}
            <div
              style={{
                display: 'inline-block',
                padding: '0.25rem 0.5rem',
                backgroundColor: sidebarTierBg,
                color: colors.electric,
                borderRadius: '0.375rem',
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {getTierBadge()}
            </div>
          </div>

          {/* Navigation sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {sections.map((section) => (
              <div key={section}>
                {/* Section label */}
                <div
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: sidebarFaint,
                    marginBottom: '0.75rem',
                    paddingLeft: '0.5rem',
                  }}
                >
                  {section}
                </div>

                {/* Section items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {navItems
                    .filter(item => item.section === section)
                    .map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          style={{
                            padding: '0.55rem 0.75rem',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            textDecoration: 'none',
                            color: isActive ? colors.navActive : colors.navIcon,
                            backgroundColor: isActive ? `${colors.electric}15` : 'transparent',
                            transition: 'all 0.2s ease',
                            fontSize: '0.85rem',
                            fontWeight: isActive ? 600 : 500,
                            position: 'relative',
                          }}
                        >
                          <Icon size={18} />
                          <span style={{ flex: 1 }}>{item.label}</span>
                          {item.hasBadge && detectedCount > 0 && (
                            <span
                              style={{
                                minWidth: '18px',
                                height: '18px',
                                borderRadius: '4px',
                                backgroundColor: '#EF4444',
                                color: '#fff',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {detectedCount > 9 ? '9+' : detectedCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* Settings and AI section at bottom */}
        <div style={{
          paddingTop: '1rem',
          borderTop: `1px solid ${sidebarDivider}`,
          marginBottom: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
        }}>
          {/* Settings */}
          <Link
            href="/app/settings"
            onClick={() => setSidebarOpen(false)}
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              textDecoration: 'none',
              color: pathname.startsWith('/app/settings') ? colors.navActive : colors.navIcon,
              backgroundColor: pathname.startsWith('/app/settings') ? `${colors.electric}15` : 'transparent',
              transition: 'all 0.2s ease',
              fontSize: '0.85rem',
              fontWeight: pathname.startsWith('/app/settings') ? 600 : 500,
            }}
          >
            <Settings size={18} />
            Settings
          </Link>

          {/* AI Assistant (if available) */}
          {aiSettingsAvailable && (
            <Link
              href="/app/settings/ai"
              onClick={() => setSidebarOpen(false)}
              style={{
                padding: '0.55rem 0.75rem',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                textDecoration: 'none',
                color: pathname.startsWith('/app/settings/ai') ? colors.navActive : colors.navIcon,
                backgroundColor: pathname.startsWith('/app/settings/ai') ? `${colors.electric}15` : 'transparent',
                transition: 'all 0.2s ease',
                fontSize: '0.85rem',
                fontWeight: pathname.startsWith('/app/settings/ai') ? 600 : 500,
              }}
            >
              <Sparkles size={18} />
              AI Assistant
            </Link>
          )}
        </div>

        {/* Admin section (if admin) */}
        {isAdmin && (
          <div style={{
            paddingTop: '1rem',
            borderTop: `1px solid ${sidebarDivider}`,
            marginBottom: '1rem',
          }}>
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: sidebarFaint,
                marginBottom: '0.75rem',
                paddingLeft: '0.5rem',
              }}
            >
              Admin
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <Link
                href="/app/admin"
                onClick={() => setSidebarOpen(false)}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  textDecoration: 'none',
                  color: pathname === '/app/admin' ? colors.navActive : colors.navIcon,
                  backgroundColor: pathname === '/app/admin' ? `${colors.electric}15` : 'transparent',
                  transition: 'all 0.2s ease',
                  fontSize: '0.85rem',
                  fontWeight: pathname === '/app/admin' ? 600 : 500,
                }}
              >
                <Users size={18} />
                User Management
              </Link>
              <Link
                href="/app/admin/ai"
                onClick={() => setSidebarOpen(false)}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  textDecoration: 'none',
                  color: pathname.startsWith('/app/admin/ai') && !pathname.startsWith('/app/admin/ai/users') ? colors.navActive : colors.navIcon,
                  backgroundColor: pathname.startsWith('/app/admin/ai') && !pathname.startsWith('/app/admin/ai/users') ? `${colors.electric}15` : 'transparent',
                  transition: 'all 0.2s ease',
                  fontSize: '0.85rem',
                  fontWeight: pathname.startsWith('/app/admin/ai') && !pathname.startsWith('/app/admin/ai/users') ? 600 : 500,
                }}
              >
                <Sparkles size={18} />
                AI Dashboard
              </Link>
              <Link
                href="/app/admin/ai/users"
                onClick={() => setSidebarOpen(false)}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  textDecoration: 'none',
                  color: pathname.startsWith('/app/admin/ai/users') ? colors.navActive : colors.navIcon,
                  backgroundColor: pathname.startsWith('/app/admin/ai/users') ? `${colors.electric}15` : 'transparent',
                  transition: 'all 0.2s ease',
                  fontSize: '0.85rem',
                  fontWeight: pathname.startsWith('/app/admin/ai/users') ? 600 : 500,
                }}
              >
                <Shield size={18} />
                AI Users
              </Link>
            </div>
          </div>
        )}

        {/* User section at bottom */}
        {user && (
          <div
            style={{
              paddingTop: '1rem',
              borderTop: `1px solid ${sidebarDivider}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {/* Avatar + Name + Email */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              paddingBottom: '0.75rem',
              borderBottom: `1px solid ${sidebarDivider}`,
            }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: colors.electric,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {getInitials()}
              </div>
              <div style={{
                flex: 1,
                minWidth: 0,
              }}>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: colors.textMuted,
                    margin: 0,
                    marginBottom: '0.25rem',
                  }}
                >
                  Signed in as
                </p>
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: sidebarText,
                    margin: 0,
                    wordBreak: 'break-all',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.email}
                </p>
              </div>
            </div>

            {/* Sign out button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSignOut}
              style={{
                width: '100%',
                justifyContent: 'center',
                fontSize: '0.85rem',
              }}
            >
              <LogOut size={16} />
              Sign Out
            </Button>
          </div>
        )}
      </nav>

      {/* Right side: topbar + scrollable content */}
      <div
        className="app-right"
        style={{
          marginLeft: '240px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top Bar */}
        <header
          className="app-topbar"
          style={{
            height: '56px',
            minHeight: '56px',
            backgroundColor: `${colors.background}D9`,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${colors.divider}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: '2rem',
            paddingRight: '2rem',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          {/* Left: Page Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: colors.text,
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              {pageTitle || 'Dashboard'}
            </h2>
          </div>

          {/* Center: Month Navigation */}
          {showMonthNav ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.15rem',
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: '0.5rem',
                  padding: '0.3rem 0.15rem',
                }}
              >
                <button
                  onClick={handlePrevMonth}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: colors.textMuted,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                    fontSize: '0.85rem',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = colors.text; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = colors.textMuted; e.currentTarget.style.background = 'none'; }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: colors.text,
                    minWidth: '110px',
                    textAlign: 'center',
                  }}
                >
                  {monthString}
                </span>
                <button
                  onClick={handleNextMonth}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: colors.textMuted,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                    fontSize: '0.85rem',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = colors.text; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = colors.textMuted; e.currentTarget.style.background = 'none'; }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div />
          )}

          {/* Right: Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                height: '40px',
                padding: '0 0.85rem',
                borderRadius: '999px',
                border: `1px solid ${colors.cardBorder}`,
                background: colors.card,
                color: colors.text,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 700,
                boxShadow: isDark ? 'none' : '0 8px 20px rgba(26,24,20,0.08)',
              }}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
              <span className="theme-toggle-label">{isDark ? 'Light' : 'Dark'}</span>
            </button>
            {topBarActions}
          </div>
        </header>

        {/* Main content */}
        <main
          className="app-main"
          style={{
            padding: '2rem',
            flex: 1,
          }}
        >
          {children}
        </main>
      </div>

      <style>{`
        .app-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background-color: ${colors.background};
          position: relative;
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

          .app-right {
            margin-left: 0 !important;
          }

          .theme-toggle-label {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * TwoColumnLayout — Helper component for pages that need a main content + right sidebar
 */
export function TwoColumnLayout({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: sidebar ? '1fr 340px' : '1fr',
        gap: '2rem',
        alignItems: 'start',
      }}
    >
      {/* Main content column */}
      <div>
        {children}
      </div>

      {/* Right sidebar column */}
      {sidebar && (
        <div
          style={{
            position: 'sticky',
            top: '80px',
          }}
        >
          {sidebar}
        </div>
      )}

      {/* Responsive stacking */}
      <style>{`
        @media (max-width: 1100px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }

          div[style*="position: sticky"] {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}
