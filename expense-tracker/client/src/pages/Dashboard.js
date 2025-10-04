import React, { useState } from "react";
import ExpenseCharts from "../components/ExpenseCharts";
import BudgetTracker from "../components/BudgetTracker";
import AdvancedAnalytics from "../components/AdvancedAnalytics";
import SmartFeatures from "../components/SmartFeatures";
import FinancialIntelligence from "../components/FinancialIntelligence";
import AdminPanel from "../components/AdminPanel";
import { exportToCSV, exportToJSON } from "../utils/exportUtils";

const Dashboard = ({
  user,
  expenses,
  total,
  onAddExpense,
  onDeleteExpense,
  onLogout,
}) => {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Food");
  const [activeTab, setActiveTab] = useState("overview");

  const categories = [
    "Food",
    "Transportation",
    "Shopping",
    "Entertainment",
    "Bills",
    "Healthcare",
    "Education",
    "Travel",
    "Business",
    "Other",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!amount || !description) {
      alert("Please fill all fields");
      return;
    }

    onAddExpense({
      amount: parseFloat(amount),
      description,
      category,
    });

    // Reset form
    setAmount("");
    setDescription("");
    setCategory("Food");
  };

  return (
    <div className="dashboard">
      <header className="header">
        <h1>💰 Expense Tracker</h1>
        <div className="header-actions">
          <div className="export-buttons">
            <button
              onClick={() => exportToCSV(expenses)}
              className="btn btn--small btn--outline"
              disabled={expenses.length === 0}
            >
              📊 Export CSV
            </button>
            <button
              onClick={() => exportToJSON(expenses)}
              className="btn btn--small btn--outline"
              disabled={expenses.length === 0}
            >
              📋 Export JSON
            </button>
          </div>
          <div className="user-info">
            <span>Welcome, {user.name}!</span>
            <button onClick={onLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Navigation Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            📊 Overview
          </button>
          <button
            className={`tab ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            📈 Advanced Analytics
          </button>
          <button
            className={`tab ${activeTab === "smart" ? "active" : ""}`}
            onClick={() => setActiveTab("smart")}
          >
            🤖 Smart Features
          </button>
          <button
            className={`tab ${activeTab === "intelligence" ? "active" : ""}`}
            onClick={() => setActiveTab("intelligence")}
          >
            💡 Financial Intelligence
          </button>
          {user?.role === "admin" && (
            <button
              className={`tab ${activeTab === "admin" ? "active" : ""}`}
              onClick={() => setActiveTab("admin")}
            >
              🛠️ Admin Panel
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="tab-content">
            <div className="total-section">
              <h2>Total Expenses: ${total.toFixed(2)}</h2>
            </div>

            <div className="add-expense-section">
              <h3>Add New Expense</h3>
              <form onSubmit={handleSubmit} className="expense-form">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <button type="submit">Add Expense</button>
              </form>
            </div>

            {/* Basic Analytics Charts */}
            <ExpenseCharts expenses={expenses} />

            {/* Budget Tracker */}
            <BudgetTracker expenses={expenses} />

            <div className="expenses-section">
              <h3>Recent Expenses ({expenses.length})</h3>
              <div className="expenses-list">
                {expenses.length === 0 ? (
                  <p>No expenses yet. Add your first expense above!</p>
                ) : (
                  expenses.map((expense) => (
                    <div key={expense._id} className="expense-item">
                      <div className="expense-info">
                        <span className="expense-amount">
                          ${expense.amount.toFixed(2)}
                        </span>
                        <span className="expense-description">
                          {expense.description}
                        </span>
                        <span className="expense-category">
                          {expense.category}
                        </span>
                        <span className="expense-date">
                          {new Date(expense.date).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          onDeleteExpense(expense._id, expense.amount)
                        }
                        className="delete-btn"
                      >
                        ❌
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="tab-content">
            <AdvancedAnalytics expenses={expenses} />
          </div>
        )}

        {activeTab === "smart" && (
          <div className="tab-content">
            <SmartFeatures expenses={expenses} onAddExpense={onAddExpense} />
          </div>
        )}

        {activeTab === "intelligence" && (
          <div className="tab-content">
            <FinancialIntelligence expenses={expenses} />
          </div>
        )}

        {activeTab === "admin" && user?.role === "admin" && (
          <div className="tab-content">
            <AdminPanel user={user} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
