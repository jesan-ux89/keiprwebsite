'use client';

import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SkeletonStyles } from '@/components/LoadingSkeleton';

export default function AuthAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <SkeletonStyles />
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </AppLayout>
  );
}
