"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Rocket, Loader2 } from "lucide-react";
import { logger } from '@/lib/logger';

interface AcquisitionActionsProps {
  item: any;
}

export function AcquisitionActions({ item }: AcquisitionActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setLoading(action);
    try {
      const response = await fetch("/api/admin/acquisition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id: item.id }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Action failed");
      }

      window.location.reload();
    } catch (error) {
      logger.error("Action failed:", error);
      alert(error instanceof Error ? error.message : "Action failed");
    } finally {
      setLoading(null);
    }
  };

  const canApprove = item.status === "queued";
  const canReject = item.status === "queued" || item.status === "approved";
  const canPublish = item.status === "approved" && !item.imported_entity_id;

  return (
    <div className="flex items-center gap-2">
      {canApprove && (
        <button
          onClick={() => handleAction("approve")}
          disabled={loading === "approve"}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-300"
          title="Approve for publishing"
        >
          {loading === "approve" ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <CheckCircle size={12} />
          )}
          Approve
        </button>
      )}

      {canReject && (
        <button
          onClick={() => handleAction("reject")}
          disabled={loading === "reject"}
          className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-500/20 disabled:opacity-50 dark:text-red-300"
          title="Reject this item"
        >
          {loading === "reject" ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <XCircle size={12} />
          )}
          Reject
        </button>
      )}

      {canPublish && (
        <button
          onClick={() => handleAction("publish")}
          disabled={loading === "publish"}
          className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
          title="Publish to projects"
        >
          {loading === "publish" ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Rocket size={12} />
          )}
          Publish
        </button>
      )}

      {item.status === "imported" && (
        <span className="text-xs text-muted">Published</span>
      )}

      {item.status === "duplicate" && (
        <span className="text-xs text-amber-600 dark:text-amber-400">Duplicate</span>
      )}
    </div>
  );
}
