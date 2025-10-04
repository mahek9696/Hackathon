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
          <p className="text-muted">Create your account to get started</p>
        </div>

        {/* Register Card */}
        <div className="card">
          <div className="card-body">
            {errors.general && (
              <div className="alert alert-error mb-md">{errors.general}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-md">
              {/* Name Field */}
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`form-input ${errors.name ? "error" : ""}`}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
                {errors.name && (
                  <div className="text-error text-sm mt-xs">{errors.name}</div>
                )}
              </div>

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
                  placeholder="Enter your email address"
                  disabled={isLoading}
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
                    placeholder="Create a strong password"
                    disabled={isLoading}
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

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-xs">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="h-1 rounded-full transition-all duration-300"
                        style={{
                          width: `${(getPasswordStrength() / 5) * 100}%`,
                          backgroundColor: passwordStrength.color,
                        }}
                      ></div>
                    </div>
                    <span
                      className="text-sm mt-xs"
                      style={{ color: passwordStrength.color }}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                )}

                {errors.password && (
                  <div className="text-error text-sm mt-xs">
                    {errors.password}
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-input ${
                    errors.confirmPassword ? "error" : ""
                  }`}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <div className="text-error text-sm mt-xs">
                    {errors.confirmPassword}
                  </div>
                )}
              </div>

              {/* Currency Field */}
              <div className="form-group">
                <label htmlFor="currency" className="form-label">
                  Preferred Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="form-select"
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
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-lg space-y-sm">
          <p className="text-sm text-muted">
            Already have an account?{" "}
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={onSwitchToLogin}
              disabled={isLoading}
            >
              Sign In
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

        {/* Demo Account Info */}
        <div className="card mt-lg">
          <div className="card-body">
            <h4 className="font-semibold mb-sm">Try Demo Account</h4>
            <p className="text-sm text-muted mb-sm">
              Want to try without registering? Use the demo account:
            </p>
            <div className="bg-light p-sm rounded text-sm">
              <div>
                <strong>Email:</strong> demo@expensetracker.com
              </div>
              <div>
                <strong>Password:</strong> Demo123!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
