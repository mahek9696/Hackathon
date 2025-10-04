const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Import routes
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const { auth } = require("./middleware/auth");

// Middleware
app.use(cors());
app.use(express.json());

// Import models
const User = require("./models/User");
const Expense = require("./models/Expense");

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running!",
    timestamp: new Date().toISOString(),
  });
});

// Get expenses (protected route)
app.get("/api/expenses", auth, async (req, res) => {
  try {
    const { category, startDate, endDate, limit = 50, page = 1 } = req.query;

    // Build query
    const query = { userId: req.user.id };

    if (category && category !== "all") {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const count = await Expense.countDocuments(query);

    res.json({
      success: true,
      expenses,
      total,
      count,
      page: parseInt(page),
      pages: Math.ceil(count / parseInt(limit)),
    });
  } catch (error) {
    console.error("Get expenses error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching expenses",
    });
  }
});

// Add expense (protected route)
app.post("/api/expenses", auth, async (req, res) => {
  try {
    const { amount, description, category, date, tags, notes } = req.body;

    // Validate required fields
    if (!amount || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Amount, description, and category are required",
      });
    }

    const expense = new Expense({
      userId: req.user.id,
      amount: parseFloat(amount),
      description: description.trim(),
      category,
      date: date ? new Date(date) : new Date(),
      tags: tags || [],
      notes: notes || "",
    });

    await expense.save();

    res.status(201).json({
      success: true,
      message: "Expense added successfully",
      expense,
    });
  } catch (error) {
    console.error("Add expense error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding expense",
    });
  }
});

// Update expense (protected route)
app.put("/api/expenses/:id", auth, async (req, res) => {
  try {
    const { amount, description, category, date, tags, notes } = req.body;

    // Find expense and verify ownership
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    // Update fields
    if (amount !== undefined) expense.amount = parseFloat(amount);
    if (description !== undefined) expense.description = description.trim();
    if (category !== undefined) expense.category = category;
    if (date !== undefined) expense.date = new Date(date);
    if (tags !== undefined) expense.tags = tags;
    if (notes !== undefined) expense.notes = notes;

    await expense.save();

    res.json({
      success: true,
      message: "Expense updated successfully",
      expense,
    });
  } catch (error) {
    console.error("Update expense error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating expense",
    });
  }
});

// Delete expense (protected route)
app.delete("/api/expenses/:id", auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    await Expense.findByIdAndDelete(req.params.id);

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
});

// Get expense analytics (protected route)
app.get("/api/expenses/analytics/summary", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build match criteria
    const matchCriteria = { userId: new mongoose.Types.ObjectId(req.user.id) };

    if (startDate || endDate) {
      matchCriteria.date = {};
      if (startDate) matchCriteria.date.$gte = new Date(startDate);
      if (endDate) matchCriteria.date.$lte = new Date(endDate);
    }

    // Aggregation pipeline for analytics
    const analytics = await Expense.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: "$amount" },
          avgExpense: { $avg: "$amount" },
          count: { $sum: 1 },
          maxExpense: { $max: "$amount" },
          minExpense: { $min: "$amount" },
        },
      },
    ]);

    // Category breakdown
    const categoryBreakdown = await Expense.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          avg: { $avg: "$amount" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({
      success: true,
      analytics: analytics[0] || {
        totalExpenses: 0,
        avgExpense: 0,
        count: 0,
        maxExpense: 0,
        minExpense: 0,
      },
      categoryBreakdown,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching analytics",
    });
  }
});

// MongoDB connection
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/expense-tracker"
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💡 Test login: test@test.com / test123`);
});
