'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { usersAPI, exportAPI } from '@/lib/api';
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
    name: 'Free',
    price: '$0',
    features: ['1 income source', '1 split', '1 month planning'],
    current: true,
  },
  {
    name: 'Pro',
    price: '$7.99/mo',
    features: ['Unlimited income sources', 'Unlimited splits', 'Unlimited planning', 'Data export', 'Trends'],
  },
  {
    name: 'Ultra',
    price: '$11.99/mo',
    features: ['Everything in Pro', 'Connected banking via Plaid', 'Bill suggestions', 'Transaction matching'],
  },
];

export default function SettingsPage() {
  const { colors } = useTheme();
  const { themeMode, setThemeMode } = useTheme();
  const { incomeSources, currency, setCurrency, addIncomeSource, updateIncomeSource, deleteIncomeSource, refreshIncomeSources } = useApp();
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

  const [expandedSection, setExpandedSection] = useState<string | null>('profile');
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

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
        amount: parseFloat(incomeForm.amount),
        frequency: incomeForm.frequency,
        next_pay_date: incomeForm.nextPayDate,
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
      amount: source.amount.toString(),
      frequency: source.frequency,
      nextPayDate: source.nextPayDate,
    });
    setShowIncomeModal(true);
  };

  const handleUpdateIncome = async () => {
    if (!incomeForm.id || !incomeForm.name || !incomeForm.amount || !incomeForm.nextPayDate) {
      alert('Please fill in all fields');
      return;
    }

    setIncomeLoading(true);
    try {
      await updateIncomeSource(incomeForm.id, {
        name: incomeForm.name,
        amount: parseFloat(incomeForm.amount),
        frequency: incomeForm.frequency,
        next_pay_date: incomeForm.nextPayDate,
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
    if (!window.confirm('Are you sure you want to delete this income source?')) return;

    try {
      await deleteIncomeSource(id);
    } catch (error) {
      console.error('Failed to delete income source:', error);
      alert('Failed to delete income source');
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
                    onClick={() => setDisplayNameEdit(false)}
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
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
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
            {incomeSources.length === 0 ? (
              <p style={{ color: colors.textMuted, margin: '0 0 1rem 0' }}>
                No income sources yet. Add one to get started.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                {incomeSources.map((source) => (
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
                      <p style={{ color: colors.text, fontWeight: 500, margin: 0, fontSize: '0.95rem' }}>
                        {source.name}
                      </p>
                      <p style={{ color: colors.textMuted, margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                        {FREQUENCIES.find((f) => f.value === source.frequency)?.label} • Next: {new Date(source.nextPayDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                      <p style={{ color: colors.text, fontWeight: 600, margin: 0 }}>
                        ${source.amount.toFixed(2)}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                style={{
                  padding: '1.5rem',
                  backgroundColor: colors.background,
                  borderRadius: '0.75rem',
                  border: tier.current ? `2px solid ${colors.electric}` : `1px solid ${colors.divider}`,
                  position: 'relative',
                }}
              >
                {tier.current && (
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
                    }}
                  >
                    <Check size={12} />
                    Current Plan
                  </div>
                )}

                <h3 style={{ color: colors.text, fontWeight: 600, margin: '0 0 0.5rem 0' }}>
                  {tier.name}
                </h3>
                <p style={{ color: colors.electric, fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0 1rem 0' }}>
                  {tier.price}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {tier.features.map((feature, i) => (
                    <li key={i} style={{ color: colors.textMuted, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Check size={14} style={{ color: colors.green, flexShrink: 0 }} />
                      {feature}
                    </li>
                  ))}
                </ul>
                {!tier.current && (
                  <Button
                    variant="primary"
                    size="md"
                    style={{ width: '100%', marginTop: '1rem' }}
                  >
                    Upgrade
                  </Button>
                )}
              </div>
            ))}
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
            <Button variant="secondary" size="md">
              Change Password
            </Button>
            <Button variant="secondary" size="md">
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
