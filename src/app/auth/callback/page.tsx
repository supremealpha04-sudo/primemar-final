"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    const handleAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Check if profile exists
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", session.user.id)
          .single();

        if (!profile) {
          // Create profile for OAuth users
          const username = session.user.email?.split("@")[0] || "user";
          await supabase.from("profiles").insert({
            id: session.user.id,
            username: `${username}_${Math.random().toString(36).slice(2, 6)}`,
            display_name: session.user.user_metadata.full_name || username,
            avatar_url: session.user.user_metadata.avatar_url,
          });
        }

        router.push("/feed");
      } else {
        router.push("/login");
      }
    };

    handleAuth();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-lg font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}
