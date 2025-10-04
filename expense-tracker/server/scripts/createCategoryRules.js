const mongoose = require("mongoose");
require("dotenv").config();

const ApprovalRule = require("../models/ApprovalRule");
const Company = require("../models/Company");
const User = require("../models/User");

async function createCategorySpecificRules() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find Moonlight company and admin
    const company = await Company.findOne({ name: "Moonlight" });
    const admin = await User.findOne({ email: "pragnesh123@mail.com" });

    if (!company || !admin) {
      console.log("Company or admin not found");
      return;
    }

    console.log(`Creating category-specific rules for ${company.name}`);

    // Category-specific approval rules
    const categoryRules = [
      {
        company: company._id,
        name: "Travel Expenses Special Rule",
        description:
          "Travel expenses over $200 need admin approval due to company policy",
        priority: 10, // Higher priority than default rules
        conditions: {
          amountRange: { min: 200, max: Number.MAX_SAFE_INTEGER },
          categories: ["Travel", "Transportation", "Accommodation"],
          employeeRoles: ["employee", "manager"],
        },
        approvalFlow: {
          type: "sequential",
          requireManagerApproval: false, // Skip manager, go directly to admin
          steps: [
            {
              stepNumber: 0,
              name: "Admin Approval for Travel",
              approverType: "specific_user",
              approvers: [admin._id],
              isOptional: false,
              timeoutHours: 48,
            },
          ],
        },
        autoApprovalRules: {
          enabled: false,
        },
      },
      {
        company: company._id,
        name: "Office Supplies Auto-Approval",
        description: "Office supplies under $100 are auto-approved",
        priority: 8,
        conditions: {
          amountRange: { min: 0, max: 100 },
          categories: ["Office Supplies", "Software"],
          employeeRoles: ["employee"],
        },
        approvalFlow: {
          type: "sequential",
          requireManagerApproval: false,
          steps: [],
        },
        autoApprovalRules: {
          enabled: true,
          conditions: {
            maxAmount: 100,
            categories: ["Office Supplies", "Software"],
            recurringExpenses: false,
          },
        },
      },
      {
        company: company._id,
        name: "Entertainment Strict Approval",
        description: "All entertainment expenses need manager + admin approval",
        priority: 9,
        conditions: {
          amountRange: { min: 0, max: Number.MAX_SAFE_INTEGER },
          categories: ["Entertainment", "Meals"],
          employeeRoles: ["employee"],
        },
        approvalFlow: {
          type: "sequential",
          requireManagerApproval: true,
          steps: [
            {
              stepNumber: 1,
              name: "Admin Review for Entertainment",
              approverType: "specific_user",
              approvers: [admin._id],
              isOptional: false,
              timeoutHours: 24,
            },
          ],
        },
        autoApprovalRules: {
          enabled: false,
        },
      },
      {
        company: company._id,
        name: "Healthcare Fast Track",
        description:
          "Healthcare expenses under $300 only need manager approval",
        priority: 7,
        conditions: {
          amountRange: { min: 0, max: 300 },
          categories: ["Healthcare"],
          employeeRoles: ["employee"],
        },
        approvalFlow: {
          type: "sequential",
          requireManagerApproval: true,
          steps: [],
        },
        autoApprovalRules: {
          enabled: false,
        },
      },
    ];

    // Insert the category-specific rules
    const insertedRules = await ApprovalRule.insertMany(categoryRules);
    console.log(
      `\n✅ Created ${insertedRules.length} category-specific approval rules:`
    );

    insertedRules.forEach((rule) => {
      console.log(`\n📋 Rule: ${rule.name}`);
      console.log(`   Categories: ${rule.conditions.categories.join(", ")}`);
      console.log(
        `   Amount Range: $${rule.conditions.amountRange.min} - $${rule.conditions.amountRange.max}`
      );
      console.log(`   Priority: ${rule.priority}`);
      console.log(
        `   Auto-Approval: ${rule.autoApprovalRules.enabled ? "Yes" : "No"}`
      );
      console.log(
        `   Manager Required: ${
          rule.approvalFlow.requireManagerApproval ? "Yes" : "No"
        }`
      );
      console.log(`   Additional Steps: ${rule.approvalFlow.steps.length}`);
    });

    console.log("\n🎯 How Priority Works:");
    console.log("Higher priority number = rule applied first");
    console.log("System finds the FIRST matching rule with highest priority");

    process.exit(0);
  } catch (error) {
    console.error("Error creating category rules:", error);
    process.exit(1);
  }
}

createCategorySpecificRules();
