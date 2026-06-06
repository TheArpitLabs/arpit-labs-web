import { redirect } from "next/navigation";

// PAYMENTS TEMPORARILY DISABLED - Redirect billing page to profile
export default function BillingPage() {
  redirect("/profile");
}

/*
// ORIGINAL IMPLEMENTATION (Commented out - re-enable when payments are restored)
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
*/
