'use client';

import { useApp } from '@/context/AppContext';
import DashboardFreeContent from './DashboardFreeContent';
import DashboardUltraContent from './DashboardUltraContent';

export default function DashboardPage() {
  const { isUltra } = useApp();
  return isUltra ? <DashboardUltraContent /> : <DashboardFreeContent />;
}
