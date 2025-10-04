import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import "./styles/global.css";
import Login from "./components/Login";
import Register from "./components/Register";
import CompanyRegistration from "./components/CompanyRegistration";
import Dashboard from "./pages/Dashboard";

function App() {
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isCompanyRegisterMode, setIsCompanyRegisterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on app start
  useEffect(() => {
    const checkExistingAuth = () => {
      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");
      const userData =
        localStorage.getItem("user") || sessionStorage.getItem("user");

      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setAuthToken(token);

          // Set default authorization header
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        } catch (error) {
          console.error("Error parsing stored user data:", error);
          // Clear invalid data
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          sessionStorage.removeItem("authToken");
          sessionStorage.removeItem("user");
        }
      }
      setIsLoading(false);
    };

    checkExistingAuth();
  }, []);

  // Fetch expenses
  const fetchExpenses = async () => {
    if (!user || !authToken) return;

    try {
      const response = await axios.get("/api/expenses", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.data.success) {
        setExpenses(response.data.expenses);
        setTotal(response.data.total);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);

      if (error.response?.status === 401) {
        // Token expired or invalid
        handleLogout();
      }
    }
  };

  // Add expense
  const addExpense = async (expenseData) => {
    try {
      const response = await axios.post("/api/expenses", expenseData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.data.success) {
        setExpenses((prev) => [response.data.expense, ...prev]);
        setTotal((prev) => prev + expenseData.amount);
      }
    } catch (error) {
      console.error("Error adding expense:", error);

      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  // Delete expense
  const deleteExpense = async (id, amount) => {
    try {
      const response = await axios.delete(`/api/expenses/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.data.success) {
        setExpenses((prev) => prev.filter((exp) => exp._id !== id));
        setTotal((prev) => prev - amount);
      }
    } catch (error) {
      console.error("Error deleting expense:", error);

      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  // Handle login
  const handleLogin = (userData, token) => {
    setUser(userData);
    setAuthToken(token);

    // Show success notification
    toast.success(`Welcome back, ${userData.name}!`);

    // Set default authorization header
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  // Handle registration
  const handleRegister = async (registrationData) => {
    try {
      const response = await axios.post("/api/auth/register", registrationData);

      if (response.data.success) {
        // Show success notification
        toast.success("Account created successfully! Please sign in.");

        // Switch to login mode instead of auto-login
        setIsRegisterMode(false);

        // Optional: Store the registration data temporarily for auto-fill
        sessionStorage.setItem("registeredEmail", registrationData.email);
      } else {
        throw new Error(response.data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      // Show error notification
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Registration failed. Please try again.");
      }
      throw error; // Re-throw to let Register component handle it
    }
  };

  // Handle login form submission
  const handleLoginSubmit = async (loginData) => {
    try {
      const response = await axios.post("/api/auth/login", loginData);

      if (response.data.success) {
        // Store token and user data
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        handleLogin(response.data.user, response.data.token);
      } else {
        throw new Error(response.data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      // Show error notification
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 401) {
        toast.error("Invalid email or password");
      } else {
        toast.error("Login failed. Please try again.");
      }
      throw error; // Re-throw to let Login component handle it
    }
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    setAuthToken(null);
    setExpenses([]);
    setTotal(0);

    // Clear stored data
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("registeredEmail");

    // Clear default authorization header
    delete axios.defaults.headers.common["Authorization"];

    // Show logout notification
    toast.success("Logged out successfully");
  };

  // Handle company registration
  const handleCompanyRegister = async (companyData) => {
    try {
      const response = await axios.post(
        "/api/auth/v2/register-company",
        companyData
      );

      if (response.data.success) {
        handleLogin(response.data.user, response.data.token);
        toast.success("Company registered successfully! Welcome!");
        setIsCompanyRegisterMode(false);
      }
    } catch (error) {
      console.error("Error registering company:", error);
      const errorMessage =
        error.response?.data?.message || "Registration failed";
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [user, authToken]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <h2>Expense Tracker</h2>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show dashboard if user is authenticated
  if (user && authToken) {
    return (
      <>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              style: {
                background: "#10b981",
              },
            },
            error: {
              duration: 5000,
              style: {
                background: "#ef4444",
              },
            },
          }}
        />
        <Dashboard
          user={user}
          expenses={expenses}
          total={total}
          onAddExpense={addExpense}
          onDeleteExpense={deleteExpense}
          onLogout={handleLogout}
        />
      </>
    );
  }

  // Show authentication forms
  return (
    <div className="app">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            style: {
              background: "#10b981",
            },
          },
          error: {
            duration: 5000,
            style: {
              background: "#ef4444",
            },
          },
        }}
      />

      {isCompanyRegisterMode ? (
        <CompanyRegistration
          onRegister={handleCompanyRegister}
          onSwitchToLogin={() => setIsCompanyRegisterMode(false)}
        />
      ) : isRegisterMode ? (
        <Register
          onRegister={handleRegister}
          onSwitchToLogin={() => setIsRegisterMode(false)}
          onSwitchToCompanyRegister={() => setIsCompanyRegisterMode(true)}
        />
      ) : (
        <Login
          onLogin={handleLoginSubmit}
          onSwitchToRegister={() => setIsRegisterMode(true)}
          onSwitchToCompanyRegister={() => setIsCompanyRegisterMode(true)}
        />
      )}
    </div>
  );
}

export default App;
