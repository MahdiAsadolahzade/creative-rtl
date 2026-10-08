export function Ltr({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <bdi dir="ltr" lang="en" className={className}>{children}</bdi>;
}
