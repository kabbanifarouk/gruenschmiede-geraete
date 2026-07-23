import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

export default async function DashboardLayout({ children }) {
  const nutzer = await getSession();
  if (!nutzer) redirect("/login");
  return <DashboardShell nutzer={nutzer}>{children}</DashboardShell>;
}
