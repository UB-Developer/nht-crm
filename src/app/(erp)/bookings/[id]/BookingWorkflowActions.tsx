"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, ChevronRight } from "lucide-react";

const STAGES = [
  { key: "DRAFT", label: "Draft" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "VISA_PROCESSING", label: "Visa Processing" },
  { key: "TICKETED", label: "Ticketed" },
  { key: "DEPARTED", label: "Departed" },
  { key: "COMPLETED", label: "Completed" },
];

export function BookingWorkflowActions({
  bookingId,
  currentStatus,
}: {
  bookingId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const currentIndex = STAGES.findIndex((s) => s.key === currentStatus);

  const handleStageClick = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/package-bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingStatus: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to transition status");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-xl border bg-card shadow-xs">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Lifecycle Workflow (Click any stage to advance):
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STAGES.map((s, idx) => {
          const isPassed = currentIndex >= 0 && idx < currentIndex;
          const isCurrent = s.key === currentStatus;

          return (
            <React.Fragment key={s.key}>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleStageClick(s.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isCurrent
                    ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30"
                    : isPassed
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {isPassed && <Check className="w-3.5 h-3.5" />}
                {isCurrent && <Clock className="w-3.5 h-3.5 animate-spin" />}
                <span>{s.label}</span>
              </button>
              {idx < STAGES.length - 1 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground/60 hidden sm:block" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
