// components/Logo.tsx
'use client';

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 36, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle with gradient */}
      <defs>
        <linearGradient id="logoBg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="iconGlow" x1="128" y1="128" x2="384" y2="384" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="100%" stopColor="#E0E7FF" stopOpacity="0.9" />
        </linearGradient>
        <filter id="innerShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#1E40AF" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Main rounded square background */}
      <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#logoBg)" />
      
      {/* Subtle shine overlay */}
      <rect x="16" y="16" width="480" height="240" rx="112" fill="white" opacity="0.08" />

      {/* Central hub circle */}
      <circle cx="256" cy="240" r="52" fill="url(#iconGlow)" filter="url(#innerShadow)" />
      
      {/* Inner dot */}
      <circle cx="256" cy="240" r="18" fill="#6366F1" />

      {/* Top-left node */}
      <circle cx="140" cy="148" r="32" fill="url(#iconGlow)" opacity="0.95" />
      <circle cx="140" cy="148" r="12" fill="#3B82F6" />

      {/* Top-right node */}
      <circle cx="372" cy="148" r="32" fill="url(#iconGlow)" opacity="0.95" />
      <circle cx="372" cy="148" r="12" fill="#8B5CF6" />

      {/* Bottom-left node */}
      <circle cx="140" cy="340" r="32" fill="url(#iconGlow)" opacity="0.95" />
      <circle cx="140" cy="340" r="12" fill="#3B82F6" />

      {/* Bottom-right node */}
      <circle cx="372" cy="340" r="32" fill="url(#iconGlow)" opacity="0.95" />
      <circle cx="372" cy="340" r="12" fill="#8B5CF6" />

      {/* Connection lines from center to nodes */}
      <line x1="220" y1="212" x2="165" y2="168" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
      <line x1="292" y1="212" x2="347" y2="168" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
      <line x1="220" y1="268" x2="165" y2="320" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
      <line x1="292" y1="268" x2="347" y2="320" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.6" />

      {/* Lightning bolt (automation symbol) */}
      <path
        d="M268 370 L248 410 L272 410 L252 450"
        stroke="url(#iconGlow)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.95"
      />
      
      {/* Small sparkle dots */}
      <circle cx="296" cy="380" r="5" fill="white" opacity="0.7" />
      <circle cx="224" cy="430" r="4" fill="white" opacity="0.5" />
      <circle cx="288" cy="440" r="3" fill="white" opacity="0.6" />
    </svg>
  );
}
