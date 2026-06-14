"use client";

import { useState } from "react";
import { Github, Loader2, CheckCircle, XCircle, AlertCircle, ShieldAlert } from "lucide-react";

interface GitHubImportFormProps {
  onImportSuccess?: (item: any) => void;
  featureEnabled?: boolean;
}

export function GitHubImportForm({ onImportSuccess, featureEnabled = true }: GitHubImportFormProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!featureEnabled) {
    return (
      <div className="rounded-[1.5rem] border border-amber-500/30 bg-amber-500/10 p-6 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/5">
        <div className="flex items-center gap-3">
          <ShieldAlert size={20} className="text-amber-600 dark:text-amber-400" />
          <div>
            <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">Feature Disabled</h2>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              The Acquisition Engine feature is currently disabled. Enable it via the NEXT_PUBLIC_FEATURE_ACQUISITION_ENGINE environment variable.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/acquisition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "github_import", url }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Import failed");
      }

      setSuccess(true);
      setUrl("");
      onImportSuccess?.(data.item);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mb-4 flex items-center gap-3">
        <Github size={20} className="text-primary" />
        <h2 className="text-lg font-semibold text-foreground">GitHub Repository Import</h2>
      </div>
      
      <form onSubmit={handleImport} className="space-y-4">
        <div>
          <label htmlFor="github-url" className="mb-2 block text-sm font-medium text-foreground">
            Repository URL
          </label>
          <input
            id="github-url"
            type="url"
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-800"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
            <XCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>Repository imported successfully and added to review queue.</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !url}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Github size={16} />
              Import Repository
            </>
          )}
        </button>
      </form>

      <div className="mt-4 rounded-lg border border-border/70 bg-muted/30 p-3 text-xs text-muted dark:border-slate-800">
        <div className="flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Import Process:</p>
            <ul className="mt-1 space-y-1 text-muted">
              <li>• Fetches repository metadata from GitHub API</li>
              <li>• Extracts README content and topics</li>
              <li>• Runs duplicate detection automatically</li>
              <li>• Adds to approval queue (no auto-publish)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
