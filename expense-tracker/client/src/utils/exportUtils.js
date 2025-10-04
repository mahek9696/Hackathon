import { saveAs } from "file-saver";

export const exportToCSV = (expenses, filename = "expenses.csv") => {
  // Create CSV header
  const header = ["Date", "Description", "Category", "Amount"];

  // Convert expenses to CSV rows
  const rows = expenses.map((expense) => [
    new Date(expense.date).toLocaleDateString(),
    expense.description,
    expense.category,
    expense.amount.toFixed(2),
  ]);

  // Combine header and rows
  const csvContent = [header, ...rows]
    .map((row) => row.map((field) => `"${field}"`).join(","))
    .join("\n");

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, filename);
};

export const exportToJSON = (expenses, filename = "expenses.json") => {
  const dataStr = JSON.stringify(expenses, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  saveAs(blob, filename);
};

export const generateExpenseReport = (expenses) => {
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const report = {
    generatedAt: new Date().toISOString(),
    totalExpenses: total,
    expenseCount: expenses.length,
    averageExpense: expenses.length > 0 ? total / expenses.length : 0,
    categoryBreakdown: categoryTotals,
    expenses: expenses,
  };

  return report;
};
