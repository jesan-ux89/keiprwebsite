'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { usersAPI, exportAPI, subscriptionsAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Plus,
  Edit2,
  Trash2,
  Lock,
  CreditCard,
  Download,
  AlertTriangle,
  ChevronRight,
  Check,
} from 'lucide-react';

interface IncomeSourceForm {
  id?: string;
  name: string;
  amount: string;
  frequency: 'weekly' | 'biweekly' | 'twicemonthly' | 'monthly';
  nextPayDate: string;
}

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'twicemonthly', label: 'Twice Monthly' },
  { value: 'monthly', label: 'Monthly' },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

const TIERS = [
  {
    key: 'free',
    name: 'Free',
    monthlyPrice: '$0',
    annualPrice: '$0',
    monthlyLabel: 'Free forever',
    annualLabel: 'Free forever',
    monthlyPlanKey: null,
    annualPlanKey: null,
    features: ['1 income source', '1 split', '1 month planning'],
  },
  {
    key: 'pro',
    name: 'Pro',
    monthlyPrice: '$7.99',
    annualPrice: '$6.99',
    monthlyLabel: '/month',
    annualLabel: '/month, billed annually',
    monthlyPlanKey: 'pro_monthly',
    annualPlanKey: 'pro_annual',
    features: ['Unlimited income sources', 'Unlimited splits', 'Unlimited planning', 'Data export', 'Trends'],
  },
  {
    key: 'ultra',
    name: 'Ultra',
    monthlyPrice: '$11.99',
    annualPrice: '$10.99',
    monthlyLabel: '/month',
    annualLabel: '/month, billed annually',
    monthlyPlanKey: 'ultra_monthly',
    annualPlanKey: 'ultra_annual',
    features: ['Everything in Pro', 'Connected banking via Plaid', 'Bill suggestions', 'Transaction matching'],
  },
];

export default function SettingsPage() {
  const { colors } = useTheme();
  const { themeMode, setThemeMode } = useTheme();
  const { incomeSources, currency, setCurrencyCode, addIncomeSource, updateIncomeSource, deleteIncomeSource, setPrimaryIncomeSource, refreshIncomeSources, fmt } = useApp();
  const { user, signOut } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [displayNameEdit, setDisplayNameEdit] = useState(false);

  const [incomeForm, setIncomeForm] = useState<IncomeSourceForm>({
    name: '',
    amount: '',
    frequency: 'biweekly',
    nextPayDate: '',
  });
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeLoading, setIncomeLoading] = useState(false);

  const [fundName, setFundName] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundLoading, setFundLoading] = useState(false);

  // Fund detail (allocation tracking)
  const [expandedFundId, setExpandedFundId] = useState<string | null>(null);
  const [fundAllocations, setFundAllocations] = useState<any[]>([]);
  const [fundAllocLoading, setFundAllocLoading] = useState(false);
  const [allocName, setAllocName] = useState('');
  const [allocAmount, setAllocAmount] = useState('');
  const [allocError, setAllocError] = useState<string | null>(null);
  const [allocSaving, setAllocSaving] = useState(false);
  const [showAllocForm, setShowAllocForm] = useState(false);

  const searchParams = useSearchParams();
  const initialSection = searchParams.get('section') || 'profile';
  const [expandedSection, setExpandedSection] = useState<string | null>(initialSection);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Subscription state
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [subStatus, setSubStatus] = useState<any>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  // Load subscription status when subscription section opens
  useEffect(() => {
    if (expandedSection === 'subscription') {
      loadSubStatus();
    }
  }, [expandedSection]);

  const loadSubStatus = async () => {
    try {
      const res = await subscriptionsAPI.getStatus();
      setSubStatus(res.data);
    } catch (err) {
      console.error('Failed to load subscription status:', err);
    }
  };

  const handleCheckout = async (planKey: string) => {
    setCheckoutLoading(planKey);
    try {
      const res = await subscriptionsAPI.checkout(planKey);
      if (res.data?.checkoutUrl) {
        window.open(res.data.checkoutUrl, '_blank');
      }
    } catch (err: any) {
      console.error('Checkout failed:', err);
      alert(err?.response?.data?.error || 'Failed to start checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setSubLoading(true);
    try {
      const res = await subscriptionsAPI.getPortal();
      if (res.data?.customerPortalUrl) {
        window.open(res.data.customerPortalUrl, '_blank');
      }
    } catch (err: any) {
      console.error('Portal failed:', err);
      alert(err?.response?.data?.error || 'Failed to open subscription management');
    } finally {
      setSubLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You\'ll keep access until the end of your billing period.')) return;
    setSubLoading(true);
    try {
      const res = await subscriptionsAPI.cancel();
      alert(res.data?.message || 'Subscription cancelled.');
      await loadSubStatus();
    } catch (err: any) {
      console.error('Cancel failed:', err);
      alert(err?.response?.data?.error || 'Failed to cancel subscription');
    } finally {
      setSubLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    setSubLoading(true);
    try {
      await subscriptionsAPI.resume();
      await loadSubStatus();
    } catch (err: any) {
      console.error('Resume failed:', err);
      alert(err?.response?.data?.error || 'Failed to resume subscription');
    } finally {
      setSubLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleAddIncome = async () => {
    if (!incomeForm.name || !incomeForm.amount || !incomeForm.nextPayDate) {
      alert('Please fill in all fields');
      return;
    }

    setIncomeLoading(true);
    try {
      await addIncomeSource({
        name: incomeForm.name,
        typicalAmount: parseFloat(incomeForm.amount),
        frequency: incomeForm.frequency,
        nextPayDate: incomeForm.nextPayDate,
      });
      setIncomeForm({ name: '', amount: '', frequency: 'biweekly', nextPayDate: '' });
      setShowIncomeModal(false);
    } catch (error) {
      console.error('Failed to add income source:', error);
      alert('Failed to add income source');
    } finally {
      setIncomeLoading(false);
    }
  };

  const handleEditIncome = (source: typeof incomeSources[0]) => {
    setIncomeForm({
      id: source.id,
      name: source.name,
      amount: source.typicalAmount.toString(),
      frequency: source.frequency as IncomeSourceForm['frequency'],
      nextPayDate: source.nextPayDate || '',
    });
    setShowIncomeModal(true);
  };

  const handleUpdateIncome = async () => {
    if (!incomeForm.id || !incomeForm.name || !incomeForm.amount || !incomeForm.nextPayDate) {
      alert('Please fill in all fields');
      return;
    }

    // Check if this is the primary income and schedule/payday changed
    const original = incomeSources.find(s => s.id === incomeForm.id);
    const isPrimarySource = original?.isPrimary || (!incomeSources.some(s => s.isPrimary) && incomeSources[0]?.id === incomeForm.id);
    const scheduleChanged = original?.frequency !== incomeForm.frequency;
    const payDateChanged = (original?.nextPayDate || '') !== incomeForm.nextPayDate;

    if (isPrimarySource && (scheduleChanged || payDateChanged)) {
      const changes: string[] = [];
      if (scheduleChanged) changes.push(`pay frequency to ${FREQUENCIES.find(f => f.value === incomeForm.frequency)?.label || incomeForm.frequency}`);
      if (payDateChanged) changes.push(`next pay date to ${incomeForm.nextPayDate}`);
      const confirmed = window.confirm(
        `You're updating your primary income's ${changes.join(' and ')}.\n\nThis will recalculate your pay periods, which affects which bills appear in each paycheck across your dashboard, tracker, and plan.`
      );
      if (!confirmed) return;
    }

    setIncomeLoading(true);
    try {
      await updateIncomeSource(incomeForm.id, {
        name: incomeForm.name,
        typicalAmount: parseFloat(incomeForm.amount),
        frequency: incomeForm.frequency,
        nextPayDate: incomeForm.nextPayDate,
      });
      setIncomeForm({ name: '', amount: '', frequency: 'biweekly', nextPayDate: '' });
      setShowIncomeModal(false);
    } catch (error) {
      console.error('Failed to update income source:', error);
      alert('Failed to update income source');
    } finally {
      setIncomeLoading(false);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    const source = incomeSources.find(s => s.id === id);
    const isPrimary = source?.isPrimary;
    const remaining = incomeSources.filter(s => s.id !== id);
    const message = isPrimary && remaining.length > 0
      ? `This is your primary income source. Removing it will make "${remaining[0].name}" your new primary, which will change your pay schedule and bill timing across the app. Continue?`
      : 'Are you sure you want to delete this income source?';

    if (!window.confirm(message)) return;

    try {
      await deleteIncomeSource(id);
    } catch (error) {
      console.error('Failed to delete income source:', error);
      alert('Failed to delete income source');
    }
  };

  const handleSetPrimary = async (id: string) => {
    const source = incomeSources.find(s => s.id === id);
    const currentPrimary = incomeSources.find(s => s.isPrimary) || incomeSources[0];
    if (!source || source.id === currentPrimary?.id) return;

    const freqLabel = FREQUENCIES.find(f => f.value === source.frequency)?.label || source.frequency;
    const confirmed = window.confirm(
      `Setting "${source.name}" as your primary will change your pay schedule across the entire app.\n\nYour dashboard, tracker, and plan will recalculate around "${source.name}"'s pay dates and frequency (${freqLabel}).\n\nThis affects which bills appear in each paycheck period.`
    );
    if (!confirmed) return;

    try {
      await setPrimaryIncomeSource(id);
    } catch (error) {
      console.error('Failed to set primary income source:', error);
      alert('Failed to set primary income source');
    }
  };

  const handleAddFund = async () => {
    if (!fundName || !fundAmount) {
      alert('Please fill in all fields');
      return;
    }

    setFundLoading(true);
    try {
      await addIncomeSource({
        name: fundName,
        typicalAmount: parseFloat(fundAmount),
        frequency: 'monthly',
        isOneTime: true,
      });
      setFundName('');
      setFundAmount('');
      setShowFundModal(false);
    } catch (error) {
      console.error('Failed to add one-time fund:', error);
      alert('Failed to add one-time fund');
    } finally {
      setFundLoading(false);
    }
  };

  const handleDeleteFund = async (id: string) => {
    if (!window.confirm('Remove this one-time fund?')) return;

    try {
      await deleteIncomeSource(id);
    } catch (error) {
      console.error('Failed to delete one-time fund:', error);
      alert('Failed to delete one-time fund');
    }
  };

  // Fund allocation handlers
  const loadFundAllocations = async (fundId: string) => {
    setFundAllocLoading(true);
    try {
      const res = await usersAPI.getFundAllocations(fundId);
      setFundAllocations(res.data?.allocations || []);
    } catch (err) {
      console.error('Failed to load fund allocations:', err);
      setFundAllocations([]);
    } finally {
      setFundAllocLoading(false);
    }
  };

  const toggleFundDetail = (fundId: string) => {
    if (expandedFundId === fundId) {
      setExpandedFundId(null);
      setFundAllocations([]);
      setShowAllocForm(false);
    } else {
      setExpandedFundId(fundId);
      loadFundAllocations(fundId);
      setShowAllocForm(false);
      setAllocError(null);
    }
  };

  const handleAddAllocation = async (fundId: string, fundTotal: number) => {
    setAllocError(null);
    const name = allocName.trim();
    const amount = parseFloat(allocAmount);
    const totalAllocated = fundAllocations.reduce((s: number, a: any) => s + parseFloat(a.amount), 0);
    const remaining = fundTotal - totalAllocated;

    if (!name) { setAllocError('Enter a name for this item.'); return; }
    if (isNaN(amount) || amount <= 0) { setAllocError('Enter a valid amount.'); return; }
    if (amount > remaining + 0.01) { setAllocError(`Amount exceeds remaining balance of ${fmt(remaining)}.`); return; }

    setAllocSaving(true);
    try {
      const res = await usersAPI.addFundAllocation(fundId, { name, amount });
      const newAlloc = res.data?.allocation;
      if (newAlloc) setFundAllocations(prev => [...prev, newAlloc]);
      setAllocName('');
      setAllocAmount('');
      setShowAllocForm(false);
    } catch (err: any) {
      setAllocError(err?.response?.data?.error || 'Failed to add item.');
    } finally {
      setAllocSaving(false);
    }
  };

  const handleDeleteAllocation = async (fundId: string, allocId: string) => {
    setFundAllocations(prev => prev.filter(a => a.id !== allocId));
    try {
      await usersAPI.deleteFundAllocation(fundId, allocId);
    } catch (err) {
      console.error('Failed to delete allocation:', err);
      loadFundAllocations(fundId);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      await exportAPI.requestExport();
      alert('Export requested! Check your email for the download link.');
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to request export');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you absolutely sure? This action cannot be undone.')) return;
    setDeleteLoading(true);
    try {
      await usersAPI.deleteAccount();
      await signOut();
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: colors.text, margin: 0 }}>
          Settings
        </h1>
        <p style={{ color: colors.textMuted, margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => toggleSection('profile')}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            marginBottom: expandedSection === 'profile' ? '1.5rem' : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Settings size={20} style={{ color: colors.electric }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
              Profile
            </h2>
          </div>
          <ChevronRight
            size={20}
            style={{
              color: colors.textMuted,
              transform: expandedSection === 'profile' ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        {expandedSection === 'profile' && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: colors.textMuted, fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                Email
              </label>
              <p style={{ color: colors.text, fontSize: '1rem', margin: 0, fontWeight: 500 }}>
                {user?.email}
              </p>
            </div>

            <div>
              <label style={{ color: colors.textMuted, fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                Display Name
              </label>
              {displayNameEdit ? (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={async () => {
                      try {
                        await usersAPI.updateProfile({ fullName: displayName.trim() });
                        setDisplayNameEdit(false);
                      } catch (err) {
                        console.error('Failed to save display name:', err);
                        alert('Failed to save display name');
                      }
                    }}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ color: colors.text, fontSize: '1rem', margin: 0, fontWeight: 500 }}>
                    {displayName || 'Not set'}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDisplayNameEdit(true)}
                    style={{ color: colors.electric }}
                  >
                    <Edit2 size={16} />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </Card>

      {/* Theme Section */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => toggleSection('theme')}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            marginBottom: expandedSection === 'theme' ? '1.5rem' : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Moon size={20} style={{ color: colors.electric }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
              Theme
            </h2>
          </div>
          <ChevronRight
            size={20}
            style={{
              color: colors.textMuted,
              transform: expandedSection === 'theme' ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        {expandedSection === 'theme' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { id: 'system', label: 'System', icon: Monitor },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'light', label: 'Light', icon: Sun },
            ].map(({ id, label, icon: Icon }) => (
              <label
                key={id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem',
                  backgroundColor: colors.background,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  border: themeMode === id ? `2px solid ${colors.electric}` : `1px solid ${colors.divider}`,
                }}
              >
                <input
                  type="radio"
                  name="theme"
                  value={id}
                  checked={themeMode === id}
                  onChange={(e) => setThemeMode(e.target.value as any)}
                  style={{ marginRight: '0.75rem', cursor: 'pointer' }}
                />
                <Icon size={18} style={{ marginRight: '0.5rem', color: colors.textMuted }} />
                <span style={{ color: colors.text, fontWeight: 500 }}>{label}</span>
              </label>
            ))}
          </div>
        )}
      </Card>

      {/* Currency Section */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => toggleSection('currency')}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            marginBottom: expandedSection === 'currency' ? '1.5rem' : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CreditCard size={20} style={{ color: colors.electric }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
              Currency
            </h2>
          </div>
          <ChevronRight
            size={20}
            style={{
              color: colors.textMuted,
              transform: expandedSection === 'currency' ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        {expandedSection === 'currency' && (
          <select
            value={currency.code}
            onChange={(e) => setCurrencyCode(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: colors.inputBg,
              border: `1px solid ${colors.inputBorder}`,
              borderRadius: '0.5rem',
              color: colors.text,
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            {CURRENCIES.map(({ code, name }) => (
              <option key={code} value={code}>
                {name} ({code})
              </option>
            ))}
          </select>
        )}
      </Card>

      {/* Income Sources Section */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => toggleSection('income')}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            marginBottom: expandedSection === 'income' ? '1.5rem' : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CreditCard size={20} style={{ color: colors.electric }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
              Income Sources
            </h2>
          </div>
          <ChevronRight
            size={20}
            style={{
              color: colors.textMuted,
              transform: expandedSection === 'income' ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        {expandedSection === 'income' && (
          <>
            {/* Primary income explainer */}
            {incomeSources.length > 0 && (
              <p style={{
                fontSize: '0.8rem',
                color: colors.textMuted,
                lineHeight: 1.5,
                margin: '0 0 0.75rem 0',
                padding: '0.625rem 0.75rem',
                backgroundColor: 'rgba(56,189,248,0.06)',
                borderRadius: '0.5rem',
                border: '0.5px solid rgba(56,189,248,0.15)',
              }}>
                Your <span style={{ fontWeight: 600, color: '#38BDF8' }}>primary</span> income drives the pay schedule across the app &mdash; dashboard, tracker, and plan all organize bills around its pay dates.
                {incomeSources.length > 1 ? ' Secondary incomes add to your per-paycheck totals.' : ''}
              </p>
            )}

            {incomeSources.filter(s => !s.isOneTime).length === 0 ? (
              <p style={{ color: colors.textMuted, margin: '0 0 1rem 0' }}>
                No income sources yet. Add one to get started.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                {incomeSources.filter(s => !s.isOneTime).map((source) => (
                  <div
                    key={source.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      backgroundColor: colors.background,
                      borderRadius: '0.5rem',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <p style={{ color: colors.text, fontWeight: 500, margin: 0, fontSize: '0.95rem' }}>
                          {source.name}
                        </p>
                        {source.isPrimary && (
                          <span style={{
                            backgroundColor: 'rgba(56,189,248,0.12)',
                            color: '#38BDF8',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            border: '0.5px solid rgba(56,189,248,0.25)',
                          }}>Primary</span>
                        )}
                      </div>
                      <p style={{ color: colors.textMuted, margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                        {FREQUENCIES.find((f) => f.value === source.frequency)?.label} • Next: {source.nextPayDate ? new Date(source.nextPayDate + 'T00:00:00').toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                      <p style={{ color: colors.text, fontWeight: 600, margin: 0 }}>
                        {fmt(source.typicalAmount ?? 0)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditIncome(source)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      {incomeSources.filter(s => !s.isOneTime).length > 1 && !source.isPrimary && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSetPrimary(source.id)}
                          style={{ color: '#38BDF8', borderColor: 'rgba(56,189,248,0.3)' }}
                        >
                          Set Primary
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteIncome(source.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setIncomeForm({ name: '', amount: '', frequency: 'biweekly', nextPayDate: '' });
                setShowIncomeModal(true);
              }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Plus size={18} />
              Add Income Source
            </Button>
          </>
        )}
      </Card>

      {/* One-Time Funds Section */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => toggleSection('funds')}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            marginBottom: expandedSection === 'funds' ? '1.5rem' : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CreditCard size={20} style={{ color: '#0A7B6C' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
              One-Time Funds
            </h2>
          </div>
          <ChevronRight
            size={20}
            style={{
              color: colors.textMuted,
              transform: expandedSection === 'funds' ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        {expandedSection === 'funds' && (
          <>
            {/* Info box */}
            <p style={{
              fontSize: '0.8rem',
              color: colors.textMuted,
              lineHeight: 1.5,
              margin: '0 0 0.75rem 0',
              padding: '0.625rem 0.75rem',
              backgroundColor: 'rgba(10,123,108,0.06)',
              borderRadius: '0.5rem',
              border: '0.5px solid rgba(10,123,108,0.15)',
            }}>
              Track one-time money like tax refunds, bonuses, or loan proceeds separately from your regular budget. Funds won't affect your paycheck calculations.
            </p>

            {incomeSources.filter(s => s.isOneTime).length === 0 ? (
              <p style={{ color: colors.textMuted, margin: '0 0 1rem 0' }}>
                No one-time funds yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                {incomeSources.filter(s => s.isOneTime).map((fund) => {
                  const isExpanded = expandedFundId === fund.id;
                  const totalAllocated = isExpanded ? fundAllocations.reduce((s: number, a: any) => s + parseFloat(a.amount), 0) : 0;
                  const remaining = (fund.typicalAmount ?? 0) - totalAllocated;
                  const isFullySpent = isExpanded && remaining < 0.01;
                  const spentPct = (fund.typicalAmount ?? 0) > 0 ? Math.min(100, Math.round((totalAllocated / (fund.typicalAmount ?? 1)) * 100)) : 0;

                  return (
                  <div
                    key={fund.id}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: colors.background,
                      borderRadius: '0.5rem',
                      border: isExpanded ? '1px solid rgba(10,123,108,0.2)' : 'none',
                    }}
                  >
                    {/* Fund header row — clickable */}
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => toggleFundDetail(fund.id)}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.1rem' }}>💰</span>
                          <p style={{ color: colors.text, fontWeight: 500, margin: 0, fontSize: '0.95rem' }}>
                            {fund.name}
                          </p>
                          <span style={{
                            backgroundColor: isFullySpent ? 'rgba(10,123,108,0.12)' : 'rgba(10,123,108,0.12)',
                            color: '#0A7B6C',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            border: '0.5px solid rgba(10,123,108,0.25)',
                          }}>{isFullySpent ? 'Fully spent' : 'One-time'}</span>
                        </div>
                        <p style={{ color: colors.textMuted, margin: '0.25rem 0 0 1.6rem', fontSize: '0.8rem' }}>
                          {isExpanded ? `${fundAllocations.length} item${fundAllocations.length !== 1 ? 's' : ''} · Click to collapse` : 'Click to view spending'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                        <p style={{ color: '#0A7B6C', fontWeight: 600, margin: 0 }}>
                          {fmt(fund.typicalAmount ?? 0)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDeleteFund(fund.id); }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: `1px solid ${colors.cardBorder}` }}>
                        {fundAllocLoading ? (
                          <p style={{ color: colors.textMuted, fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>Loading...</p>
                        ) : (
                          <>
                            {/* Summary bar */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                              <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: colors.text }}>{fmt(fund.typicalAmount ?? 0)}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Spent</div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#A32D2D' }}>{fmt(totalAllocated)}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Remaining</div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: isFullySpent ? '#0A7B6C' : '#854F0B' }}>{fmt(remaining)}</div>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div style={{ height: '4px', backgroundColor: colors.progressTrack || colors.cardBorder, borderRadius: '2px', overflow: 'hidden', marginBottom: '1rem' }}>
                              <div style={{ height: '100%', width: `${spentPct}%`, backgroundColor: isFullySpent ? '#0A7B6C' : spentPct > 80 ? '#854F0B' : '#38BDF8', borderRadius: '2px' }} />
                            </div>

                            {/* Allocation items */}
                            {fundAllocations.length === 0 ? (
                              <p style={{ color: colors.textMuted, fontSize: '0.85rem', textAlign: 'center', padding: '0.75rem 0' }}>
                                No spending items yet. Click below to start spending from this fund.
                              </p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                {fundAllocations.map((alloc: any) => (
                                  <div key={alloc.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '0.6rem 0.75rem', backgroundColor: colors.card, borderRadius: '0.5rem',
                                    border: `0.5px solid ${colors.cardBorder}`,
                                  }}>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: '0.85rem', fontWeight: 500, color: colors.text }}>{alloc.name}</div>
                                      <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>
                                        {new Date(alloc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </div>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#A32D2D', marginRight: '0.75rem' }}>{fmt(parseFloat(alloc.amount))}</div>
                                    <button
                                      onClick={() => handleDeleteAllocation(fund.id, alloc.id)}
                                      style={{
                                        padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                        backgroundColor: 'rgba(163,45,45,0.08)', color: '#A32D2D', fontSize: '0.75rem', fontWeight: 600,
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add allocation form / button */}
                            {!isFullySpent && (
                              showAllocForm ? (
                                <div style={{
                                  padding: '0.75rem', backgroundColor: colors.card, borderRadius: '0.5rem',
                                  border: '1px solid rgba(10,123,108,0.2)', marginBottom: '0.5rem',
                                }}>
                                  {allocError && (
                                    <div style={{
                                      backgroundColor: 'rgba(163,45,45,0.1)', padding: '0.5rem 0.75rem',
                                      borderRadius: '0.375rem', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#A32D2D',
                                    }}>
                                      {allocError}
                                    </div>
                                  )}
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <div>
                                      <label style={{ fontSize: '0.65rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>What's it for</label>
                                      <input
                                        type="text"
                                        value={allocName}
                                        onChange={(e) => setAllocName(e.target.value)}
                                        placeholder="e.g. New Tires"
                                        style={{
                                          width: '100%', padding: '8px 10px', borderRadius: '6px',
                                          border: `1px solid ${colors.inputBorder}`, backgroundColor: colors.inputBg,
                                          color: colors.text, fontSize: '0.85rem', fontFamily: 'inherit', boxSizing: 'border-box',
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '0.65rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Amount</label>
                                      <input
                                        type="number"
                                        value={allocAmount}
                                        onChange={(e) => setAllocAmount(e.target.value)}
                                        placeholder="0.00"
                                        style={{
                                          width: '100%', padding: '8px 10px', borderRadius: '6px',
                                          border: `1px solid ${colors.inputBorder}`, backgroundColor: colors.inputBg,
                                          color: colors.text, fontSize: '0.85rem', fontFamily: 'inherit', boxSizing: 'border-box',
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: '0 0 0.5rem 0' }}>{fmt(remaining)} remaining in this fund</p>
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                      onClick={() => handleAddAllocation(fund.id, fund.typicalAmount ?? 0)}
                                      disabled={allocSaving}
                                      style={{
                                        padding: '8px 16px', borderRadius: '6px', border: 'none',
                                        backgroundColor: '#0A7B6C', color: '#fff', fontSize: '0.85rem',
                                        fontWeight: 600, cursor: 'pointer', opacity: allocSaving ? 0.6 : 1,
                                      }}
                                    >
                                      {allocSaving ? 'Adding...' : 'Add item'}
                                    </button>
                                    <button
                                      onClick={() => { setShowAllocForm(false); setAllocError(null); }}
                                      style={{
                                        padding: '8px 16px', borderRadius: '6px',
                                        border: `1px solid ${colors.inputBorder}`, backgroundColor: colors.card,
                                        color: colors.textSub, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setShowAllocForm(true); setAllocName(''); setAllocAmount(''); setAllocError(null); }}
                                  style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    width: '100%', padding: '0.6rem', borderRadius: '0.5rem', cursor: 'pointer',
                                    backgroundColor: 'rgba(10,123,108,0.06)', border: '1px solid rgba(10,123,108,0.15)',
                                    color: '#0A7B6C', fontSize: '0.85rem', fontWeight: 500,
                                  }}
                                >
                                  <Plus size={16} /> Spend from this fund
                                </button>
                              )
                            )}

                            {/* Fully spent notice */}
                            {isFullySpent && (
                              <div style={{
                                display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                                padding: '0.75rem', backgroundColor: 'rgba(10,123,108,0.06)',
                                borderRadius: '0.5rem', border: '0.5px solid rgba(10,123,108,0.15)',
                              }}>
                                <span>✅</span>
                                <div>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0A7B6C', marginBottom: '2px' }}>Fully spent</div>
                                  <div style={{ fontSize: '0.8rem', color: colors.textSub, lineHeight: 1.4 }}>
                                    This fund has been fully allocated. Remove items to free up balance, or delete the fund when you no longer need it.
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}

            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setFundName('');
                setFundAmount('');
                setShowFundModal(true);
              }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Plus size={18} />
              Add One-Time Fund
            </Button>
          </>
        )}
      </Card>

      {/* Subscription Section */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => toggleSection('subscription')}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            marginBottom: expandedSection === 'subscription' ? '1.5rem' : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CreditCard size={20} style={{ color: colors.electric }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
              Subscription
            </h2>
          </div>
          <ChevronRight
            size={20}
            style={{
              color: colors.textMuted,
              transform: expandedSection === 'subscription' ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        {expandedSection === 'subscription' && (
          <div>
            {/* Billing interval toggle */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                display: 'inline-flex',
                backgroundColor: colors.background,
                borderRadius: '0.5rem',
                padding: '4px',
                border: `1px solid ${colors.divider}`,
              }}>
                <button
                  onClick={() => setBillingInterval('monthly')}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    backgroundColor: billingInterval === 'monthly' ? colors.electric : 'transparent',
                    color: billingInterval === 'monthly' ? colors.midnight : colors.textMuted,
                    transition: 'all 0.2s ease',
                  }}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval('annual')}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    backgroundColor: billingInterval === 'annual' ? colors.electric : 'transparent',
                    color: billingInterval === 'annual' ? colors.midnight : colors.textMuted,
                    transition: 'all 0.2s ease',
                  }}
                >
                  Annual
                  <span style={{ fontSize: '0.7rem', marginLeft: '0.35rem', color: billingInterval === 'annual' ? colors.midnight : '#22c55e' }}>Save ~13%</span>
                </button>
              </div>
            </div>

            {/* Active subscription status bar */}
            {subStatus && subStatus.plan !== 'free' && (
              <div style={{
                padding: '1rem 1.25rem',
                backgroundColor: colors.background,
                borderRadius: '0.75rem',
                border: `1px solid ${colors.electric}`,
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}>
                <div>
                  <span style={{ color: colors.text, fontWeight: 600, fontSize: '0.95rem' }}>
                    Keipr {subStatus.plan.charAt(0).toUpperCase() + subStatus.plan.slice(1)}
                  </span>
                  <span style={{
                    marginLeft: '0.75rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '1rem',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    backgroundColor: subStatus.subscriptionStatus === 'active' || subStatus.subscriptionStatus === 'trialing' ? '#22c55e20' : '#f59e0b20',
                    color: subStatus.subscriptionStatus === 'active' || subStatus.subscriptionStatus === 'trialing' ? '#22c55e' : '#f59e0b',
                  }}>
                    {subStatus.subscriptionStatus === 'trialing' ? 'Trial' : subStatus.subscriptionStatus}
                  </span>
                  {subStatus.subscriptionStatus === 'cancelled' && subStatus.subscriptionEndsAt && (
                    <span style={{ color: colors.textMuted, fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                      Access until {new Date(subStatus.subscriptionEndsAt).toLocaleDateString()}
                    </span>
                  )}
                  {subStatus.subscriptionStatus === 'trialing' && subStatus.trialEndsAt && (
                    <span style={{ color: colors.textMuted, fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                      Trial ends {new Date(subStatus.trialEndsAt).toLocaleDateString()}
                    </span>
                  )}
                  {subStatus.subscriptionRenewsAt && subStatus.subscriptionStatus === 'active' && (
                    <span style={{ color: colors.textMuted, fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                      Renews {new Date(subStatus.subscriptionRenewsAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {subStatus.subscriptionStatus === 'cancelled' ? (
                    <button
                      onClick={handleResumeSubscription}
                      disabled={subLoading}
                      style={{
                        padding: '0.4rem 1rem',
                        borderRadius: '0.375rem',
                        border: `1px solid ${colors.electric}`,
                        backgroundColor: 'transparent',
                        color: colors.electric,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: subLoading ? 'not-allowed' : 'pointer',
                        opacity: subLoading ? 0.6 : 1,
                      }}
                    >
                      {subLoading ? 'Resuming...' : 'Resume'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleManageSubscription}
                        disabled={subLoading}
                        style={{
                          padding: '0.4rem 1rem',
                          borderRadius: '0.375rem',
                          border: `1px solid ${colors.divider}`,
                          backgroundColor: 'transparent',
                          color: colors.text,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: subLoading ? 'not-allowed' : 'pointer',
                          opacity: subLoading ? 0.6 : 1,
                        }}
                      >
                        Manage Billing
                      </button>
                      <button
                        onClick={handleCancelSubscription}
                        disabled={subLoading}
                        style={{
                          padding: '0.4rem 1rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #ef4444',
                          backgroundColor: 'transparent',
                          color: '#ef4444',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: subLoading ? 'not-allowed' : 'pointer',
                          opacity: subLoading ? 0.6 : 1,
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Tier cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {TIERS.map((tier) => {
                const currentPlan = subStatus?.plan || 'free';
                const isCurrent = tier.key === currentPlan;
                const price = billingInterval === 'annual' ? tier.annualPrice : tier.monthlyPrice;
                const label = billingInterval === 'annual' ? tier.annualLabel : tier.monthlyLabel;
                const planKey = billingInterval === 'annual' ? tier.annualPlanKey : tier.monthlyPlanKey;
                const isUpgrade = tier.key !== 'free' && !isCurrent && (
                  (tier.key === 'ultra') || (tier.key === 'pro' && currentPlan === 'free')
                );
                const isDowngrade = tier.key !== 'free' && !isCurrent && (
                  (tier.key === 'pro' && currentPlan === 'ultra')
                );

                return (
                  <div
                    key={tier.key}
                    style={{
                      padding: '1.5rem',
                      backgroundColor: colors.background,
                      borderRadius: '0.75rem',
                      border: isCurrent ? `2px solid ${colors.electric}` : `1px solid ${colors.divider}`,
                      position: 'relative',
                    }}
                  >
                    {isCurrent && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-12px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: colors.electric,
                          color: colors.midnight,
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Check size={12} />
                        Current Plan
                      </div>
                    )}

                    <h3 style={{ color: colors.text, fontWeight: 600, margin: '0 0 0.5rem 0' }}>
                      {tier.name}
                    </h3>
                    <div style={{ margin: '0.5rem 0 1rem 0' }}>
                      <span style={{ color: colors.electric, fontSize: '1.5rem', fontWeight: 700 }}>
                        {price}
                      </span>
                      <span style={{ color: colors.textMuted, fontSize: '0.85rem' }}>
                        {label}
                      </span>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {tier.features.map((feature, i) => (
                        <li key={i} style={{ color: colors.textMuted, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Check size={14} style={{ color: colors.green, flexShrink: 0 }} />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* Action buttons */}
                    {isUpgrade && planKey && (
                      <Button
                        variant="primary"
                        size="md"
                        style={{ width: '100%', marginTop: '1rem' }}
                        disabled={checkoutLoading !== null}
                        onClick={() => {
                          if (currentPlan === 'free') {
                            handleCheckout(planKey);
                          } else {
                            // Already subscribed — change plan via API
                            subscriptionsAPI.changePlan(planKey).then(() => loadSubStatus()).catch((err: any) => alert(err?.response?.data?.error || 'Failed to change plan'));
                          }
                        }}
                      >
                        {checkoutLoading === planKey ? 'Loading...' : currentPlan === 'free' ? `Start Free Trial` : `Upgrade to ${tier.name}`}
                      </Button>
                    )}
                    {isDowngrade && planKey && (
                      <button
                        style={{
                          width: '100%',
                          marginTop: '1rem',
                          padding: '0.6rem',
                          borderRadius: '0.375rem',
                          border: `1px solid ${colors.divider}`,
                          backgroundColor: 'transparent',
                          color: colors.textMuted,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          if (window.confirm(`Downgrade to ${tier.name}? Your billing will be adjusted.`)) {
                            subscriptionsAPI.changePlan(planKey).then(() => loadSubStatus()).catch((err: any) => alert(err?.response?.data?.error || 'Failed to change plan'));
                          }
                        }}
                      >
                        Downgrade to {tier.name}
                      </button>
                    )}
                    {isCurrent && tier.key !== 'free' && (
                      <div style={{
                        width: '100%',
                        marginTop: '1rem',
                        padding: '0.6rem',
                        textAlign: 'center',
                        color: colors.textMuted,
                        fontSize: '0.85rem',
                      }}>
                        Your current plan
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 7-day trial note */}
            <p style={{ textAlign: 'center', color: colors.textMuted, fontSize: '0.8rem', marginTop: '1rem' }}>
              All paid plans include a 7-day free trial. Cancel anytime.
            </p>
          </div>
        )}
      </Card>

      {/* Security Section */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => toggleSection('security')}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            marginBottom: expandedSection === 'security' ? '1.5rem' : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Lock size={20} style={{ color: colors.electric }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
              Security
            </h2>
          </div>
          <ChevronRight
            size={20}
            style={{
              color: colors.textMuted,
              transform: expandedSection === 'security' ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        {expandedSection === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={async () => {
                try {
                  const { sendPasswordResetEmail } = await import('firebase/auth');
                  const { auth } = await import('@/lib/firebase');
                  if (user?.email) {
                    await sendPasswordResetEmail(auth, user.email);
                    alert('Password reset email sent! Check your inbox.');
                  }
                } catch (err) {
                  alert('Failed to send password reset email. Please try again.');
                }
              }}
            >
              Change Password
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => alert('Two-factor authentication coming soon!')}
            >
              Enable Two-Factor Authentication
            </Button>
          </div>
        )}
      </Card>

      {/* Export Section */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => toggleSection('export')}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            marginBottom: expandedSection === 'export' ? '1.5rem' : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Download size={20} style={{ color: colors.electric }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
              Export Data
            </h2>
          </div>
          <ChevronRight
            size={20}
            style={{
              color: colors.textMuted,
              transform: expandedSection === 'export' ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        {expandedSection === 'export' && (
          <div>
            <p style={{ color: colors.textMuted, fontSize: '0.95rem', margin: '0 0 1rem 0' }}>
              Download a backup of your data including all bills, income sources, and transactions.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={handleExport}
              loading={exportLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Download size={18} />
              Export Data
            </Button>
          </div>
        )}
      </Card>

      {/* Danger Zone */}
      <Card style={{ borderColor: colors.red, marginBottom: '1.5rem' }}>
        <button
          onClick={() => toggleSection('danger')}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            marginBottom: expandedSection === 'danger' ? '1.5rem' : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} style={{ color: colors.red }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.red, margin: 0 }}>
              Danger Zone
            </h2>
          </div>
          <ChevronRight
            size={20}
            style={{
              color: colors.red,
              transform: expandedSection === 'danger' ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        {expandedSection === 'danger' && (
          <div>
            <p style={{ color: colors.textMuted, fontSize: '0.95rem', margin: '0 0 1rem 0' }}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button
              variant="danger"
              size="md"
              onClick={() => setShowDeleteModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Trash2 size={18} />
              Delete Account
            </Button>
          </div>
        )}
      </Card>

      {/* Income Modal */}
      <Modal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        title={incomeForm.id ? 'Edit Income Source' : 'Add Income Source'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Name"
            placeholder="e.g., Primary Job"
            value={incomeForm.name}
            onChange={(e) => setIncomeForm({ ...incomeForm, name: e.target.value })}
          />

          <Input
            label="Amount"
            type="number"
            placeholder="0.00"
            value={incomeForm.amount}
            onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
          />

          <div>
            <label style={{ color: colors.textMuted, fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
              Frequency
            </label>
            <select
              value={incomeForm.frequency}
              onChange={(e) => setIncomeForm({ ...incomeForm, frequency: e.target.value as any })}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '0.5rem',
                color: colors.text,
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              {FREQUENCIES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Next Pay Date"
            type="date"
            value={incomeForm.nextPayDate}
            onChange={(e) => setIncomeForm({ ...incomeForm, nextPayDate: e.target.value })}
          />

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowIncomeModal(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={incomeForm.id ? handleUpdateIncome : handleAddIncome}
              loading={incomeLoading}
              style={{ flex: 1 }}
            >
              {incomeForm.id ? 'Update' : 'Add'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* One-Time Fund Modal */}
      <Modal
        isOpen={showFundModal}
        onClose={() => setShowFundModal(false)}
        title="Add One-Time Fund"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Fund Name"
            placeholder="e.g., Tax Refund, Work Bonus"
            value={fundName}
            onChange={(e) => setFundName(e.target.value)}
          />

          <Input
            label="Total Amount"
            type="number"
            placeholder="0.00"
            value={fundAmount}
            onChange={(e) => setFundAmount(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowFundModal(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleAddFund}
              loading={fundLoading}
              style={{ flex: 1 }}
            >
              Add Fund
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: colors.textMuted, fontSize: '0.95rem', margin: 0 }}>
            Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowDeleteModal(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleDeleteAccount}
              loading={deleteLoading}
              style={{ flex: 1 }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
