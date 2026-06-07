"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import {
  Users,
  DollarSign,
  FileText,
  ShieldAlert,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState("7d");
  const supabase = createBrowserSupabaseClient();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats", timeRange],
    queryFn: async () => {
      // Total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Premium users
      const { count: premiumUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("tier", "premium");

      // Total posts
      const { count: totalPosts } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true });

      // Pending payouts
      const { count: pendingPayouts } = await supabase
        .from("creator_earnings")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Total earnings
      const { data: earnings } = await supabase
        .from("creator_earnings")
        .select("net_amount")
        .eq("status", "paid_out");

      const totalEarnings = earnings?.reduce((sum, e) => sum + (e.net_amount || 0), 0) || 0;

      // Reports pending
      const { count: pendingReports } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      return {
        totalUsers: totalUsers || 0,
        premiumUsers: premiumUsers || 0,
        totalPosts: totalPosts || 0,
        pendingPayouts: pendingPayouts || 0,
        totalEarnings,
        pendingReports: pendingReports || 0,
      };
    },
  });

  const statCards = [
    {
      label: "Total Users",
      value: stats?.totalUsers || 0,
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      label: "Premium Users",
      value: stats?.premiumUsers || 0,
      change: "+8%",
      trend: "up",
      icon: DollarSign,
      color: "bg-gold-500",
    },
    {
      label: "Total Posts",
      value: stats?.totalPosts || 0,
      change: "+24%",
      trend: "up",
      icon: FileText,
      color: "bg-green-500",
    },
    {
      label: "Pending Payouts",
      value: stats?.pendingPayouts || 0,
      change: "-3%",
      trend: "down",
      icon: TrendingUp,
      color: "bg-orange-500",
    },
    {
      label: "Total Paid Out",
      value: `$${(stats?.totalEarnings || 0).toLocaleString()}`,
      change: "+18%",
      trend: "up",
      icon: DollarSign,
      color: "bg-emerald-500",
    },
    {
      label: "Pending Reports",
      value: stats?.pendingReports || 0,
      change: "+5",
      trend: "up",
      icon: ShieldAlert,
      color: "bg-red-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-navy-400 text-sm">Platform overview and key metrics</p>
        </div>
        <div className="flex gap-2">
          {["24h", "7d", "30d", "90d"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? "bg-gold-500 text-navy-900"
                  : "bg-navy-800 text-navy-300 hover:text-white"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-navy-900 border border-navy-800 rounded-xl p-5 hover:border-navy-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${stat.color} p-2.5 rounded-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${
                stat.trend === "up" ? "text-green-400" : "text-red-400"
              }`}>
                {stat.trend === "up" ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-navy-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <Activity className="w-5 h-5 text-navy-400" />
        </div>
        <div className="space-y-3">
          {[
            { action: "New user registered", time: "2 min ago", type: "user" },
            { action: "Creator eligibility unlocked", time: "5 min ago", type: "creator" },
            { action: "Post boost: $25", time: "12 min ago", type: "payment" },
            { action: "Content reported", time: "18 min ago", type: "report" },
            { action: "Payout processed: $340", time: "1 hour ago", type: "payout" },
          ].map((activity, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-navy-800/50 rounded-lg"
            >
              <div className={`w-2 h-2 rounded-full ${
                activity.type === "user" ? "bg-blue-400" :
                activity.type === "creator" ? "bg-gold-400" :
                activity.type === "payment" ? "bg-green-400" :
                activity.type === "report" ? "bg-red-400" :
                "bg-emerald-400"
              }`} />
              <div className="flex-1">
                <p className="text-sm text-white">{activity.action}</p>
                <p className="text-xs text-navy-400">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
