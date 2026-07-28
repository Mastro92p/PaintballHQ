import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { MobileSidebar } from "@/components/layout/MobileSidebar";

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <div className="h-dvh overflow-hidden">
      <div className="flex h-dvh overflow-hidden lg:hidden">
        <MobileSidebar isAdmin={!!session} userEmail={session?.user?.email} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <SidebarProvider>
        <div className="hidden h-dvh overflow-hidden lg:flex">
          <Sidebar isAdmin={!!session} userEmail={session?.user?.email} />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </SidebarProvider>
    </div>
  );
}