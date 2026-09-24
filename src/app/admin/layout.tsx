import type { Metadata } from "next";
import { AdminAuthProvider } from "@/components/admin/auth-provider";
import "./admin.css";
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-wrap"><AdminAuthProvider>{children}</AdminAuthProvider></div>;
}
