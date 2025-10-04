import React, { useState } from "react";
import toast from "react-hot-toast";

const CompanyRegistration = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    companyName: "",
    country: "",
    adminName: "",
    adminEmail: "",
    password: "",
    confirmPassword: "",
    currency: "USD",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);

  const countries = [
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "India",
    "Japan",
    "China",
    "Brazil",
  ];

  const currencies = [
    { code: "USD", name: "US Dollar ($)" },
    { code: "EUR", name: "Euro (€)" },
    { code: "GBP", name: "British Pound (£)" },
    { code: "INR", name: "Indian Rupee (₹)" },
    { code: "CAD", name: "Canadian Dollar (C$)" },
    { code: "AUD", name: "Australian Dollar (A$)" },
    { code: "JPY", name: "Japanese Yen (¥)" },
    { code: "CNY", name: "Chinese Yuan (¥)" },
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

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    } else if (formData.companyName.trim().length < 2) {
      newErrors.companyName = "Company name must be at least 2 characters";
    }

    if (!formData.country) {
      newErrors.country = "Please select a country";
    }

    if (!formData.currency) {
      newErrors.currency = "Please select a currency";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.adminName.trim()) {
      newErrors.adminName = "Admin name is required";
    } else if (formData.adminName.trim().length < 2) {
      newErrors.adminName = "Name must be at least 2 characters";
    }

    if (!formData.adminEmail) {
      newErrors.adminEmail = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) {
      newErrors.adminEmail = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep2()) {
      return;
    }

    setIsLoading(true);

    try {
      const companyData = {
        companyName: formData.companyName.trim(),
        country: formData.country,
        adminName: formData.adminName.trim(),
        adminEmail: formData.adminEmail.toLowerCase().trim(),
        password: formData.password,
        currency: formData.currency,
      };

      await onRegister(companyData);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card company-registration">
        <div className="auth-header">
          <h1>🏢 Create Your Company</h1>
          <p>Set up your expense management system</p>
          <div className="step-indicator">
            <div className={`step ${currentStep >= 1 ? "active" : ""}`}>1</div>
            <div className="step-line"></div>
            <div className={`step ${currentStep >= 2 ? "active" : ""}`}>2</div>
          </div>
        </div>

        {errors.general && (
          <div className="alert alert-error">{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Step 1: Company Information */}
          {currentStep === 1 && (
            <div className="step-content">
              <h3>Company Information</h3>

              <div className="form-group">
                <label htmlFor="companyName">Company Name *</label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className={errors.companyName ? "error" : ""}
                  placeholder="Enter your company name"
                  disabled={isLoading}
                />
                {errors.companyName && (
                  <div className="error-message">{errors.companyName}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="country">Country *</label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={errors.country ? "error" : ""}
                  disabled={isLoading}
                >
                  <option value="">Select your country</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <div className="error-message">{errors.country}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="currency">Default Currency *</label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className={errors.currency ? "error" : ""}
                  disabled={isLoading}
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.name}
                    </option>
                  ))}
                </select>
                {errors.currency && (
                  <div className="error-message">{errors.currency}</div>
                )}
              </div>

              <button
                type="button"
                className="auth-button"
                onClick={handleNext}
                disabled={isLoading}
              >
                Next: Admin Account →
              </button>
            </div>
          )}

          {/* Step 2: Admin Account */}
          {currentStep === 2 && (
            <div className="step-content">
              <h3>Admin Account</h3>

              <div className="form-group">
                <label htmlFor="adminName">Admin Name *</label>
                <input
                  type="text"
                  id="adminName"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleChange}
                  className={errors.adminName ? "error" : ""}
                  placeholder="Enter admin name"
                  disabled={isLoading}
                />
                {errors.adminName && (
                  <div className="error-message">{errors.adminName}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="adminEmail">Admin Email *</label>
                <input
                  type="email"
                  id="adminEmail"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  className={errors.adminEmail ? "error" : ""}
                  placeholder="Enter admin email"
                  disabled={isLoading}
                />
                {errors.adminEmail && (
                  <div className="error-message">{errors.adminEmail}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? "error" : ""}
                  placeholder="Create a strong password"
                  disabled={isLoading}
                />
                {errors.password && (
                  <div className="error-message">{errors.password}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
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

              <div className="form-actions">
                <button
                  type="button"
                  className="auth-button secondary"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="auth-button"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="loading-spinner">Creating Company...</span>
                  ) : (
                    "Create Company & Admin Account"
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Switch to Login */}
        <div className="auth-footer">
          <p>
            Already have a company account?{" "}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToLogin}
              disabled={isLoading}
            >
              Sign In
            </button>
          </p>
        </div>

        {/* Features Preview */}
        <div className="features-preview">
          <h4>✨ Enterprise Features:</h4>
          <ul>
            <li>🏢 Multi-level Approval Workflows</li>
            <li>👥 Employee & Manager Management</li>
            <li>💱 Multi-currency Support</li>
            <li>📊 Advanced Analytics & Reports</li>
            <li>🔒 Role-based Access Control</li>
            <li>⚡ Conditional Approval Rules</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CompanyRegistration;
