"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema, ContactFormInput } from "@/lib/validation/contact.schema";
import { submitContactMessage } from "@/lib/actions/server-actions";
import { Card } from "@/components/ui/card";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/utils";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (data: ContactFormInput) => {
    setStatus("loading");
    setErrorMessage("");
    try {
      await submitContactMessage(data);
      setStatus("success");
      reset();
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message || "Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-green-500">
          <CheckCircle2 size={40} />
        </div>
        <h3 className="text-2xl font-bold text-foreground">Message Sent!</h3>
        <p className="mt-4 text-muted">
          Thank you for reaching out. I&apos;ll get back to you as soon as possible.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-8 text-sm font-semibold text-primary hover:underline"
        >
          Send another message
        </button>
      </Card>
    );
  }

  return (
    <Card className="p-8 md:p-10">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-bold uppercase tracking-widest text-muted">
              Name
            </label>
            <input
              {...register("name")}
              id="name"
              type="text"
              placeholder="John Doe"
              className={cn(
                "w-full rounded-2xl border border-border/70 bg-background px-4 py-3.5 text-sm focus:border-primary focus:outline-none dark:border-slate-800 dark:bg-slate-950",
                errors.name && "border-red-500 focus:border-red-500"
              )}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-bold uppercase tracking-widest text-muted">
              Email
            </label>
            <input
              {...register("email")}
              id="email"
              type="email"
              placeholder="john@example.com"
              className={cn(
                "w-full rounded-2xl border border-border/70 bg-background px-4 py-3.5 text-sm focus:border-primary focus:outline-none dark:border-slate-800 dark:bg-slate-950",
                errors.email && "border-red-500 focus:border-red-500"
              )}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="subject" className="text-sm font-bold uppercase tracking-widest text-muted">
            Subject
          </label>
          <input
            {...register("subject")}
            id="subject"
            type="text"
            placeholder="How can I help you?"
            className={cn(
              "w-full rounded-2xl border border-border/70 bg-background px-4 py-3.5 text-sm focus:border-primary focus:outline-none dark:border-slate-800 dark:bg-slate-950",
              errors.subject && "border-red-500 focus:border-red-500"
            )}
          />
          {errors.subject && <p className="text-xs text-red-500">{errors.subject.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-bold uppercase tracking-widest text-muted">
            Message
          </label>
          <textarea
            {...register("message")}
            id="message"
            rows={5}
            placeholder="Tell me about your project or inquiry..."
            className={cn(
              "w-full rounded-2xl border border-border/70 bg-background px-4 py-3.5 text-sm focus:border-primary focus:outline-none dark:border-slate-800 dark:bg-slate-950",
              errors.message && "border-red-500 focus:border-red-500"
            )}
          />
          {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
        </div>

        {status === "error" && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-4 text-sm text-red-500">
            <AlertCircle size={16} />
            <p>{errorMessage}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="group inline-flex w-full items-center justify-center gap-3 rounded-[1.25rem] bg-primary py-4 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-70"
        >
          {status === "loading" ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
          {status === "loading" ? "Sending..." : "Send Message"}
        </button>
      </form>
    </Card>
  );
}
