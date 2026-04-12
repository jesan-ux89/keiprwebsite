'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { aiAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Zap,
  CheckCircle,
  RefreshCw,
  Layers,
  TrendingUp,
  AlertCircle,
  Loader,
  Info,
} from 'lucide-react';

interface ToastMessage {
  text: string;
  type: 'success' | 'error';
}

export default function AISettingsPage() {
  const { colors, isDark } = useTheme();
  const { isUltra } = useApp();

  // State
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState<'categories' | 'budgets' | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Settings
  const [aiEnabled, setAiEnabled] = useState(true);
  const [smartMatchingEnabled, setSmartMatchingEnabled] = useState(true);
  const [categorySuggestionsEnabled, setCategorySuggestionsEnabled] = useState(true);
  const [budgetSuggestionsEnabled, setBudgetSuggestionsEnabled] = useState(true);
  const [categoryRulesCount, setCategoryRulesCount] = useState(0);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const settingsRes = await aiAPI.getSettings();
      const settings = settingsRes.data;
      setAiEnabled(settings?.aiEnabled ?? true);
      setSmartMatchingEnabled(settings?.smartMatchingEnabled ?? true);
      setCategorySuggestionsEnabled(settings?.categorySuggestionsEnabled ?? true);
      setBudgetSuggestionsEnabled(settings?.budgetSuggestionsEnabled ?? true);

      const rulesRes = await aiAPI.getCategoryRules();
      setCategoryRulesCount(rulesRes.data?.rules?.length ?? 0);
    } catch (err: any) {
      console.error('[AISettings] Failed to load settings:', err?.message);
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function updateSetting(setting: string, value: boolean) {
    try {
      await aiAPI.updateSettings({ [setting]: value });
      showToast('Settings saved', 'success');
    } catch (err: any) {
      console.error(`[AISettings] Failed to update ${setting}:`, err?.message);
      showToast('Failed to save settings', 'error');
    }
  }

  function handleToggleAI(value: boolean) {
    setAiEnabled(value);
    updateSetting('aiEnabled', value);
  }

  function handleToggleSmartMatching(value: boolean) {
    setSmartMatchingEnabled(value);
    updateSetting('smartMatchingEnabled', value);
  }

  function handleToggleCategorySuggestions(value: boolean) {
    setCategorySuggestionsEnabled(value);
    updateSetting('categorySuggestionsEnabled', value);
  }

  function handleToggleBudgetSuggestions(value: boolean) {
    setBudgetSuggestionsEnabled(value);
    updateSetting('budgetSuggestionsEnabled', value);
  }

  async function handleScanCategories() {
    try {
      setScanLoading('categories');
      const res = await aiAPI.scanCategories();
      const result = res.data;
      const count = result?.suggestionsCreated || 0;
      showToast(count > 0 ? `Found ${count} category suggestion${count !== 1 ? 's' : ''}` : 'No issues found — categories look good!', 'success');
      await loadSettings();
    } catch (err: any) {
      console.error('[AISettings] Scan categories failed:', err?.message);
      showToast(err?.response?.data?.error || 'Scan failed', 'error');
    } finally {
      setScanLoading(null);
    }
  }

  async function handleScanBudgets() {
    try {
      setScanLoading('budgets');
      const res = await aiAPI.scanBudgets();
      const result = res.data;
      const count = result?.suggestionsCreated || 0;
      showToast(count > 0 ? `Created ${count} budget suggestion${count !== 1 ? 's' : ''}` : 'No new budget suggestions', 'success');
      await loadSettings();
    } catch (err: any) {
      console.error('[AISettings] Scan budgets failed:', err?.message);
      showToast(err?.response?.data?.error || 'Scan failed', 'error');
    } finally {
      setScanLoading(null);
    }
  }

  function showToast(text: string, type: 'success' | 'error') {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size={32} style={{ color: colors.electric, animation: 'spin 1s linear infinite', margin: '2rem auto' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 1rem 2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link
          href="/app/settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            color: colors.textMuted,
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = colors.electric)}
          onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text, margin: 0 }}>
          AI Features
        </h1>
      </div>

      {/* Toast Message */}
      {toast && (
        <Card
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor:
              toast.type === 'error'
                ? `rgba(163, 45, 45, 0.1)`
                : `rgba(10, 123, 108, 0.1)`,
            borderColor:
              toast.type === 'error'
                ? 'rgba(163, 45, 45, 0.3)'
                : 'rgba(10, 123, 108, 0.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <p
              style={{
                color: toast.type === 'error' ? '#A32D2D' : '#0A7B6C',
                margin: 0,
                fontSize: '0.95rem',
                flex: 1,
              }}
            >
              {toast.text}
            </p>
            <button
              onClick={() => setToast(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: colors.textMuted,
                fontSize: '1.2rem',
              }}
            >
              ✕
            </button>
          </div>
        </Card>
      )}

      {/* AI Control Section */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <h3
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: colors.textMuted,
            margin: '0 0 1rem 0',
          }}
        >
          AI Control
        </h3>

        <ToggleRow
          label="AI Features"
          description="Enable AI-powered insights and automation"
          value={aiEnabled}
          onChange={handleToggleAI}
          icon={Zap}
          colors={colors}
        />
      </Card>

      {/* AI Features Section */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <h3
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: colors.textMuted,
            margin: '0 0 1rem 0',
          }}
        >
          Features
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <ToggleRow
            label="Smart Matching"
            description="AI helps identify which transactions match your bills"
            value={smartMatchingEnabled}
            onChange={handleToggleSmartMatching}
            disabled={!aiEnabled}
            icon={CheckCircle}
            colors={colors}
            divider
          />
          <ToggleRow
            label="Category Suggestions"
            description="Get suggestions when transactions may be miscategorized"
            value={categorySuggestionsEnabled}
            onChange={handleToggleCategorySuggestions}
            disabled={!aiEnabled}
            icon={RefreshCw}
            colors={colors}
            divider
          />
          <ToggleRow
            label="Budget Suggestions"
            description="AI creates spending budgets based on your patterns"
            value={budgetSuggestionsEnabled}
            onChange={handleToggleBudgetSuggestions}
            disabled={!aiEnabled}
            icon={TrendingUp}
            colors={colors}
          />
        </div>
      </Card>

      {/* On-Demand Scans Section (Ultra only) */}
      {isUltra && (
        <Card style={{ marginBottom: '1.5rem' }}>
          <h3
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: colors.textMuted,
              margin: '0 0 1rem 0',
            }}
          >
            On-Demand Scans
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button
              onClick={handleScanCategories}
              disabled={scanLoading === 'categories'}
              style={{
                padding: '1rem',
                backgroundColor: colors.inputBg,
                border: `1px solid ${colors.divider}`,
                borderRadius: '0.5rem',
                cursor: scanLoading === 'categories' ? 'not-allowed' : 'pointer',
                opacity: scanLoading === 'categories' ? 0.6 : 1,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <Layers size={20} style={{ color: colors.electric }} />
                <div style={{ textAlign: 'left' }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: colors.text,
                    }}
                  >
                    Scan Categories
                  </p>
                  <p
                    style={{
                      margin: '0.25rem 0 0 0',
                      fontSize: '0.875rem',
                      color: colors.textMuted,
                    }}
                  >
                    Categorize uncategorized transactions
                  </p>
                </div>
              </div>
              {scanLoading === 'categories' ? (
                <Loader
                  size={18}
                  style={{
                    color: colors.electric,
                    animation: 'spin 1s linear infinite',
                  }}
                />
              ) : (
                <span style={{ color: colors.textMuted, fontSize: '1.2rem' }}>›</span>
              )}
            </button>

            <button
              onClick={handleScanBudgets}
              disabled={scanLoading === 'budgets'}
              style={{
                padding: '1rem',
                backgroundColor: colors.inputBg,
                border: `1px solid ${colors.divider}`,
                borderRadius: '0.5rem',
                cursor: scanLoading === 'budgets' ? 'not-allowed' : 'pointer',
                opacity: scanLoading === 'budgets' ? 0.6 : 1,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <TrendingUp size={20} style={{ color: colors.electric }} />
                <div style={{ textAlign: 'left' }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: colors.text,
                    }}
                  >
                    Scan Budgets
                  </p>
                  <p
                    style={{
                      margin: '0.25rem 0 0 0',
                      fontSize: '0.875rem',
                      color: colors.textMuted,
                    }}
                  >
                    Generate budget suggestions from spending
                  </p>
                </div>
              </div>
              {scanLoading === 'budgets' ? (
                <Loader
                  size={18}
                  style={{
                    color: colors.electric,
                    animation: 'spin 1s linear infinite',
                  }}
                />
              ) : (
                <span style={{ color: colors.textMuted, fontSize: '1.2rem' }}>›</span>
              )}
            </button>
          </div>
        </Card>
      )}

      {/* Rules Section */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <h3
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: colors.textMuted,
            margin: '0 0 1rem 0',
          }}
        >
          Rules & Settings
        </h3>

        <Link
          href="/app/settings/merchant-rules"
          style={{ textDecoration: 'none' }}
        >
          <button
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: colors.inputBg,
              border: `1px solid ${colors.divider}`,
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget;
              target.style.backgroundColor = isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(12, 74, 110, 0.05)';
              target.style.borderColor = colors.electric;
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget;
              target.style.backgroundColor = colors.inputBg;
              target.style.borderColor = colors.divider;
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
              <Zap size={20} style={{ color: colors.electric }} />
              <div style={{ textAlign: 'left' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: colors.text,
                  }}
                >
                  My Category Rules
                </p>
                <p
                  style={{
                    margin: '0.25rem 0 0 0',
                    fontSize: '0.875rem',
                    color: colors.textMuted,
                  }}
                >
                  {categoryRulesCount} custom rule{categoryRulesCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <span style={{ color: colors.textMuted, fontSize: '1.2rem' }}>›</span>
          </button>
        </Link>
      </Card>

      {/* Privacy Section */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <h3
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: colors.textMuted,
            margin: '0 0 1rem 0',
          }}
        >
          Privacy
        </h3>

        <div
          style={{
            display: 'flex',
            gap: '1rem',
            padding: '1rem',
            backgroundColor: isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(12, 74, 110, 0.05)',
            borderRadius: '0.5rem',
            border: `1px solid ${colors.divider}`,
          }}
        >
          <Info size={20} style={{ color: colors.electric, flexShrink: 0, marginTop: '0.125rem' }} />
          <p
            style={{
              margin: 0,
              fontSize: '0.9rem',
              lineHeight: 1.6,
              color: colors.textMuted,
            }}
          >
            Your data stays private. AI features run on our servers and never share your
            financial data with third parties. The AI model does not train on your data.
          </p>
        </div>
      </Card>
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon: React.ElementType;
  colors: any;
  disabled?: boolean;
  divider?: boolean;
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
  icon: Icon,
  colors,
  disabled = false,
  divider = false,
}: ToggleRowProps) {
  return (
    <div
      style={{
        padding: '1rem 0',
        borderBottom: divider ? `1px solid ${colors.divider}` : 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
        <Icon
          size={20}
          style={{
            color: colors.electric,
            marginTop: '0.125rem',
            flexShrink: 0,
          }}
        />
        <div>
          <p
            style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: 500,
              color: disabled ? colors.textMuted : colors.text,
            }}
          >
            {label}
          </p>
          <p
            style={{
              margin: '0.25rem 0 0 0',
              fontSize: '0.875rem',
              color: colors.textMuted,
            }}
          >
            {description}
          </p>
        </div>
      </div>

      <label
        style={{
          position: 'relative',
          display: 'inline-flex',
          width: '3rem',
          height: '1.5rem',
          backgroundColor: value ? colors.electric : colors.cardBorder,
          borderRadius: '9999px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
          opacity: disabled ? 0.6 : 1,
          flexShrink: 0,
        }}
      >
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          style={{
            position: 'absolute',
            opacity: 0,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        />
        <span
          style={{
            position: 'absolute',
            top: '0.25rem',
            left: value ? '1.625rem' : '0.25rem',
            width: '1rem',
            height: '1rem',
            backgroundColor: '#fff',
            borderRadius: '50%',
            transition: 'left 0.2s',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          }}
        />
      </label>
    </div>
  );
}
