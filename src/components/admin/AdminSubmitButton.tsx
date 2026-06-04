"use client";

import { useFormStatus } from "react-dom";

interface AdminSubmitButtonProps {
  idleLabel: string;
  pendingLabel?: string;
}

export function AdminSubmitButton({ idleLabel, pendingLabel = "Saving..." }: AdminSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
