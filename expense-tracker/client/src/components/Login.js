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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>💰 Expense Tracker</h1>
          <p>Welcome back! Please sign in to your account.</p>
        </div>

        {errors.general && (
          <div className="alert alert-error">{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "error" : ""}
              placeholder="Enter your email"
              disabled={isLoading}
              autoComplete="email"
            />
            {errors.email && (
              <div className="error-message">{errors.email}</div>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? "error" : ""}
                placeholder="Enter your password"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              Remember me
            </label>
            <button type="button" className="link-button" disabled={isLoading}>
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? (
              <span className="loading-spinner">Signing In...</span>
            ) : (
              "Sign In"
            )}
          </button>

          {/* Demo Login Button */}
          <button
            type="button"
            className="demo-button"
            onClick={handleDemoLogin}
            disabled={isLoading}
          >
            🚀 Try Demo Account
          </button>
        </form>

        {/* Switch to Register */}
        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToRegister}
              disabled={isLoading}
            >
              Create Account
            </button>
          </p>
          <p>
            Want to start a new company?{" "}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToCompanyRegister}
              disabled={isLoading}
            >
              Register Company
            </button>
          </p>
        </div>

        {/* Features Preview */}
        <div className="features-preview">
          <h4>✨ Features you'll get:</h4>
          <ul>
            <li>📊 Advanced Analytics & Charts</li>
            <li>🤖 AI-Powered Smart Insights</li>
            <li>💡 Financial Intelligence & Tips</li>
            <li>💰 Budget Tracking & Alerts</li>
            <li>📱 Mobile-Responsive Design</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
