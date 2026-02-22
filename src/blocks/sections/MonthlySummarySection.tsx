"use client";

import { useAppSelector } from "@/store/hooks";
import {
  selectCurrentMonthSummary,
  selectMonthlySummaries,
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

/** "February 2026" → "Feb 2026" */
function shortMonthLabel(monthLabel: string) {
  const i = monthLabel.indexOf(" ");
  if (i <= 0) return monthLabel;
  return monthLabel.slice(0, 3) + monthLabel.slice(i);
}

export function MonthlySummarySection() {
  const currentMonth = useAppSelector(selectCurrentMonthSummary);
  const allMonths = useAppSelector(selectMonthlySummaries);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Monthly summary</h2>

      {currentMonth && (
        <SummaryCardSection
          title={`This month (${shortMonthLabel(currentMonth.monthLabel)})`}
          summary={currentMonth}
        />
      )}

      {allMonths.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Other months</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {allMonths
                .filter((m) => m.month !== currentMonth?.month || m.year !== currentMonth?.year)
                .slice(0, 6)
                .map((m) => (
                  <li
                    key={`${m.year}-${m.month}`}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <span className="font-medium text-foreground">{shortMonthLabel(m.monthLabel)}</span>
                    <span className="text-sm text-muted-foreground">
                      Income {formatMoney(m.totalIncome)} · Expense {formatMoney(m.totalExpense)} · Balance {formatMoney(m.balance)}
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
