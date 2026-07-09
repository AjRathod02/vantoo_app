"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";

export const TrackingNotification = memo(function TrackingNotification({
  message,
}: {
  message: string | null;
}) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-white shadow-cardHover"
          role="status"
          aria-live="polite"
        >
          <Bell className="h-4 w-4 text-brand-primaryLight" />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
});
