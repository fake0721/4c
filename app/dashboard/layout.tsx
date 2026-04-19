import { DashboardLayout } from "@/components/dashboard/shell/dashboard-layout";
import { getDashboardShellData } from "@/lib/dashboard/workbench";

export default async function DashboardRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shellData = await getDashboardShellData();

  return <DashboardLayout {...shellData}>{children}</DashboardLayout>;
}
