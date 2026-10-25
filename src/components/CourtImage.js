'use client';
import { useState } from 'react';

export default function CourtImage({ src, alt = '', className = '' }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-br from-emerald-800 to-emerald-950 ${className}`}>
        <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full opacity-60" fill="none" stroke="white" strokeWidth="1.2">
          <rect x="20" y="15" width="160" height="90" />
          <line x1="100" y1="15" x2="100" y2="105" />
          <rect x="20" y="35" width="45" height="50" />
          <rect x="135" y="35" width="45" height="50" />
          <line x1="65" y1="60" x2="135" y2="60" />
        </svg>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={`object-cover ${className}`} onError={() => setErr(true)} />;
}
