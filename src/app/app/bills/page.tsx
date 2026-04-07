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
import { Plus, Search, ChevronDown, ChevronUp, Split, Zap, Landmark } from 'lucide-react';

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
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <h3
                              style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: colors.text,
                                margin: 0,
                              }}
                            >
                              {bill.name}
                            </h3>
                            {matchedBillIds.has(bill.id) && (
                              <Landmark
                                size={14}
                                style={{
                                  color: colors.electric,
                                  flexShrink: 0,
                                }}
                                title="Matched to bank transaction"
                              />
                            )}
                            {bill.isSplit && (
                              <Split
                                size={16}
                                style={{
                                  color: colors.electric,
                                  opacity: 0.7,
                                }}
                                aria-label="This bill is split across paychecks"
                              />
                            )}
                            {bill.isAutoPay && (
                              <Zap
                                size={16}
                                style={{
                                  color: colors.green,
                                  opacity: 0.7,
                                }}
                                aria-label="AutoPay enabled"
                              />
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                            <span style={{ color: colors.textMuted }}>Due: Day {bill.dueDay}</span>
                            <span
                              style={{
                                color: colors.textMuted,
                              }}
                            >
                              Frequency: {bill.isRecurring ? 'Recurring' : 'One-time'}
                            </span>
                          </div>
                        </div>

                        <div
                          style={{
                            textAlign: 'right',
                            marginRight: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
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
                          <p
                            style={{
                              fontSize: '0.875rem',
                              color: colors.textMuted,
                              margin: '0.25rem 0 0 0',
                            }}
                          >
                            {fmt(bill.funded)}/{fmt(bill.total)}
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
