import { Suspense } from "react";
import { BillingClient } from "@/app/billing/BillingClient";

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">
          <p>Loading billing details...</p>
        </main>
      }
    >
      <BillingClient />
    </Suspense>
  );
}
