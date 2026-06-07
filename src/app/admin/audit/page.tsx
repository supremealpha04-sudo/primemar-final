"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import {
  ClipboardList,
  Filter,
  Search,
  Shield,
  User,
  FileText,
  DollarSign,
  Settings,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminAuditPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const supabase = createBrowserSupabaseClient();

  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-audit", searchQuery, filterAction],
    queryFn: async () => {
      let query = supabase
        .from("admin_audit_log")
        .select(`
          *,
          admin:admin_id (username, display_name, role)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (searchQuery) {
        query = query.ilike("action", `%${searchQuery}%`);
      }

      if (filterAction !== "all") {
        query = query.ilike("action", `%${filterAction}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const getActionIcon = (action: string) => {
    if (action.includes("USER")) return <User className="w-4 h-4" />;
    if (action.includes("CONTENT")) return <FileText className="w-4 h-4" />;
    if (action.includes("PAYOUT")) return <DollarSign className="w-4 h-4" />;
    if (action.includes("SETTING")) return <Settings className="w-4 h-4" />;
    return <Shield className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes("DELETE") || action.includes("BAN")) return "text-red-400 bg-red-500/10";
    if (action.includes("CREATE") || action.includes("ADD")) return "text-green-400 bg-green-500/10";
    if (action.includes("UPDATE") || action.includes("EDIT")) return "text-blue-400 bg-blue-500/10";
    return "text-navy-400 bg-navy-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-navy-400 text-sm">Track all admin actions and changes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search actions..."
            className="w-full pl-10 pr-4 py-2.5 bg-navy-900 border border-navy-700 rounded-xl text-white placeholder:text-navy-500 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-4 py-2.5 bg-navy-900 border border-navy-700 rounded-xl text-white focus:ring-2 focus:ring-gold-500 outline-none"
        >
          <option value="all">All Actions</option>
          <option value="USER">User Actions</option>
          <option value="CONTENT">Content Actions</option>
          <option value="PAYOUT">Payout Actions</option>
          <option value="WEBHOOK">Webhooks</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-navy-800">
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase">Action</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase">Admin</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase">Resource</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase">IP Address</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase">Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-navy-400">Loading logs...</td>
              </tr>
            ) : (
              logs?.map((log: any) => (
                <tr key={log.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                      </div>
                      <span className="text-sm text-white font-medium">{log.action}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-white">{log.admin?.display_name || log.admin?.username}</p>
                      <p className="text-xs text-navy-400">{log.admin?.role}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-navy-300">{log.resource_type || "—"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-navy-400 font-mono">{log.ip_address || "—"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-navy-400">
                      {formatDistanceToNow(new Date(log.created_at))} ago
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
