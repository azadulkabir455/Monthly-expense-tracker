"use client";

import { useAppSelector } from "@/store/hooks";
import {
  selectCurrentYearSummary,
  selectYearlySummaries,
} from "@/store/slices/expensesSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/blocks/elements/Card";
import { SummaryCardSection } from "./SummaryCardSection";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n) + " ৳";
}

export function YearlySummarySection() {
  const currentYear = useAppSelector(selectCurrentYearSummary);
  const allYears = useAppSelector(selectYearlySummaries);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Yearly summary</h2>

      {currentYear && (
        <SummaryCardSection
          title={`This year (${currentYear.year})`}
          summary={currentYear}
        />
      )}

      {allYears.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Other years</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {allYears
                .filter((y) => y.year !== currentYear?.year)
                .slice(0, 5)
                .map((y) => (
                  <li
                    key={y.year}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <span className="font-medium text-foreground">{y.year}</span>
                    <span className="text-sm text-muted-foreground">
                      Income {formatMoney(y.totalIncome)} · Expense {formatMoney(y.totalExpense)} · Balance {formatMoney(y.balance)}
                    </span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
