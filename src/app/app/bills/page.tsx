'use client';

import { useApp } from '@/context/AppContext';
import BillsFreeContent from './BillsFreeContent';
import BillsUltraContent from './BillsUltraContent';

export default function BillsPage() {
  const { isUltra } = useApp();

  if (isUltra) {
    return <BillsUltraContent />;
  }

  return <BillsFreeContent />;
}
