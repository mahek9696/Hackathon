const express = require("express");
const {
  registerCompany,
  registerEmployee,
  login,
  getProfile,
  getCompanyUsers,
} = require("../controllers/authControllerV2");
const { auth } = require("../middleware/auth");
const { checkRole } = require("../middleware/rbac");

const router = express.Router();

// Company registration (First admin signup)
router.post("/register-company", registerCompany);

// Employee/Manager registration (Admin only)
router.post("/register-employee", auth, checkRole(["admin"]), registerEmployee);

// Login
router.post("/login", login);

// Get profile
router.get("/profile", auth, getProfile);

// Get company users (Admin only)
router.get("/company-users", auth, checkRole(["admin"]), getCompanyUsers);

module.exports = router;
