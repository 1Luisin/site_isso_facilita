import type { Metadata } from "next";
import { AdminLogin } from "@/components/admin/login";
export const metadata: Metadata = { title: "Entrar · Admin", robots: { index: false, follow: false } };
export default function AdminLoginPage() { return <AdminLogin />; }
