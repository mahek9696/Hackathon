import React from "react";

const Header = ({ user, onLogout }) => {
  return (
    <header className="app-header">
      <div className="container">
        <nav className="flex items-center justify-between py-md">
          <div className="flex items-center gap-md">
            <div className="flex items-center gap-sm">
              <div className="logo-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="8" fill="var(--primary)" />
                  <path
                    d="M8 12h16v2H8v-2zm0 4h16v2H8v-2zm0 4h12v2H8v-2z"
                    fill="white"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">
                  Expense Management System
                </h1>
                <p className="text-sm text-muted">Track & Manage Expenses</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-md">
            {user && (
              <>
                <div className="user-info text-right">
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-sm text-muted capitalize">{user.role}</p>
                </div>
                <div className="user-avatar">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <button onClick={onLogout} className="btn btn-ghost btn-sm">
                  Logout
                </button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
