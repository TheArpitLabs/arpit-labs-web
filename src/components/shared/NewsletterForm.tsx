"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newsletterSchema, NewsletterFormInput } from "@/lib/validation/newsletter.schema";
import { subscribeNewsletter } from "@/lib/actions/server-actions";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewsletterFormInput>({
    resolver: zodResolver(newsletterSchema),
  });

  const onSubmit = async (data: NewsletterFormInput) => {
    setStatus("loading");
    setMessage("");
    try {
      await subscribeNewsletter(data);
      setStatus("success");
      setMessage("Thank you for subscribing to the lab notes!");
      reset();
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "Failed to subscribe. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-6 text-center animate-in fade-in zoom-in duration-300">
        <CheckCircle2 size={24} className="mx-auto mb-3 text-green-500" />
        <p className="text-sm font-medium text-foreground">{message}</p>
        <button 
          onClick={() => setStatus("idle")}
          className="mt-4 text-xs text-muted hover:text-primary underline"
        >
          Subscribe another email
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/70 bg-primary/5 p-6 dark:border-slate-800">
      <h3 className="text-lg font-bold text-foreground">Subscribe</h3>
      <p className="mt-2 text-sm text-muted">
        Get the latest lab notes delivered straight to your inbox.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-3">
        <div className="space-y-1">
          <input
            {...register("email")}
            type="email"
            placeholder="email@example.com"
            className={cn(
              "w-full rounded-xl border border-border/70 bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none dark:border-slate-700",
              errors.email && "border-red-500"
            )}
            disabled={status === "loading"}
          />
          {errors.email && <p className="text-[10px] text-red-500 pl-1">{errors.email.message}</p>}
        </div>
        
        {status === "error" && (
          <div className="flex items-center gap-2 text-[10px] text-red-500 bg-red-500/10 p-2 rounded-lg">
            <AlertCircle size={12} />
            <p>{message}</p>
          </div>
        )}

        <button 
          type="submit"
          disabled={status === "loading"}
          className="w-full inline-flex items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-70"
        >
          {status === "loading" ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Subscribing...
            </>
          ) : (
            "Join Newsletter"
          )}
        </button>
      </form>
    </div>
  );
}
