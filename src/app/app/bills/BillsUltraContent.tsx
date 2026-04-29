'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { bankingAPI, aiAPI, usersAPI } from '@/lib/api';
import AppLayout, { TwoColumnLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import AddBillModal from './AddBillModal';
import CorrectionBadge from '@/components/ai/CorrectionBadge';
import CorrectionDetailModal from '@/components/ai/CorrectionDetailModal';
import { BillsSkeleton } from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import { Plus, Search, ChevronDown, ChevronUp, Calendar, ChevronRight, Lock, Waves, Wallet } from 'lucide-react';
import MerchantLogo from '@/components/MerchantLogo';
import CategoryIcon from '@/components/CategoryIcon';
import { getPayPeriods } from '@/lib/payPeriods';

type SortBy = 'name' | 'dueDate' | 'amount';

interface ExpandedBills {
  [key: string]: boolean;
}

export default function BillsUltraContent() {
  const { colors, isDark } = useTheme();
  const { bills, billsLoading, fmt, isUltra, spendingSummary, spendingBudgets, detectedBills, detectedCount, confirmDetectedBill, confirmAsOneTime, dismissDetectedBill, linkDuplicateBill, creditCards, incomeSources, addIncomeSource, addBill, refreshBills } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedBills, setExpandedBills] = useState<ExpandedBills>({});
  const [expandedTypes, setExpandedTypes] = useState<{ fixed: boolean; flexible: boolean }>({ fixed: false, flexible: false });
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [matchedBillIds, setMatchedBillIds] = useState<Set<string>>(new Set());
  const [spendingTxns, setSpendingTxns] = useState<any[]>([]);
  const [quickSpendActionTxn, setQuickSpendActionTxn] = useState<any | null>(null);
  const [quickSpendLinkTxn, setQuickSpendLinkTxn] = useState<any | null>(null);
  const [quickSpendActioning, setQuickSpendActioning] = useState<string | null>(null);

  // One-time funds
  const oneTimeFunds = incomeSources.filter(s => s.isOneTime);
  const [fundAllocations, setFundAllocations] = useState<Record<string, { total: number; items: any[] }>>({});
  const [expandedFunds, setExpandedFunds] = useState(false);
  const [showAddFund, setShowAddFund] = useState(false);
  const [newFundName, setNewFundName] = useState('');
  const [newFundAmount, setNewFundAmount] = useState('');

  useEffect(() => {
    async function loadFundAllocations() {
      const allocs: Record<string, { total: number; items: any[] }> = {};
      for (const fund of oneTimeFunds) {
        try {
          const res = await usersAPI.getFundAllocations(fund.id);
          const items = res.data?.allocations || [];
          const total = items.reduce((s: number, a: any) => s + a.amount, 0);
          allocs[fund.id] = { total, items };
        } catch {
          allocs[fund.id] = { total: 0, items: [] };
        }
      }
      setFundAllocations(allocs);
    }
    if (oneTimeFunds.length > 0) loadFundAllocations();
  }, [incomeSources]);

  async function handleAddFund() {
    if (!newFundName || !newFundAmount) return;
    const amount = parseFloat(newFundAmount);
    if (isNaN(amount) || amount <= 0) return;
    await addIncomeSource({
      name: newFundName,
      frequency: 'monthly',
      typicalAmount: amount,
      isOneTime: true,
    });
    setNewFundName('');
    setNewFundAmount('');
    setShowAddFund(false);
  }

  useEffect(() => {
    bankingAPI.getMatchedBills()
      .then(res => setMatchedBillIds(new Set(res.data?.matched_bill_ids || [])))
      .catch(() => {});
  }, [bills]);

  useEffect(() => {
    async function loadSpendingTxns() {
      try {
        const res = await bankingAPI.getAllTransactions({ category: 'spending', days: 30, limit: 200 });
        const txns = res.data?.transactions || [];
        const income = incomeSources.find(s => s.isPrimary) || (incomeSources.length > 0 ? incomeSources[0] : null);
        const period = getPayPeriods(income?.nextPayDate, income?.frequency || '').current;
        const filtered = txns.filter((txn: any) => {
          const txDate = parseTransactionDate(txn.transaction_date);
          return txDate >= period.start && txDate <= period.end;
        });
        setSpendingTxns(filtered);
      } catch {
        // Quick Spend is non-critical on the Budget page.
      }
    }
    loadSpendingTxns();
  }, [bills.length, incomeSources]);

  // AI Corrections state
  const [aiSettingsAvailable, setAiSettingsAvailable] = useState(false);
  const [aiCorrectionsByBill, setAiCorrectionsByBill] = useState<Record<string, any[]>>({});
  const [activeCorrectionId, setActiveCorrectionId] = useState<string | null>(null);

  useEffect(() => {
    aiAPI.getSettings().then(s => {
      setAiSettingsAvailable(!!s);
      if (s) {
        aiAPI.getHistory(20).then(res => {
          const map: Record<string, any[]> = {};
          (res?.data?.runs || []).forEach((run: any) => {
            (run.corrections || []).forEach((c: any) => {
              if (c.target_table === 'bills' && c.status === 'applied') {
                (map[c.target_id] ||= []).push(c);
              }
            });
          });
          setAiCorrectionsByBill(map);
        }).catch(() => {});
      }
    }).catch(() => setAiSettingsAvailable(false));
  }, []);

  const handleDeleteAll = () => {
    if (window.confirm('Delete all bills and spending budgets? This action cannot be undone.')) {
      // TODO: Implement deleteAllBills action in AppContext if needed
      // deleteAllBills();
    }
  };

  function quickSpendTxnName(txn: any) {
    return txn?.cleaned_name || txn?.merchant_name || txn?.name || 'Quick Spend';
  }

  function quickSpendTxnAmount(txn: any) {
    return Math.abs(Number(txn?.amount || 0));
  }

  function parseTransactionDate(dateValue: string | undefined) {
    if (!dateValue) return new Date();
    return /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
      ? new Date(`${dateValue}T00:00:00`)
      : new Date(dateValue);
  }

  function quickSpendTxnDueDay(txn: any) {
    const parsed = parseTransactionDate(txn?.transaction_date);
    return Number.isFinite(parsed.getTime()) ? parsed.getDate() : new Date().getDate();
  }

  function categoryForQuickSpendName(name: string, txn: any) {
    const text = `${name} ${txn?.personal_finance_category || ''} ${txn?.personal_finance_subcategory || ''}`.toUpperCase();
    if (/(KLARNA|AFFIRM|AFTERPAY|BREADPAY|LOAN_PAYMENTS)/.test(text)) return 'Loans';
    return 'Other';
  }

  async function handleMakeQuickSpendRecurring(txn: any) {
    const defaultName = quickSpendTxnName(txn);
    const name = window.prompt('Name this recurring expense', defaultName);
    if (!name || !name.trim()) return;

    setQuickSpendActioning(txn.id);
    try {
      const bill = await addBill({
        name: name.trim(),
        category: categoryForQuickSpendName(name, txn),
        dueDay: quickSpendTxnDueDay(txn),
        total: quickSpendTxnAmount(txn),
        isRecurring: true,
        isAutoPay: false,
        isSplit: false,
        expenseType: 'fixed',
      });
      if (bill?.id) {
        await bankingAPI.transactionAction(txn.id, { action: 'link_bill', bill_id: bill.id });
      }
      setSpendingTxns(prev => prev.filter(t => t.id !== txn.id));
      setQuickSpendActionTxn(null);
      refreshBills?.();
    } catch {
      window.alert('Could not create recurring expense. Please try again.');
    } finally {
      setQuickSpendActioning(null);
    }
  }

  async function handleQuickSpendBillSelected(billId: string) {
    if (!quickSpendLinkTxn) return;
    setQuickSpendActioning(quickSpendLinkTxn.id);
    try {
      await bankingAPI.transactionAction(quickSpendLinkTxn.id, { action: 'link_bill', bill_id: billId });
      setSpendingTxns(prev => prev.filter(t => t.id !== quickSpendLinkTxn.id));
      setQuickSpendLinkTxn(null);
      refreshBills?.();
    } catch {
      window.alert('Could not link transaction. Please try again.');
    } finally {
      setQuickSpendActioning(null);
    }
  }

  async function handleHideQuickSpendMerchant(txn: any) {
    const name = quickSpendTxnName(txn);
    if (!window.confirm(`Hide future "${name}" transactions from Quick Spend?`)) return;
    setQuickSpendActioning(txn.id);
    try {
      await bankingAPI.transactionAction(txn.id, { action: 'ignore_always', rule_value: name });
      setSpendingTxns(prev => prev.filter(t => t.id !== txn.id));
      setQuickSpendActionTxn(null);
    } catch {
      window.alert('Could not hide merchant. Please try again.');
    } finally {
      setQuickSpendActioning(null);
    }
  }

  // Group bills by category
  const billsByCategory = useMemo(() => {
    return bills.reduce(
      (acc, bill) => {
        if (!acc[bill.category]) {
          acc[bill.category] = [];
        }
        acc[bill.category].push(bill);
        return acc;
      },
      {} as Record<string, typeof bills>
    );
  }, [bills]);

  // Filter and sort bills
  const filteredBills = useMemo(() => {
    const filtered = bills.filter((bill) =>
      bill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return a.dueDay - b.dueDay;
        case 'amount':
          return b.total - a.total;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [bills, searchTerm, sortBy]);

  // Group bills by expense type
  const fixedBills = useMemo(() => filteredBills.filter(b => (b.expenseType || 'fixed') === 'fixed'), [filteredBills]);
  const flexibleBills = useMemo(() => filteredBills.filter(b => b.expenseType === 'flexible'), [filteredBills]);
  const fixedTotal = useMemo(() => fixedBills.reduce((sum, bill) => sum + bill.total, 0), [fixedBills]);
  const flexibleTotal = useMemo(() => flexibleBills.reduce((sum, bill) => sum + bill.total, 0), [flexibleBills]);

  // Get all category names from bills
  const allCategoryNames = useMemo(() => {
    const billCategories = new Set(filteredBills.map(b => b.category));
    const combined = Array.from(billCategories);
    return combined.sort((a, b) => {
      const totalA = filteredBills.filter(x => x.category === a).reduce((s, x) => s + x.total, 0);
      const totalB = filteredBills.filter(x => x.category === b).reduce((s, x) => s + x.total, 0);
      return totalB - totalA;
    });
  }, [filteredBills]);

  // Group filtered bills by category for display
  const groupedFilteredBills = useMemo(() => {
    return filteredBills.reduce(
      (acc, bill) => {
        if (!acc[bill.category]) {
          acc[bill.category] = [];
        }
        acc[bill.category].push(bill);
        return acc;
      },
      {} as Record<string, typeof bills>
    );
  }, [filteredBills]);

  const toggleExpanded = (billId: string) => {
    setExpandedBills((prev) => ({
      ...prev,
      [billId]: !prev[billId],
    }));
  };

  // Calculate total income, expenses, and remaining
  const totalIncome = useMemo(() => {
    return filteredBills.reduce((sum, bill) => sum + bill.total, 0);
  }, [filteredBills]);

  const totalExpenses = totalIncome;
  const totalActual = useMemo(() => {
    const billsPaid = filteredBills.reduce((sum, bill) => sum + bill.funded, 0);
    const spendingActual = spendingSummary
      ? (spendingSummary as any[]).reduce((sum, s) => sum + (s.spentAmount || 0), 0)
      : 0;
    return billsPaid + spendingActual;
  }, [filteredBills, spendingSummary]);

  const leftToSpend = totalExpenses - totalActual;

  // Budget Summary Sidebar
  const BudgetSummary = () => (
    <Card style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{
          fontSize: '0.875rem',
          color: colors.textMuted,
          margin: '0 0 0.5rem 0',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: 600,
        }}>
          Total Expenses
        </p>
        <p style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: colors.text,
          margin: 0,
        }}>
          {fmt(totalExpenses)}
        </p>
        <p style={{
          fontSize: '0.75rem',
          color: colors.textMuted,
          margin: '0.5rem 0 0 0',
        }}>
          This month
        </p>
      </div>

      <div style={{ paddingBottom: '1.5rem', borderBottom: `1px solid ${colors.divider}` }}>
        {/* Income row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}>
          <span style={{ fontSize: '0.875rem', color: colors.textMuted }}>Income</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.green }}>
            {fmt(totalExpenses)}
          </span>
        </div>

        {/* Fixed expenses row */}
        {fixedBills.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
          }}>
            <span style={{ fontSize: '0.875rem', color: colors.textMuted }}>Fixed ({fixedBills.length})</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text }}>
              {fmt(fixedBills.reduce((s, b) => s + b.total, 0))}
            </span>
          </div>
        )}

        {/* Flexible expenses row */}
        {flexibleBills.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
          }}>
            <span style={{ fontSize: '0.875rem', color: colors.textMuted }}>Flexible ({flexibleBills.length})</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text }}>
              {fmt(flexibleBills.reduce((s, b) => s + b.total, 0))}
            </span>
          </div>
        )}
      </div>

      <div style={{ paddingTop: '1.5rem' }}>
        <p style={{
          fontSize: '0.875rem',
          color: colors.textMuted,
          margin: '0 0 0.5rem 0',
        }}>
          Left to spend
        </p>
        <p style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: leftToSpend >= 0 ? colors.green : colors.red,
          margin: 0,
        }}>
          {fmt(leftToSpend)}
        </p>
      </div>

      <div style={{ paddingTop: '1.5rem', borderTop: `1px solid ${colors.divider}` }}>
        <p style={{
          fontSize: '0.875rem',
          color: colors.textMuted,
          margin: '0 0 0.75rem 0',
        }}>
          Coverage
        </p>
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: colors.progressTrack,
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '0.5rem',
        }}>
          <div
            style={{
              height: '100%',
              width: `${totalExpenses > 0 ? Math.min((totalActual / totalExpenses) * 100, 100) : 0}%`,
              backgroundColor: colors.electric,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: colors.textMuted,
        }}>
          <span>{fmt(totalActual)} paid</span>
          <span>{totalExpenses > 0 ? Math.round((totalActual / totalExpenses) * 100) : 0}%</span>
        </div>
      </div>
    </Card>
  );

  return (
    <AppLayout
      pageTitle="Budget"
      showMonthNav={true}
      topBarActions={
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Plus size={20} />
          Add expense
        </Button>
      }
    >
      <TwoColumnLayout sidebar={<BudgetSummary />}>
        <section
          className="app-page-hero"
          style={{
            padding: '1.4rem 1.5rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 0.45fr)', gap: '1.5rem', alignItems: 'end' }}>
            <div>
              <p className="app-page-kicker" style={{ marginBottom: '0.4rem' }}>Paycheck budget</p>
              <h1 className="app-page-title" style={{ fontSize: 'clamp(1.6rem, 2.6vw, 2.4rem)', lineHeight: 1.15 }}>Every expense, by paycheck.</h1>
              <p className="app-page-subtitle" style={{ marginTop: '0.5rem', fontSize: '0.92rem', lineHeight: 1.5 }}>
                Review what is fixed, flexible, upcoming, and split before it affects your available number.
              </p>
            </div>
            <div className="app-soft-panel" style={{ padding: '1rem' }}>
              <p style={{ margin: '0 0 0.45rem', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.textMuted }}>
                Total expenses
              </p>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: colors.text }}>
                {fmt(totalExpenses)}
              </p>
              <p style={{ margin: '0.35rem 0 0', color: colors.textMuted, fontSize: '0.82rem' }}>
                {fixedBills.length} fixed &middot; {flexibleBills.length} flexible &middot; {filteredBills.length} active
              </p>
            </div>
          </div>
        </section>

        {/* Search and Sort Controls */}
        <Card
          style={{
            marginBottom: '1.5rem',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '1rem',
            alignItems: 'end',
          }}
        >
          <div style={{ position: 'relative' }}>
            <Input
              type="text"
              placeholder="Search expenses by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                paddingLeft: '2.5rem',
              }}
            />
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.textMuted,
                pointerEvents: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <label
              style={{
                fontSize: '0.875rem',
                color: colors.textMuted,
                whiteSpace: 'nowrap',
              }}
            >
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              style={{
                backgroundColor: colors.inputBg,
                color: colors.text,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <option value="name">Name</option>
              <option value="dueDate">Due Date</option>
              <option value="amount">Amount</option>
            </select>
          </div>
        </Card>

        {/* Detected Expenses Banner (when detected bills exist) */}
        {detectedCount > 0 && (
          <Card
            style={{
              marginBottom: '2rem',
              padding: '1.25rem',
              backgroundColor: isDark ? 'rgba(56,189,248,0.08)' : 'rgba(56,189,248,0.05)',
              border: `1px solid ${colors.electric}33`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <span style={{ fontSize: '1.5rem' }}>🔔</span>
                <div>
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                    {detectedCount} new recurring expense{detectedCount !== 1 ? 's' : ''} detected
                  </p>
                  <p style={{
                    fontSize: '0.8rem',
                    color: colors.textMuted,
                    margin: '0.25rem 0 0 0',
                  }}>
                    {detectedBills.slice(0, 2).map(b => b.name).join(', ')}{detectedCount > 2 ? ' and more...' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExpandedBills(prev => ({ ...prev, '__detected__': !prev['__detected__'] }))}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: colors.electric,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Review
              </button>
            </div>
          </Card>
        )}

        {/* Detected Section (expandable) */}
        {detectedCount > 0 && expandedBills['__detected__'] && (
          <Card style={{ marginBottom: '2rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                Review Detected Expenses
              </h3>
              {detectedCount >= 3 && (
                <button
                  onClick={() => {
                    if (window.confirm(`Confirm all ${detectedCount} as recurring expenses?`)) {
                      detectedBills.forEach(b => confirmDetectedBill(b.id));
                    }
                  }}
                  style={{
                    padding: '0.375rem 0.75rem',
                    backgroundColor: colors.electric,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Confirm all
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {detectedBills.map((bill) => (
                <div
                  key={bill.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    backgroundColor: colors.background,
                    borderRadius: '0.5rem',
                    border: `1px solid ${colors.cardBorder}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <MerchantLogo billName={bill.name} category={bill.category} size={28} isDark={isDark} />
                    <div>
                      <p style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.text, margin: 0 }}>{bill.name}</p>
                      <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: '0.25rem 0 0 0' }}>
                        {bill.category}
                      </p>
                      {bill.paidWith ? (
                        <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: '0.2rem 0 0 0' }}>
                          Paid with {bill.paidWith}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <p style={{ fontSize: '0.95rem', fontWeight: 700, color: colors.text, margin: 0, minWidth: '60px', textAlign: 'right' }}>
                      {fmt(bill.total)}
                    </p>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button
                        onClick={() => confirmDetectedBill(bill.id)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          backgroundColor: colors.electric,
                          color: '#fff',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Recurring
                      </button>
                      <button
                        onClick={() => confirmAsOneTime(bill.id)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          backgroundColor: isDark ? 'rgba(214,209,199,0.10)' : 'rgba(12,74,110,0.08)',
                          color: colors.textMuted,
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        One-time
                      </button>
                      <button
                        onClick={() => dismissDetectedBill(bill.id)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          backgroundColor: isDark ? 'rgba(214,209,199,0.10)' : 'rgba(12,74,110,0.08)',
                          color: colors.amber || '#854F0B',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Don't track
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Bills List / Budget Table */}
        {billsLoading ? (
          <BillsSkeleton />
        ) : filteredBills.length === 0 && spendingTxns.length === 0 ? (
          <EmptyState
            icon="bills"
            title="No expenses yet"
            description="Add your first expense to start tracking your budget."
            actionLabel="Add an expense"
            onAction={() => setShowAddModal(true)}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* AI flagged corrections handled silently — no user-facing review cards.
              Sparkle badges on individual bills are the only AI indicator. */}

          {/* Credit Cards Section */}
          {creditCards.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: colors.text,
                margin: '0 0 1rem 0',
                paddingBottom: '0.75rem',
                borderBottom: `1px solid ${colors.divider}`,
              }}>
                Bills paid by credit card
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {creditCards.map((cc: any) => (
                  <Card
                    key={cc.cardName}
                    onClick={() => setExpandedCard(expandedCard === cc.cardName ? null : cc.cardName)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                          💳 {cc.cardName}
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: colors.textMuted, margin: '0.25rem 0 0 0' }}>
                          {cc.paidCount} of {cc.totalCount} charged
                        </p>
                      </div>
                      <p style={{ fontSize: '1.1rem', fontWeight: 700, color: colors.text, margin: 0 }}>
                        {fmt(cc.totalAmount)}
                      </p>
                    </div>
                    {expandedCard === cc.cardName && cc.bills && cc.bills.length > 0 && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${colors.divider}` }}>
                        {cc.bills.map((b: any) => (
                          <div
                            key={b.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '0.625rem 0',
                              fontSize: '0.875rem',
                              color: colors.textMuted,
                            }}
                          >
                            <span>{b.name}</span>
                            <span style={{ color: colors.text, fontWeight: 600 }}>{fmt(b.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Quick Spend bank transactions for the current pay period */}
          {spendingTxns.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: colors.text,
                margin: '0 0 1rem 0',
                paddingBottom: '0.75rem',
                borderBottom: `1px solid ${colors.divider}`,
              }}>
                Quick Spend
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {spendingTxns.map((txn: any) => {
                  const txnName = quickSpendTxnName(txn);
                  const txnAmount = quickSpendTxnAmount(txn);
                  const txnDate = parseTransactionDate(txn.transaction_date);
                  const dateLabel = Number.isFinite(txnDate.getTime())
                    ? txnDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'Bank';
                  return (
                    <Card
                      key={txn.id}
                      onClick={() => setQuickSpendActionTxn(txn)}
                      style={{
                        cursor: 'pointer',
                        borderColor: isDark ? 'rgba(251,191,36,0.15)' : 'rgba(217,119,6,0.18)',
                        backgroundColor: isDark ? 'rgba(251,191,36,0.06)' : '#FFF8EA',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                          <MerchantLogo billName={txnName} category="Other" size={32} isDark={isDark} />
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {txnName}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '0.125rem 0.45rem',
                                borderRadius: '999px',
                                backgroundColor: isDark ? 'rgba(52,211,153,0.15)' : 'rgba(4,120,87,0.1)',
                                color: isDark ? '#34D399' : '#047857',
                              }}>Bank</span>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '0.125rem 0.45rem',
                                borderRadius: '999px',
                                backgroundColor: isDark ? 'rgba(214,209,199,0.12)' : 'rgba(12,74,110,0.08)',
                                color: colors.textMuted,
                              }}>{dateLabel}</span>
                            </div>
                          </div>
                        </div>
                        <p style={{ fontSize: '1rem', fontWeight: 700, color: isDark ? '#FBBF24' : '#D97706', margin: 0, flexShrink: 0 }}>
                          {fmt(txnAmount)}
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Monarch-style Budget Table */}
          {filteredBills.length > 0 && (
          <Card>
            {/* Column Headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 100px 100px 100px',
                gap: '1rem',
                padding: '1.25rem',
                borderBottom: `1px solid ${colors.divider}`,
              }}
            >
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: colors.textMuted,
              }}>
                Expenses
              </div>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: colors.textMuted,
                textAlign: 'right',
              }}>
                Budget
              </div>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: colors.textMuted,
                textAlign: 'right',
              }}>
                Actual
              </div>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: colors.textMuted,
                textAlign: 'right',
              }}>
                Remaining
              </div>
            </div>

            {/* Expenses by category — grouped by Fixed then Flexible */}
            <div>
              {[
                { label: 'Fixed Expenses', bills: fixedBills, prefix: 'fixed' },
                { label: 'Flexible Expenses', bills: flexibleBills, prefix: 'flex' },
              ].map((group, gi) => {
                const groupCategories = Array.from(new Set(group.bills.map(b => b.category || 'Other'))).sort((a, b) => {
                  const totalA = group.bills.filter(x => x.category === a).reduce((s, x) => s + x.total, 0);
                  const totalB = group.bills.filter(x => x.category === b).reduce((s, x) => s + x.total, 0);
                  return totalB - totalA;
                });
                const typeKey: 'fixed' | 'flexible' = group.prefix === 'fixed' ? 'fixed' : 'flexible';
                const isSectionOpen = expandedTypes[typeKey];
                const isFixed = typeKey === 'fixed';
                const iconBg = isFixed ? 'rgba(56,189,248,0.12)' : 'rgba(217,119,6,0.12)';
                const iconColor = isFixed ? '#38BDF8' : '#D97706';
                const Icon = isFixed ? Lock : Waves;
                const subtitle = isFixed ? 'Same every cycle' : 'Varies month to month';
                return (
                  <div key={group.prefix}>
                    {/* Section header — click to expand/collapse */}
                    <div
                      onClick={() => setExpandedTypes(p => ({ ...p, [typeKey]: !p[typeKey] }))}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem 1.25rem',
                        borderTop: gi > 0 ? `2px solid ${colors.divider}` : 'none',
                        backgroundColor: colors.background,
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '0.9rem',
                          color: colors.textMuted,
                          transform: isSectionOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.15s ease',
                        }}>›</span>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: iconBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Icon size={16} color={iconColor} />
                        </div>
                        <div>
                          <p style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: colors.text,
                            margin: 0,
                          }}>
                            {group.label}
                          </p>
                          <p style={{
                            fontSize: '0.7rem',
                            color: colors.textMuted,
                            margin: '0.15rem 0 0 0',
                          }}>
                            {subtitle} · {group.bills.length} expense{group.bills.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: colors.text,
                        margin: 0,
                      }}>
                        {fmt(group.bills.reduce((s, b) => s + b.total, 0))}
                      </p>
                    </div>
                    {isSectionOpen && group.bills.length > 0 && groupCategories.map((catName, idx) => {
                const categoryBills = group.bills.filter(b => b.category === catName);
                const hasBills = categoryBills.length > 0;
                const isExpanded = expandedBills[`${group.prefix}_${catName}`];

                if (!hasBills) return null;

                const catTotalBudget = categoryBills.reduce((s, b) => s + b.total, 0);
                const catTotalActual = categoryBills.reduce((s, b) => s + b.funded, 0);
                const catRemaining = catTotalBudget - catTotalActual;

                return (
                  <div key={`${group.prefix}_${catName}`} style={{ borderTop: idx === 0 ? 'none' : `1px solid ${colors.divider}` }}>
                    {/* Category Group Row */}
                    <div
                      onClick={() => setExpandedBills(prev => ({ ...prev, [`${group.prefix}_${catName}`]: !prev[`${group.prefix}_${catName}`] }))}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 100px 100px 100px',
                        gap: '1rem',
                        padding: '1.25rem',
                        backgroundColor: isExpanded ? colors.background : colors.card,
                        cursor: 'pointer',
                        borderBottom: isExpanded ? `1px solid ${colors.divider}` : 'none',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isExpanded) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = colors.background;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = colors.card;
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <CategoryIcon category={catName} size={20} isDark={isDark} />
                        <div>
                          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                            {catName}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: '0.25rem 0 0 0' }}>
                            {categoryBills.length} expense{categoryBills.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.text, margin: 0, textAlign: 'right' }}>
                        {fmt(catTotalBudget)}
                      </p>
                      <p style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.text, margin: 0, textAlign: 'right' }}>
                        {fmt(catTotalActual)}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
                        <p style={{
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          color: catRemaining >= 0 ? colors.green : colors.red,
                          margin: 0,
                        }}>
                          {fmt(catRemaining)}
                        </p>
                        {isExpanded ? <ChevronUp size={18} color={colors.textMuted} /> : <ChevronDown size={18} color={colors.textMuted} />}
                      </div>
                    </div>

                    {/* Expanded Items */}
                    {isExpanded && (
                      <div style={{ backgroundColor: colors.background }}>
                        {/* Bill items */}
                        {categoryBills.map((bill) => (
                          <div
                            key={bill.id}
                            onClick={() => toggleExpanded(bill.id)}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 100px 100px 100px',
                              gap: '1rem',
                              padding: '0.875rem 1.25rem 0.875rem 3.75rem',
                              borderTop: `1px solid ${colors.divider}`,
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease',
                              alignItems: 'center',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = colors.background;
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = colors.background;
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                              <MerchantLogo billName={bill.name} category={bill.category} size={24} isDark={isDark} />
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.text, margin: 0 }}>
                                    {bill.name}
                                  </p>
                                  {aiSettingsAvailable && aiCorrectionsByBill[bill.id]?.length > 0 && (
                                    <CorrectionBadge
                                      correctionCount={aiCorrectionsByBill[bill.id].length}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveCorrectionId(aiCorrectionsByBill[bill.id][0].id);
                                      }}
                                    />
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                  {bill.isSplit && (
                                    <span style={{
                                      fontSize: '0.65rem',
                                      fontWeight: 600,
                                      padding: '0.125rem 0.375rem',
                                      borderRadius: '8px',
                                      backgroundColor: isDark ? 'rgba(168,130,255,0.15)' : 'rgba(109,40,217,0.1)',
                                      color: isDark ? '#A882FF' : '#6D28D9',
                                    }}>
                                      {bill.funding
                                        ? `Funded across ${bill.funding.stages.length} paychecks`
                                        : 'Split'}
                                    </span>
                                  )}
                                  {bill.isSplit && bill.funding && (
                                    <span style={{
                                      fontSize: '0.65rem',
                                      fontWeight: 600,
                                      padding: '0.125rem 0.375rem',
                                      borderRadius: '8px',
                                      backgroundColor: bill.funding.percentReady >= 100
                                        ? (isDark ? 'rgba(52,211,153,0.15)' : 'rgba(4,120,87,0.1)')
                                        : (isDark ? 'rgba(56,189,248,0.15)' : 'rgba(3,105,161,0.1)'),
                                      color: bill.funding.percentReady >= 100
                                        ? (isDark ? '#34D399' : '#047857')
                                        : (isDark ? '#38BDF8' : '#0369A1'),
                                    }}>
                                      {bill.funding.percentReady >= 100
                                        ? 'Fully funded'
                                        : `${Math.round(bill.funding.percentReady)}% set aside`}
                                    </span>
                                  )}
                                  {bill.isRecurring && (
                                    <span style={{
                                      fontSize: '0.65rem',
                                      fontWeight: 600,
                                      padding: '0.125rem 0.375rem',
                                      borderRadius: '8px',
                                      backgroundColor: isDark ? 'rgba(56,189,248,0.15)' : 'rgba(3,105,161,0.1)',
                                      color: isDark ? '#38BDF8' : '#0369A1',
                                    }}>Recurring</span>
                                  )}
                                  {matchedBillIds.has(bill.id) && (
                                    <span style={{
                                      fontSize: '0.65rem',
                                      fontWeight: 600,
                                      padding: '0.125rem 0.375rem',
                                      borderRadius: '8px',
                                      backgroundColor: isDark ? 'rgba(52,211,153,0.15)' : 'rgba(4,120,87,0.1)',
                                      color: isDark ? '#34D399' : '#047857',
                                    }}>Bank Synced</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text, margin: 0, textAlign: 'right' }}>
                              {fmt(bill.total)}
                            </p>
                            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text, margin: 0, textAlign: 'right' }}>
                              {fmt(bill.funded)}
                            </p>
                            <p style={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: bill.funded >= bill.total ? colors.green : colors.amber,
                              margin: 0,
                              textAlign: 'right',
                            }}>
                              {fmt(Math.max(0, bill.total - bill.funded))}
                            </p>
                          </div>
                        ))}

                      </div>
                    )}
                  </div>
                );
              })}
                  </div>
                  );
              })}
            </div>
          </Card>
          )}

          {/* One-Time Funds Section */}
          <Card style={{ marginTop: '2rem' }}>
            <div
              onClick={() => setExpandedFunds(!expandedFunds)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 1.25rem', cursor: 'pointer', userSelect: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  backgroundColor: isDark ? 'rgba(56,189,248,0.12)' : 'rgba(12,74,110,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Wallet size={18} style={{ color: colors.electric }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, margin: 0 }}>One-time funds</h3>
                  <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: '0.125rem 0 0' }}>
                    {oneTimeFunds.length} fund{oneTimeFunds.length !== 1 ? 's' : ''} · Track cash, bonuses & refunds
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAddFund(true); setExpandedFunds(true); }}
                  style={{
                    background: 'none', border: 'none', color: colors.electric,
                    fontSize: '1.375rem', fontWeight: 300, cursor: 'pointer', padding: '0 0.25rem',
                  }}
                >+</button>
                {expandedFunds ? <ChevronUp size={18} style={{ color: colors.textMuted }} /> : <ChevronDown size={18} style={{ color: colors.textMuted }} />}
              </div>
            </div>

            {expandedFunds && (
              <div style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                {/* Add fund inline form */}
                {showAddFund && (
                  <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                    <input
                      type="text"
                      placeholder="Fund name (e.g. Tax Refund)"
                      value={newFundName}
                      onChange={(e) => setNewFundName(e.target.value)}
                      style={{
                        width: '100%', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        borderRadius: 8, padding: '0.625rem 0.75rem', color: colors.text,
                        fontSize: '0.9375rem', marginBottom: '0.5rem', outline: 'none',
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={newFundAmount}
                      onChange={(e) => setNewFundAmount(e.target.value)}
                      style={{
                        width: '100%', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        borderRadius: 8, padding: '0.625rem 0.75rem', color: colors.text,
                        fontSize: '0.9375rem', marginBottom: '0.75rem', outline: 'none',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={handleAddFund}
                        style={{
                          flex: 1, background: colors.electric, border: 'none', borderRadius: 8,
                          padding: '0.625rem', color: '#fff', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                        }}
                      >Add fund</button>
                      <button
                        onClick={() => { setShowAddFund(false); setNewFundName(''); setNewFundAmount(''); }}
                        style={{
                          flex: 1, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                          border: 'none', borderRadius: 8, padding: '0.625rem',
                          color: colors.textMuted, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                        }}
                      >Cancel</button>
                    </div>
                  </div>
                )}

                {oneTimeFunds.length === 0 && !showAddFund && (
                  <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <p style={{ color: colors.textMuted, fontSize: '0.8125rem', margin: '0 0 0.75rem' }}>
                      Track money that doesn't hit your bank — cash gifts, side hustle income, bonuses, refunds.
                    </p>
                    <button
                      onClick={() => setShowAddFund(true)}
                      style={{
                        background: isDark ? 'rgba(56,189,248,0.12)' : 'rgba(12,74,110,0.08)',
                        border: 'none', borderRadius: 8, padding: '0.5rem 1rem',
                        color: colors.electric, fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer',
                      }}
                    >+ Add your first fund</button>
                  </div>
                )}

                {oneTimeFunds.map((fund, i) => {
                  const alloc = fundAllocations[fund.id] || { total: 0, items: [] };
                  const remaining = Math.max(0, fund.typicalAmount - alloc.total);
                  const pct = fund.typicalAmount > 0 ? Math.min(100, Math.round((alloc.total / fund.typicalAmount) * 100)) : 0;
                  const isFullySpent = remaining < 0.01;

                  return (
                    <Link key={fund.id} href={`/app/income?fund=${fund.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.875rem 1.25rem',
                        borderBottom: i < oneTimeFunds.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` : 'none',
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          backgroundColor: isDark ? 'rgba(56,189,248,0.12)' : 'rgba(12,74,110,0.08)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <span style={{ fontSize: '1rem' }}>💰</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text }}>{fund.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.125rem' }}>
                            <span style={{ fontSize: '0.6875rem', color: colors.textMuted }}>
                              {isFullySpent ? 'Fully spent' : `${fmt(remaining)} remaining`}
                            </span>
                            <span style={{ fontSize: '0.6875rem', color: colors.textMuted }}>·</span>
                            <span style={{ fontSize: '0.6875rem', color: colors.textMuted }}>{alloc.items.length} item{alloc.items.length !== 1 ? 's' : ''}</span>
                          </div>
                          {/* Progress bar */}
                          <div style={{
                            height: 3, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                            borderRadius: 2, marginTop: '0.375rem', overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%', width: `${pct}%`,
                              backgroundColor: isFullySpent ? (colors.green || '#16A34A') : colors.electric,
                              borderRadius: 2, transition: 'width 0.3s ease',
                            }} />
                          </div>
                        </div>
                        <span style={{
                          fontSize: '0.9375rem', fontWeight: 600,
                          color: isFullySpent ? (colors.green || '#16A34A') : colors.text,
                          flexShrink: 0,
                        }}>{fmt(fund.typicalAmount)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Plan ahead card — Ultra only */}
          <Link href="/app/plan">
            <Card style={{
              marginTop: '2rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.25rem',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? 'rgba(56,189,248,0.08)' : 'rgba(56,189,248,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.card;
            }}
            >
              <Calendar size={32} style={{ color: colors.electric, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: '0 0 0.25rem 0' }}>Plan ahead</h3>
                <p style={{ fontSize: '0.875rem', color: colors.textMuted, margin: 0 }}>Draft next month's budget</p>
              </div>
              <ChevronRight size={20} style={{ color: colors.textMuted }} />
            </Card>
          </Link>

          </div>
        )}
      </TwoColumnLayout>

      {/* Quick Spend Actions */}
      {quickSpendActionTxn && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1rem',
          }}
          onClick={() => setQuickSpendActionTxn(null)}
        >
          <div
            style={{
              backgroundColor: colors.background,
              borderRadius: '14px',
              width: '100%',
              maxWidth: '420px',
              border: `1px solid ${colors.divider}`,
              padding: '1rem',
              boxShadow: '0 24px 70px rgba(0,0,0,0.32)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {quickSpendTxnName(quickSpendActionTxn)}
            </h3>
            <p style={{ margin: '0.25rem 0 1rem', fontSize: '0.8rem', color: colors.textMuted }}>
              {fmt(quickSpendTxnAmount(quickSpendActionTxn))} bank transaction
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                disabled={quickSpendActioning === quickSpendActionTxn.id}
                onClick={() => handleMakeQuickSpendRecurring(quickSpendActionTxn)}
                style={{
                  border: `1px solid ${isDark ? 'rgba(56,189,248,0.22)' : 'rgba(3,105,161,0.18)'}`,
                  borderRadius: '10px',
                  background: isDark ? 'rgba(56,189,248,0.12)' : 'rgba(12,74,110,0.08)',
                  color: colors.electric,
                  padding: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                Make Recurring
              </button>
              <button
                disabled={quickSpendActioning === quickSpendActionTxn.id}
                onClick={() => { setQuickSpendLinkTxn(quickSpendActionTxn); setQuickSpendActionTxn(null); }}
                style={{
                  border: `1px solid ${isDark ? 'rgba(56,189,248,0.22)' : 'rgba(3,105,161,0.18)'}`,
                  borderRadius: '10px',
                  background: isDark ? 'rgba(56,189,248,0.12)' : 'rgba(12,74,110,0.08)',
                  color: colors.electric,
                  padding: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                Link to Existing
              </button>
              <button
                disabled={quickSpendActioning === quickSpendActionTxn.id}
                onClick={() => handleHideQuickSpendMerchant(quickSpendActionTxn)}
                style={{
                  border: `1px solid ${isDark ? 'rgba(248,113,113,0.22)' : 'rgba(220,38,38,0.18)'}`,
                  borderRadius: '10px',
                  background: isDark ? 'rgba(248,113,113,0.10)' : 'rgba(220,38,38,0.08)',
                  color: isDark ? '#FCA5A5' : '#B91C1C',
                  padding: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                Hide Merchant
              </button>
              <button
                onClick={() => setQuickSpendActionTxn(null)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: colors.textMuted,
                  padding: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Spend Link Picker */}
      {quickSpendLinkTxn && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1rem',
          }}
          onClick={() => setQuickSpendLinkTxn(null)}
        >
          <div
            style={{
              backgroundColor: colors.background,
              borderRadius: '14px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: `1px solid ${colors.divider}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1rem', borderBottom: `1px solid ${colors.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: colors.text }}>Link to Bill</h3>
              <button onClick={() => setQuickSpendLinkTxn(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: colors.textMuted }}>x</button>
            </div>
            <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${colors.divider}` }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: colors.textMuted }}>
                Linking: <strong style={{ color: colors.text }}>{quickSpendTxnName(quickSpendLinkTxn)}</strong> - {fmt(quickSpendTxnAmount(quickSpendLinkTxn))}
              </p>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {bills.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <p style={{ color: colors.textMuted }}>No bills found. Add a bill first.</p>
                </div>
              ) : (
                [...bills]
                  .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
                  .map((bill: any) => (
                    <div
                      key={bill.id}
                      onClick={() => handleQuickSpendBillSelected(bill.id)}
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: quickSpendActioning === quickSpendLinkTxn.id ? 'wait' : 'pointer',
                        borderBottom: `1px solid ${colors.divider}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.text }}>{bill.name}</div>
                        <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>{bill.category || 'Other'}</div>
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isDark ? '#38BDF8' : '#0369A1' }}>
                        {fmt(bill.total)}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <AddBillModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />

      {/* Correction detail modal */}
      {activeCorrectionId && (
        <CorrectionDetailModal
          correctionId={activeCorrectionId}
          open={!!activeCorrectionId}
          onClose={() => setActiveCorrectionId(null)}
        />
      )}
    </AppLayout>
  );
}
