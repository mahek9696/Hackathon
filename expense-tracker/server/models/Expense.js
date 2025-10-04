const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: [
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
        ],
        message: "Invalid category",
      },
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    receipt: {
      type: String, // URL to receipt image
      default: "",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringDetails: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly"],
        required: function () {
          return this.isRecurring;
        },
      },
      endDate: {
        type: Date,
        required: function () {
          return this.isRecurring;
        },
      },
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });
expenseSchema.index({ userId: 1, createdAt: -1 });

// Virtual for formatted amount
expenseSchema.virtual("formattedAmount").get(function () {
  return `$${this.amount.toFixed(2)}`;
});

// Ensure virtual fields are serialized
expenseSchema.set("toJSON", {
  virtuals: true,
});

module.exports = mongoose.model("Expense", expenseSchema);
