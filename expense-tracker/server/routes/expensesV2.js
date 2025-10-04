const express = require("express");
const {
  submitExpense,
  getPendingApprovals,
  approveExpense,
  rejectExpense,
  getMyExpenses,
} = require("../controllers/expenseControllerV2");
const { auth } = require("../middleware/auth");
const { checkRole } = require("../middleware/rbac");

const router = express.Router();

// Employee routes
router.post(
  "/submit",
  auth,
  checkRole(["employee", "manager", "admin"]),
  submitExpense
);
router.get("/my-expenses", auth, getMyExpenses);

// Manager/Admin routes
router.get(
  "/pending-approval",
  auth,
  checkRole(["manager", "admin"]),
  getPendingApprovals
);
router.put(
  "/:id/approve",
  auth,
  checkRole(["manager", "admin"]),
  approveExpense
);
router.put("/:id/reject", auth, checkRole(["manager", "admin"]), rejectExpense);

module.exports = router;
