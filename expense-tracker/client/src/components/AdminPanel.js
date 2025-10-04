import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AdminPanel = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers();
      fetchStats();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/admin/users");
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error("Error fetching users:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get("/api/admin/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch statistics");
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await axios.put(`/api/admin/users/${userId}/role`, {
        role: newRole,
      });

      if (response.data.success) {
        toast.success(`User role updated to ${newRole}`);
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      toast.error("Failed to update user role");
      console.error("Error updating role:", error);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await axios.put(`/api/admin/users/${userId}/status`, {
        isActive: !currentStatus,
      });

      if (response.data.success) {
        toast.success(`User ${!currentStatus ? "activated" : "deactivated"}`);
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      toast.error("Failed to update user status");
      console.error("Error updating status:", error);
    }
  };

  const deleteUser = async (userId) => {
    if (
      !window.confirm(
        "Are you sure? This will delete the user and all their data."
      )
    ) {
      return;
    }

    try {
      const response = await axios.delete(`/api/admin/users/${userId}`);

      if (response.data.success) {
        toast.success("User deleted successfully");
        fetchUsers(); // Refresh the list
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      toast.error("Failed to delete user");
      console.error("Error deleting user:", error);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="admin-access-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to access the admin panel.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <h2>Loading Admin Panel...</h2>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <p>Manage users and system settings</p>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="admin-overview">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Users</h3>
              <div className="stat-number">{stats.totalUsers || 0}</div>
            </div>
            <div className="stat-card">
              <h3>Active Users</h3>
              <div className="stat-number">{stats.activeUsers || 0}</div>
            </div>
            <div className="stat-card">
              <h3>Total Expenses</h3>
              <div className="stat-number">{stats.totalExpenses || 0}</div>
            </div>
          </div>

          {/* Users by Role */}
          <div className="role-breakdown">
            <h3>Users by Role</h3>
            <div className="role-stats">
              {stats.usersByRole?.map((role) => (
                <div key={role._id} className="role-stat">
                  <span className="role-name">{role._id || "undefined"}</span>
                  <span className="role-count">{role.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Users */}
          <div className="recent-users">
            <h3>Recent Users</h3>
            <div className="user-list">
              {stats.recentUsers?.map((user) => (
                <div key={user._id} className="user-item">
                  <div className="user-info">
                    <span className="user-name">{user.name}</span>
                    <span className="user-email">{user.email}</span>
                  </div>
                  <span className={`user-role role-${user.role}`}>
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="admin-users">
          <div className="users-header">
            <h2>User Management</h2>
            <p>Total: {users.length} users</p>
          </div>

          <div className="users-table">
            {users.map((user) => (
              <div key={user._id} className="user-row">
                <div className="user-details">
                  <div className="user-main">
                    <span className="user-name">{user.name}</span>
                    <span className="user-email">{user.email}</span>
                  </div>
                  <div className="user-meta">
                    <span className="user-joined">
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                    <span
                      className={`user-status ${
                        user.isActive ? "active" : "inactive"
                      }`}
                    >
                      {user.isActive ? "🟢 Active" : "🔴 Inactive"}
                    </span>
                  </div>
                </div>

                <div className="user-controls">
                  <div className="role-selector">
                    <label>Role:</label>
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user._id, e.target.value)}
                      disabled={user._id === user._id} // Can't change own role
                    >
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="user-actions">
                    <button
                      className={`btn btn-toggle ${
                        user.isActive ? "btn-warning" : "btn-success"
                      }`}
                      onClick={() => toggleUserStatus(user._id, user.isActive)}
                    >
                      {user.isActive ? "⏸️ Deactivate" : "▶️ Activate"}
                    </button>

                    <button
                      className="btn btn-danger"
                      onClick={() => deleteUser(user._id)}
                      disabled={user._id === user._id} // Can't delete own account
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
