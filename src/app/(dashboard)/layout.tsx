import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Phones: stacked (top bar, then page). Desktop: sidebar on the left, page on the right
    <div className="relative min-h-screen md:flex">
      {/* Soft aurora glow behind everything */}
      <div className="pointer-events-none fixed inset-0 bg-aurora opacity-60" aria-hidden="true" />

      <Sidebar />
      <div className="relative z-10 min-w-0 flex-1">{children}</div>
    </div>
  );
}