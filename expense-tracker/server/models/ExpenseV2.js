const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee ID is required"],
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      enum: ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY", "CNY"],
      default: "USD",
    },
    convertedAmount: {
      type: Number, // Amount in company's default currency
      required: true,
    },
    exchangeRate: {
      type: Number,
      default: 1,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Travel",
        "Meals",
        "Accommodation",
        "Transportation",
        "Office Supplies",
        "Software",
        "Training",
        "Marketing",
        "Entertainment",
        "Healthcare",
        "Other",
      ],
    },
    expenseDate: {
      type: Date,
      required: [true, "Expense date is required"],
      validate: {
        validator: function (date) {
          return date <= new Date();
        },
        message: "Expense date cannot be in the future",
      },
    },
    receipt: {
      type: String, // URL to receipt image
      default: "",
    },
    merchantName: {
      type: String,
      trim: true,
      maxlength: [100, "Merchant name cannot exceed 100 characters"],
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Credit Card", "Debit Card", "Bank Transfer", "Other"],
      default: "Credit Card",
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "pending", "approved", "rejected", "paid"],
      default: "draft",
    },
    approvalWorkflow: {
      currentStep: {
        type: Number,
        default: 0,
      },
      totalSteps: {
        type: Number,
        default: 0,
      },
      steps: [
        {
          stepNumber: Number,
          approverType: {
            type: String,
            enum: ["manager", "specific_user", "any_from_group"],
          },
          approver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          approverGroup: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
          ],
          status: {
            type: String,
            enum: ["pending", "approved", "rejected", "skipped"],
            default: "pending",
          },
          comments: String,
          approvedAt: Date,
          approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        },
      ],
      conditionalRules: {
        percentageRule: {
          enabled: Boolean,
          percentage: Number, // e.g., 60 for 60%
        },
        specificApproverRule: {
          enabled: Boolean,
          approver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        },
        hybridRule: {
          enabled: Boolean,
          operator: {
            type: String,
            enum: ["AND", "OR"],
            default: "OR",
          },
        },
      },
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        message: {
          type: String,
          required: true,
          maxlength: [1000, "Comment cannot exceed 1000 characters"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    reimbursementDate: Date,
    reimbursementMethod: {
      type: String,
      enum: ["Bank Transfer", "Check", "Cash", "Payroll"],
      default: "Bank Transfer",
    },
    tags: [String],
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringDetails: {
      frequency: {
        type: String,
        enum: ["weekly", "monthly", "quarterly", "yearly"],
      },
      endDate: Date,
      nextDueDate: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
expenseSchema.index({ employeeId: 1, status: 1 });
expenseSchema.index({ company: 1, status: 1 });
expenseSchema.index({ "approvalWorkflow.steps.approver": 1, status: 1 });
expenseSchema.index({ createdAt: -1 });
expenseSchema.index({ expenseDate: -1 });

// Pre-save middleware to set converted amount
expenseSchema.pre("save", function (next) {
  if (this.isModified("amount") || this.isModified("exchangeRate")) {
    this.convertedAmount = this.amount * this.exchangeRate;
  }
  next();
});

// Instance method to check if expense needs approval
expenseSchema.methods.needsApproval = function () {
  return (
    this.status === "submitted" &&
    this.approvalWorkflow.currentStep < this.approvalWorkflow.totalSteps
  );
};

// Instance method to get current approver
expenseSchema.methods.getCurrentApprover = function () {
  if (this.approvalWorkflow.currentStep < this.approvalWorkflow.totalSteps) {
    return this.approvalWorkflow.steps[this.approvalWorkflow.currentStep];
  }
  return null;
};

// Instance method to approve by specific user
expenseSchema.methods.approveByUser = function (userId, comments = "") {
  const currentStep = this.getCurrentApprover();
  const currentApproverId = currentStep?.approver?._id || currentStep?.approver;

  if (currentStep && currentApproverId.toString() === userId.toString()) {
    currentStep.status = "approved";
    currentStep.comments = comments;
    currentStep.approvedAt = new Date();
    currentStep.approvedBy = userId;

    // Move to next step
    this.approvalWorkflow.currentStep += 1;

    // Check if all steps completed
    if (this.approvalWorkflow.currentStep >= this.approvalWorkflow.totalSteps) {
      this.status = "approved";
    }

    return true;
  }
  return false;
};

// Instance method to reject by specific user
expenseSchema.methods.rejectByUser = function (userId, comments = "") {
  const currentStep = this.getCurrentApprover();
  const currentApproverId = currentStep?.approver?._id || currentStep?.approver;

  if (currentStep && currentApproverId.toString() === userId.toString()) {
    currentStep.status = "rejected";
    currentStep.comments = comments;
    currentStep.approvedAt = new Date();
    currentStep.approvedBy = userId;

    this.status = "rejected";
    return true;
  }
  return false;
};

module.exports = mongoose.model("ExpenseV2", expenseSchema);
