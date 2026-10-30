import React from 'react';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  logoColor?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = '', 
  showText = true,
  size = 'md',
  logoColor = 'text-white' 
}) => {
  const iconHeight = 
    size === 'sm' ? 'h-4' : 
    size === 'md' ? 'h-5' : 
    size === 'lg' ? 'h-6 sm:h-7' : 
    'h-8 sm:h-9';
  const textClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base sm:text-lg' : size === 'xl' ? 'text-xl' : 'text-sm sm:text-base';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg 
        viewBox="0 0 60 20" 
        className={`${iconHeight} w-auto ${logoColor} shrink-0 transition-transform duration-200 hover:scale-105`} 
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="thrill Logo Mark"
      >
        <path d="M20.4266 4.56681H17.2569L16.2408 8.37525H15.9923V0.00105366H9.98967V14.9551H6.00264V9.32658H8.50104V4.56681H6.00264V0.00105366H0V16.1939C0 18.2921 1.72845 20 3.85371 20H8.52313L9.74196 15.4311H9.99046V20H15.9931V10.4719C15.9931 9.85328 16.5035 9.33983 17.1299 9.32736C17.7246 9.32736 18.2777 9.70749 18.2777 10.4711V20H24.2804V8.37291C24.2804 6.27391 22.5519 4.56681 20.4274 4.56681" />
        <path d="M43.1273 4.56624H37.1246V19.9994H43.1273V4.56624Z" />
        <path d="M43.1273 0.00102984H37.1247V3.25861H43.1273V0.00102984Z" />
        <path d="M58.5853 19.999H55.9678C54.2796 19.999 52.8043 18.9308 52.2955 17.3413L52.0273 16.503L51.0948 19.999H48.4718C46.3473 19.999 44.6181 18.2919 44.6181 16.1929V0H50.6207V14.954H52.1085V0H58.1112V14.954H59.9469L58.5853 19.999Z" />
        <path d="M32.0189 8.3747H31.7704V4.56626H25.7677V19.9995H31.7704V10.4425C31.7704 9.82702 32.2776 9.32681 32.9001 9.32681H35.6375V4.56704H33.0342L32.0181 8.37548L32.0189 8.3747Z" />
      </svg>

      {showText && (
        <span className={`font-extrabold tracking-tight text-white flex items-center gap-1.5 ${textClass}`}>
          <span>ContentOps</span>
          <span className="text-[#00E599]">OS</span>
        </span>
      )}
    </div>
  );
};
