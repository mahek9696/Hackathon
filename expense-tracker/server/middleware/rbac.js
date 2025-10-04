const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Role-based access control middleware
const checkRole = (roles) => {
  return async (req, res, next) => {
    try {
      // Get user from the auth middleware
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Check if user's role is in the allowed roles
      if (!roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Insufficient permissions.",
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error during authorization",
      });
    }
  };
};

// Permission-based access control
const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Admin has all permissions
      if (user.role === "admin") {
        return next();
      }

      // Check if user has the specific permission
      if (!user.permissions || !user.permissions.includes(permission)) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Missing required permission.",
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error during permission check",
      });
    }
  };
};

// Get role permissions
const getRolePermissions = (role) => {
  const rolePermissions = {
    user: [
      "expense:create",
      "expense:read:own",
      "expense:update:own",
      "expense:delete:own",
      "budget:create:own",
      "budget:read:own",
      "budget:update:own",
      "budget:delete:own",
      "profile:read:own",
      "profile:update:own",
    ],
    manager: [
      "expense:create",
      "expense:read:own",
      "expense:read:team",
      "expense:update:own",
      "expense:update:team",
      "expense:delete:own",
      "expense:delete:team",
      "budget:create:own",
      "budget:create:team",
      "budget:read:own",
      "budget:read:team",
      "budget:update:own",
      "budget:update:team",
      "budget:delete:own",
      "budget:delete:team",
      "profile:read:own",
      "profile:read:team",
      "profile:update:own",
      "reports:read:team",
      "analytics:read:team",
    ],
    admin: [
      "expense:*",
      "budget:*",
      "user:*",
      "profile:*",
      "reports:*",
      "analytics:*",
      "system:*",
    ],
  };

  return rolePermissions[role] || [];
};

// Middleware to assign permissions based on role
const assignRolePermissions = async (req, res, next) => {
  try {
    if (req.user && req.user.role) {
      req.user.permissions = getRolePermissions(req.user.role);
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error assigning permissions",
    });
  }
};

module.exports = {
  checkRole,
  checkPermission,
  getRolePermissions,
  assignRolePermissions,
};
