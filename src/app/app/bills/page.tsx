'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { bankingAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import AddBillModal from './AddBillModal';
import { BillsSkeleton } from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import { Plus, Search, ChevronDown, ChevronUp } from 'lucide-react';

type SortBy = 'name' | 'dueDate' | 'amount';

interface ExpandedBills {
  [key: string]: boolean;
}

export default function BillsPage() {
  const { colors } = useTheme();
  const { bills, billsLoading, fmt, isUltra } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedBills, setExpandedBills] = useState<ExpandedBills>({});
  const [matchedBillIds, setMatchedBillIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isUltra) {
      bankingAPI.getMatchedBills()
        .then(res => setMatchedBillIds(new Set(res.data?.matched_bill_ids || [])))
        .catch(() => {});
    }
  }, [isUltra, bills]);

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
            Bills
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
          Add Bill
        </Button>
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
          {Object.entries(groupedFilteredBills).map(([category, categoryBills]) => (
            <div key={category}>
              <h2
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: colors.text,
                  margin: '0 0 1rem 0',
                  paddingBottom: '0.75rem',
                  borderBottom: `1px solid ${colors.divider}`,
                }}
              >
                {category}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                                backgroundColor: 'rgba(168,130,255,0.15)',
                                color: '#A882FF',
                                letterSpacing: '0.3px',
                              }}>Split</span>
                            )}
                            {bill.isRecurring && (
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '0.125rem 0.5rem',
                                borderRadius: '10px',
                                backgroundColor: 'rgba(56,189,248,0.15)',
                                color: '#38BDF8',
                                letterSpacing: '0.3px',
                              }}>Recurring</span>
                            )}
                            {matchedBillIds.has(bill.id) && (
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '0.125rem 0.5rem',
                                borderRadius: '10px',
                                backgroundColor: 'rgba(52,211,153,0.15)',
                                color: '#34D399',
                                letterSpacing: '0.3px',
                              }}>Bank Synced</span>
                            )}
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              padding: '0.125rem 0.5rem',
                              borderRadius: '10px',
                              backgroundColor: 'rgba(214,209,199,0.1)',
                              color: '#D6D1C7',
                              letterSpacing: '0.3px',
                            }}>Due the {bill.dueDay}{bill.dueDay === 1 ? 'st' : bill.dueDay === 2 ? 'nd' : bill.dueDay === 3 ? 'rd' : 'th'}</span>
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
                                color: allDone ? '#34D399' : '#A882FF',
                                margin: '0 0 0.25rem 0',
                              }}>
                                {allDone
                                  ? `${splitsTotal} of ${splitsTotal} splits ✓ Fully saved!`
                                  : `${splitsDone} of ${splitsTotal} splits ✓`}
                              </p>
                            );
                          })()}

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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Bill Modal */}
      <AddBillModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
