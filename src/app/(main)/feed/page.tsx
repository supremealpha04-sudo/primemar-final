"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { PostCard } from "@/components/feed/PostCard";
import { CreatePost } from "@/components/feed/CreatePost";
import { Flame, Clock, Sparkles } from "lucide-react";

type FeedType = "for-you" | "following" | "trending";

export default function FeedPage() {
  const [feedType, setFeedType] = useState<FeedType>("for-you");
  const supabase = createBrowserSupabaseClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts", feedType],
    queryFn: async () => {
      let query = supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id (id, username, display_name, avatar_url, badge_type, is_verified)
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (feedType === "trending") {
        query = query.order("engagement_score", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Feed Tabs */}
      <div className="sticky top-0 z-10 bg-cream/80 backdrop-blur-xl border-b border-navy-100 -mx-4 px-4 py-2">
        <div className="flex gap-1 bg-navy-100/50 p-1 rounded-xl">
          {[
            { id: "for-you" as FeedType, label: "For You", icon: Sparkles },
            { id: "following" as FeedType, label: "Following", icon: Flame },
            { id: "trending" as FeedType, label: "Trending", icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFeedType(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                feedType === tab.id
                  ? "bg-white text-navy-900 shadow-sm"
                  : "text-navy-500 hover:text-navy-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Create Post */}
      <CreatePost />

      {/* Posts */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-navy-100 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-navy-100 rounded w-32" />
                    <div className="h-3 bg-navy-100 rounded w-20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-navy-100 rounded w-full" />
                  <div className="h-4 bg-navy-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          posts?.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}
