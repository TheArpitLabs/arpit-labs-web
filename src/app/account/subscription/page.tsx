import { redirect } from "next/navigation";

// PAYMENTS TEMPORARILY DISABLED - Redirect subscription page to profile
export default function AccountSubscriptionPage() {
  redirect("/profile");
}

// ORIGINAL IMPLEMENTATION PRESERVED FOR FUTURE REFERENCE
// To restore: Replace entire file with original subscription page implementation
// Original file contained subscription management and plan comparison functionality
