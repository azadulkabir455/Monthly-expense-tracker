"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { BudgetItem } from "@/types/budget";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatNum(n: number): string {
  if (n === 0) return "0";
  return n > 0 ? `${n}` : `-${Math.abs(n)}`;
}

/**
 * Generate and download a PDF of budget details (Name, Budget, Cost, Due).
 */
export function downloadBudgetDetailsPdf(
  categoryName: string,
  year: number,
  month: number,
  items: BudgetItem[],
  expenseByTypeId: Record<string, number>
): void {
  const doc = new jsPDF();
  const monthLabel = MONTH_NAMES[month - 1] ?? "";

  doc.setFontSize(16);
  doc.text(`Budget details — ${categoryName}`, 14, 20);
  doc.setFontSize(11);
  doc.text(`${monthLabel} ${year}`, 14, 28);

  const tableData = items.map((item) => {
    const cost = item.expenseTypeId ? (expenseByTypeId[item.expenseTypeId] ?? 0) : 0;
    const due = item.amount - cost;
    return [
      item.name,
      formatNum(item.amount),
      formatNum(cost),
      formatNum(due),
    ];
  });

  const totalBudget = items.reduce((s, i) => s + i.amount, 0);
  const totalCost = items.reduce((s, i) => {
    const exp = i.expenseTypeId ? (expenseByTypeId[i.expenseTypeId] ?? 0) : 0;
    return s + exp;
  }, 0);
  const totalDue = totalBudget - totalCost;

  autoTable(doc, {
    startY: 34,
    head: [["Name", "Budget (৳)", "Cost (৳)", "Due (৳)"]],
    body: tableData,
    foot: [["Total", formatNum(totalBudget), formatNum(totalCost), formatNum(totalDue)]],
    theme: "grid",
    headStyles: { fillColor: [91, 33, 182] },
    footStyles: { fillColor: [240, 240, 240], fontStyle: "bold" },
    margin: { left: 14 },
  });

  doc.save(`budget-${categoryName.replace(/\s+/g, "-")}-${monthLabel}-${year}.pdf`);
}
