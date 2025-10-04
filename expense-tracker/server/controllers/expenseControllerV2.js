const ExpenseV2 = require("../models/ExpenseV2");
const User = require("../models/User");
const Company = require("../models/Company");
const ApprovalRule = require("../models/ApprovalRule");

// @desc    Submit expense (Employee)
// @route   POST /api/expenses/submit
// @access  Private/Employee
const submitExpense = async (req, res) => {
  try {
    const {
      amount,
      currency,
      description,
      category,
      expenseDate,
      merchantName,
      paymentMethod,
      receipt,
    } = req.body;

    const employee = req.user;
    const company = await Company.findById(employee.company);

    if (!company) {
      return res.status(400).json({
        success: false,
        message: "Company not found",
      });
    }

    // Calculate exchange rate and converted amount
    const exchangeRate = await getExchangeRate(
      currency,
      company.defaultCurrency
    );
    const convertedAmount = amount * exchangeRate;

    // Create expense
    const expense = new ExpenseV2({
      employeeId: employee._id,
      company: company._id,
      amount,
      currency,
      convertedAmount,
      exchangeRate,
      description,
      category,
      expenseDate: new Date(expenseDate),
      merchantName,
      paymentMethod,
      receipt,
      status: "submitted",
    });

    // Find applicable approval rule
    const applicableRule = await ApprovalRule.findApplicableRule(
      expense,
      employee
    );

    if (applicableRule) {
      // Check for auto-approval
      if (applicableRule.canAutoApprove(expense, employee)) {
        expense.status = "approved";
        expense.approvalWorkflow = {
          currentStep: 0,
          totalSteps: 0,
          steps: [],
        };
      } else {
        // Generate approval workflow
        expense.approvalWorkflow = applicableRule.generateWorkflow(
          expense,
          employee
        );
        expense.status = "pending";
      }
    } else {
      // Default workflow: require manager approval
      if (employee.manager) {
        expense.approvalWorkflow = {
          currentStep: 0,
          totalSteps: 1,
          steps: [
            {
              stepNumber: 0,
              approverType: "manager",
              approver: employee.manager,
              status: "pending",
            },
          ],
        };
        expense.status = "pending";
      } else {
        // No manager, auto-approve for small amounts
        if (convertedAmount <= 50) {
          expense.status = "approved";
        } else {
          return res.status(400).json({
            success: false,
            message: "No approval workflow found and no manager assigned",
          });
        }
      }
    }

    await expense.save();

    // Populate for response
    await expense.populate([
      { path: "employeeId", select: "name email" },
      { path: "approvalWorkflow.steps.approver", select: "name email role" },
    ]);

    res.status(201).json({
      success: true,
      message: "Expense submitted successfully",
      expense: {
        id: expense._id,
        amount: expense.amount,
        currency: expense.currency,
        convertedAmount: expense.convertedAmount,
        description: expense.description,
        category: expense.category,
        status: expense.status,
        expenseDate: expense.expenseDate,
        employee: expense.employeeId,
        approvalWorkflow: expense.approvalWorkflow,
        createdAt: expense.createdAt,
      },
    });
  } catch (error) {
    console.error("Submit expense error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during expense submission",
    });
  }
};

// @desc    Get expenses for approval (Manager/Admin)
// @route   GET /api/expenses/pending-approval
// @access  Private/Manager/Admin
const getPendingApprovals = async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, limit = 10, status = "pending" } = req.query;

    // Build query based on user role
    let query = {
      company: user.company,
      status: status,
      $or: [
        { "approvalWorkflow.steps.approver": user._id },
        { "approvalWorkflow.steps.approverGroup": user._id },
      ],
    };

    // For admin, show all pending expenses
    if (user.role === "admin") {
      query = {
        company: user.company,
        status: status,
      };
    }

    const expenses = await ExpenseV2.find(query)
      .populate("employeeId", "name email department employeeId")
      .populate("approvalWorkflow.steps.approver", "name email role")
      .populate("approvalWorkflow.steps.approvedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ExpenseV2.countDocuments(query);

    res.json({
      success: true,
      expenses: expenses.map((expense) => ({
        id: expense._id,
        amount: expense.amount,
        currency: expense.currency,
        convertedAmount: expense.convertedAmount,
        description: expense.description,
        category: expense.category,
        status: expense.status,
        expenseDate: expense.expenseDate,
        employee: expense.employeeId,
        approvalWorkflow: expense.approvalWorkflow,
        currentApprover: expense.getCurrentApprover(),
        createdAt: expense.createdAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get pending approvals error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Approve expense (Manager/Admin)
// @route   PUT /api/expenses/:id/approve
// @access  Private/Manager/Admin
const approveExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments = "" } = req.body;
    const approver = req.user;

    const expense = await ExpenseV2.findById(id)
      .populate("employeeId", "name email")
      .populate("approvalWorkflow.steps.approver", "name email");

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    // Check if user can approve this expense
    const currentStep = expense.getCurrentApprover();
    const currentApproverId =
      currentStep?.approver?._id || currentStep?.approver;

    if (
      !currentStep ||
      currentApproverId.toString() !== approver._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to approve this expense at this step",
      });
    }

    // Approve the expense
    const approved = expense.approveByUser(approver._id, comments);

    if (!approved) {
      return res.status(400).json({
        success: false,
        message: "Unable to approve expense",
      });
    }

    await expense.save();

    // Add comment if provided
    if (comments) {
      expense.comments.push({
        user: approver._id,
        message: comments,
      });
      await expense.save();
    }

    res.json({
      success: true,
      message: "Expense approved successfully",
      expense: {
        id: expense._id,
        status: expense.status,
        approvalWorkflow: expense.approvalWorkflow,
        comments: expense.comments,
      },
    });
  } catch (error) {
    console.error("Approve expense error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Reject expense (Manager/Admin)
// @route   PUT /api/expenses/:id/reject
// @access  Private/Manager/Admin
const rejectExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments = "" } = req.body;
    const approver = req.user;

    const expense = await ExpenseV2.findById(id)
      .populate("employeeId", "name email")
      .populate("approvalWorkflow.steps.approver", "name email");

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    // Check if user can reject this expense
    const currentStep = expense.getCurrentApprover();
    if (
      !currentStep ||
      currentStep.approver.toString() !== approver._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to reject this expense",
      });
    }

    // Reject the expense
    const rejected = expense.rejectByUser(approver._id, comments);

    if (!rejected) {
      return res.status(400).json({
        success: false,
        message: "Unable to reject expense",
      });
    }

    await expense.save();

    // Add comment
    if (comments) {
      expense.comments.push({
        user: approver._id,
        message: comments,
      });
      await expense.save();
    }

    res.json({
      success: true,
      message: "Expense rejected",
      expense: {
        id: expense._id,
        status: expense.status,
        approvalWorkflow: expense.approvalWorkflow,
        comments: expense.comments,
      },
    });
  } catch (error) {
    console.error("Reject expense error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get employee's own expenses
// @route   GET /api/expenses/my-expenses
// @access  Private/Employee
const getMyExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category } = req.query;
    const employee = req.user;

    let query = {
      employeeId: employee._id,
      company: employee.company,
    };

    if (status) query.status = status;
    if (category) query.category = category;

    const expenses = await ExpenseV2.find(query)
      .populate("approvalWorkflow.steps.approver", "name email role")
      .populate("approvalWorkflow.steps.approvedBy", "name email")
      .populate("comments.user", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ExpenseV2.countDocuments(query);

    res.json({
      success: true,
      expenses: expenses.map((expense) => ({
        id: expense._id,
        amount: expense.amount,
        currency: expense.currency,
        convertedAmount: expense.convertedAmount,
        description: expense.description,
        category: expense.category,
        status: expense.status,
        expenseDate: expense.expenseDate,
        approvalWorkflow: expense.approvalWorkflow,
        currentApprover: expense.getCurrentApprover(),
        comments: expense.comments,
        createdAt: expense.createdAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get my expenses error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Helper function to get exchange rate (simplified)
async function getExchangeRate(fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return 1;

  // In a real app, you'd call an exchange rate API
  // For now, return simplified rates
  const rates = {
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
    INR: 83.12,
    CAD: 1.36,
    AUD: 1.52,
    JPY: 149.34,
    CNY: 7.24,
  };

  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;

  return toRate / fromRate;
}

module.exports = {
  submitExpense,
  getPendingApprovals,
  approveExpense,
  rejectExpense,
  getMyExpenses,
};
