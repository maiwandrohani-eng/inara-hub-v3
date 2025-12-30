import { useState } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const [imageError, setImageError] = useState(false);
  
  const sizes = {
    sm: { logo: 64, text: 'text-xl' },
    md: { logo: 96, text: 'text-2xl' },
    lg: { logo: 128, text: 'text-4xl' },
  };

  const { logo: logoSize, text: textSize } = sizes[size];

  return (
    <div className={`flex flex-col items-start ${className}`}>
      {/* Logo Image - Try PNG first, fallback to SVG */}
      {!imageError ? (
        <img
          src="/inara-logo.png"
          alt="INARA Logo"
          width={logoSize}
          height={logoSize}
          className="mb-2 mt-4"
          onError={() => setImageError(true)}
        />
      ) : (
        // Fallback SVG Logo (matches the INARA brand colors)
        <svg
          width={logoSize}
          height={logoSize}
          viewBox="0 0 100 100"
          className="mb-2 mt-4"
        >
          {/* Yellow band */}
          <path
            d="M 25 50 Q 20 30, 35 25 Q 50 20, 65 25 Q 75 30, 70 45 Q 65 60, 50 65 Q 35 60, 25 50"
            fill="none"
            stroke="#FFD700"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Magenta/Pink band */}
          <path
            d="M 70 45 Q 75 30, 65 25 Q 50 20, 35 25 Q 25 30, 30 45 Q 35 60, 50 65 Q 65 60, 70 45"
            fill="none"
            stroke="#FF1493"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Light Blue/Cyan band */}
          <path
            d="M 50 65 Q 65 60, 70 45 Q 75 60, 65 75 Q 50 80, 35 75 Q 25 70, 30 55 Q 35 60, 50 65"
            fill="none"
            stroke="#00BFFF"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Teal/Mint Green band */}
          <path
            d="M 30 45 Q 25 30, 35 25 Q 50 20, 65 25 Q 75 40, 70 55 Q 65 70, 50 75 Q 35 70, 30 55 Q 30 50, 30 45"
            fill="none"
            stroke="#40E0D0"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      
      {/* Text */}
      {showText && (
        <span className={`${textSize} font-normal tracking-wide text-white`}>
          INARA
        </span>
      )}
    </div>
  );
}
