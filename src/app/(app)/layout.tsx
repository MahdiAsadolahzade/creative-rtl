export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="app-theme" data-theme="dark">{children}</div>;
}
