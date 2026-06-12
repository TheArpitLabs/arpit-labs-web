"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export function CardSkeleton() {
  return (
    <motion.div
      className="premium-card overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Skeleton variant="card" className="mb-4 h-48 w-full" />
      <div className="space-y-3 p-5">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
        <div className="flex items-center justify-between pt-4">
          <Skeleton variant="text" className="w-20" />
          <Skeleton variant="button" className="w-16" />
        </div>
      </div>
    </motion.div>
  );
}

export function ProfileCardSkeleton() {
  return (
    <motion.div
      className="premium-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-4">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-3">
          <Skeleton variant="text" className="w-1/3" />
          <Skeleton variant="text" className="w-1/4" />
        </div>
      </div>
    </motion.div>
  );
}

export function StatCardSkeleton() {
  return (
    <motion.div
      className="premium-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-4">
        <Skeleton variant="avatar" className="h-14 w-14" />
        <div className="flex-1 space-y-3">
          <Skeleton variant="text" className="w-24" />
          <Skeleton variant="text" className="w-16 h-6" />
        </div>
      </div>
    </motion.div>
  );
}
