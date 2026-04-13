'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SkeletonStyles } from '@/components/LoadingSkeleton';

export default function AuthAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SkeletonStyles />
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </>
  );
}
