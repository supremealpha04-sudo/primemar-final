import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { initializePayment, subscribeToPlan } from "@/lib/flutterwave";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, amount, email, tx_ref, plan_id, meta } = body;

    const supabase = createAdminClient();

    await supabase.from("admin_audit_log").insert({
      action: "PAYMENT_INIT",
      resource_type: "system",
      new_value: { type, amount, email, tx_ref },
    });

    let response;

    if (type === "subscription" && plan_id) {
      response = await subscribeToPlan({ email, plan_id, amount, tx_ref });
    } else {
      response = await initializePayment({
        amount,
        email,
        tx_ref,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify`,
        meta,
      });
    }

    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    console.error("Payment API error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
