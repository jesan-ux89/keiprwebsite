'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ComingSoonContent() {
  const searchParams = useSearchParams();
  const platform = searchParams.get('platform');

  const isIOS = platform === 'ios';
  const title = isIOS ? 'iOS App Coming Soon' : 'Android App Releasing Soon';
  const subtitle = isIOS
    ? 'We\'re working hard to bring Keipr to the App Store. Be the first to know when it launches.'
    : 'The Keipr Android app is almost ready. Stay tuned for the Google Play release.';
  const icon = isIOS ? (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="#38BDF8">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  ) : (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92z" fill="#4285F4"/>
      <path d="M17.556 8.236L5.178.734C4.756.49 4.324.394 3.93.447l9.862 9.862 3.764-2.073z" fill="#EA4335"/>
      <path d="M17.556 15.764l-3.764-2.073L3.93 23.553c.394.053.826-.043 1.248-.287l12.378-7.502z" fill="#34A853"/>
      <path d="M20.778 12c0-.678-.378-1.28-.945-1.588l-2.277-1.376-4.014 2.214L14.792 12l-1.25.75 4.014 2.214 2.277-1.376c.567-.308.945-.91.945-1.588z" fill="#FBBC04"/>
    </svg>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#1A1814' }}>
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center">{icon}</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#E8E5DC]">{title}</h1>
        <p className="text-lg text-[#E8E5DC]/60 leading-relaxed">{subtitle}</p>
        <p className="text-sm text-[#E8E5DC]/40">
          In the meantime, use Keipr on the web — all features, any browser.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/auth/signup"
            className="px-6 py-3 rounded-full bg-[#38BDF8] text-[#0C4A6E] font-semibold hover:opacity-90 transition text-center"
          >
            Get Started Free
          </Link>
          <Link
            href="/"
            className="px-6 py-3 rounded-full border border-[#E8E5DC]/20 text-[#E8E5DC] font-medium hover:border-[#E8E5DC]/40 transition text-center"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ComingSoon() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1A1814' }}>
        <span className="text-[#E8E5DC]/60">Loading...</span>
      </div>
    }>
      <ComingSoonContent />
    </Suspense>
  );
}
