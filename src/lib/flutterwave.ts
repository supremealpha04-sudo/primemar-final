import Flutterwave from "flutterwave-node-v3";

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY!,
  process.env.FLW_SECRET_KEY!
);

// Payment Plans (Subscriptions)
export async function createPaymentPlan({
  name,
  amount,
  interval,
  duration,
  currency = "USD",
}: {
  name: string;
  amount: number;
  interval: "daily" | "weekly" | "monthly" | "yearly";
  duration?: number;
  currency?: string;
}) {
  try {
    const response = await flw.PaymentPlan.create({
      name,
      amount,
      interval,
      duration: duration || 48,
      currency,
    });
    return response;
  } catch (error) {
    console.error("Payment plan creation failed:", error);
    throw error;
  }
}

// Initialize Payment (for one-time charges like boosts)
export async function initializePayment({
  amount,
  email,
  tx_ref,
  redirect_url,
  payment_options = "card,mobilemoney,ussd",
  meta = {},
}: {
  amount: number;
  email: string;
  tx_ref: string;
  redirect_url: string;
  payment_options?: string;
  meta?: Record<string, any>;
}) {
  try {
    const response = await flw.Payment.initiate({
      tx_ref,
      amount,
      currency: "USD",
      redirect_url,
      payment_options,
      customer: { email },
      customizations: {
        title: "PrimeMar",
        description: "Support your favorite creators",
        logo: "https://primemar.com/logo.png",
      },
      meta,
    });
    return response;
  } catch (error) {
    console.error("Payment initialization failed:", error);
    throw error;
  }
}

// Verify Transaction
export async function verifyTransaction(transactionId: string) {
  try {
    const response = await flw.Transaction.verify({ id: transactionId });
    return response;
  } catch (error) {
    console.error("Transaction verification failed:", error);
    throw error;
  }
}

// Subscribe Customer to Plan
export async function subscribeToPlan({
  email,
  plan_id,
  amount,
  tx_ref,
}: {
  email: string;
  plan_id: number;
  amount: number;
  tx_ref: string;
}) {
  try {
    const response = await flw.Payment.initiate({
      tx_ref,
      amount,
      currency: "USD",
      payment_plan: plan_id,
      customer: { email },
      customizations: {
        title: "PrimeMar Premium",
        description: "Unlock premium features",
      },
    });
    return response;
  } catch (error) {
    console.error("Subscription failed:", error);
    throw error;
  }
}

// Cancel Subscription
export async function cancelSubscription(subscriptionId: string) {
  try {
    const response = await flw.Subscription.cancel(subscriptionId);
    return response;
  } catch (error) {
    console.error("Subscription cancellation failed:", error);
    throw error;
  }
}

// Transfer/Payout to Creator
export async function transferToCreator({
  account_bank,
  account_number,
  amount,
  narration,
  reference,
  currency = "USD",
}: {
  account_bank: string;
  account_number: string;
  amount: number;
  narration: string;
  reference: string;
  currency?: string;
}) {
  try {
    const response = await flw.Transfer.initiate({
      account_bank,
      account_number,
      amount,
      narration,
      currency,
      reference,
      debit_currency: currency,
    });
    return response;
  } catch (error) {
    console.error("Transfer failed:", error);
    throw error;
  }
}

// Webhook verification
export async function verifyWebhook(payload: any, signature: string) {
  const crypto = require("crypto");
  const hash = crypto
    .createHmac("sha256", process.env.FLW_SECRET_KEY!)
    .update(JSON.stringify(payload))
    .digest("hex");
  return hash === signature;
}

export { flw };
