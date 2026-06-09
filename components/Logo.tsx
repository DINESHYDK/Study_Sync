
interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 36, showText = true, className }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        {/* Background container */}
        <rect width="32" height="32" rx="9" fill="#111119" stroke="#222230" strokeWidth="1.5" />
        
        {/* Synchronization loop paths */}
        <path
          d="M16 6C20.4183 6 24 9.58172 24 14C24 15.5 23.5 17 22.5 18"
          stroke="#2dd4bf"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M16 26C11.5817 26 8 22.4183 8 18C8 16.5 8.5 15 9.5 14"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Arrowheads for the sync loops */}
        <path d="M20.5 17.5L22.5 18L23.5 16M11.5 14.5L9.5 14L8.5 16" stroke="url(#logo-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Graduation cap in center */}
        <path
          d="M16 10L21.5 13L16 16L10.5 13L16 10Z"
          fill="#38bdf8"
        />
        <path
          d="M12.5 15V17.5C12.5 18.5 14 19.5 16 19.5C18 19.5 19.5 18.5 19.5 17.5V15"
          stroke="#2dd4bf"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      {showText && (
        <span className="font-bold text-lg tracking-tight text-white font-heading">
          StudySync
        </span>
      )}
    </div>
  );
}
