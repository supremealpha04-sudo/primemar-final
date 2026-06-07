"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { toast } from "sonner";
import {
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Download,
  Filter,
} from "lucide-react";

export default function AdminPayoutsPage() {
  const [filterStatus, setFilterStatus] = useState("pending");
  const supabase = createBrowserSupabaseClient();
  const queryClient = useQueryClient();

  const { data: payouts, isLoading } = useQuery({
    queryKey: ["admin-payouts", filterStatus],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creator_earnings")
        .select(`
          *,
          creator:creator_id (username, display_name, avatar_url)
        `)
        .eq("status", filterStatus)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  const processPayoutMutation = useMutation({
    mutationFn: async (earningId: string) => {
      // In production, this would call the Flutterwave transfer API
      const { error } = await supabase
        .from("creator_earnings")
        .update({ status: "processing" })
        .eq("id", earningId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payout marked as processing");
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
  });

  const totalPending = payouts?.reduce((sum: number, p: any) => sum + (p.net_amount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payouts</h1>
          <p className="text-navy-400 text-sm">Manage creator earnings and transfers</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white rounded-xl text-sm font-medium transition-colors">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-sm text-navy-400">Pending</p>
          </div>
          <p className="text-2xl font-bold text-white">${totalPending.toLocaleString()}</p>
          <p className="text-xs text-navy-400 mt-1">{payouts?.length || 0} payouts</p>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ArrowUpRight className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm text-navy-400">Processing</p>
          </div>
          <p className="text-2xl font-bold text-white">$12,450</p>
          <p className="text-xs text-navy-400 mt-1">8 payouts</p>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-navy-400">Paid Out (This Month)</p>
          </div>
          <p className="text-2xl font-bold text-white">$89,230</p>
          <p className="text-xs text-navy-400 mt-1">142 payouts</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-navy-400" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-navy-900 border border-navy-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-gold-500 outline-none"
        >
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="paid_out">Paid Out</option>
          <option value="held">Held</option>
        </select>
      </div>

      {/* Payouts Table */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-navy-800">
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase">Creator</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase">Source</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase">Gross</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase">Fee</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase">Net</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase">Status</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-navy-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-navy-400">Loading payouts...</td>
              </tr>
            ) : (
              payouts?.map((payout: any) => (
                <tr key={payout.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {payout.creator?.display_name?.[0] || payout.creator?.username?.[0]}
                      </div>
                      <div>
                        <p className="text-sm text-white">{payout.creator?.display_name || payout.creator?.username}</p>
                        <p className="text-xs text-navy-400">@{payout.creator?.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-navy-300 capitalize">{payout.source_type}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white">${payout.gross_amount}</td>
                  <td className="px-6 py-4 text-sm text-navy-400">${payout.platform_fee}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-white">${payout.net_amount}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      payout.status === "pending" ? "bg-orange-500/10 text-orange-400" :
                      payout.status === "processing" ? "bg-blue-500/10 text-blue-400" :
                      payout.status === "paid_out" ? "bg-green-500/10 text-green-400" :
                      "bg-red-500/10 text-red-400"
                    }`}>
                      {payout.status === "pending" && <Clock className="w-3 h-3" />}
                      {payout.status === "paid_out" && <CheckCircle className="w-3 h-3" />}
                      {payout.status === "held" && <AlertTriangle className="w-3 h-3" />}
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {payout.status === "pending" && (
                      <button
                        onClick={() => processPayoutMutation.mutate(payout.id)}
                        className="px-3 py-1.5 bg-gold-500 hover:bg-gold-600 text-navy-900 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Process
                      </button>
                    )}
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
