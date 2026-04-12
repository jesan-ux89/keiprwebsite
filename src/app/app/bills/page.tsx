'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { bankingAPI, aiAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import AddBillModal from './AddBillModal';
import { BillsSkeleton } from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import { Plus, Search, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import MerchantLogo from '@/components/MerchantLogo';
import CategoryIcon from '@/components/CategoryIcon';
import AISuggestionCard, { AISuggestion } from '@/components/AISuggestionCard';

type SortBy = 'name' | 'dueDate' | 'amount';

interface ExpandedBills {
  [key: string]: boolean;
}

export default function BillsPage() {
  const { colors, isDark } = useTheme();
  const { bills, billsLoading, fmt, isUltra, spendingSummary, spendingBudgets, detectedBills, detectedCount, confirmDetectedBill, confirmAsOneTime, dismissDetectedBill, linkDuplicateBill, creditCards } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedBills, setExpandedBills] = useState<ExpandedBills>({});
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [matchedBillIds, setMatchedBillIds] = useState<Set<string>>(new Set());
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);

  useEffect(() => {
    if (isUltra) {
      bankingAPI.getMatchedBills()
        .then(res => setMatchedBillIds(new Set(res.data?.matched_bill_ids || [])))
        .catch(() => {});
      aiAPI.getSuggestions()
        .then(res => setAiSuggestions(res.data?.suggestions || []))
        .catch(() => {});
    }
  }, [isUltra, bills]);

  const handleSuggestionAction = async (id: string, action: 'apply' | 'dismiss') => {
    try {
      await aiAPI.handleSuggestion(id, action);
      setAiSuggestions(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to process suggestion');
    }
  };

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

  // Get all category names: bills + spending budgets (if Ultra)
  const allCategoryNames = useMemo(() => {
    const billCategories = new Set(filteredBills.map(b => b.category));
    const budgetCategories = isUltra ? (spendingBudgets || []).map((b: any) => b.category) : [];
    const combined = Array.from(new Set([...billCategories, ...budgetCategories]));
    return combined.sort((a, b) => {
      const totalA = filteredBills.filter(x => x.category === a).reduce((s, x) => s + x.total, 0);
      const totalB = filteredBills.filter(x => x.category === b).reduce((s, x) => s + x.total, 0);
      return totalB - totalA;
    });
  }, [filteredBills, isUltra, spendingBudgets]);

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

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: colors.text,
              margin: 0,
            }}
          >
            {isUltra ? 'Budget' : 'Bills'}
          </h1>
          <p
            style={{
              color: colors.textMuted,
              margin: '0.5rem 0 0 0',
              fontSize: '0.95rem',
            }}
          >
            Manage and track all your bills
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
        </div>
      </div>

      {/* Search and Sort */}
      <Card
        style={{
          marginBottom: '2rem',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '1rem',
          alignItems: 'end',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Input
            type="text"
            placeholder="Search bills by name or category..."
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

      {/* Bills List */}
      {billsLoading ? (
        <BillsSkeleton />
      ) : filteredBills.length === 0 ? (
        <EmptyState
          icon="bills"
          title="No bills yet"
          description="Add your first bill to start tracking your budget."
          actionLabel="Add a bill"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Credit Cards Visualizer (Full Dollar Tracking) */}
          {creditCards.length > 0 && (
            <div>
              <h2 style={{
                fontSize: '1.1rem', fontWeight: 600, color: colors.text,
                margin: '0 0 1rem 0', paddingBottom: '0.75rem',
                borderBottom: `1px solid ${colors.divider}`,
              }}>Bills paid by credit card</h2>
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

          {/* Detected Transactions Section */}
          {detectedCount > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{
                  fontSize: '1.1rem', fontWeight: 600, color: colors.electric,
                  margin: 0, paddingBottom: '0.75rem',
                  borderBottom: `1px solid rgba(56,189,248,0.25)`,
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  flex: 1,
                }}>
                  <span>🔔</span> New transactions detected ({detectedCount})
                </h2>
              </div>

              {/* Bulk Actions Bar */}
              {detectedCount >= 3 && (
                <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1rem' }}>
                  <button
                    onClick={() => {
                      if (window.confirm(`Confirm all ${detectedCount} as recurring bills?`)) {
                        detectedBills.forEach(b => confirmDetectedBill(b.id));
                      }
                    }}
                    style={{
                      flex: 1, padding: '0.625rem', borderRadius: '0.5rem', border: 'none',
                      backgroundColor: colors.electric, color: '#fff', fontWeight: 600,
                      fontSize: '0.8rem', cursor: 'pointer',
                    }}
                  >Confirm all recurring</button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Dismiss all ${detectedCount} detected bills?`)) {
                        detectedBills.forEach(b => dismissDetectedBill(b.id));
                      }
                    }}
                    style={{
                      flex: 1, padding: '0.625rem', borderRadius: '0.5rem', border: 'none',
                      backgroundColor: isDark ? 'rgba(214,209,199,0.10)' : 'rgba(12,74,110,0.08)',
                      color: colors.textSub, fontWeight: 600,
                      fontSize: '0.8rem', cursor: 'pointer',
                    }}
                  >Dismiss all</button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {detectedBills.map((bill) => (
                  <Card key={bill.id} style={{ borderLeft: `3px solid ${colors.electric}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1 }}>
                        <MerchantLogo billName={bill.name} category={bill.category} size={32} isDark={isDark} />
                        <div>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: '0 0 0.25rem 0' }}>{bill.name}</h3>
                          <p style={{ fontSize: '0.8rem', color: colors.textSub, margin: 0 }}>
                            {bill.category} · {bill.detectedAt
                              ? `Last charged ${new Date(bill.detectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                              : `Due day ${bill.dueDay}`}
                          </p>
                        </div>
                      </div>
                      <p style={{ fontSize: '1.1rem', fontWeight: 700, color: colors.text, margin: '0 1rem 0 0' }}>{fmt(bill.total)}/mo</p>
                    </div>

                    {/* Duplicate Prompt */}
                    {bill.possibleDuplicateOf && bill.possibleDuplicateName ? (
                      <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.75rem' }}>
                        <button
                          onClick={() => linkDuplicateBill(bill.id, bill.possibleDuplicateOf!)}
                          style={{
                            flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: 'none',
                            backgroundColor: colors.electric, color: '#fff', fontWeight: 600,
                            fontSize: '0.8rem', cursor: 'pointer',
                          }}
                        >Yes, same bill</button>
                        <button
                          onClick={() => confirmDetectedBill(bill.id)}
                          style={{
                            flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: 'none',
                            backgroundColor: isDark ? 'rgba(214,209,199,0.10)' : 'rgba(12,74,110,0.08)',
                            color: colors.textSub, fontWeight: 600,
                            fontSize: '0.8rem', cursor: 'pointer',
                          }}
                        >No, keep both</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.75rem' }}>
                        <button
                          onClick={() => confirmDetectedBill(bill.id)}
                          style={{
                            flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: 'none',
                            backgroundColor: colors.electric, color: '#fff', fontWeight: 600,
                            fontSize: '0.8rem', cursor: 'pointer',
                          }}
                        >Recurring bill</button>
                        <button
                          onClick={() => confirmAsOneTime(bill.id)}
                          style={{
                            flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: 'none',
                            backgroundColor: isDark ? 'rgba(214,209,199,0.10)' : 'rgba(12,74,110,0.08)',
                            color: colors.textSub, fontWeight: 600,
                            fontSize: '0.8rem', cursor: 'pointer',
                          }}
                        >One-time expense</button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* AI SUGGESTIONS (Ultra only) */}
          {isUltra && aiSuggestions.length > 0 && (
            <AISuggestionCard
              suggestions={aiSuggestions}
              onAction={handleSuggestionAction}
            />
          )}


          {/* Plan ahead card — Ultra only */}
          {isUltra && (
            <Link href="/app/plan">
              <Card style={{
                marginBottom: '1.5rem',
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
                <span style={{ color: colors.textMuted, fontSize: '1.25rem' }}>›</span>
              </Card>
            </Link>
          )}

          {allCategoryNames.map((catName) => {
            const categoryBills = groupedFilteredBills[catName] || [];
            const catBudget = isUltra ? (spendingBudgets || []).find((b: any) => b.category === catName) : null;
            const catSummary = catBudget ? (spendingSummary || []).find((s: any) => s.category === catName) : null;
            const hasBills = categoryBills.length > 0;
            const hasBudget = isUltra && !!catBudget;

            let catHeaderSub = '';
            if (hasBills && hasBudget) {
              catHeaderSub = `${categoryBills.length} bill${categoryBills.length !== 1 ? 's' : ''} + spending target`;
            } else if (hasBills) {
              catHeaderSub = `${categoryBills.length} bill${categoryBills.length !== 1 ? 's' : ''}`;
            } else if (hasBudget) {
              const spent = catSummary?.spentAmount || 0;
              const budget = catBudget.budget_amount || 0;
              catHeaderSub = `${fmt(spent)} of ${fmt(budget)} spent`;
            }

            return (
            <div key={catName}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  paddingBottom: '0.75rem',
                  borderBottom: `1px solid ${colors.divider}`,
                  cursor: 'pointer',
                }}
                onClick={() => setExpandedBills(prev => ({ ...prev, [catName]: !prev[catName] }))}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h2
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: colors.text,
                        margin: 0,
                      }}
                    >
                      {catName}
                    </h2>
                    {hasBudget && (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.125rem 0.5rem',
                        borderRadius: '10px',
                        backgroundColor: catSummary && catSummary.remaining < 0 ? 'rgba(220,38,38,0.1)' : 'rgba(168,130,255,0.15)',
                        color: catSummary && catSummary.remaining < 0 ? '#DC2626' : isDark ? '#A882FF' : '#6D28D9',
                        letterSpacing: '0.3px',
                      }}>
                        {catSummary && catSummary.remaining < 0 ? 'OVER' : 'TARGET'}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: colors.textMuted,
                      margin: 0,
                    }}
                  >
                    {catHeaderSub}
                  </p>
                  {hasBudget && !hasBills && catBudget.budget_amount > 0 && (
                    <div style={{ height: '5px', backgroundColor: colors.progressTrack || colors.cardBorder, borderRadius: '3px', overflow: 'hidden', marginTop: '0.5rem', width: '85%' }}>
                      <div style={{
                        height: '100%', borderRadius: '3px',
                        width: `${Math.min(100, Math.round(((catSummary?.spentAmount || 0) / (catBudget.budget_amount || 1)) * 100))}%`,
                        backgroundColor: catSummary && catSummary.remaining < 0 ? '#DC2626' : colors.green,
                      }} />
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <p
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: catSummary && catSummary.remaining < 0 ? '#DC2626' : colors.text,
                      margin: 0,
                    }}
                  >
                    {fmt(hasBills ? categoryBills.reduce((s, b) => s + b.total, 0) : (catBudget?.budget_amount || 0))}
                  </p>
                  <span style={{ color: colors.textMuted, fontSize: '1rem' }}>
                    {expandedBills[catName] ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {expandedBills[catName] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                {categoryBills.map((bill) => {
                  const isExpanded = expandedBills[bill.id];

                  return (
                    <Card
                      key={bill.id}
                      onClick={() => toggleExpanded(bill.id)}
                      style={{
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', flex: 1 }}>
                          <MerchantLogo billName={bill.name} category={bill.category} size={32} isDark={isDark} />
                          <div style={{ flex: 1 }}>
                          <h3
                            style={{
                              fontSize: '1rem',
                              fontWeight: 600,
                              color: colors.text,
                              margin: '0 0 0.375rem 0',
                            }}
                          >
                            {bill.name}
                          </h3>

                          {/* Pill badges */}
                          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                            {bill.isSplit && (
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '0.125rem 0.5rem',
                                borderRadius: '10px',
                                backgroundColor: isDark ? 'rgba(168,130,255,0.15)' : 'rgba(109,40,217,0.1)',
                                color: isDark ? '#A882FF' : '#6D28D9',
                                letterSpacing: '0.3px',
                              }}>Split</span>
                            )}
                            {bill.isQuickExpense && (
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '0.125rem 0.5rem',
                                borderRadius: '10px',
                                backgroundColor: isDark ? 'rgba(251,191,36,0.15)' : 'rgba(217,119,6,0.1)',
                                color: isDark ? '#FBBF24' : '#D97706',
                                letterSpacing: '0.3px',
                              }}>Quick Spend</span>
                            )}
                            {!bill.isQuickExpense && bill.isRecurring && (
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '0.125rem 0.5rem',
                                borderRadius: '10px',
                                backgroundColor: isDark ? 'rgba(56,189,248,0.15)' : 'rgba(3,105,161,0.1)',
                                color: isDark ? '#38BDF8' : '#0369A1',
                                letterSpacing: '0.3px',
                              }}>Recurring</span>
                            )}
                            {matchedBillIds.has(bill.id) && (
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '0.125rem 0.5rem',
                                borderRadius: '10px',
                                backgroundColor: isDark ? 'rgba(52,211,153,0.15)' : 'rgba(4,120,87,0.1)',
                                color: isDark ? '#34D399' : '#047857',
                                letterSpacing: '0.3px',
                              }}>Bank Synced</span>
                            )}
                            {bill.paidWith && (
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '0.125rem 0.5rem',
                                borderRadius: '10px',
                                backgroundColor: isDark ? 'rgba(251,146,60,0.15)' : 'rgba(194,102,2,0.1)',
                                color: isDark ? '#FB923C' : '#B45309',
                                letterSpacing: '0.3px',
                              }}>💳 {bill.paidWith}</span>
                            )}
                            {!bill.isQuickExpense && <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              padding: '0.125rem 0.5rem',
                              borderRadius: '10px',
                              backgroundColor: isDark ? 'rgba(214,209,199,0.1)' : 'rgba(12,74,110,0.08)',
                              color: isDark ? '#D6D1C7' : '#4A5568',
                              letterSpacing: '0.3px',
                            }}>Due the {bill.dueDay}{bill.dueDay === 1 ? 'st' : bill.dueDay === 2 ? 'nd' : bill.dueDay === 3 ? 'rd' : 'th'}</span>}
                          </div>

                          {/* Split progress */}
                          {bill.isSplit && (() => {
                            const splits = [
                              { amount: bill.p1, done: bill.p1done },
                              { amount: bill.p2, done: bill.p2done },
                              { amount: bill.p3, done: bill.p3done },
                              { amount: bill.p4, done: bill.p4done },
                            ].filter(s => s.amount > 0);
                            const splitsTotal = splits.length;
                            const splitsDone = splits.filter(s => s.done).length;
                            const allDone = splitsDone === splitsTotal && splitsTotal > 0;
                            return (
                              <p style={{
                                fontSize: '0.8rem',
                                color: allDone ? (isDark ? '#34D399' : '#047857') : (isDark ? '#A882FF' : '#6D28D9'),
                                margin: '0 0 0.25rem 0',
                              }}>
                                {allDone
                                  ? `${splitsTotal} of ${splitsTotal} splits ✓ Fully saved!`
                                  : `${splitsDone} of ${splitsTotal} splits ✓`}
                              </p>
                            );
                          })()}

                        </div>
                        </div>

                        <div
                          style={{
                            textAlign: 'right',
                            marginRight: '1rem',
                          }}
                        >
                          <p
                            style={{
                              fontSize: '1.25rem',
                              fontWeight: 700,
                              color: colors.text,
                              margin: 0,
                            }}
                          >
                            {fmt(bill.total)}
                          </p>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            color: colors.textMuted,
                          }}
                        >
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div
                          style={{
                            marginTop: '1.5rem',
                            paddingTop: '1.5rem',
                            borderTop: `1px solid ${colors.divider}`,
                          }}
                        >
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                              gap: '1rem',
                              marginBottom: '1.5rem',
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  fontSize: '0.875rem',
                                  color: colors.textMuted,
                                  margin: '0 0 0.5rem 0',
                                }}
                              >
                                Total Amount
                              </p>
                              <p
                                style={{
                                  fontSize: '1.25rem',
                                  fontWeight: 700,
                                  color: colors.text,
                                  margin: 0,
                                }}
                              >
                                {fmt(bill.total)}
                              </p>
                            </div>

                            <div>
                              <p
                                style={{
                                  fontSize: '0.875rem',
                                  color: colors.textMuted,
                                  margin: '0 0 0.5rem 0',
                                }}
                              >
                                Funded
                              </p>
                              <p
                                style={{
                                  fontSize: '1.25rem',
                                  fontWeight: 700,
                                  color: colors.text,
                                  margin: 0,
                                }}
                              >
                                {fmt(bill.funded)}
                              </p>
                            </div>

                            <div>
                              <p
                                style={{
                                  fontSize: '0.875rem',
                                  color: colors.textMuted,
                                  margin: '0 0 0.5rem 0',
                                }}
                              >
                                Remaining
                              </p>
                              <p
                                style={{
                                  fontSize: '1.25rem',
                                  fontWeight: 700,
                                  color: bill.funded >= bill.total ? colors.green : colors.amber,
                                  margin: 0,
                                }}
                              >
                                {fmt(Math.max(0, bill.total - bill.funded))}
                              </p>
                            </div>
                          </div>

                          {/* Split breakdown */}
                          {bill.isSplit && (
                            <div
                              style={{
                                marginBottom: '1.5rem',
                                padding: '1rem',
                                backgroundColor: colors.background,
                                borderRadius: '0.5rem',
                              }}
                            >
                              <p
                                style={{
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                  color: colors.text,
                                  margin: '0 0 0.75rem 0',
                                }}
                              >
                                Split Across Paychecks
                              </p>
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(2, 1fr)',
                                  gap: '0.75rem',
                                }}
                              >
                                {[
                                  { num: 1, amount: bill.p1, paid: bill.p1done },
                                  { num: 2, amount: bill.p2, paid: bill.p2done },
                                  { num: 3, amount: bill.p3, paid: bill.p3done },
                                  { num: 4, amount: bill.p4, paid: bill.p4done },
                                ].map(({ num, amount, paid }) => (
                                  <div
                                    key={num}
                                    style={{
                                      padding: '0.75rem',
                                      backgroundColor: colors.card,
                                      borderRadius: '0.375rem',
                                      border: `1px solid ${colors.cardBorder}`,
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <div>
                                      <p
                                        style={{
                                          fontSize: '0.875rem',
                                          color: colors.textMuted,
                                          margin: 0,
                                        }}
                                      >
                                        Paycheck {num}
                                      </p>
                                    </div>
                                    <div
                                      style={{
                                        textAlign: 'right',
                                      }}
                                    >
                                      <p
                                        style={{
                                          fontSize: '0.95rem',
                                          fontWeight: 600,
                                          color: colors.text,
                                          margin: 0,
                                        }}
                                      >
                                        {fmt(amount)}
                                      </p>
                                      <p
                                        style={{
                                          fontSize: '0.75rem',
                                          color: paid ? colors.green : colors.textMuted,
                                          margin: '0.125rem 0 0 0',
                                        }}
                                      >
                                        {paid ? 'Paid' : 'Unpaid'}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Progress bar */}
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '0.5rem',
                              }}
                            >
                              <span style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                                Progress
                              </span>
                              <span style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                                {bill.total > 0 ? Math.round((bill.funded / bill.total) * 100) : 0}%
                              </span>
                            </div>
                            <div
                              style={{
                                width: '100%',
                                height: '8px',
                                backgroundColor: colors.progressTrack,
                                borderRadius: '4px',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${bill.total > 0 ? Math.min((bill.funded / bill.total) * 100, 100) : 0}%`,
                                  backgroundColor: colors.electric,
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
                {hasBudget && (
                  <Card style={{ cursor: 'pointer' }} onClick={() => alert('Budget spending tracker')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.625rem', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', flex: 1 }}>
                        <CategoryIcon category={catName} size={32} isDark={isDark} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                              {catName} spending
                            </h3>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              padding: '0.125rem 0.5rem',
                              borderRadius: '10px',
                              backgroundColor: catSummary && catSummary.remaining < 0 ? 'rgba(220,38,38,0.1)' : 'rgba(168,130,255,0.15)',
                              color: catSummary && catSummary.remaining < 0 ? '#DC2626' : isDark ? '#A882FF' : '#6D28D9',
                              letterSpacing: '0.3px',
                            }}>
                              {catSummary && catSummary.remaining < 0 ? 'OVER' : 'TARGET'}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.875rem', color: colors.textMuted, margin: '0 0 0.5rem 0' }}>
                            {fmt(catSummary?.spentAmount || 0)} of {fmt(catBudget.budget_amount)} spent
                          </p>
                          {catBudget.budget_amount > 0 && (
                            <div style={{ height: '5px', backgroundColor: colors.progressTrack || colors.cardBorder, borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', borderRadius: '3px',
                                width: `${Math.min(100, Math.round(((catSummary?.spentAmount || 0) / (catBudget.budget_amount || 1)) * 100))}%`,
                                backgroundColor: catSummary && catSummary.remaining < 0 ? '#DC2626' : colors.green,
                              }} />
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '1.1rem', fontWeight: 700, color: colors.text, margin: 0 }}>
                          {fmt(catBudget.budget_amount)}
                        </p>
                        {catSummary && catSummary.spentAmount > 0 && (
                          <p style={{ fontSize: '0.8rem', color: colors.textMuted, margin: '0.25rem 0 0 0' }}>
                            {fmt(catSummary.spentAmount)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                )}
              </div>
              )}
            </div>
          );})
        </div>
      )}

      {/* Add Expense Modal */}
      <AddBillModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
