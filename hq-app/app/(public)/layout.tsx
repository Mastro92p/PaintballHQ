// app/(public)/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-context";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <SidebarProvider>
      <div className="flex h-dvh overflow-hidden">
        <Sidebar isAdmin={!!session} userEmail={session?.user?.email} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}