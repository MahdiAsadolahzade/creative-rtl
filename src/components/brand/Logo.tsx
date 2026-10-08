type LogoProps = {
  variant?: "mark" | "wordmark";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = { sm: 28, md: 36, lg: 48 } as const;

export function Logo({ variant = "wordmark", size = "md", className = "" }: LogoProps) {
  const dimension = sizes[size];
  return (
    <span className={`brand-lockup brand-lockup--${variant} ${className}`} dir="ltr">
      <svg aria-hidden="true" width={dimension} height={dimension} viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id={`logo-gradient-${size}`} x1="4" y1="4" x2="29" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A78BFA" />
            <stop offset=".5" stopColor="#6366F1" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        <path d="M14.2 5.5 6.1 13.6a3.4 3.4 0 0 0 0 4.8l8.1 8.1" stroke={`url(#logo-gradient-${size})`} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m17.8 5.5 8.1 8.1a3.4 3.4 0 0 1 0 4.8l-8.1 8.1" stroke={`url(#logo-gradient-${size})`} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m14.8 16 2.4 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      {variant !== "mark" && <span className="wordmark"><span>creative-</span><b>rtl</b></span>}
    </span>
  );
}
