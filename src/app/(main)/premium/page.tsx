"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { useAuthStore } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Crown,
  Check,
  Zap,
  BarChart3,
  Palette,
  Image,
  Sparkles,
  ArrowRight,
  Star,
} from "lucide-react";

const features = [
  { icon: Zap, text: "Unlimited posts per day" },
  { icon: BarChart3, text: "Advanced analytics dashboard" },
  { icon: Palette, text: "Custom themes & profile customization" },
  { icon: Image, text: "HD photo & video uploads" },
  { icon: Sparkles, text: "Priority placement in feeds" },
  { icon: Star, text: "Exclusive premium badge" },
  { icon: Zap, text: "Early access to new features" },
  { icon: BarChart3, text: "Download content analytics" },
];

export default function PremiumPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const { user } = useAuthStore();

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Please sign in first");
      router.push("/login");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subscription",
          amount: billingCycle === "monthly" ? 4.99 : 49.99,
          email: user.username + "@primemar.com", // Use actual email
          tx_ref: `PM_PREM_${Date.now()}_${user.id.slice(0, 8)}`,
          plan_id: billingCycle === "monthly" ? 1 : 2, // Your Flutterwave plan IDs
          meta: {
            payment_type: "premium",
            user_id: user.id,
            billing_cycle: billingCycle,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.data?.link) {
        window.location.href = data.data.data.link;
      } else {
        throw new Error("Payment initialization failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to start payment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-gold-100 text-gold-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
          <Crown className="w-4 h-4" />
          Unlock Your Potential
        </div>
        <h1 className="text-4xl font-bold text-navy-900 mb-3">
          Go <span className="text-gold-500">Premium</span>
        </h1>
        <p className="text-navy-500 text-lg max-w-lg mx-auto">
          Supercharge your PrimeMar experience with exclusive features designed for serious creators and engagers.
        </p>
      </div>

      {/* Pricing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-10">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
            billingCycle === "monthly"
              ? "bg-navy-900 text-white"
              : "bg-navy-100 text-navy-600 hover:bg-navy-200"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle("yearly")}
          className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
            billingCycle === "yearly"
              ? "bg-navy-900 text-white"
              : "bg-navy-100 text-navy-600 hover:bg-navy-200"
          }`}
        >
          Yearly
          <span className="ml-1.5 text-gold-500 text-xs">Save 17%</span>
        </button>
      </div>

      {/* Pricing Card */}
      <div className="bg-white border-2 border-gold-400 rounded-3xl p-8 shadow-xl max-w-md mx-auto relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-gold-500 text-navy-900 text-xs font-bold px-4 py-1 rounded-bl-xl">
          MOST POPULAR
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-navy-900">PrimeMar Premium</h2>
          <div className="mt-4">
            <span className="text-5xl font-bold text-navy-900">
              ${billingCycle === "monthly" ? "4.99" : "49.99"}
            </span>
            <span className="text-navy-500">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
          </div>
          {billingCycle === "yearly" && (
            <p className="text-sm text-green-600 mt-1">Save $9.89 per year</p>
          )}
        </div>

        <div className="space-y-3 mb-8">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gold-100 rounded-full flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-gold-600" />
              </div>
              <feature.icon className="w-4 h-4 text-navy-400" />
              <span className="text-sm text-navy-700">{feature.text}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-gold-400 to-gold-600 hover:from-gold-500 hover:to-gold-700 text-navy-900 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
          ) : (
            <>
              Get Premium <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-navy-400 mt-4">
          Cancel anytime. No hidden fees.
        </p>
      </div>

      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-8 mt-12 text-navy-400">
        <div className="flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-green-500" />
          Secure payment
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-green-500" />
          30-day refund
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-green-500" />
          Cancel anytime
        </div>
      </div>
    </div>
  );
}
