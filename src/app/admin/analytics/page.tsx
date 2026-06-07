"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const supabase = createBrowserSupabaseClient();

  const { data: analytics } = useQuery({
    queryKey: ["admin-analytics", timeRange],
    queryFn: async () => {
      // Daily active users (last 30 days)
      const { data: dauData } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Revenue by day
      const { data: revenueData } = await supabase
        .from("creator_earnings")
        .select("created_at, gross_amount")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Top creators by earnings
      const { data: topCreators } = await supabase
        .from("profiles")
        .select("username, display_name, total_earnings, followers_count")
        .eq("tier", "creator")
        .order("total_earnings", { ascending: false })
        .limit(10);

      // Content metrics
      const { data: contentMetrics } = await supabase
        .from("posts")
        .select("post_type, view_count, like_count, comment_count");

      return {
        dauData,
        revenueData,
        topCreators,
        contentMetrics,
      };
    },
  });

  const totalRevenue = analytics?.revenueData?.reduce((sum: number, r: any) => sum + (r.gross_amount || 0), 0) || 0;
  const totalViews = analytics?.contentMetrics?.reduce((sum: number, c: any) => sum + (c.view_count || 0), 0) || 0;
  const totalEngagement = analytics?.contentMetrics?.reduce((sum: number, c: any) => sum + (c.like_count || 0) + (c.comment_count || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-navy-400 text-sm">Platform performance and insights</p>
        </div>
        <div className="flex gap-2">
          {["7d", "30d", "90d", "1y"].map((range) => (
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

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: `$${totalRevenue.toLocaleString()}`,
            change: "+18%",
            trend: "up",
            icon: DollarSign,
            color: "bg-emerald-500",
          },
          {
            label: "Total Views",
            value: totalViews.toLocaleString(),
            change: "+32%",
            trend: "up",
            icon: Activity,
            color: "bg-blue-500",
          },
          {
            label: "Engagement",
            value: totalEngagement.toLocaleString(),
            change: "+15%",
            trend: "up",
            icon: TrendingUp,
            color: "bg-gold-500",
          },
          {
            label: "Active Creators",
            value: analytics?.topCreators?.length || 0,
            change: "+8%",
            trend: "up",
            icon: Users,
            color: "bg-purple-500",
          },
        ].map((metric) => (
          <div key={metric.label} className="bg-navy-900 border border-navy-800 rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className={`${metric.color} p-2.5 rounded-lg`}>
                <metric.icon className="w-5 h-5 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${
                metric.trend === "up" ? "text-green-400" : "text-red-400"
              }`}>
                {metric.trend === "up" ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {metric.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{metric.value}</p>
            <p className="text-sm text-navy-400 mt-1">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Top Creators */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Top Creators by Earnings</h2>
          <BarChart3 className="w-5 h-5 text-navy-400" />
        </div>
        <div className="space-y-3">
          {analytics?.topCreators?.map((creator: any, index: number) => (
            <div
              key={creator.username}
              className="flex items-center gap-4 p-3 bg-navy-800/50 rounded-xl"
            >
              <div className="w-8 h-8 bg-navy-700 rounded-full flex items-center justify-center text-sm font-bold text-navy-300">
                {index + 1}
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {creator.display_name?.[0] || creator.username[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{creator.display_name || creator.username}</p>
                <p className="text-xs text-navy-400">@{creator.username} · {creator.followers_count} followers</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gold-400">${creator.total_earnings?.toLocaleString()}</p>
                <p className="text-xs text-navy-400">lifetime</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Performance */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Content Performance</h2>
        <div className="grid grid-cols-3 gap-4">
          {["text", "image", "video"].map((type) => {
            const typeData = analytics?.contentMetrics?.filter((c: any) => c.post_type === type) || [];
            const avgViews = typeData.length > 0
              ? Math.round(typeData.reduce((sum: number, c: any) => sum + c.view_count, 0) / typeData.length)
              : 0;

            return (
              <div key={type} className="bg-navy-800/50 p-4 rounded-xl text-center">
                <p className="text-sm font-medium text-navy-400 capitalize mb-2">{type} Posts</p>
                <p className="text-2xl font-bold text-white">{typeData.length}</p>
                <p className="text-xs text-navy-400 mt-1">{avgViews} avg views</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
