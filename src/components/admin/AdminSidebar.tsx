"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  ShieldAlert,
  DollarSign,
  BarChart3,
  ClipboardList,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/hooks/useAuth";

const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: FileText, label: "Content", href: "/admin/content" },
  { icon: ShieldAlert, label: "Moderation", href: "/admin/moderation" },
  { icon: DollarSign, label: "Payouts", href: "/admin/payouts" },
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
  { icon: ClipboardList, label: "Audit Log", href: "/admin/audit" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-navy-900 border-r border-navy-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-navy-800">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-gold-400" />
          <span className="text-xl font-bold text-white">
            Prime<span className="text-gold-400">Mar</span>
          </span>
        </Link>
        <p className="text-xs text-navy-400 mt-1">Admin Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {adminNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-gold-500/10 text-gold-400 border border-gold-500/20"
                  : "text-navy-300 hover:bg-navy-800 hover:text-white"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-navy-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
            {user?.display_name?.[0] || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.display_name || user?.username}
            </p>
            <p className="text-xs text-navy-400">Admin</p>
          </div>
        </div>
        <Link
          href="/feed"
          className="flex items-center gap-2 mt-3 px-4 py-2 text-sm text-navy-400 hover:text-white hover:bg-navy-800 rounded-xl transition-all"
        >
          <LogOut className="w-4 h-4" />
          Exit Admin
        </Link>
      </div>
    </aside>
  );
}
