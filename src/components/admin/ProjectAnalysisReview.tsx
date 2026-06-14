"use client";

import { useState } from "react";
import { Brain, Loader2, CheckCircle, XCircle, BookOpen, Layers, Target, Building2, Zap } from "lucide-react";

interface ProjectAnalysisReviewProps {
  queueItem: any;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
}

export function ProjectAnalysisReview({ queueItem, onApprove, onReject, onEdit }: ProjectAnalysisReviewProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const hasAnalysis = queueItem.ai_analysis_status === "completed" && analysis;
  const isAnalyzing = queueItem.ai_analysis_status === "analyzing" || analyzing;

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch("/api/admin/analyze-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueItemId: queueItem.id }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Analysis failed");
      }

      setAnalysis(data.analysis);
      window.location.reload(); // Reload to show updated status
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3">
          <Loader2 size={20} className="animate-spin text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Analyzing Project</h3>
            <p className="text-sm text-muted">AI is analyzing the repository structure and content...</p>
          </div>
        </div>
      </div>
    );
  }

  if (queueItem.ai_analysis_status === "failed") {
    return (
      <div className="rounded-[1.5rem] border border-red-500/30 bg-red-500/10 p-6 shadow-sm dark:border-red-500/20 dark:bg-red-500/5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <XCircle size={20} className="text-red-600 dark:text-red-400" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Analysis Failed</h3>
              <p className="text-sm text-red-700 dark:text-red-300">Unable to analyze this project automatically</p>
            </div>
          </div>
          <button
            onClick={handleAnalyze}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!hasAnalysis && queueItem.ai_analysis_status !== "completed") {
    return (
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Brain size={20} className="text-primary" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">AI Analysis Available</h3>
              <p className="text-sm text-muted">Generate comprehensive analysis including tech stack, difficulty, and learning outcomes</p>
            </div>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain size={16} />
                Analyze Project
              </>
            )}
          </button>
        </div>
        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Show analysis results
  const analysisData = analysis || queueItem;
  
  return (
    <div className="space-y-4">
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mb-4 flex items-center gap-3">
          <Brain size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">AI Analysis Results</h3>
          <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Completed
          </span>
        </div>

        <div className="space-y-6">
          {/* Executive Summary */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Target size={16} className="text-primary" />
              Executive Summary
            </h4>
            <p className="text-sm text-muted">{analysisData.executive_summary || "No executive summary available"}</p>
          </div>

          {/* Technical Summary */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Zap size={16} className="text-primary" />
              Technical Summary
            </h4>
            <p className="text-sm text-muted">{analysisData.technical_summary || "No technical summary available"}</p>
          </div>

          {/* Engineering Overview */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Building2 size={16} className="text-primary" />
              Engineering Overview
            </h4>
            <p className="text-sm text-muted">{analysisData.engineering_overview || "No engineering overview available"}</p>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Layers size={16} className="text-primary" />
              Tech Stack
            </h4>
            <div className="grid gap-3 md:grid-cols-2">
              <TechStackCategory label="Languages" items={analysisData.tech_stack?.languages || []} />
              <TechStackCategory label="Frameworks" items={analysisData.tech_stack?.frameworks || []} />
              <TechStackCategory label="Databases" items={analysisData.tech_stack?.databases || []} />
              <TechStackCategory label="Cloud" items={analysisData.tech_stack?.cloudProviders || []} />
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Target size={16} className="text-primary" />
              Difficulty Level
            </h4>
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-semibold capitalize text-primary">
                {analysisData.difficulty || "intermediate"}
              </span>
              <p className="text-sm text-muted">{analysisData.difficulty_reasoning || ""}</p>
            </div>
          </div>

          {/* Domains */}
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <BookOpen size={16} className="text-primary" />
              Domains
            </h4>
            <div className="flex flex-wrap gap-2">
              {(analysisData.domains || []).map((domain: string) => (
                <span key={domain} className="rounded-lg border border-border/70 bg-muted/50 px-3 py-1 text-sm text-muted dark:border-slate-800">
                  {domain}
                </span>
              ))}
            </div>
          </div>

          {/* Learning Outcomes */}
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <BookOpen size={16} className="text-primary" />
              Learning Outcomes
            </h4>
            <ul className="space-y-2">
              {(analysisData.learning_outcomes || []).map((outcome: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted">
                  <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Architecture */}
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Building2 size={16} className="text-primary" />
              Architecture Overview
            </h4>
            <div className="space-y-3">
              <div>
                <p className="mb-2 text-xs font-medium text-muted">System Overview</p>
                <p className="text-sm text-muted">{analysisData.architecture_system_overview || "No system overview available"}</p>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted">Data Flow</p>
                <p className="text-sm text-muted">{analysisData.architecture_data_flow || "No data flow information available"}</p>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted">Components</p>
                <div className="grid gap-2">
                  {(analysisData.architecture_components || []).map((component: any, index: number) => (
                    <div key={index} className="rounded-lg border border-border/70 bg-muted/30 p-3 dark:border-slate-800">
                      <p className="text-sm font-medium text-foreground">{component.name}</p>
                      <p className="text-xs text-muted">{component.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border/70 pt-4 dark:border-slate-800">
          {onReject && (
            <button
              onClick={onReject}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-500/20 dark:text-red-300"
            >
              <XCircle size={16} />
              Reject
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/50 dark:border-slate-800"
            >
              Edit Analysis
            </button>
          )}
          {onApprove && (
            <button
              onClick={onApprove}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
            >
              <CheckCircle size={16} />
              Approve & Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TechStackCategory({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.length > 0 ? (
          items.map((item) => (
            <span key={item} className="rounded border border-border/70 bg-muted/50 px-2 py-0.5 text-xs text-muted dark:border-slate-800">
              {item}
            </span>
          ))
        ) : (
          <span className="text-xs text-muted">None detected</span>
        )}
      </div>
    </div>
  );
}
