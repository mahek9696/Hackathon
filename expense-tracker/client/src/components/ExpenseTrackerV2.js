import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const ExpenseTrackerV2 = ({ user }) => {
  const [myExpenses, setMyExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    currency: user?.currency || "INR",
    description: "",
    category: "",
    expenseDate: new Date().toISOString().split("T")[0],
    merchantName: "",
    paymentMethod: "",
    businessJustification: "",
  });

  const categories = [
    "Meals",
    "Transportation",
    "Office Supplies",
    "Software",
    "Training",
    "Healthcare",
    "Entertainment",
    "Travel",
    "Utilities",
    "Other",
  ];

  const paymentMethods = [
    "Cash",
    "Credit Card",
    "Debit Card",
    "Bank Transfer",
    "UPI",
  ];

  useEffect(() => {
    fetchMyExpenses();
  }, []);

  const fetchMyExpenses = async () => {
    try {
      const response = await axios.get("/api/expenses/v2/my-expenses");
      if (response.data.success) {
        setMyExpenses(response.data.expenses);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to fetch expenses");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      const response = await axios.post("/api/expenses/v2/submit", payload);

      if (response.data.success) {
        toast.success("Expense submitted successfully!");
        setFormData({
          amount: "",
          currency: user?.currency || "INR",
          description: "",
          category: "",
          expenseDate: new Date().toISOString().split("T")[0],
          merchantName: "",
          paymentMethod: "",
          businessJustification: "",
        });
        setShowSubmitForm(false);
        fetchMyExpenses(); // Refresh the list
      }
    } catch (error) {
      console.error("Error submitting expense:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to submit expense";
      toast.error(errorMessage);
    }
  };

  const formatCurrency = (amount, currency) => {
    const symbol = currency === "INR" ? "₹" : "$";
    return `${symbol}${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "#22c55e";
      case "rejected":
        return "#ef4444";
      case "pending":
        return "#f59e0b";
      default:
        return "#64748b";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return "✓";
      case "rejected":
        return "✗";
      case "pending":
        return "⏳";
      default:
        return "...";
    }
  };

  const getCurrentStepInfo = (expense) => {
    if (expense.status === "approved") return "All approvals completed";
    if (expense.status === "rejected") return "Expense rejected";

    const currentStep =
      expense.approvalWorkflow?.steps?.[expense.approvalWorkflow?.currentStep];
    if (!currentStep) return "Processing...";

    return `Pending approval from ${currentStep.approver.name} (${currentStep.approver.role})`;
  };

  if (loading) {
    return (
      <div className="expense-tracker">
        <div className="loading">Loading your expenses...</div>
      </div>
    );
  }

  return (
    <div className="expense-tracker">
      <div className="tracker-header">
        <div className="header-content">
          <h2>My Expenses</h2>
          <p>Track and manage your expense submissions</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowSubmitForm(!showSubmitForm)}
        >
          {showSubmitForm ? "Cancel" : "➕ Submit Expense"}
        </button>
      </div>

      {showSubmitForm && (
        <div className="submit-form-container">
          <form onSubmit={handleSubmit} className="expense-form">
            <h3>Submit New Expense</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                >
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Brief description of the expense"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  name="expenseDate"
                  value={formData.expenseDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Merchant/Vendor</label>
                <input
                  type="text"
                  name="merchantName"
                  value={formData.merchantName}
                  onChange={handleInputChange}
                  placeholder="Where was this expense incurred?"
                />
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                >
                  <option value="">Select Payment Method</option>
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Business Justification</label>
              <textarea
                name="businessJustification"
                value={formData.businessJustification}
                onChange={handleInputChange}
                placeholder="Explain why this expense was necessary for business purposes"
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Submit for Approval
              </button>
              <button
                type="button"
                onClick={() => setShowSubmitForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="expenses-list">
        {myExpenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">No Data</div>
            <h3>No expenses yet</h3>
            <p>Submit your first expense to get started!</p>
          </div>
        ) : (
          myExpenses.map((expense) => (
            <div key={expense.id} className="expense-card">
              <div className="expense-header">
                <div className="expense-info">
                  <h3>{expense.description}</h3>
                  <p className="expense-meta">
                    {expense.category} • {formatDate(expense.expenseDate)}
                  </p>
                </div>
                <div className="expense-amount">
                  <span className="amount">
                    {formatCurrency(expense.amount, expense.currency)}
                  </span>
                  <span
                    className="status"
                    style={{ color: getStatusColor(expense.status) }}
                  >
                    {getStatusIcon(expense.status)}{" "}
                    {expense.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="expense-details">
                <div className="detail-row">
                  <span className="label">Current Status:</span>
                  <span>{getCurrentStepInfo(expense)}</span>
                </div>
                {expense.merchantName && (
                  <div className="detail-row">
                    <span className="label">Merchant:</span>
                    <span>{expense.merchantName}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="label">Submitted:</span>
                  <span>{formatDate(expense.createdAt)}</span>
                </div>
              </div>

              {/* Approval Progress */}
              {expense.approvalWorkflow && (
                <div className="approval-progress">
                  <h4>Approval Progress</h4>
                  <div className="progress-steps">
                    {expense.approvalWorkflow.steps.map((step, index) => (
                      <div
                        key={step._id}
                        className={`progress-step ${
                          step.status === "approved"
                            ? "completed"
                            : index === expense.approvalWorkflow.currentStep
                            ? "current"
                            : "pending"
                        }`}
                      >
                        <div className="step-indicator">
                          {step.status === "approved" ? "✓" : index + 1}
                        </div>
                        <div className="step-details">
                          <div className="step-title">
                            {step.approverType === "manager"
                              ? "Manager"
                              : "Admin"}{" "}
                            Approval
                          </div>
                          <div className="step-approver">
                            {step.approver.name}
                          </div>
                          {step.comments && (
                            <div className="step-comments">
                              "{step.comments}"
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .expense-tracker {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .tracker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .header-content h2 {
          margin: 0 0 8px 0;
          color: #1e293b;
        }

        .header-content p {
          margin: 0;
          color: #64748b;
        }

        .submit-form-container {
          background: #f8fafc;
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 30px;
          border: 1px solid #e2e8f0;
        }

        .expense-form h3 {
          margin: 0 0 24px 0;
          color: #1e293b;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          margin-bottom: 20px;
        }

        .form-group label {
          margin-bottom: 8px;
          font-weight: 500;
          color: #374151;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #2563eb;
          color: white;
        }

        .btn-primary:hover {
          background: #1d4ed8;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        .expenses-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .expense-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .expense-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .expense-info h3 {
          margin: 0 0 8px 0;
          color: #1e293b;
        }

        .expense-meta {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .expense-amount {
          text-align: right;
        }

        .amount {
          display: block;
          font-size: 20px;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .status {
          font-size: 12px;
          font-weight: 500;
        }

        .expense-details {
          margin-bottom: 16px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .label {
          color: #64748b;
          font-size: 14px;
        }

        .approval-progress h4 {
          margin: 16px 0 12px 0;
          color: #1e293b;
          font-size: 16px;
        }

        .progress-steps {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .progress-step {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border-radius: 6px;
        }

        .progress-step.completed {
          background: #f0fdf4;
        }

        .progress-step.current {
          background: #fef3c7;
        }

        .step-indicator {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          background: #f1f5f9;
          color: #64748b;
        }

        .progress-step.completed .step-indicator {
          background: #22c55e;
          color: white;
        }

        .progress-step.current .step-indicator {
          background: #f59e0b;
          color: white;
        }

        .step-details {
          flex: 1;
        }

        .step-title {
          font-weight: 500;
          color: #1e293b;
          font-size: 14px;
        }

        .step-approver {
          font-size: 12px;
          color: #64748b;
        }

        .step-comments {
          font-size: 12px;
          color: #059669;
          font-style: italic;
          margin-top: 2px;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .tracker-header {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .expense-header {
            flex-direction: column;
            gap: 12px;
          }

          .expense-amount {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
};

export default ExpenseTrackerV2;
