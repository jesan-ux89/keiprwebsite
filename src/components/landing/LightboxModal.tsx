'use client';

import { X } from 'lucide-react';

interface LightboxModalProps {
  src: string | null;
  onClose: () => void;
}

export default function LightboxModal({ src, onClose }: LightboxModalProps) {
  if (!src) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'zoom-out',
        padding: '40px',
      }}
    >
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: '20px', right: '24px', background: 'none', border: 'none', cursor: 'pointer' }}
        aria-label="Close lightbox"
      >
        <X size={32} color="#fff" />
      </button>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: '90vh',
          maxWidth: '400px',
          width: '90vw',
          borderRadius: '36px',
          border: '4px solid rgba(255,255,255,0.15)',
          overflow: 'hidden',
          background: '#1A1814',
          boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)',
          cursor: 'default',
        }}
      >
        <img src={src} alt="Full resolution screenshot" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>
    </div>
  );
}
