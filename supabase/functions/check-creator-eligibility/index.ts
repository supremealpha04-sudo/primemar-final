import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { data: candidates, error } = await supabase
      .from("profiles")
      .select("id, followers_count, premium_subscriber_count, consecutive_premium_months, strike_count, created_at")
      .eq("tier", "premium")
      .eq("creator_eligible", false)
      .gte("followers_count", 5000)
      .gte("premium_subscriber_count", 1000)
      .gte("consecutive_premium_months", 4)
      .eq("strike_count", 0)
      .lte("created_at", new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    let enrolled = 0;

    for (const user of candidates || []) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          tier: "creator",
          badge_type: "creator",
          creator_eligible: true,
          creator_enrolled_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (!updateError) {
        enrolled++;

        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "creator_unlocked",
          title: "🎉 Creator Monetization Unlocked!",
          body: "You've unlocked earning potential on PrimeMar. Start monetizing your content today!",
        });

        await supabase.from("admin_audit_log").insert({
          action: "CREATOR_AUTO_ENROLLED",
          resource_type: "user",
          resource_id: user.id,
          new_value: { followers: user.followers_count, subscribers: user.premium_subscriber_count },
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, enrolled, totalChecked: candidates?.length || 0 }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
