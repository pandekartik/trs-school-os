import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/page-header";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 items-center gap-3 border-b px-4 shrink-0">
          <SidebarTrigger className="h-7 w-7" />
          <Separator orientation="vertical" className="h-4" />
          <PageHeader />
        </header>
        <main className="flex flex-col flex-1 p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
      <Toaster position="bottom-right" richColors />
    </SidebarProvider>
  );
}