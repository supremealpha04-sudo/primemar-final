"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { useAuthStore } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Search,
  Bell,
  MessageSquare,
  Plus,
  Sparkles,
  LogOut,
  Crown,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    toast.success("Signed out successfully");
    router.push("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-navy-100 h-16">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2 shrink-0">
          <Sparkles className="w-6 h-6 text-gold-500" />
          <span className="text-xl font-bold text-navy-900 tracking-tight hidden sm:block">
            Prime<span className="text-gold-500">Mar</span>
          </span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search creators, posts, topics..."
              className="w-full pl-10 pr-4 py-2 bg-navy-50 border border-navy-100 rounded-full focus:ring-2 focus:ring-gold-400 focus:border-transparent outline-none text-sm text-navy-900 placeholder:text-navy-400"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/create"
            className="hidden sm:flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create
          </Link>

          <Link
            href="/premium"
            className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-navy-900 px-4 py-2 rounded-full text-sm font-semibold transition-colors"
          >
            <Crown className="w-4 h-4" />
            Premium
          </Link>

          <button className="relative p-2 hover:bg-navy-50 rounded-full transition-colors">
            <Bell className="w-5 h-5 text-navy-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <Link href="/messages" className="p-2 hover:bg-navy-50 rounded-full transition-colors">
            <MessageSquare className="w-5 h-5 text-navy-600" />
          </Link>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center gap-2 p-1 hover:bg-navy-50 rounded-full transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user?.display_name?.[0] || user?.username?.[0] || "U"}
              </div>
            </button>

            {mobileMenuOpen && (
              <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-elevated border border-navy-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-navy-100">
                  <p className="font-semibold text-navy-900">{user?.display_name || user?.username}</p>
                  <p className="text-sm text-navy-500">@{user?.username}</p>
                </div>
                <Link href={`/profile/${user?.username}`} className="block px-4 py-2 hover:bg-navy-50 text-navy-700 text-sm">
                  Profile
                </Link>
                <Link href="/creator/dashboard" className="block px-4 py-2 hover:bg-navy-50 text-navy-700 text-sm">
                  Creator Dashboard
                </Link>
                <Link href="/settings" className="block px-4 py-2 hover:bg-navy-50 text-navy-700 text-sm">
                  Settings
                </Link>
                <div className="border-t border-navy-100 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
