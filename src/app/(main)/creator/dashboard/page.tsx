"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { useAuthStore } from "@/hooks/useAuth";
import {
  DollarSign,
  Users,
  Eye,
  Heart,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Zap,
  Crown,
} from "lucide-react";

export default function CreatorDashboardPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const { user } = useAuthStore();
  const supabase = createBrowserSupabaseClient();

  const { data: dashboardData } = useQuery({
    queryKey: ["creator-dashboard", user?.id, timeRange],
    queryFn: async () => {
      if (!user?.id) return null;

      // Earnings
      const { data: earnings } = await supabase
        .from("creator_earnings")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });

      // Subscribers
      const { data: subscribers } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("creator_id", user.id)
        .eq("status", "active");

      // Posts performance
      const { data: posts } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      return { earnings, subscribers, posts };
    },
    enabled: !!user?.id,
  });

  const totalEarnings = dashboardData?.earnings?.reduce((sum: number, e: any) => sum + (e.net_amount || 0), 0) || 0;
  const pendingEarnings = dashboardData?.earnings?.filter((e: any) => e.status === "pending").reduce((sum: number, e: any) => sum + (e.net_amount || 0), 0) || 0;
  const totalSubscribers = dashboardData?.subscribers?.length || 0;
  const totalViews = dashboardData?.posts?.reduce((sum: number, p: any) => sum + (p.view_count || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Creator Dashboard</h1>
          <p className="text-navy-500 text-sm">Track your earnings, audience, and content performance</p>
        </div>
        <div className="flex gap-2">
          {["7d", "30d", "90d", "1y"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? "bg-navy-900 text-white"
                  : "bg-navy-100 text-navy-600 hover:bg-navy-200"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Earnings Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Earnings",
            value: `$${totalEarnings.toLocaleString()}`,
            change: "+24%",
            trend: "up",
            icon: DollarSign,
            color: "bg-emerald-500",
          },
          {
            label: "Pending Payout",
            value: `$${pendingEarnings.toLocaleString()}`,
            change: "—",
            trend: "neutral",
            icon: Wallet,
            color: "bg-orange-500",
          },
          {
            label: "Subscribers",
            value: totalSubscribers.toLocaleString(),
            change: "+12%",
            trend: "up",
            icon: Users,
            color: "bg-blue-500",
          },
          {
            label: "Total Views",
            value: totalViews.toLocaleString(),
            change: "+45%",
            trend: "up",
            icon: Eye,
            color: "bg-purple-500",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-navy-100 rounded-xl p-5 shadow-elevated">
            <div className="flex items-start justify-between mb-4">
              <div className={`${stat.color} p-2.5 rounded-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              {stat.trend !== "neutral" && (
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  stat.trend === "up" ? "text-green-600" : "text-red-600"
                }`}>
                  {stat.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-navy-900">{stat.value}</p>
            <p className="text-sm text-navy-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white border border-navy-100 rounded-xl p-6 shadow-elevated">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-navy-900">Revenue Sources</h2>
          <BarChart3 className="w-5 h-5 text-navy-400" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Subscriptions", amount: "$2,340", percentage: 65, color: "bg-blue-500" },
            { label: "Post Boosts", amount: "$890", percentage: 25, color: "bg-gold-500" },
            { label: "Virtual Gifts", amount: "$356", percentage: 10, color: "bg-purple-500" },
          ].map((source) => (
            <div key={source.label} className="text-center p-4 bg-navy-50 rounded-xl">
              <p className="text-sm text-navy-500 mb-1">{source.label}</p>
              <p className="text-xl font-bold text-navy-900">{source.amount}</p>
              <div className="w-full bg-navy-200 rounded-full h-2 mt-3">
                <div className={`${source.color} h-2 rounded-full`} style={{ width: `${source.percentage}%` }} />
              </div>
              <p className="text-xs text-navy-400 mt-1">{source.percentage}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performing Posts */}
      <div className="bg-white border border-navy-100 rounded-xl p-6 shadow-elevated">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-navy-900">Top Performing Posts</h2>
          <TrendingUp className="w-5 h-5 text-navy-400" />
        </div>
        <div className="space-y-3">
          {dashboardData?.posts?.map((post: any, index: number) => (
            <div key={post.id} className="flex items-center gap-4 p-3 bg-navy-50 rounded-xl">
              <div className="w-8 h-8 bg-navy-200 rounded-full flex items-center justify-center text-sm font-bold text-navy-600">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-navy-900 truncate">{post.content.slice(0, 80)}...</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-navy-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {post.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" /> {post.like_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" /> {post.boost_count} boosts
                  </span>
                </div>
              </div>
            </div>
          )) || (
            <p className="text-center text-navy-400 py-8">No posts yet. Start creating!</p>
          )}
        </div>
      </div>

      {/* Creator Progress (Hidden Criteria - Vague) */}
      <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-xl p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-5 h-5 text-gold-400" />
          <h2 className="text-lg font-semibold">Creator Progress</h2>
        </div>
        <p className="text-navy-300 text-sm mb-4">
          Keep growing your audience to unlock monetization features. The more you create, the closer you get!
        </p>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-navy-300">Audience Growth</span>
              <span className="text-gold-400 font-medium">Growing!</span>
            </div>
            <div className="w-full bg-navy-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-gold-400 to-gold-500 h-2 rounded-full" style={{ width: "65%" }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-navy-300">Engagement Quality</span>
              <span className="text-gold-400 font-medium">Excellent</span>
            </div>
            <div className="w-full bg-navy-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-gold-400 to-gold-500 h-2 rounded-full" style={{ width: "82%" }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-navy-300">Content Consistency</span>
              <span className="text-gold-400 font-medium">On Track</span>
            </div>
            <div className="w-full bg-navy-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-gold-400 to-gold-500 h-2 rounded-full" style={{ width: "45%" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
