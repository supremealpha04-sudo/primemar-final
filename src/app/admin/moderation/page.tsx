"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { toast } from "sonner";
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Eye,
  Ban,
  AlertTriangle,
  MessageSquare,
  FileText,
  User,
  Filter,
} from "lucide-react";

export default function AdminModerationPage() {
  const [filterStatus, setFilterStatus] = useState("pending");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const supabase = createBrowserSupabaseClient();
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports", filterStatus],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          *,
          reporter:reporter_id (username, display_name)
        `)
        .eq("status", filterStatus)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ reportId, resolution }: { reportId: string; resolution: string }) => {
      const { error } = await supabase
        .from("reports")
        .update({ status: "resolved", resolution, resolved_at: new Date().toISOString() })
        .eq("id", reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report resolved");
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      setSelectedReport(null);
    },
  });

  const issueStrikeMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      // Get current strike count
      const { data: profile } = await supabase
        .from("profiles")
        .select("strike_count")
        .eq("id", userId)
        .single();

      const newStrikeCount = (profile?.strike_count || 0) + 1;

      // Update profile
      await supabase
        .from("profiles")
        .update({
          strike_count: newStrikeCount,
          last_strike_at: new Date().toISOString(),
        })
        .eq("id", userId);

      // Create strike record
      await supabase.from("user_strikes").insert({
        user_id: userId,
        strike_number: newStrikeCount,
        reason,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // If 3 strikes, suspend
      if (newStrikeCount >= 3) {
        await supabase
          .from("profiles")
          .update({ tier: "free" })
          .eq("id", userId);
      }
    },
    onSuccess: () => {
      toast.success("Strike issued");
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
  });

  const getContentIcon = (type: string) => {
    switch (type) {
      case "post": return <FileText className="w-4 h-4" />;
      case "comment": return <MessageSquare className="w-4 h-4" />;
      case "profile": return <User className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Moderation</h1>
          <p className="text-navy-400 text-sm">Review reported content and take action</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-navy-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-navy-900 border border-navy-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-gold-500 outline-none"
          >
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Pending", value: "12", color: "text-orange-400", bg: "bg-orange-500/10" },
          { label: "Today", value: "28", color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Resolved", value: "156", color: "text-green-400", bg: "bg-green-500/10" },
          { label: "Escalated", value: "3", color: "text-red-400", bg: "bg-red-500/10" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} border border-navy-800 rounded-xl p-4`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-navy-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Reports Table */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-navy-800">
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase">Content</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase">Reason</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase">Reporter</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase">Status</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-navy-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-navy-400">Loading reports...</td>
              </tr>
            ) : (
              reports?.map((report: any) => (
                <tr key={report.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-navy-800 rounded-lg text-navy-400">
                        {getContentIcon(report.content_type)}
                      </div>
                      <div>
                        <p className="text-sm text-white capitalize">{report.content_type}</p>
                        <p className="text-xs text-navy-400">{report.content_id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-white">{report.reason}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-navy-300">@{report.reporter?.username}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      report.status === "pending" ? "bg-orange-500/10 text-orange-400" :
                      report.status === "reviewing" ? "bg-blue-500/10 text-blue-400" :
                      report.status === "resolved" ? "bg-green-500/10 text-green-400" :
                      "bg-navy-800 text-navy-400"
                    }`}>
                      {report.status === "pending" && <AlertTriangle className="w-3 h-3" />}
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="p-2 hover:bg-navy-800 rounded-lg text-navy-400 hover:text-white transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Report Details</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 hover:bg-navy-800 rounded-lg text-navy-400"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-navy-800/50 p-4 rounded-xl">
                <p className="text-xs text-navy-400 mb-1">Content Type</p>
                <p className="text-sm text-white capitalize">{selectedReport.content_type}</p>
              </div>

              <div className="bg-navy-800/50 p-4 rounded-xl">
                <p className="text-xs text-navy-400 mb-1">Reason</p>
                <p className="text-sm text-white">{selectedReport.reason}</p>
              </div>

              {selectedReport.description && (
                <div className="bg-navy-800/50 p-4 rounded-xl">
                  <p className="text-xs text-navy-400 mb-1">Description</p>
                  <p className="text-sm text-white">{selectedReport.description}</p>
                </div>
              )}

              <div className="bg-navy-800/50 p-4 rounded-xl">
                <p className="text-xs text-navy-400 mb-1">Reported By</p>
                <p className="text-sm text-white">@{selectedReport.reporter?.username}</p>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <button
                  onClick={() => resolveMutation.mutate({ reportId: selectedReport.id, resolution: "dismissed" })}
                  className="flex items-center justify-center gap-2 py-2.5 bg-navy-800 hover:bg-navy-700 text-navy-300 rounded-xl transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Dismiss
                </button>
                <button
                  onClick={() => resolveMutation.mutate({ reportId: selectedReport.id, resolution: "content_removed" })}
                  className="flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
                >
                  <Ban className="w-4 h-4" />
                  Remove Content
                </button>
                <button
                  onClick={() => {
                    issueStrikeMutation.mutate({
                      userId: selectedReport.content_id,
                      reason: selectedReport.reason,
                    });
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-xl transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Issue Strike
                </button>
                <button
                  onClick={() => resolveMutation.mutate({ reportId: selectedReport.id, resolution: "resolved" })}
                  className="flex items-center justify-center gap-2 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-xl transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Resolve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
