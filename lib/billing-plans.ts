export type BillingPlanId = "base" | "pro";

type BillingPlan = {
  id: BillingPlanId;
  name: string;
  tag: string;
  amountLabel: string;
  description: string;
  features: string[];
  cta: string;
  note: string;
  envPriceKey: "STRIPE_PRICE_BASE_MONTHLY" | "STRIPE_PRICE_PRO_MONTHLY";
};

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "base",
    name: "Base Plan",
    tag: "Starter",
    amountLabel: "INR 11 /month",
    description: "Great for individuals and small households.",
    features: [
      "Personal dashboard",
      "Society dashboard",
      "Monthly spending insights",
    ],
    cta: "Upgrade to Base",
    note: "Great starting point for personal and shared usage.",
    envPriceKey: "STRIPE_PRICE_BASE_MONTHLY",
  },
  {
    id: "pro",
    name: "Pro Plan",
    tag: "Most Popular",
    amountLabel: "INR 19 /month",
    description: "Built for power users and advanced tracking.",
    features: [
      "Everything in Base",
      "Advanced cashflow analytics",
      "Advanced society member transactions",
      "Early access to new features",
    ],
    cta: "Upgrade to Pro",
    note: "Best for advanced visibility across shared transactions.",
    envPriceKey: "STRIPE_PRICE_PRO_MONTHLY",
  },
];

export function getBillingPlanById(planId: string) {
  return BILLING_PLANS.find((plan) => plan.id === planId);
}
