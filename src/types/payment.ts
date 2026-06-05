export type PaymentProvider = "stripe" | "razorpay";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "unpaid" | "incomplete" | "trialing";
export type TransactionStatus = "succeeded" | "pending" | "failed" | "refunded";
export type TransactionType = "subscription" | "one_time";

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  features: string[];
  active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  provider: PaymentProvider;
  provider_subscription_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  plan?: SubscriptionPlan;
}

export interface Transaction {
  id: string;
  user_id: string | null;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  provider_transaction_id: string;
  status: TransactionStatus;
  type: TransactionType;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string | null;
  transaction_id: string | null;
  invoice_number: string;
  pdf_url: string | null;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  transaction?: Transaction;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  currency: string;
  status: string;
  transaction_id: string | null;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_type: "marketplace_item" | "product";
  item_id: string;
  amount: number;
  created_at: string;
}
