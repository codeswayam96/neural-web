// Playground sits inside /agents/[id] which is already wrapped by the
// agents/ layout → DashboardLayout. No extra layout wrapper needed here.
export default function AgentPlaygroundLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
