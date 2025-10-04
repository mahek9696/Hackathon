import React, { useState, useEffect } from "react";
import axios from "axios";

const Login = ({ onLogin, onSwitchToRegister, onSwitchToCompanyRegister }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Auto-fill email if user just registered
  useEffect(() => {
    const registeredEmail = sessionStorage.getItem("registeredEmail");
    if (registeredEmail) {
      setFormData((prev) => ({
        ...prev,
        email: registeredEmail,
      }));
      // Clear the stored email
      sessionStorage.removeItem("registeredEmail");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await onLogin({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      });
    } catch (error) {
      console.error("Login error:", error);

      if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = {};
        error.response.data.errors.forEach((err) => {
          validationErrors[err.field] = err.message;
        });
        setErrors(validationErrors);
      } else {
        setErrors({
          general:
            error.response?.data?.message || "Login failed. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setFormData({
      email: "demo@expensetracker.com",
      password: "Demo123!",
    });

    setIsLoading(true);

    try {
      const response = await axios.post("/api/auth/login", {
        email: "demo@expensetracker.com",
        password: "Demo123!",
      });

      if (response.data.success) {
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        onLogin(response.data.user, response.data.token);
      }
    } catch (error) {
      // If demo account doesn't exist, create it
      try {
        await axios.post("/api/auth/register", {
          name: "Demo User",
          email: "demo@expensetracker.com",
          password: "Demo123!",
          confirmPassword: "Demo123!",
          currency: "USD",
        });

        // Now login with the created account
        const loginResponse = await axios.post("/api/auth/login", {
          email: "demo@expensetracker.com",
          password: "Demo123!",
        });

        if (loginResponse.data.success) {
          localStorage.setItem("authToken", loginResponse.data.token);
          localStorage.setItem("user", JSON.stringify(loginResponse.data.user));
          onLogin(loginResponse.data.user, loginResponse.data.token);
        }
      } catch (createError) {
        setErrors({
          general: "Demo account setup failed. Please try manual registration.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light flex items-center justify-center p-md">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-lg">
          <div className="flex items-center justify-center gap-sm mb-md">
            <div className="logo-icon">
              <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="var(--primary)" />
                <path
                  d="M8 12h16v2H8v-2zm0 4h16v2H8v-2zm0 4h12v2H8v-2z"
                  fill="white"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">
                Expense Management System
              </h1>
            </div>
          </div>
          <p className="text-muted">Sign in to manage your expenses</p>
        </div>

        {/* Login Card */}
        <div className="card">
          <div className="card-body">
            {errors.general && (
              <div className="alert alert-error mb-md">{errors.general}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-md">
              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? "error" : ""}`}
                  placeholder="Enter your email"
                  disabled={isLoading}
                  autoComplete="email"
                />
                {errors.email && (
                  <div className="text-error text-sm mt-xs">{errors.email}</div>
                )}
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`form-input pr-10 ${
                      errors.password ? "error" : ""
                    }`}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && (
                  <div className="text-error text-sm mt-xs">
                    {errors.password}
                  </div>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="form-checkbox"
                  />
                  <span className="text-sm">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  disabled={isLoading}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>

              {/* Demo Login Button */}
              <button
                type="button"
                className="btn btn-outline w-full"
                onClick={handleDemoLogin}
                disabled={isLoading}
              >
                Try Demo Account
              </button>
            </form>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-lg space-y-sm">
          <p className="text-sm text-muted">
            Don't have an account?{" "}
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={onSwitchToRegister}
              disabled={isLoading}
            >
              Create Account
            </button>
          </p>
          <p className="text-sm text-muted">
            Want to start a new company?{" "}
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={onSwitchToCompanyRegister}
              disabled={isLoading}
            >
              Register Company
            </button>
          </p>
        </div>

        {/* Features Preview */}
        <div className="card mt-lg">
          <div className="card-body">
            <h4 className="font-semibold mb-sm">Why choose our platform?</h4>
            <ul className="text-sm text-muted space-y-xs">
              <li className="flex items-center gap-xs">
                <span className="w-1 h-1 bg-primary rounded-full"></span>
                Advanced Analytics & Reports
              </li>
              <li className="flex items-center gap-xs">
                <span className="w-1 h-1 bg-primary rounded-full"></span>
                Multi-level Approval Workflow
              </li>
              <li className="flex items-center gap-xs">
                <span className="w-1 h-1 bg-primary rounded-full"></span>
                Budget Tracking & Alerts
              </li>
              <li className="flex items-center gap-xs">
                <span className="w-1 h-1 bg-primary rounded-full"></span>
                Mobile-Responsive Design
              </li>
              <li className="flex items-center gap-xs">
                <span className="w-1 h-1 bg-primary rounded-full"></span>
                Secure & Reliable Platform
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
