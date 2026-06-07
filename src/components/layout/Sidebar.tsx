"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  TrendingUp,
  Users,
  Bookmark,
  Settings,
  Shield,
  Crown,
} from "lucide-react";
import { useAuthStore } from "@/hooks/useAuth";

const navItems = [
  { icon: Home, label: "Feed", href: "/feed" },
  { icon: Compass, label: "Explore", href: "/explore" },
  { icon: TrendingUp, label: "Trending", href: "/trending" },
  { icon: Users, label: "Following", href: "/following" },
  { icon: Bookmark, label: "Bookmarks", href: "/bookmarks" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuthStore();

  return (
    <aside className="hidden lg:flex fixed left-0 top-16 w-[280px] h-[calc(100vh-64px)] bg-white border-r border-navy-100 flex-col overflow-y-auto">
      <div className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-navy-900 text-white"
                  : "text-navy-600 hover:bg-navy-50"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-gold-400" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto p-4 border-t border-navy-100 space-y-1">
        <Link
          href="/premium"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gold-600 hover:bg-gold-50 transition-all"
        >
          <Crown className="w-5 h-5" />
          Upgrade to Premium
        </Link>

        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-navy-600 hover:bg-navy-50 transition-all"
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>

        {isAdmin && (
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <Shield className="w-5 h-5" />
            Admin Panel
          </Link>
        )}

        {/* Mini Profile */}
        <div className="mt-4 p-3 bg-navy-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.display_name?.[0] || user?.username?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-navy-900 text-sm truncate">
                {user?.display_name || user?.username}
              </p>
              <p className="text-xs text-navy-500 truncate">@{user?.username}</p>
            </div>
            {user?.badge_type === "premium" && (
              <Crown className="w-4 h-4 text-gold-500 shrink-0" />
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
