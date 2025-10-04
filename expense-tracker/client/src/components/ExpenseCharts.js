import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ExpenseCharts = ({ expenses }) => {
  // Calculate category data
  const categoryData = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  // Calculate daily spending for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split("T")[0];
  }).reverse();

  const dailyData = last7Days.reduce((acc, date) => {
    const dayExpenses = expenses.filter(
      (expense) => expense.date.split("T")[0] === date
    );
    acc[date] = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    return acc;
  }, {});

  // Chart data configurations
  const categoryChartData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        data: Object.values(categoryData),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
          "#FF6384",
        ],
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const dailyChartData = {
    labels: last7Days.map((date) => {
      const d = new Date(date);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }),
    datasets: [
      {
        label: "Daily Spending",
        data: Object.values(dailyData),
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2,
        borderRadius: 5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Expense Analytics",
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
      },
      title: {
        display: true,
        text: "Spending by Category",
      },
    },
  };

  if (expenses.length === 0) {
    return (
      <div className="charts-container">
        <div className="no-data">
          <h3>📊 Analytics</h3>
          <p>Add some expenses to see your spending analytics!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="charts-container">
      <h3>📊 Expense Analytics</h3>

      <div className="charts-grid">
        <div className="chart-card">
          <h4>Daily Spending (Last 7 Days)</h4>
          <div className="chart-wrapper">
            <Bar data={dailyChartData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h4>Category Breakdown</h4>
          <div className="chart-wrapper">
            <Doughnut data={categoryChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total Categories</h4>
          <div className="stat-value">{Object.keys(categoryData).length}</div>
        </div>
        <div className="stat-card">
          <h4>Highest Category</h4>
          <div className="stat-value">
            {Object.keys(categoryData).length > 0
              ? Object.entries(categoryData).reduce((a, b) =>
                  categoryData[a[0]] > categoryData[b[0]] ? a : b
                )[0]
              : "N/A"}
          </div>
        </div>
        <div className="stat-card">
          <h4>Avg per Day</h4>
          <div className="stat-value">
            $
            {expenses.length > 0
              ? (
                  expenses.reduce((sum, exp) => sum + exp.amount, 0) / 7
                ).toFixed(2)
              : "0.00"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCharts;
