'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { spendingAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import CategoryIcon from '@/components/CategoryIcon';
import { ArrowLeft, Plus, Pencil, X } from 'lucide-react';

const FALLBACK_CATEGORIES = ['Dining', 'Fun', 'Groceries', 'Healthcare', 'Housing', 'Insurance', 'Other', 'Savings', 'Subscriptions', 'Transport', 'Utilities'];

export default function SpendingBudgetsPage() {
  const { colors, isDark } = useTheme();
  const { spendingBudgets, fetchSpendingBudgets, fmt, categories: dbCategories, isPro } = useApp();

  const categoryNames = Array.from(new Set([
    ...(dbCategories.length > 0 ? dbCategories.map((c: any) => c.name) : []),
    ...FALLBACK_CATEGORIES,
  ])).sort((a, b) => a.localeCompare(b));

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Dining');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const isFreeAndAtLimit = !isPro && spendingBudgets.length >= 3;

  async function handleSave() {
    if (!selectedCategory || !amount) return;
    setLoading(true);
    try {
      if (editingId) {
        await spendingAPI.updateBudget(editingId, {
          category: selectedCategory,
          budgetAmount: parseFloat(amount),
        });
      } else {
        await spendingAPI.createBudget({
          category: selectedCategory,
          budgetAmount: parseFloat(amount),
        });
      }
      await fetchSpendingBudgets();
      setShowModal(false);
      setSelectedCategory('Dining');
      setAmount('');
      setEditingId(null);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to save budget');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this spending budget?')) return;
    try {
      await spendingAPI.deleteBudget(id);
      await fetchSpendingBudgets();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to delete budget');
    }
  }

  function openEdit(budget: any) {
    setEditingId(budget.id);
    setSelectedCategory(budget.category || 'Dining');
    setAmount(String(budget.budget_amount || ''));
    setShowModal(true);
  }

  function openAdd() {
    setEditingId(null);
    setSelectedCategory('Dining');
    setAmount('');
    setShowModal(true);
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/app/bills" style={{ color: colors.textMuted, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text, margin: 0 }}>Spending Budgets</h1>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={openAdd}
          disabled={isFreeAndAtLimit && !isPro}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} />
          Add Budget
        </Button>
      </div>

      {/* Budget list */}
      {spendingBudgets.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <p style={{ fontSize: '3rem', margin: '0 0 0.75rem 0' }}>💰</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: '0 0 0.5rem 0' }}>No budgets yet</p>
          <p style={{ fontSize: '0.9rem', color: colors.textSub, margin: '0 0 1.5rem 0' }}>Create a budget to track spending by category</p>
          <Button variant="primary" size="md" onClick={openAdd}>Create first budget</Button>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {spendingBudgets.map((budget: any) => {
            const pct = budget.budget_amount > 0 && budget.spentAmount !== undefined
              ? Math.min(100, Math.round((budget.spentAmount / budget.budget_amount) * 100))
              : 0;
            const isOver = budget.spentAmount > budget.budget_amount;
            return (
              <Card key={budget.id} style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <CategoryIcon category={budget.category} size={24} isDark={isDark} />
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: colors.text }}>{budget.category}</span>
                    </div>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: isDark ? '#38BDF8' : '#0369A1', margin: '0.25rem 0 0 0' }}>
                      {fmt(budget.budget_amount)}/paycheck
                    </p>
                    {budget.spentAmount !== undefined && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ height: '5px', backgroundColor: colors.progressTrack || colors.cardBorder, borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: '3px',
                            width: `${pct}%`,
                            backgroundColor: isOver ? '#EF4444' : pct > 80 ? '#854F0B' : '#38BDF8',
                          }} />
                        </div>
                        <p style={{ fontSize: '0.75rem', color: colors.textSub, margin: '0.25rem 0 0 0' }}>
                          {fmt(budget.spentAmount)} spent · {fmt(Math.max(0, budget.budget_amount - budget.spentAmount))} left
                        </p>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => openEdit(budget)}
                      style={{
                        padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                        backgroundColor: 'rgba(56,189,248,0.1)', color: '#38BDF8', display: 'flex', alignItems: 'center',
                      }}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      style={{
                        padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                        backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', display: 'flex', alignItems: 'center',
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}

          {isFreeAndAtLimit && !isPro && (
            <Card style={{ padding: '1rem', backgroundColor: 'rgba(56,189,248,0.08)', borderColor: 'rgba(56,189,248,0.2)' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.text, margin: '0 0 0.25rem 0' }}>Pro feature</p>
              <p style={{ fontSize: '0.85rem', color: colors.textSub, margin: '0 0 0.75rem 0' }}>
                You&apos;ve created 3 budgets. Upgrade to Keipr Pro for unlimited budgets and spending insights.
              </p>
              <Link href="/app/settings">
                <Button variant="primary" size="sm">View Pro</Button>
              </Link>
            </Card>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowModal(false)}>
          <div
            style={{
              backgroundColor: colors.card, borderRadius: '1rem', padding: '2rem',
              width: '90%', maxWidth: '420px', border: `1px solid ${colors.cardBorder}`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: colors.text, margin: '0 0 1.5rem 0' }}>
              {editingId ? 'Edit' : 'New'} Budget
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 500, color: colors.textSub, letterSpacing: '1px', display: 'block', marginBottom: '0.5rem' }}>
                CATEGORY
              </label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                  backgroundColor: colors.inputBg, color: colors.text,
                  border: `1px solid ${colors.inputBorder}`, fontSize: '1rem',
                }}
              >
                {categoryNames.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 500, color: colors.textSub, letterSpacing: '1px', display: 'block', marginBottom: '0.5rem' }}>
                AMOUNT PER PAYCHECK
              </label>
              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                style={{ fontSize: '1.25rem', fontWeight: 500 }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none',
                  backgroundColor: isDark ? 'rgba(214,209,199,0.10)' : 'rgba(12,74,110,0.08)',
                  color: colors.textSub, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                }}
              >Cancel</button>
              <button
                onClick={handleSave}
                disabled={loading || !amount || !selectedCategory}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none',
                  backgroundColor: '#0C4A6E', color: '#fff', fontWeight: 600,
                  fontSize: '0.9rem', cursor: 'pointer',
                  opacity: loading || !amount ? 0.5 : 1,
                }}
              >{loading ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
