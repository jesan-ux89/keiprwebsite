'use client';

import { useApp } from '@/context/AppContext';
import DashboardFreeContent from './DashboardFreeContent';
import DashboardUltraContent from './DashboardUltraContent';
import AIConsentFirstLoginPrompt from '@/components/AIConsentFirstLoginPrompt';

export default function DashboardPage() {
  const { isUltra } = useApp();
  return (
    <>
      {isUltra ? <DashboardUltraContent /> : <DashboardFreeContent />}
      {/* Shows ONCE for existing users who haven't been asked yet; silent no-op otherwise */}
      <AIConsentFirstLoginPrompt />
    </>
  );
}
