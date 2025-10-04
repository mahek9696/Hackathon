import React, { useState, useEffect } from "react";

const BudgetTracker = ({ expenses }) => {
  // Default budget amounts for each category
  const defaultBudgets = {
    Food: 500,
    Transportation: 200,
    Shopping: 300,
    Entertainment: 150,
    Bills: 400,
    Healthcare: 250,
    Education: 200,
    Travel: 300,
    Business: 400,
    Other: 100,
  };

  const [budgets, setBudgets] = useState(defaultBudgets);
  const [editingBudget, setEditingBudget] = useState(null);
  const [newBudgetAmount, setNewBudgetAmount] = useState("");

  // Get all unique categories from expenses and default categories
  const getAllCategories = () => {
    const expenseCategories = [
      ...new Set(expenses.map((expense) => expense.category)),
    ];
    const allCategories = [
      ...new Set([...Object.keys(defaultBudgets), ...expenseCategories]),
    ];
    return allCategories;
  };

  // Initialize budgets for any new categories found in expenses
  useEffect(() => {
    const allCategories = getAllCategories();
    const newBudgets = { ...budgets };

    allCategories.forEach((category) => {
      if (!newBudgets[category]) {
        newBudgets[category] = 100; // Default budget for new categories
      }
    });

    setBudgets(newBudgets);
  }, [expenses]);

  // Calculate spending by category
  const categorySpending = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const handleBudgetEdit = (category) => {
    setEditingBudget(category);
    setNewBudgetAmount(budgets[category].toString());
  };

  const handleBudgetSave = (category) => {
    setBudgets((prev) => ({
      ...prev,
      [category]: parseFloat(newBudgetAmount) || 0,
    }));
    setEditingBudget(null);
    setNewBudgetAmount("");
  };

  const getBudgetStatus = (category) => {
    const spent = categorySpending[category] || 0;
    const budget = budgets[category] || 0;
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;

    if (percentage >= 100) return { status: "over", color: "#dc3545" };
    if (percentage >= 80) return { status: "warning", color: "#ffc107" };
    return { status: "good", color: "#28a745" };
  };

  return (
    <div className="budget-tracker">
      <h3>💰 Budget Tracker</h3>

      <div className="budget-overview">
        <div className="budget-summary">
          <div className="budget-stat">
            <span>Total Budget:</span>
            <span>
              $
              {Object.values(budgets)
                .reduce((sum, budget) => sum + budget, 0)
                .toFixed(2)}
            </span>
          </div>
          <div className="budget-stat">
            <span>Total Spent:</span>
            <span>
              $
              {Object.values(categorySpending)
                .reduce((sum, spent) => sum + spent, 0)
                .toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="budget-categories">
        {getAllCategories()
          .sort()
          .map((category) => {
            const spent = categorySpending[category] || 0;
            const budget = budgets[category] || 0;
            const percentage =
              budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
            const status = getBudgetStatus(category);

            return (
              <div key={category} className="budget-item">
                <div className="budget-header">
                  <h4>{category}</h4>
                  <div className="budget-amounts">
                    <span className="spent">${spent.toFixed(2)}</span>
                    <span>/</span>
                    {editingBudget === category ? (
                      <div className="budget-edit">
                        <input
                          type="number"
                          value={newBudgetAmount}
                          onChange={(e) => setNewBudgetAmount(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleBudgetSave(category)
                          }
                          autoFocus
                        />
                        <button onClick={() => handleBudgetSave(category)}>
                          ✓
                        </button>
                        <button onClick={() => setEditingBudget(null)}>
                          ✗
                        </button>
                      </div>
                    ) : (
                      <span
                        className="budget-amount clickable"
                        onClick={() => handleBudgetEdit(category)}
                        title="Click to edit budget"
                      >
                        ${budget.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="budget-progress">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: status.color,
                    }}
                  ></div>
                </div>

                <div className="budget-info">
                  <span className={`status ${status.status}`}>
                    {percentage.toFixed(1)}% used
                  </span>
                  <span className="remaining">
                    ${Math.max(budget - spent, 0).toFixed(2)} left
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default BudgetTracker;
