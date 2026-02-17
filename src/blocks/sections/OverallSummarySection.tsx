"use client";

import { useAppSelector } from "@/store/hooks";
import { selectOverallSummary } from "@/store/slices/expensesSlice";
import { SummaryCardSection } from "./SummaryCardSection";

export function OverallSummarySection() {
  const overall = useAppSelector(selectOverallSummary);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Overall summary</h2>
      <SummaryCardSection title="All-time total" summary={overall} />
    </div>
  );
}
