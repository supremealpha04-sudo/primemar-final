"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Welcome back to PrimeMar!");
      router.push("/feed");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github" | "twitter") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-gold-400" />
            <span className="text-3xl font-bold text-white tracking-tight">
              Prime<span className="text-gold-400">Mar</span>
            </span>
          </div>
          <p className="text-navy-300 text-sm">
            The creator-first social platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-elevated p-8">
          <h1 className="text-2xl font-bold text-navy-900 mb-1">Welcome back</h1>
          <p className="text-navy-500 text-sm mb-6">Sign in to your account</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-navy-200 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-transparent outline-none transition-all text-navy-900 placeholder:text-navy-400"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-navy-200 rounded-xl focus:ring-2 focus:ring-gold-400 focus:border-transparent outline-none transition-all text-navy-900 placeholder:text-navy-400"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-navy-300 text-gold-500 focus:ring-gold-400" />
                <span className="text-navy-600">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-gold-600 hover:text-gold-700 font-medium">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign in <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-navy-100" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-navy-400">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { name: "Google", icon: "G", provider: "google" as const },
              { name: "GitHub", icon: "GH", provider: "github" as const },
              { name: "Twitter", icon: "X", provider: "twitter" as const },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => handleOAuth(item.provider)}
                className="flex items-center justify-center py-2.5 border border-navy-200 rounded-xl hover:bg-navy-50 transition-colors text-navy-700 font-medium text-sm"
              >
                {item.icon}
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-navy-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-gold-600 hover:text-gold-700 font-semibold">
              Get started
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
