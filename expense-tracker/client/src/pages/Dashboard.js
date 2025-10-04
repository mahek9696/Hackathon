import React, { useState } from "react";
import ExpenseCharts from "../components/ExpenseCharts";
import BudgetTracker from "../components/BudgetTracker";
import AdminPanel from "../components/AdminPanel";
import UserManagement from "../components/UserManagement";
import ApprovalDashboard from "../components/ApprovalDashboard";
import ExpenseTrackerV2 from "../components/ExpenseTrackerV2";
import Header from "../components/Header";
import Footer from "../components/Footer";
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
  const [activeTab, setActiveTab] = useState("expenses");

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

  // Listen for custom tab change events from admin panel
  React.useEffect(() => {
    const handleTabChange = (event) => {
      setActiveTab(event.detail.tab);
    };

    window.addEventListener("dashboard-tab-change", handleTabChange);
    return () => {
      window.removeEventListener("dashboard-tab-change", handleTabChange);
    };
  }, []);

  return (
    <div id="root">
      <Header user={user} onLogout={onLogout} />

      <main className="main-content">
        <div className="container">
          {/* Navigation Tabs */}
          <div className="nav-tabs">
            <button
              className={`nav-tab ${activeTab === "expenses" ? "active" : ""}`}
              onClick={() => setActiveTab("expenses")}
            >
              My Expenses
            </button>
            {(user?.role === "manager" || user?.role === "admin") && (
              <button
                className={`nav-tab ${
                  activeTab === "approvals" ? "active" : ""
                }`}
                onClick={() => setActiveTab("approvals")}
              >
                Approvals
              </button>
            )}
            <button
              className={`nav-tab ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            {user?.role === "admin" && (
              <>
                <button
                  className={`nav-tab ${activeTab === "admin" ? "active" : ""}`}
                  onClick={() => setActiveTab("admin")}
                >
                  Admin Panel
                </button>
                <button
                  className={`nav-tab ${activeTab === "users" ? "active" : ""}`}
                  onClick={() => setActiveTab("users")}
                >
                  User Management
                </button>
              </>
            )}
          </div>

          {/* Tab Content */}
          {activeTab === "expenses" && (
            <div className="tab-content">
              <ExpenseTrackerV2 user={user} />
            </div>
          )}

          {activeTab === "approvals" &&
            (user?.role === "manager" || user?.role === "admin") && (
              <div className="tab-content">
                <ApprovalDashboard user={user} />
              </div>
            )}

          {activeTab === "overview" && (
            <div className="tab-content">
              <div
                className="grid"
                style={{
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-lg)",
                  marginBottom: "var(--space-lg)",
                }}
              >
                <div className="card">
                  <div className="card-header">
                    <h3 className="font-semibold">Total Expenses</h3>
                  </div>
                  <div className="card-body">
                    <div className="text-3xl font-bold text-primary">
                      ₹{total.toFixed(2)}
                    </div>
                    <p className="text-muted text-sm mt-sm">
                      Current month total
                    </p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 className="font-semibold">Export Data</h3>
                  </div>
                  <div className="card-body">
                    <div className="flex gap-sm">
                      <button
                        onClick={() => exportToCSV(expenses)}
                        className="btn btn-outline btn-sm"
                        disabled={expenses.length === 0}
                      >
                        Export CSV
                      </button>
                      <button
                        onClick={() => exportToJSON(expenses)}
                        className="btn btn-outline btn-sm"
                        disabled={expenses.length === 0}
                      >
                        Export JSON
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card mb-lg">
                <div className="card-header">
                  <h3 className="font-semibold">Add New Expense</h3>
                </div>
                <div className="card-body">
                  <form
                    onSubmit={handleSubmit}
                    className="grid"
                    style={{
                      gridTemplateColumns: "1fr 1fr 1fr auto",
                      gap: "var(--space-md)",
                      alignItems: "end",
                    }}
                  >
                    <div className="form-group">
                      <label className="form-label">Amount (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <input
                        type="text"
                        placeholder="What did you spend on?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="form-select"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary">
                      Add Expense
                    </button>
                  </form>
                </div>
              </div>

              {/* Charts and Analytics */}
              <ExpenseCharts expenses={expenses} />
              <BudgetTracker expenses={expenses} />

              <div className="card mt-lg">
                <div className="card-header">
                  <h3 className="font-semibold">
                    Recent Expenses ({expenses.length})
                  </h3>
                </div>
                <div className="card-body">
                  {expenses.length === 0 ? (
                    <div className="text-center py-lg">
                      <p className="text-muted">
                        No expenses yet. Add your first expense above!
                      </p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Amount</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Date</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.map((expense) => (
                            <tr key={expense._id}>
                              <td className="font-semibold">
                                ₹{expense.amount.toFixed(2)}
                              </td>
                              <td>{expense.description}</td>
                              <td>
                                <span className="badge badge-info">
                                  {expense.category}
                                </span>
                              </td>
                              <td className="text-sm text-muted">
                                {new Date(expense.date).toLocaleDateString()}
                              </td>
                              <td>
                                <button
                                  onClick={() =>
                                    onDeleteExpense(expense._id, expense.amount)
                                  }
                                  className="btn btn-sm"
                                  style={{
                                    backgroundColor: "var(--error)",
                                    color: "white",
                                    padding: "4px 8px",
                                  }}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "admin" && user?.role === "admin" && (
            <div className="tab-content">
              <AdminPanel user={user} />
            </div>
          )}

          {activeTab === "users" && user?.role === "admin" && (
            <div className="tab-content">
              <UserManagement user={user} />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
