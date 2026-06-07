import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { verifyWebhook, verifyTransaction } from "@/lib/flutterwave";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const signature = req.headers.get("verif-hash") || "";

    const isValid = await verifyWebhook(payload, signature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const event = payload.event;
    const data = payload.data;

    await supabase.from("admin_audit_log").insert({
      action: `WEBHOOK_${event}`,
      resource_type: "system",
      new_value: payload,
    });

    switch (event) {
      case "charge.completed": {
        const verification = await verifyTransaction(data.id);

        if (verification.status === "success") {
          const meta = data.meta || {};

          if (meta.payment_type === "boost") {
            await supabase.from("post_boosts").insert({
              post_id: meta.post_id,
              booster_id: meta.user_id,
              creator_id: meta.creator_id,
              amount: data.amount,
              platform_fee: data.amount * 0.3,
              creator_earnings: data.amount * 0.7,
              flutterwave_ref: data.flw_ref,
            });

            await supabase.rpc("increment_counter", {
              table_name: "profiles",
              column_name: "pending_earnings",
              row_id: meta.creator_id,
              amount: data.amount * 0.7,
            });
          }

          if (meta.payment_type === "premium") {
            await supabase
              .from("profiles")
              .update({ tier: "premium", badge_type: "premium" })
              .eq("id", meta.user_id);

            await supabase.from("subscriptions").insert({
              subscriber_id: meta.user_id,
              creator_id: meta.creator_id,
              amount: data.amount,
              flutterwave_ref: data.flw_ref,
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            });
          }
        }
        break;
      }

      case "subscription.cancelled": {
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("flutterwave_ref", data.id);
        break;
      }

      case "transfer.completed": {
        await supabase
          .from("creator_earnings")
          .update({ status: "paid_out", paid_at: new Date().toISOString() })
          .eq("payout_reference", data.reference);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
