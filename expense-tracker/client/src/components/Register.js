import React, { useState } from "react";

const Register = ({
  onRegister,
  onSwitchToLogin,
  onSwitchToCompanyRegister,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    currency: "USD",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const currencies = [
    { code: "USD", name: "US Dollar ($)" },
    { code: "EUR", name: "Euro (€)" },
    { code: "GBP", name: "British Pound (£)" },
    { code: "INR", name: "Indian Rupee (₹)" },
    { code: "CAD", name: "Canadian Dollar (C$)" },
    { code: "AUD", name: "Australian Dollar (A$)" },
  ];

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

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
      newErrors.name = "Name can only contain letters and spaces";
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
      await onRegister({
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        currency: formData.currency,
      });
    } catch (error) {
      console.error("Registration error:", error);

      // Handle specific error responses
      if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = {};
        error.response.data.errors.forEach((err) => {
          validationErrors[err.field] = err.message;
        });
        setErrors(validationErrors);
      } else if (error.response?.data?.message) {
        // Handle general error messages
        setErrors({
          general: error.response.data.message,
        });
      } else {
        setErrors({
          general: "Registration failed. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    let strength = 0;

    if (password.length >= 6) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    return strength;
  };

  const getPasswordStrengthLabel = () => {
    const strength = getPasswordStrength();
    if (strength < 2) return { label: "Weak", color: "#dc3545" };
    if (strength < 4) return { label: "Medium", color: "#ffc107" };
    return { label: "Strong", color: "#28a745" };
  };

  const passwordStrength = getPasswordStrengthLabel();

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join us to start tracking your expenses</p>
        </div>

        {errors.general && (
          <div className="alert alert-error">{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? "error" : ""}
              placeholder="Enter your full name"
              disabled={isLoading}
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>

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
              placeholder="Enter your email address"
              disabled={isLoading}
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
                placeholder="Create a strong password"
                disabled={isLoading}
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
            {formData.password && (
              <div className="password-strength">
                <div
                  className="strength-indicator"
                  style={{
                    width: `${(getPasswordStrength() / 5) * 100}%`,
                    backgroundColor: passwordStrength.color,
                  }}
                ></div>
                <span style={{ color: passwordStrength.color }}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
            {errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? "error" : ""}
              placeholder="Confirm your password"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <div className="error-message">{errors.confirmPassword}</div>
            )}
          </div>

          {/* Currency Field */}
          <div className="form-group">
            <label htmlFor="currency">Preferred Currency</label>
            <select
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              disabled={isLoading}
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? (
              <span className="loading-spinner">Creating Account...</span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Switch to Login */}
        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToLogin}
              disabled={isLoading}
            >
              Sign In
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

        {/* Demo Account Info */}
        <div className="demo-info">
          <h4>🚀 Quick Demo</h4>
          <p>Want to try without registering? Use the demo account:</p>
          <div className="demo-credentials">
            <strong>Email:</strong> demo@expensetracker.com
            <br />
            <strong>Password:</strong> Demo123!
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
