const User = require("../models/User");
const Company = require("../models/Company");
const ApprovalRule = require("../models/ApprovalRule");
const crypto = require("crypto");

// @desc    Register company and admin user (First signup)
// @route   POST /api/auth/register-company
// @access  Public
const registerCompany = async (req, res) => {
  try {
    const { companyName, country, adminName, adminEmail, password, currency } =
      req.body;

    // Check if admin user already exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create company first (without admin reference)
    const company = new Company({
      name: companyName,
      country,
      defaultCurrency: currency || "USD",
      adminUser: null, // Will be set after user creation
    });

    // Create admin user
    const adminUser = new User({
      name: adminName,
      email: adminEmail,
      password,
      currency: currency || "USD",
      role: "admin",
      company: company._id,
      department: "Administration",
      approvalLimit: Number.MAX_SAFE_INTEGER, // Unlimited approval limit for admin
    });

    // Save both
    await adminUser.save();
    company.adminUser = adminUser._id;
    await company.save();

    // Create default approval rules
    await createDefaultApprovalRules(company._id, adminUser._id);

    // Generate JWT token
    const token = adminUser.generateAuthToken();

    res.status(201).json({
      success: true,
      message: "Company and admin user created successfully",
      token,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        currency: adminUser.currency,
        company: {
          id: company._id,
          name: company.name,
          currency: company.defaultCurrency,
        },
      },
    });
  } catch (error) {
    console.error("Company registration error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Company or user already exists",
      });
    }

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// @desc    Register employee/manager (Subsequent signups)
// @route   POST /api/auth/register-employee
// @access  Private/Admin
const registerEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      employeeId,
      managerId,
      approvalLimit,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Get admin's company
    const adminUser = req.user;
    const company = await Company.findById(adminUser.company);

    if (!company) {
      return res.status(400).json({
        success: false,
        message: "Company not found",
      });
    }

    // Create new employee/manager
    const user = new User({
      name,
      email,
      password,
      currency: company.defaultCurrency,
      role: role || "employee",
      company: company._id,
      department,
      employeeId,
      manager: managerId || null,
      approvalLimit: approvalLimit || 0,
    });

    await user.save();

    // Update manager's direct reports if manager is assigned
    if (managerId) {
      await User.findByIdAndUpdate(managerId, {
        $addToSet: { directReports: user._id },
      });
    }

    res.status(201).json({
      success: true,
      message: `${role || "Employee"} registered successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
        company: {
          id: company._id,
          name: company.name,
        },
      },
    });
  } catch (error) {
    console.error("Employee registration error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Employee ID or email already exists",
      });
    }

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email })
      .select("+password")
      .populate("company", "name defaultCurrency")
      .populate("manager", "name email")
      .populate("directReports", "name email role");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact your administrator.",
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = user.generateAuthToken();

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
        currency: user.currency,
        approvalLimit: user.approvalLimit,
        company: user.company,
        manager: user.manager,
        directReports: user.directReports,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// Helper function to create default approval rules
async function createDefaultApprovalRules(companyId, adminId) {
  const defaultRules = [
    {
      company: companyId,
      name: "Small Expenses Auto-Approval",
      description: "Auto-approve expenses under $50",
      priority: 1,
      conditions: {
        amountRange: { min: 0, max: 50 },
        categories: [],
        employeeRoles: ["employee"],
      },
      autoApprovalRules: {
        enabled: true,
        conditions: {
          maxAmount: 50,
          categories: [],
          recurringExpenses: false,
        },
      },
      approvalFlow: {
        type: "sequential",
        requireManagerApproval: false,
        steps: [],
      },
    },
    {
      company: companyId,
      name: "Manager Approval Required",
      description: "Expenses $50-$500 require manager approval",
      priority: 2,
      conditions: {
        amountRange: { min: 50, max: 500 },
        categories: [],
        employeeRoles: ["employee"],
      },
      approvalFlow: {
        type: "sequential",
        requireManagerApproval: true,
        steps: [],
      },
    },
    {
      company: companyId,
      name: "High Value Expenses",
      description: "Expenses over $500 require manager + admin approval",
      priority: 3,
      conditions: {
        amountRange: { min: 500, max: Number.MAX_SAFE_INTEGER },
        categories: [],
        employeeRoles: ["employee", "manager"],
      },
      approvalFlow: {
        type: "sequential",
        requireManagerApproval: true,
        steps: [
          {
            stepNumber: 1,
            name: "Admin Approval",
            approverType: "specific_user",
            approvers: [adminId],
            isOptional: false,
            timeoutHours: 72,
          },
        ],
      },
    },
  ];

  try {
    await ApprovalRule.insertMany(defaultRules);
    console.log("Default approval rules created for company:", companyId);
  } catch (error) {
    console.error("Error creating default approval rules:", error);
  }
}

// @desc    Get user profile with company info
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("company", "name defaultCurrency country")
      .populate("manager", "name email role")
      .populate("directReports", "name email role department");

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
        currency: user.currency,
        approvalLimit: user.approvalLimit,
        company: user.company,
        manager: user.manager,
        directReports: user.directReports,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get all users in admin's company
// @route   GET /api/auth/v2/company-users
// @access  Private/Admin
const getCompanyUsers = async (req, res) => {
  try {
    const adminUser = req.user;

    if (adminUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // Get all users in the same company
    const users = await User.find({
      company: adminUser.company,
      _id: { $ne: adminUser.id }, // Exclude the admin user themselves
    })
      .populate("manager", "name email")
      .populate("directReports", "name email role")
      .select("-password")
      .sort({ role: 1, name: 1 }); // Sort by role first, then name

    // Separate managers and employees
    const managers = users.filter((user) => user.role === "manager");
    const employees = users.filter((user) => user.role === "employee");

    res.json({
      success: true,
      data: {
        managers,
        employees,
        total: users.length,
      },
    });
  } catch (error) {
    console.error("Error fetching company users:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  registerCompany,
  registerEmployee,
  login,
  getProfile,
  getCompanyUsers,
};
