import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const ApprovalDashboard = ({ user }) => {
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (user?.role === "manager" || user?.role === "admin") {
      fetchPendingApprovals();
    }
  }, [user]);

  const fetchPendingApprovals = async () => {
    try {
      const response = await axios.get("/api/expenses/v2/pending-approval");
      if (response.data.success) {
        setPendingExpenses(response.data.expenses);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      toast.error("Failed to fetch pending approvals");
      setLoading(false);
    }
  };

  const handleApprove = async (expenseId, comments) => {
    try {
      setProcessingId(expenseId);
      const response = await axios.put(
        `/api/expenses/v2/${expenseId}/approve`,
        {
          comments: comments || `Approved by ${user.role}`,
        }
      );

      if (response.data.success) {
        toast.success("Expense approved successfully!");
        fetchPendingApprovals(); // Refresh the list
      }
    } catch (error) {
      console.error("Error approving expense:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to approve expense";
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (expenseId, comments) => {
    try {
      setProcessingId(expenseId);
      const response = await axios.put(`/api/expenses/v2/${expenseId}/reject`, {
        comments: comments || `Rejected by ${user.role}`,
      });

      if (response.data.success) {
        toast.success("Expense rejected successfully!");
        fetchPendingApprovals(); // Refresh the list
      }
    } catch (error) {
      console.error("Error rejecting expense:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to reject expense";
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
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

  const getCurrentStepInfo = (expense) => {
    const currentStep = expense.currentApprover;
    if (!currentStep) return null;

    return {
      stepNumber: currentStep.stepNumber + 1,
      totalSteps: expense.approvalWorkflow.totalSteps,
      approverName: currentStep.approver.name,
      approverRole: currentStep.approver.role,
    };
  };

  if (loading) {
    return (
      <div className="approval-dashboard">
        <div className="loading">Loading pending approvals...</div>
      </div>
    );
  }

  return (
    <div className="approval-dashboard">
      <div className="dashboard-header">
        <h2>📋 Pending Approvals</h2>
        <p>
          {pendingExpenses.length} expense
          {pendingExpenses.length !== 1 ? "s" : ""} pending your approval
        </p>
      </div>

      {pendingExpenses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>All caught up!</h3>
          <p>No expenses pending your approval at the moment.</p>
        </div>
      ) : (
        <div className="expenses-list">
          {pendingExpenses.map((expense) => {
            const stepInfo = getCurrentStepInfo(expense);
            return (
              <div key={expense.id} className="expense-card">
                <div className="expense-header">
                  <div className="expense-info">
                    <h3>{expense.description}</h3>
                    <p className="employee-info">
                      Submitted by <strong>{expense.employee.name}</strong> (
                      {expense.employee.department})
                    </p>
                  </div>
                  <div className="expense-amount">
                    <span className="amount">
                      {formatCurrency(expense.amount, expense.currency)}
                    </span>
                    <span className="category">{expense.category}</span>
                  </div>
                </div>

                <div className="expense-details">
                  <div className="detail-row">
                    <span className="label">Date:</span>
                    <span>{formatDate(expense.expenseDate)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Status:</span>
                    <span className="status pending">Pending Approval</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Current Step:</span>
                    <span>
                      Step {stepInfo?.stepNumber} of {stepInfo?.totalSteps} (
                      {stepInfo?.approverRole})
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Submitted:</span>
                    <span>{formatDate(expense.createdAt)}</span>
                  </div>
                </div>

                {/* Approval Workflow Progress */}
                <div className="approval-progress">
                  <h4>Approval Workflow</h4>
                  <div className="workflow-steps">
                    {expense.approvalWorkflow.steps.map((step, index) => (
                      <div
                        key={step._id}
                        className={`workflow-step ${
                          step.status === "approved"
                            ? "completed"
                            : step.status === "pending" &&
                              index === expense.approvalWorkflow.currentStep
                            ? "current"
                            : "pending"
                        }`}
                      >
                        <div className="step-indicator">
                          {step.status === "approved" ? "✅" : index + 1}
                        </div>
                        <div className="step-info">
                          <div className="step-title">
                            {step.approverType === "manager"
                              ? "Manager Approval"
                              : "Admin Approval"}
                          </div>
                          <div className="step-approver">
                            {step.approver.name}
                          </div>
                          {step.status === "approved" && (
                            <div className="step-comments">{step.comments}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="expense-actions">
                  <button
                    className="btn btn-approve"
                    onClick={() => handleApprove(expense.id)}
                    disabled={processingId === expense.id}
                  >
                    {processingId === expense.id
                      ? "Processing..."
                      : "✅ Approve"}
                  </button>
                  <button
                    className="btn btn-reject"
                    onClick={() => handleReject(expense.id)}
                    disabled={processingId === expense.id}
                  >
                    {processingId === expense.id
                      ? "Processing..."
                      : "❌ Reject"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .approval-dashboard {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .dashboard-header h2 {
          color: #1e293b;
          margin-bottom: 10px;
        }

        .dashboard-header p {
          color: #64748b;
          font-size: 16px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          color: #1e293b;
          margin-bottom: 10px;
        }

        .empty-state p {
          color: #64748b;
        }

        .expenses-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .expense-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .expense-header {
          display: flex;
          justify-content: between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .expense-info h3 {
          margin: 0 0 8px 0;
          color: #1e293b;
          font-size: 18px;
        }

        .employee-info {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .expense-amount {
          text-align: right;
        }

        .amount {
          display: block;
          font-size: 24px;
          font-weight: bold;
          color: #059669;
        }

        .category {
          display: block;
          font-size: 12px;
          color: #64748b;
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 4px;
          margin-top: 4px;
        }

        .expense-details {
          margin-bottom: 20px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .label {
          color: #64748b;
          font-weight: 500;
        }

        .status.pending {
          color: #d97706;
          background: #fef3c7;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .approval-progress {
          margin-bottom: 24px;
        }

        .approval-progress h4 {
          margin: 0 0 16px 0;
          color: #1e293b;
        }

        .workflow-steps {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .workflow-step {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .workflow-step.completed {
          background: #f0fdf4;
          border-color: #22c55e;
        }

        .workflow-step.current {
          background: #fef3c7;
          border-color: #f59e0b;
        }

        .step-indicator {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          background: #f1f5f9;
          color: #64748b;
        }

        .workflow-step.completed .step-indicator {
          background: #22c55e;
          color: white;
        }

        .workflow-step.current .step-indicator {
          background: #f59e0b;
          color: white;
        }

        .step-info {
          flex: 1;
        }

        .step-title {
          font-weight: 500;
          color: #1e293b;
        }

        .step-approver {
          font-size: 14px;
          color: #64748b;
        }

        .step-comments {
          font-size: 12px;
          color: #059669;
          font-style: italic;
          margin-top: 4px;
        }

        .expense-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          font-size: 14px;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-approve {
          background: #22c55e;
          color: white;
        }

        .btn-approve:hover:not(:disabled) {
          background: #16a34a;
        }

        .btn-reject {
          background: #ef4444;
          color: white;
        }

        .btn-reject:hover:not(:disabled) {
          background: #dc2626;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .expense-header {
            flex-direction: column;
            gap: 16px;
          }

          .expense-amount {
            text-align: left;
          }

          .expense-actions {
            flex-direction: column;
          }

          .workflow-steps {
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default ApprovalDashboard;
