import { redirect } from "next/navigation";

// PAYMENTS TEMPORARILY DISABLED - Redirect pricing page to profile
export default function PricingPage() {
  redirect("/profile");
}

// ORIGINAL IMPLEMENTATION PRESERVED FOR FUTURE REFERENCE
// To restore: Replace entire file with original pricing page implementation
// Original file contained membership plan comparison and checkout functionality
