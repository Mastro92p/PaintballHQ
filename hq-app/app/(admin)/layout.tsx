// app/(admin)/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-context";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <SidebarProvider>
      <div className="flex h-dvh overflow-hidden">
        <Sidebar isAdmin={true} userEmail={session.user.email} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}