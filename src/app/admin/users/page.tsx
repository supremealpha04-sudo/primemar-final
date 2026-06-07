"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Search,
  Filter,
  MoreHorizontal,
  Shield,
  Crown,
  Star,
  Ban,
  CheckCircle,
  Eye,
} from "lucide-react";

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const supabase = createBrowserSupabaseClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", searchQuery, filterTier],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`);
      }

      if (filterTier !== "all") {
        query = query.eq("tier", filterTier);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data;
    },
  });

  const handleSuspend = async (userId: string) => {
    try {
      await supabase
        .from("profiles")
        .update({ tier: "free" })
        .eq("id", userId);
      toast.success("User suspended");
    } catch (error) {
      toast.error("Failed to suspend user");
    }
  };

  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case "premium": return <Crown className="w-4 h-4 text-gold-500" />;
      case "creator": return <Star className="w-4 h-4 text-gold-500 fill-gold-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-navy-400 text-sm">Manage platform users</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2.5 bg-navy-900 border border-navy-700 rounded-xl text-white placeholder:text-navy-500 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          className="px-4 py-2.5 bg-navy-900 border border-navy-700 rounded-xl text-white focus:ring-2 focus:ring-gold-500 outline-none"
        >
          <option value="all">All Tiers</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
          <option value="creator">Creator</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-navy-800">
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase">User</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase">Tier</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase">Followers</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase">Earnings</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase">Status</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-navy-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-navy-400">
                  Loading users...
                </td>
              </tr>
            ) : (
              users?.map((user: any) => (
                <tr key={user.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {user.display_name?.[0] || user.username[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-white">{user.display_name || user.username}</p>
                          {getBadgeIcon(user.badge_type)}
                        </div>
                        <p className="text-sm text-navy-400">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.tier === "creator" ? "bg-gold-500/10 text-gold-400" :
                      user.tier === "premium" ? "bg-blue-500/10 text-blue-400" :
                      "bg-navy-800 text-navy-400"
                    }`}>
                      {user.tier === "creator" && <Star className="w-3 h-3" />}
                      {user.tier === "premium" && <Crown className="w-3 h-3" />}
                      {user.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white">{user.followers_count?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-white">${user.total_earnings?.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs ${
                      user.strike_count > 0 ? "text-red-400" : "text-green-400"
                    }`}>
                      {user.strike_count > 0 ? (
                        <><Ban className="w-3 h-3" /> {user.strike_count} strikes</>
                      ) : (
                        <><CheckCircle className="w-3 h-3" /> Good</>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2 hover:bg-navy-800 rounded-lg text-navy-400 hover:text-white transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSuspend(user.id)}
                        className="p-2 hover:bg-red-900/30 rounded-lg text-navy-400 hover:text-red-400 transition-colors"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">User Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 hover:bg-navy-800 rounded-lg text-navy-400"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {selectedUser.display_name?.[0] || selectedUser.username[0]}
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{selectedUser.display_name || selectedUser.username}</p>
                  <p className="text-navy-400">@{selectedUser.username}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-navy-800/50 p-3 rounded-xl">
                  <p className="text-xs text-navy-400">Followers</p>
                  <p className="text-lg font-semibold text-white">{selectedUser.followers_count}</p>
                </div>
                <div className="bg-navy-800/50 p-3 rounded-xl">
                  <p className="text-xs text-navy-400">Following</p>
                  <p className="text-lg font-semibold text-white">{selectedUser.following_count}</p>
                </div>
                <div className="bg-navy-800/50 p-3 rounded-xl">
                  <p className="text-xs text-navy-400">Total Earnings</p>
                  <p className="text-lg font-semibold text-white">${selectedUser.total_earnings}</p>
                </div>
                <div className="bg-navy-800/50 p-3 rounded-xl">
                  <p className="text-xs text-navy-400">Pending</p>
                  <p className="text-lg font-semibold text-white">${selectedUser.pending_earnings}</p>
                </div>
              </div>

              {/* Hidden Creator Criteria (Admin Only) */}
              <div className="bg-navy-800/50 p-4 rounded-xl border border-gold-500/20">
                <p className="text-xs font-semibold text-gold-400 mb-2">Creator Eligibility (Hidden)</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-navy-400">Premium Subscribers</span>
                    <span className="text-white">{selectedUser.premium_subscriber_count} / 1,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Consecutive Months</span>
                    <span className="text-white">{selectedUser.consecutive_premium_months} / 4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Eligible</span>
                    <span className={selectedUser.creator_eligible ? "text-green-400" : "text-navy-400"}>
                      {selectedUser.creator_eligible ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    toast.info("Force eligibility feature coming soon");
                  }}
                  className="flex-1 bg-gold-500 hover:bg-gold-600 text-navy-900 font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Force Eligible
                </button>
                <button
                  onClick={() => {
                    handleSuspend(selectedUser.id);
                    setSelectedUser(null);
                  }}
                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Suspend
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
