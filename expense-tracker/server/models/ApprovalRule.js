const mongoose = require("mongoose");

const approvalRuleSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Rule name is required"],
      trim: true,
      maxlength: [100, "Rule name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 1, // Higher number = higher priority
    },
    conditions: {
      amountRange: {
        min: {
          type: Number,
          default: 0,
        },
        max: {
          type: Number,
          default: Number.MAX_SAFE_INTEGER,
        },
      },
      categories: [
        {
          type: String,
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
      ],
      departments: [String],
      employeeRoles: [
        {
          type: String,
          enum: ["employee", "manager", "admin"],
        },
      ],
    },
    approvalFlow: {
      type: {
        type: String,
        enum: ["sequential", "parallel", "conditional"],
        default: "sequential",
      },
      requireManagerApproval: {
        type: Boolean,
        default: true,
      },
      steps: [
        {
          stepNumber: {
            type: Number,
            required: true,
          },
          name: {
            type: String,
            required: true,
          },
          approverType: {
            type: String,
            enum: ["manager", "specific_user", "role_based", "department_head"],
            required: true,
          },
          approvers: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
          ],
          requiredRole: {
            type: String,
            enum: ["employee", "manager", "admin"],
          },
          isOptional: {
            type: Boolean,
            default: false,
          },
          timeoutHours: {
            type: Number,
            default: 72, // Auto-escalate after 72 hours
          },
          escalateTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        },
      ],
      conditionalRules: {
        percentageApproval: {
          enabled: {
            type: Boolean,
            default: false,
          },
          percentage: {
            type: Number,
            min: 1,
            max: 100,
            default: 60,
          },
          minimumApprovers: {
            type: Number,
            default: 1,
          },
        },
        specificApproverOverride: {
          enabled: {
            type: Boolean,
            default: false,
          },
          approvers: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
          ],
          description: String,
        },
        hybridApproval: {
          enabled: {
            type: Boolean,
            default: false,
          },
          operator: {
            type: String,
            enum: ["AND", "OR"],
            default: "OR",
          },
          rules: [
            {
              type: {
                type: String,
                enum: ["percentage", "specific_approver", "role_based"],
              },
              value: mongoose.Schema.Types.Mixed,
            },
          ],
        },
      },
    },
    autoApprovalRules: {
      enabled: {
        type: Boolean,
        default: false,
      },
      conditions: {
        maxAmount: {
          type: Number,
          default: 0,
        },
        categories: [String],
        recurringExpenses: {
          type: Boolean,
          default: false,
        },
        trustedEmployees: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
      },
    },
    notificationSettings: {
      sendToApprovers: {
        type: Boolean,
        default: true,
      },
      sendToEmployee: {
        type: Boolean,
        default: true,
      },
      reminderIntervalHours: {
        type: Number,
        default: 24,
      },
      escalationNotification: {
        type: Boolean,
        default: true,
      },
    },
    statistics: {
      timesUsed: {
        type: Number,
        default: 0,
      },
      averageApprovalTime: {
        type: Number,
        default: 0, // In hours
      },
      approvalRate: {
        type: Number,
        default: 0, // Percentage
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
approvalRuleSchema.index({ company: 1, isActive: 1 });
approvalRuleSchema.index({ priority: -1 });
approvalRuleSchema.index({
  "conditions.amountRange.min": 1,
  "conditions.amountRange.max": 1,
});

// Static method to find applicable rule for an expense
approvalRuleSchema.statics.findApplicableRule = function (expense, employee) {
  return this.findOne({
    company: expense.company,
    isActive: true,
    "conditions.amountRange.min": { $lte: expense.convertedAmount },
    "conditions.amountRange.max": { $gte: expense.convertedAmount },
    $or: [
      { "conditions.categories": { $size: 0 } },
      { "conditions.categories": expense.category },
    ],
    $or: [
      { "conditions.employeeRoles": { $size: 0 } },
      { "conditions.employeeRoles": employee.role },
    ],
  }).sort({ priority: -1 });
};

// Instance method to check if expense meets auto-approval criteria
approvalRuleSchema.methods.canAutoApprove = function (expense, employee) {
  if (!this.autoApprovalRules.enabled) return false;

  const rules = this.autoApprovalRules.conditions;

  // Check amount limit
  if (expense.convertedAmount > rules.maxAmount) return false;

  // Check category
  if (
    rules.categories.length > 0 &&
    !rules.categories.includes(expense.category)
  ) {
    return false;
  }

  // Check if employee is trusted
  if (rules.trustedEmployees.length > 0) {
    return rules.trustedEmployees.some((id) => id.equals(employee._id));
  }

  // Check recurring expenses
  if (rules.recurringExpenses && !expense.isRecurring) return false;

  return true;
};

// Instance method to generate approval workflow for an expense
approvalRuleSchema.methods.generateWorkflow = function (expense, employee) {
  const workflow = {
    currentStep: 0,
    totalSteps: 0,
    steps: [],
    conditionalRules: this.approvalFlow.conditionalRules,
  };

  // Add manager approval if required
  if (this.approvalFlow.requireManagerApproval && employee.manager) {
    workflow.steps.push({
      stepNumber: workflow.totalSteps,
      approverType: "manager",
      approver: employee.manager,
      status: "pending",
    });
    workflow.totalSteps++;
  }

  // Add configured approval steps
  this.approvalFlow.steps.forEach((step) => {
    workflow.steps.push({
      stepNumber: workflow.totalSteps,
      approverType: step.approverType,
      approver: step.approvers[0], // Simplified for now
      approverGroup: step.approvers,
      status: "pending",
    });
    workflow.totalSteps++;
  });

  return workflow;
};

module.exports = mongoose.model("ApprovalRule", approvalRuleSchema);
