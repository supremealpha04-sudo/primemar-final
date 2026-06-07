"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Crown,
  Star,
  Zap,
  TrendingUp,
  Clock,
  Ghost,
  Users,
  Rocket,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    media_urls: string[] | null;
    post_type: string;
    is_time_locked: boolean;
    is_ghost: boolean;
    engagement_score: number;
    view_count: number;
    like_count: number;
    comment_count: number;
    share_count: number;
    boost_count: number;
    created_at: string;
    profiles: {
      id: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
      badge_type: string;
      is_verified: boolean;
    };
  };
}

export function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const supabase = createBrowserSupabaseClient();
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (liked) {
        await supabase.from("likes").delete().eq("post_id", post.id);
      } else {
        await supabase.from("likes").insert({ post_id: post.id });
      }
    },
    onSuccess: () => {
      setLiked(!liked);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const handleBoost = async (amount: number) => {
    try {
      // Flutterwave integration placeholder
      toast.success(`Boosted $${amount}! Creator gets 70%`);
      setShowBoostModal(false);
    } catch (error) {
      toast.error("Boost failed");
    }
  };

  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case "premium":
        return <Crown className="w-3.5 h-3.5 text-gold-500" />;
      case "creator":
        return <Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500" />;
      default:
        return null;
    }
  };

  return (
    <article className="bg-white rounded-2xl shadow-elevated p-5 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.profiles.username}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {post.profiles.display_name?.[0] || post.profiles.username[0]}
            </div>
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <Link
                href={`/profile/${post.profiles.username}`}
                className="font-semibold text-navy-900 hover:underline"
              >
                {post.profiles.display_name || post.profiles.username}
              </Link>
              {post.profiles.is_verified && (
                <div className="w-4 h-4 bg-gold-500 rounded-full flex items-center justify-center">
                  <Zap className="w-2.5 h-2.5 text-white fill-white" />
                </div>
              )}
              {getBadgeIcon(post.profiles.badge_type)}
              {post.is_ghost && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  <Ghost className="w-3 h-3" />
                  Ghost
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-navy-400">
              <span>@{post.profiles.username}</span>
              <span>·</span>
              <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>
              {post.is_time_locked && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-gold-600">
                    <Clock className="w-3 h-3" />
                    Time-locked
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button className="p-1.5 hover:bg-navy-50 rounded-full transition-colors">
          <MoreHorizontal className="w-5 h-5 text-navy-400" />
        </button>
      </div>

      {/* Content */}
      <Link href={`/post/${post.id}`}>
        <p className="text-navy-800 text-[15px] leading-relaxed mb-3 whitespace-pre-wrap">
          {post.content}
        </p>
      </Link>

      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className={`grid gap-2 mb-3 rounded-xl overflow-hidden ${
          post.media_urls.length === 1 ? "grid-cols-1" :
          post.media_urls.length === 2 ? "grid-cols-2" :
          "grid-cols-2"
        }`}>
          {post.media_urls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt="Post media"
              className="w-full object-cover max-h-96 hover:opacity-95 transition-opacity cursor-pointer"
            />
          ))}
        </div>
      )}

      {/* Engagement Stats */}
      <div className="flex items-center gap-4 text-xs text-navy-400 mb-3 px-1">
        <span>{post.view_count.toLocaleString()} views</span>
        <span>{post.engagement_score.toFixed(1)} engagement</span>
        {post.boost_count > 0 && (
          <span className="flex items-center gap-1 text-gold-600">
            <Rocket className="w-3 h-3" />
            {post.boost_count} boosts
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-navy-100">
        <div className="flex items-center gap-1">
          <button
            onClick={() => likeMutation.mutate()}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all ${
              liked
                ? "text-red-500 bg-red-50"
                : "text-navy-500 hover:bg-red-50 hover:text-red-500"
            }`}
          >
            <Heart className={`w-5 h-5 ${liked ? "fill-red-500" : ""}`} />
            <span className="text-sm font-medium">{post.like_count + (liked ? 1 : 0)}</span>
          </button>

          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-navy-500 hover:bg-blue-50 hover:text-blue-500 transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{post.comment_count}</span>
          </Link>

          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-navy-500 hover:bg-green-50 hover:text-green-500 transition-all relative"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-sm font-medium">{post.share_count}</span>

            {showShareMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-elevated border border-navy-100 py-2 z-20">
                <button className="w-full text-left px-4 py-2 text-sm text-navy-700 hover:bg-navy-50">
                  Copy link
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-navy-700 hover:bg-navy-50">
                  Share to Twitter
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-navy-700 hover:bg-navy-50">
                  Share to WhatsApp
                </button>
              </div>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowBoostModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-gold-600 hover:bg-gold-50 transition-all"
          >
            <Rocket className="w-5 h-5" />
            <span className="text-sm font-medium">Boost</span>
          </button>

          <button
            onClick={() => setBookmarked(!bookmarked)}
            className={`p-2 rounded-full transition-all ${
              bookmarked
                ? "text-navy-900 bg-navy-100"
                : "text-navy-400 hover:bg-navy-50 hover:text-navy-600"
            }`}
          >
            <Bookmark className={`w-5 h-5 ${bookmarked ? "fill-navy-900" : ""}`} />
          </button>
        </div>
      </div>

      {/* Boost Modal */}
      {showBoostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-navy-900 mb-1">Boost this post</h3>
            <p className="text-sm text-navy-500 mb-4">
              Support @{post.profiles.username} and increase reach
            </p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[1, 5, 10, 25, 50, 100].map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleBoost(amount)}
                  className="py-3 px-4 bg-navy-50 hover:bg-gold-50 hover:text-gold-700 rounded-xl text-sm font-semibold text-navy-700 transition-all"
                >
                  ${amount}
                </button>
              ))}
            </div>

            <div className="bg-navy-50 rounded-xl p-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-navy-500">Creator gets (70%)</span>
                <span className="font-semibold text-navy-900">$3.50 - $70.00</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-navy-500">Platform fee (30%)</span>
                <span className="font-semibold text-navy-900">$1.50 - $30.00</span>
              </div>
            </div>

            <button
              onClick={() => setShowBoostModal(false)}
              className="w-full py-2.5 text-sm font-medium text-navy-500 hover:text-navy-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
