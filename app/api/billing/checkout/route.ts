import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBillingPlanById } from "@/lib/billing-plans";

type StripeCheckoutSessionResponse = {
  id?: string;
  url?: string;
  error?: {
    message?: string;
  };
};

function getAppBaseUrl(req: Request) {
  const reqOrigin = req.headers.get("origin");
  if (reqOrigin) return reqOrigin;
  if (process.env.NEXT_PUBLIC_URL) return process.env.NEXT_PUBLIC_URL;
  if (process.env.AUTH_URL) return process.env.AUTH_URL;
  return "http://localhost:3000";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      {
        error: "Please sign in first.",
        loginUrl: "/login?callbackUrl=%2Fpricing",
      },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const planId = String(body?.planId ?? "").trim();
  const plan = getBillingPlanById(planId);

  if (!plan) {
    return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY is missing." },
      { status: 500 },
    );
  }

  const stripePriceId = process.env[plan.envPriceKey];
  if (!stripePriceId) {
    return NextResponse.json(
      { error: `${plan.envPriceKey} is missing.` },
      { status: 500 },
    );
  }

  const appBaseUrl = getAppBaseUrl(req);
  const successUrl = `${appBaseUrl}/pricing?status=success&plan=${plan.id}`;
  const cancelUrl = `${appBaseUrl}/pricing?status=cancelled&plan=${plan.id}`;

  const form = new URLSearchParams();
  form.append("mode", "subscription");
  form.append("line_items[0][price]", stripePriceId);
  form.append("line_items[0][quantity]", "1");
  form.append("success_url", successUrl);
  form.append("cancel_url", cancelUrl);
  form.append("customer_email", session.user.email);
  form.append("metadata[planId]", plan.id);
  form.append("subscription_data[metadata][planId]", plan.id);

  const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
    cache: "no-store",
  });

  const stripeData = (await stripeRes.json().catch(() => ({}))) as StripeCheckoutSessionResponse;

  if (!stripeRes.ok || !stripeData.url) {
    const errorMessage =
      stripeData?.error?.message || "Failed to create Stripe checkout session.";
    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }

  return NextResponse.json({ url: stripeData.url });
}
