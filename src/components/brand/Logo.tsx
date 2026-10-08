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
        <path d="m13 6-7 10 7 10M19 6l7 10-7 10" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 16h10" stroke="var(--primary-strong)" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      {variant !== "mark" && <span className="wordmark"><span>creative-</span><b>rtl</b></span>}
    </span>
  );
}
