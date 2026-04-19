'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import AppLayout, { TwoColumnLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import AddBillModal from './AddBillModal';
import { BillsSkeleton } from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import { Plus, Search, ChevronDown, ChevronUp, Lock, Waves } from 'lucide-react';
import MerchantLogo from '@/components/MerchantLogo';
import CategoryIcon from '@/components/CategoryIcon';

type SortBy = 'name' | 'dueDate' | 'amount';

interface ExpandedBills {
  [key: string]: boolean;
}

export default function BillsFreeContent() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { bills, billsLoading, fmt, spendingSummary, spendingBudgets, creditCards } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedBills, setExpandedBills] = useState<ExpandedBills>({});
  const [expandedTypes, setExpandedTypes] = useState<{ fixed: boolean; flexible: boolean }>({ fixed: false, flexible: false });
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

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
    return billsPaid;
  }, [filteredBills]);

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
      pageTitle="Expenses"
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

        {/* Search and Sort Controls */}
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

        {/* Bills List */}
        {billsLoading ? (
          <BillsSkeleton />
        ) : filteredBills.length === 0 ? (
          <EmptyState
            icon="bills"
            title="No expenses yet"
            description="Add your first expense to start tracking your budget."
            actionLabel="Add an expense"
            onAction={() => setShowAddModal(true)}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

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
                Expenses paid by credit card
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

          {/* Monarch-style Budget Table */}
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
                                    }}>Split</span>
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

          {/* Plan Ahead Card — only when no search filter */}
          {!searchTerm && (
            <div
              onClick={() => router.push('/app/plan')}
              style={{
                backgroundColor: colors.inputBg, borderRadius: 12,
                border: `0.5px solid ${colors.cardBorder}`,
                marginBottom: 16, cursor: 'pointer', overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', gap: 12 }}>
                <span style={{ fontSize: 24 }}>📅</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 2 }}>Plan ahead</div>
                  <div style={{ fontSize: 12, color: colors.textSub }}>Draft next month's budget</div>
                </div>
                <span style={{ fontSize: 20, color: colors.textMuted }}>&rsaquo;</span>
              </div>
            </div>
          )}

          </div>
        )}
      </TwoColumnLayout>

      {/* Add Expense Modal */}
      <AddBillModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </AppLayout>
  );
}
