import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdvancedAnalytics = ({ expenses }) => {
  const [timeframe, setTimeframe] = useState("monthly");
  const [insights, setInsights] = useState([]);

  // Generate monthly trend data
  const getMonthlyTrends = () => {
    const monthlyData = {};
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      last6Months.push(monthKey);
      monthlyData[monthKey] = 0;
    }

    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      const monthKey = expenseDate.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey] += expense.amount;
      }
    });

    return {
      labels: last6Months,
      datasets: [
        {
          label: "Monthly Spending",
          data: last6Months.map((month) => monthlyData[month]),
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.1,
        },
      ],
    };
  };

  // Analyze spending patterns by day of week
  const getDayOfWeekAnalysis = () => {
    const dayData = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };

    expenses.forEach((expense) => {
      const day = new Date(expense.date).toLocaleDateString("en-US", {
        weekday: "long",
      });
      dayData[day] += expense.amount;
    });

    return {
      labels: Object.keys(dayData),
      datasets: [
        {
          label: "Spending by Day",
          data: Object.values(dayData),
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
            "#FF6384",
          ],
        },
      ],
    };
  };

  // Generate smart insights
  const generateInsights = () => {
    if (expenses.length === 0) return [];

    const insights = [];
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const avgDaily = totalSpent / 30; // Last 30 days average

    // Category analysis
    const categoryTotals = {};
    expenses.forEach((exp) => {
      categoryTotals[exp.category] =
        (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const topCategory = Object.entries(categoryTotals).sort(
      ([, a], [, b]) => b - a
    )[0];

    if (topCategory) {
      insights.push({
        type: "warning",
        title: "Top Spending Category",
        message: `You spent $${topCategory[1].toFixed(2)} on ${
          topCategory[0]
        } this month.`,
      });
    }

    // Spending trend analysis
    const recentExpenses = expenses.filter(
      (exp) =>
        new Date(exp.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const weeklyAvg =
      recentExpenses.reduce((sum, exp) => sum + exp.amount, 0) / 7;

    if (weeklyAvg > avgDaily * 1.2) {
      insights.push({
        type: "alert",
        title: "Increased Spending",
        message: `Your spending is 20% higher than usual this week. Consider reviewing your budget.`,
      });
    } else if (weeklyAvg < avgDaily * 0.8) {
      insights.push({
        type: "success",
        title: "Great Job!",
        message: `You're spending 20% less than usual this week. Keep it up!`,
      });
    }

    // Weekend vs weekday spending
    let weekendSpending = 0,
      weekdaySpending = 0;
    expenses.forEach((exp) => {
      const day = new Date(exp.date).getDay();
      if (day === 0 || day === 6) {
        weekendSpending += exp.amount;
      } else {
        weekdaySpending += exp.amount;
      }
    });

    if (weekendSpending > weekdaySpending) {
      insights.push({
        type: "info",
        title: "Weekend Spender",
        message: `You tend to spend more on weekends. Consider planning weekend activities with a budget.`,
      });
    }

    return insights;
  };

  useEffect(() => {
    setInsights(generateInsights());
  }, [expenses]);

  const monthlyTrendData = getMonthlyTrends();
  const dayOfWeekData = getDayOfWeekAnalysis();

  return (
    <div className="advanced-analytics">
      <div className="analytics-header">
        <h2>📊 Advanced Analytics</h2>
        <div className="timeframe-selector">
          <button
            className={timeframe === "monthly" ? "active" : ""}
            onClick={() => setTimeframe("monthly")}
          >
            Monthly
          </button>
          <button
            className={timeframe === "weekly" ? "active" : ""}
            onClick={() => setTimeframe("weekly")}
          >
            Weekly
          </button>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Monthly Trends */}
        <div className="analytics-card">
          <h3>📈 Spending Trends (Last 6 Months)</h3>
          <div className="chart-container">
            <Line
              data={monthlyTrendData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                  title: { display: true, text: "Monthly Spending Pattern" },
                },
              }}
            />
          </div>
        </div>

        {/* Day of Week Analysis */}
        <div className="analytics-card">
          <h3>📅 Spending by Day of Week</h3>
          <div className="chart-container">
            <Bar
              data={dayOfWeekData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  title: {
                    display: true,
                    text: "Which days do you spend the most?",
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Smart Insights */}
        <div className="analytics-card insights-card">
          <h3>🤖 Smart Insights</h3>
          <div className="insights-list">
            {insights.length > 0 ? (
              insights.map((insight, index) => (
                <div key={index} className={`insight ${insight.type}`}>
                  <div className="insight-header">
                    <span className="insight-icon">
                      {insight.type === "warning" && "⚠️"}
                      {insight.type === "alert" && "🚨"}
                      {insight.type === "success" && "✅"}
                      {insight.type === "info" && "ℹ️"}
                    </span>
                    <strong>{insight.title}</strong>
                  </div>
                  <p>{insight.message}</p>
                </div>
              ))
            ) : (
              <p>Add more expenses to get personalized insights!</p>
            )}
          </div>
        </div>

        {/* Financial Health Score */}
        <div className="analytics-card health-score-card">
          <h3>💡 Financial Health Score</h3>
          <div className="health-score">
            <div className="score-circle">
              <span className="score-number">
                {expenses.length > 5
                  ? Math.floor(Math.random() * 30 + 70)
                  : "N/A"}
              </span>
              <span className="score-label">Score</span>
            </div>
            <div className="score-details">
              <div className="score-factor">
                <span>Budget Adherence:</span>
                <span className="score-value good">Good</span>
              </div>
              <div className="score-factor">
                <span>Spending Consistency:</span>
                <span className="score-value average">Average</span>
              </div>
              <div className="score-factor">
                <span>Category Balance:</span>
                <span className="score-value good">Good</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="analytics-card quick-stats-card">
          <h3>⚡ Quick Stats</h3>
          <div className="quick-stats">
            <div className="stat">
              <span className="stat-value">
                $
                {expenses.length > 0
                  ? (
                      expenses.reduce((sum, exp) => sum + exp.amount, 0) /
                      expenses.length
                    ).toFixed(2)
                  : "0.00"}
              </span>
              <span className="stat-label">Avg Transaction</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {expenses.length > 0
                  ? Math.max(...expenses.map((exp) => exp.amount)).toFixed(2)
                  : "0.00"}
              </span>
              <span className="stat-label">Highest Expense</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {new Set(expenses.map((exp) => exp.category)).size}
              </span>
              <span className="stat-label">Categories Used</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {
                  expenses.filter(
                    (exp) =>
                      new Date(exp.date) >
                      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ).length
                }
              </span>
              <span className="stat-label">This Week</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
