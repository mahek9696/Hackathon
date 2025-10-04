# Implementation Guide - Key Components

## 🔧 Step-by-Step Implementation

### 1. Database Models (MongoDB Schemas)

#### User Model

```javascript
// server/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    avatar: {
      type: String,
      default: null,
    },
    currency: {
      type: String,
      default: "USD",
      enum: ["USD", "EUR", "GBP", "INR", "CAD", "AUD"],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
```

#### Expense Model

```javascript
// server/models/Expense.js
const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
      enum: [
        "Food & Dining",
        "Transportation",
        "Shopping",
        "Entertainment",
        "Bills & Utilities",
        "Healthcare",
        "Travel",
        "Education",
        "Business",
        "Others",
      ],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    receipt: {
      url: String,
      publicId: String,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    paymentMethod: {
      type: String,
      enum: ["Cash", "Credit Card", "Debit Card", "Bank Transfer", "Other"],
      default: "Cash",
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringDetails: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly"],
      },
      endDate: Date,
      nextDue: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model("Expense", expenseSchema);
```

### 2. Authentication Controller

```javascript
// server/controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// Register User
exports.register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
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

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        avatar: user.avatar,
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

// Get Current User
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
```

### 3. Expense Controller

```javascript
// server/controllers/expenseController.js
const Expense = require("../models/Expense");
const { validationResult } = require("express-validator");

// Get All Expenses
exports.getExpenses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      startDate,
      endDate,
      search,
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = { userId: req.user.id };

    // Add filters
    if (category && category !== "all") {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with pagination
    const expenses = await Expense.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("categoryId", "name color icon");

    // Get total count for pagination
    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: Number(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get expenses error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching expenses",
    });
  }
};

// Create Expense
exports.createExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const expenseData = {
      ...req.body,
      userId: req.user.id,
    };

    // Handle file upload if present
    if (req.file) {
      expenseData.receipt = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    const expense = await Expense.create(expenseData);

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Create expense error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating expense",
    });
  }
};

// Update Expense
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    // Update expense
    const updatedExpense = await Expense.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Expense updated successfully",
      data: updatedExpense,
    });
  } catch (error) {
    console.error("Update expense error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating expense",
    });
  }
};

// Delete Expense
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    await Expense.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("Delete expense error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting expense",
    });
  }
};

// Get Expense Summary
exports.getExpenseSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = { userId: req.user.id };
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    // Aggregate pipeline for summary
    const summary = await Expense.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: "$amount" },
          totalCount: { $sum: 1 },
          avgExpense: { $avg: "$amount" },
          categoryBreakdown: {
            $push: {
              category: "$category",
              amount: "$amount",
            },
          },
        },
      },
    ]);

    // Category-wise breakdown
    const categoryStats = await Expense.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        summary: summary[0] || {
          totalExpenses: 0,
          totalCount: 0,
          avgExpense: 0,
        },
        categoryStats,
      },
    });
  } catch (error) {
    console.error("Get expense summary error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching expense summary",
    });
  }
};
```

### 4. Frontend React Components

#### Auth Context

```jsx
// client/src/context/AuthContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return {
        ...state,
        loading: true,
        error: null,
      };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        error: null,
      };
    case "LOGIN_FAILURE":
      return {
        ...state,
        loading: false,
        user: null,
        token: null,
        isAuthenticated: false,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set auth token
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("token", token);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      dispatch({ type: "LOGIN_START" });

      const response = await axios.post("/api/auth/login", {
        email,
        password,
      });

      const { token, user } = response.data;

      setAuthToken(token);

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, token },
      });

      toast.success("Login successful!");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";

      dispatch({
        type: "LOGIN_FAILURE",
        payload: message,
      });

      toast.error(message);
      return { success: false, message };
    }
  };

  // Register
  const register = async (name, email, password) => {
    try {
      dispatch({ type: "LOGIN_START" });

      const response = await axios.post("/api/auth/register", {
        name,
        email,
        password,
      });

      const { token, user } = response.data;

      setAuthToken(token);

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, token },
      });

      toast.success("Registration successful!");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";

      dispatch({
        type: "LOGIN_FAILURE",
        payload: message,
      });

      toast.error(message);
      return { success: false, message };
    }
  };

  // Logout
  const logout = () => {
    setAuthToken(null);
    dispatch({ type: "LOGOUT" });
    toast.success("Logged out successfully");
  };

  // Load user from token
  const loadUser = async () => {
    if (localStorage.getItem("token")) {
      setAuthToken(localStorage.getItem("token"));
    }

    try {
      const response = await axios.get("/api/auth/me");

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: response.data.user,
          token: localStorage.getItem("token"),
        },
      });
    } catch (error) {
      console.error("Load user error:", error);
      logout();
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const value = {
    ...state,
    login,
    register,
    logout,
    loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
```

#### Expense Form Component

```jsx
// client/src/components/expense/ExpenseForm.jsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import axios from "axios";

const ExpenseForm = ({ expense, onSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: expense || {
      amount: "",
      description: "",
      category: "Food & Dining",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "Cash",
      tags: "",
    },
  });

  const categories = [
    "Food & Dining",
    "Transportation",
    "Shopping",
    "Entertainment",
    "Bills & Utilities",
    "Healthcare",
    "Travel",
    "Education",
    "Business",
    "Others",
  ];

  const paymentMethods = [
    "Cash",
    "Credit Card",
    "Debit Card",
    "Bank Transfer",
    "Other",
  ];

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Prepare form data
      const formData = new FormData();

      // Add all form fields
      Object.keys(data).forEach((key) => {
        if (key === "tags") {
          // Convert tags string to array
          const tagsArray = data[key]
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag);
          formData.append(key, JSON.stringify(tagsArray));
        } else {
          formData.append(key, data[key]);
        }
      });

      // Add receipt file if present
      if (receiptFile) {
        formData.append("receipt", receiptFile);
      }

      let response;
      if (expense) {
        // Update existing expense
        response = await axios.put(`/api/expenses/${expense._id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // Create new expense
        response = await axios.post("/api/expenses", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      toast.success(
        expense
          ? "Expense updated successfully!"
          : "Expense created successfully!"
      );
      reset();
      setReceiptFile(null);

      if (onSuccess) {
        onSuccess(response.data.data);
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Expense form error:", error);
      const message = error.response?.data?.message || "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload a valid image file (JPEG, PNG, GIF)");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setReceiptFile(file);
    }
  };

  return (
    <div className="expense-form">
      <div className="expense-form__header">
        <h2>{expense ? "Edit Expense" : "Add New Expense"}</h2>
        {onClose && (
          <button onClick={onClose} className="btn btn--close">
            ×
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="expense-form__form">
        <div className="form-group">
          <label htmlFor="amount">Amount *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            id="amount"
            {...register("amount", {
              required: "Amount is required",
              min: { value: 0.01, message: "Amount must be greater than 0" },
            })}
            className={errors.amount ? "form-control error" : "form-control"}
          />
          {errors.amount && (
            <span className="error-message">{errors.amount.message}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <input
            type="text"
            id="description"
            {...register("description", {
              required: "Description is required",
              maxLength: {
                value: 200,
                message: "Description cannot exceed 200 characters",
              },
            })}
            className={
              errors.description ? "form-control error" : "form-control"
            }
          />
          {errors.description && (
            <span className="error-message">{errors.description.message}</span>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              {...register("category", { required: "Category is required" })}
              className={
                errors.category ? "form-control error" : "form-control"
              }
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <span className="error-message">{errors.category.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="date">Date *</label>
            <input
              type="date"
              id="date"
              {...register("date", { required: "Date is required" })}
              className={errors.date ? "form-control error" : "form-control"}
            />
            {errors.date && (
              <span className="error-message">{errors.date.message}</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="paymentMethod">Payment Method</label>
          <select
            id="paymentMethod"
            {...register("paymentMethod")}
            className="form-control"
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (comma separated)</label>
          <input
            type="text"
            id="tags"
            {...register("tags")}
            className="form-control"
            placeholder="e.g. groceries, weekly, essential"
          />
        </div>

        <div className="form-group">
          <label htmlFor="receipt">Receipt Image</label>
          <input
            type="file"
            id="receipt"
            onChange={handleFileChange}
            accept="image/*"
            className="form-control"
          />
          {receiptFile && (
            <div className="file-preview">
              <span>Selected: {receiptFile.name}</span>
              <button
                type="button"
                onClick={() => setReceiptFile(null)}
                className="btn btn--small btn--danger"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn btn--primary">
            {loading ? "Saving..." : expense ? "Update Expense" : "Add Expense"}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn btn--secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;
```

### 5. Global CSS Styles

```css
/* client/src/styles/globals.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
    "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans",
    "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f8fafc;
  color: #1a202c;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-body {
  display: flex;
  flex: 1;
}

.main-content {
  flex: 1;
  padding: 2rem;
  margin-left: 250px;
  transition: margin-left 0.3s ease;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 1rem;
  }
}

/* Form Styles */
.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-control.error {
  border-color: #dc2626;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.error-message {
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
}

/* Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  min-height: 44px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn--primary {
  background-color: #2563eb;
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.btn--secondary {
  background-color: #6b7280;
  color: white;
}

.btn--secondary:hover:not(:disabled) {
  background-color: #4b5563;
}

.btn--success {
  background-color: #16a34a;
  color: white;
}

.btn--success:hover:not(:disabled) {
  background-color: #15803d;
}

.btn--danger {
  background-color: #dc2626;
  color: white;
}

.btn--danger:hover:not(:disabled) {
  background-color: #b91c1c;
}

.btn--outline {
  background-color: transparent;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn--outline:hover:not(:disabled) {
  background-color: #f9fafb;
}

.btn--small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  min-height: 36px;
}

.btn--close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  min-height: auto;
}

.btn--close:hover {
  color: #374151;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }
}

/* File Preview */
.file-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  background-color: #f3f4f6;
  border-radius: 0.25rem;
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

/* Expense Form Specific */
.expense-form {
  background: white;
  border-radius: 0.5rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
}

.expense-form__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.expense-form__header h2 {
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
}

/* Card Styles */
.card {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

/* Loading Spinner */
.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Responsive Utilities */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.text-center {
  text-align: center;
}

.text-left {
  text-align: left;
}

.text-right {
  text-align: right;
}

.mt-1 {
  margin-top: 0.25rem;
}
.mt-2 {
  margin-top: 0.5rem;
}
.mt-3 {
  margin-top: 0.75rem;
}
.mt-4 {
  margin-top: 1rem;
}

.mb-1 {
  margin-bottom: 0.25rem;
}
.mb-2 {
  margin-bottom: 0.5rem;
}
.mb-3 {
  margin-bottom: 0.75rem;
}
.mb-4 {
  margin-bottom: 1rem;
}

.hidden {
  display: none;
}

@media (max-width: 768px) {
  .hidden-mobile {
    display: none;
  }
}

@media (min-width: 769px) {
  .hidden-desktop {
    display: none;
  }
}
```

This implementation guide provides you with:

1. **Complete database models** with validation and indexing
2. **Robust authentication system** with JWT tokens
3. **Comprehensive expense controller** with CRUD operations, filtering, and analytics
4. **React context for state management** with proper error handling
5. **Reusable form component** with file upload and validation
6. **Professional CSS styling** with responsive design

The code follows best practices including:

- Input validation and sanitization
- Error handling and user feedback
- Responsive design
- Security considerations
- Performance optimization
- Clean, maintainable code structure

You can use this as a foundation and expand upon it during your hackathon!
