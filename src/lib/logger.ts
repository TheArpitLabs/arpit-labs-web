export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[info]", message, context ?? "");
    }
  },
  warn(message: string, context?: Record<string, unknown>) {
    console.warn("[warn]", message, context ?? "");
  },
  error(message: string, context?: Record<string, unknown>) {
    console.error("[error]", message, context ?? "");
  }
};
