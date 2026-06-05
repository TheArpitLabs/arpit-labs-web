"use client";

import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MembershipPlan } from "@/types/membership";
import { formatPrice } from "@/lib/memberships";

interface MembershipPlanEditorProps {
  plans: MembershipPlan[];
}

export function MembershipPlanEditor({ plans }: MembershipPlanEditorProps) {
  const [editedPlans, setEditedPlans] = useState<Record<string, Partial<MembershipPlan>>>(() =>
    plans.reduce((state, plan) => ({
      ...state,
      [plan.id]: {
        name: plan.name,
        description: plan.description,
        monthly_price: plan.monthly_price,
        yearly_price: plan.yearly_price,
        active: plan.active,
      },
    }), {})
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const planEntries = useMemo(() => plans.map((plan) => ({ plan, edits: editedPlans[plan.id] })), [plans, editedPlans]);

  const handleChange = (planId: string, field: keyof MembershipPlan, value: string | boolean) => {
    setEditedPlans((current) => ({
      ...current,
      [planId]: {
        ...current[planId],
        [field]: field === "active" ? value : field.includes("price") ? Number(value) : value,
      },
    }));
  };

  const handleSave = async (planId: string) => {
    const updates = editedPlans[planId];
    if (!updates) return;

    setError(null);
    setSuccess(null);
    setSaving(planId);

    try {
      const response = await fetch("/api/admin/memberships", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: planId, updates }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to update plan.");
      }

      setSuccess(`Updated ${payload.plan.name}`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update plan.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      {planEntries.map(({ plan, edits }) => (
        <div key={plan.id} className="rounded-3xl border border-border/70 bg-background/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
              <p className="text-sm text-muted">{plan.description}</p>
            </div>
            <Badge variant="status">{plan.slug.toUpperCase()}</Badge>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="block text-muted">Name</span>
              <input
                value={edits?.name ?? plan.name}
                onChange={(event) => handleChange(plan.id, "name", event.target.value)}
                className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="block text-muted">Description</span>
              <input
                value={edits?.description ?? plan.description}
                onChange={(event) => handleChange(plan.id, "description", event.target.value)}
                className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="block text-muted">Monthly Price</span>
              <input
                type="number"
                min={0}
                value={edits?.monthly_price ?? plan.monthly_price}
                onChange={(event) => handleChange(plan.id, "monthly_price", event.target.value)}
                className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="block text-muted">Yearly Price</span>
              <input
                type="number"
                min={0}
                value={edits?.yearly_price ?? plan.yearly_price}
                onChange={(event) => handleChange(plan.id, "yearly_price", event.target.value)}
                className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={edits?.active ?? plan.active}
                  onChange={(event) => handleChange(plan.id, "active", event.target.checked)}
                  className="h-4 w-4 rounded border-border bg-background text-primary"
                />
                Active
              </label>
              <span className="text-sm text-muted">Base pricing: {formatPrice(plan.monthly_price)} / month</span>
            </div>
            <Button
              variant="primary"
              size="sm"
              isLoading={saving === plan.id}
              onClick={() => handleSave(plan.id)}
            >
              Save Plan
            </Button>
          </div>
        </div>
      ))}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-500">{success}</p>}
    </div>
  );
}
