import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import MobileHeader from "@/components/layout/MobileHeader";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--ss-surface)]">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex">
        <Sidebar user={session.user} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto scrollbar-thin pt-[56px] pb-[88px] md:pt-0 md:pb-0">
        {children}
      </main>

      {/* Floating header — mobile only */}
      <MobileHeader />

      {/* Floating bottom nav — mobile only */}
      <BottomNav />
    </div>
  );
}
