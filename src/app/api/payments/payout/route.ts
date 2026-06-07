import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { transferToCreator } from "@/lib/flutterwave";

export async function POST(req: NextRequest) {
  try {
    const { creator_id, amount, bank_code, account_number } = await req.json();

    const supabase = createAdminClient();

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reference = `PM_PAYOUT_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const response = await transferToCreator({
      account_bank: bank_code,
      account_number,
      amount,
      narration: "PrimeMar Creator Payout",
      reference,
      currency: "USD",
    });

    if (response.status === "success") {
      await supabase.from("creator_earnings").insert({
        creator_id,
        source_type: "subscription",
        gross_amount: amount,
        platform_fee: 0,
        net_amount: amount,
        status: "processing",
        payout_reference: reference,
      });

      await supabase.from("admin_audit_log").insert({
        action: "PAYOUT_INITIATED",
        resource_type: "payout",
        resource_id: creator_id,
        new_value: { amount, reference, bank_code },
      });
    }

    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    console.error("Payout API error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
