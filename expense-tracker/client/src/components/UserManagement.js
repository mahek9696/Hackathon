import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const UserManagement = ({ user }) => {
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    department: "",
    manager: "",
    approvalLimit: 0,
  });

  useEffect(() => {
    if (user?.role === "admin") {
      fetchCompanyUsers();
    }
  }, [user]);

  const fetchCompanyUsers = async () => {
    try {
      const response = await axios.get("/api/auth/v2/company-users");
      if (response.data.success) {
        setManagers(response.data.data.managers);
        setEmployees(response.data.data.employees);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch company users");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: formData.role,
        department: formData.department.trim(),
      };

      // Add manager if role is employee
      if (formData.role === "employee" && formData.manager) {
        payload.managerId = formData.manager;
      }

      // Add approval limit if role is manager
      if (formData.role === "manager" && formData.approvalLimit) {
        payload.approvalLimit = parseFloat(formData.approvalLimit);
      }

      const response = await axios.post(
        "/api/auth/v2/register-employee",
        payload
      );

      if (response.data.success) {
        toast.success(`${formData.role} created successfully!`);
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "employee",
          department: "",
          manager: "",
          approvalLimit: 0,
        });
        setShowCreateForm(false);
        fetchCompanyUsers(); // Refresh the list
      }
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create user";
      toast.error(errorMessage);
    }
  };

  const departments = [
    "Engineering",
    "Marketing",
    "Sales",
    "HR",
    "Finance",
    "Operations",
    "Administration",
  ];

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="loading">Loading user management...</div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>👥 User Management</h2>
        <p>Manage employees and managers for {user?.company?.name}</p>
      </div>

      <div className="admin-actions">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
        >
          {showCreateForm ? "Cancel" : "➕ Add Employee/Manager"}
        </button>
      </div>

      {showCreateForm && (
        <div className="create-user-form">
          <h3>Create New User</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter full name"
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter password"
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label>Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {formData.role === "employee" && (
                <div className="form-group">
                  <label>Manager</label>
                  <select
                    name="manager"
                    value={formData.manager}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Manager (Optional)</option>
                    {managers.map((manager) => (
                      <option key={manager._id} value={manager._id}>
                        {manager.name} - {manager.department}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.role === "manager" && (
                <div className="form-group">
                  <label>Approval Limit ($)</label>
                  <input
                    type="number"
                    name="approvalLimit"
                    value={formData.approvalLimit}
                    onChange={handleInputChange}
                    placeholder="e.g., 5000"
                    min="0"
                    step="100"
                  />
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Create {formData.role}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="users-section">
        <div className="users-grid">
          <div className="user-category">
            <h3>👨‍💼 Managers ({managers.length})</h3>
            <div className="user-list">
              {managers.length === 0 ? (
                <p className="empty-state">No managers created yet</p>
              ) : (
                managers.map((manager) => (
                  <div key={manager._id} className="user-card">
                    <div className="user-info">
                      <h4>{manager.name}</h4>
                      <p>{manager.email}</p>
                      <span className="department">{manager.department}</span>
                      <span className="approval-limit">
                        Approval Limit: $
                        {manager.approvalLimit?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="user-category">
            <h3>👥 Employees ({employees.length})</h3>
            <div className="user-list">
              {employees.length === 0 ? (
                <p className="empty-state">No employees created yet</p>
              ) : (
                employees.map((employee) => (
                  <div key={employee._id} className="user-card">
                    <div className="user-info">
                      <h4>{employee.name}</h4>
                      <p>{employee.email}</p>
                      <span className="department">{employee.department}</span>
                      {employee.manager && (
                        <span className="manager">
                          Manager: {employee.manager.name}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-panel {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .admin-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .admin-header h2 {
          color: #2563eb;
          margin-bottom: 10px;
        }

        .admin-actions {
          text-align: center;
          margin-bottom: 30px;
        }

        .create-user-form {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border: 1px solid #e2e8f0;
        }

        .create-user-form h3 {
          margin-bottom: 20px;
          color: #1e293b;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 8px;
          font-weight: 500;
          color: #374151;
        }

        .form-group input,
        .form-group select {
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #2563eb;
          color: white;
        }

        .btn-primary:hover {
          background: #1d4ed8;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        .users-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        .user-category h3 {
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
        }

        .user-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .user-card {
          background: white;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .user-info h4 {
          margin: 0 0 5px 0;
          color: #1e293b;
        }

        .user-info p {
          margin: 0 0 10px 0;
          color: #6b7280;
          font-size: 14px;
        }

        .department,
        .approval-limit,
        .manager {
          display: inline-block;
          background: #eff6ff;
          color: #1d4ed8;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          margin-right: 8px;
          margin-bottom: 4px;
        }

        .empty-state {
          text-align: center;
          color: #6b7280;
          font-style: italic;
          padding: 20px;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .form-row,
          .users-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default UserManagement;
