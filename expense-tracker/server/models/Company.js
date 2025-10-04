const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    defaultCurrency: {
      type: String,
      required: [true, "Default currency is required"],
      enum: ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY", "CNY"],
      default: "INR",
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    settings: {
      maxExpenseAmount: {
        type: Number,
        default: 10000,
      },
      requireReceiptAbove: {
        type: Number,
        default: 100,
      },
      autoApprovalLimit: {
        type: Number,
        default: 50,
      },
      fiscalYearStart: {
        type: String,
        enum: ["January", "April", "July", "October"],
        default: "January",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    adminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
companySchema.index({ adminUser: 1 });
companySchema.index({ isActive: 1 });

module.exports = mongoose.model("Company", companySchema);
