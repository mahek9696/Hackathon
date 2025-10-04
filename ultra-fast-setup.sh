#!/bin/bash

echo "🚀 ULTRA-FAST 5-HOUR HACKATHON SETUP"
echo "Setting up minimal expense tracker..."

# Create basic structure
mkdir -p expense-tracker/{server,client}
cd expense-tracker

# Create server package.json
cat > server/package.json << 'EOF'
{
  "name": "expense-server",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

# Create minimal server
cat > server/server.js << 'EOF'
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Expense Schema
const expenseSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  date: { type: Date, default: Date.now },
  userId: { type: String, required: true }
});

const Expense = mongoose.model('Expense', expenseSchema);

// Hardcoded users for speed
const users = {
  'demo': { id: 'demo', name: 'Demo User', password: 'demo123' }
};

// Routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username].password === password) {
    res.json({ success: true, user: users[username] });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.query.userId }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ message: 'Server running!', time: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
EOF

# Create environment file
cat > server/.env << 'EOF'
# Replace with your MongoDB Atlas connection string
MONGODB_URI=mongodb://localhost:27017/expense-tracker

# For MongoDB Atlas (recommended):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-tracker

NODE_ENV=development
PORT=5000
EOF

# Create React app structure
mkdir -p client/src client/public

# Create client package.json
cat > client/package.json << 'EOF'
{
  "name": "expense-client",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "proxy": "http://localhost:5000",
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  }
}
EOF

# Create index.html
cat > client/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Expense Tracker</title>
    <style>
      body { margin: 0; font-family: Arial, sans-serif; background: #f5f5f5; }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
EOF

# Create index.js
cat > client/src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
EOF

# Create App.js
cat > client/src/App.js << 'EOF'
import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: 'Food'
  });
  const [loading, setLoading] = useState(false);

  const categories = ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Other'];

  const login = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'demo', password: 'demo123' })
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        loadExpenses(data.user.id);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
    setLoading(false);
  };

  const loadExpenses = async (userId) => {
    try {
      const response = await fetch(`/api/expenses?userId=${userId}`);
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const addExpense = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user.id })
      });
      if (response.ok) {
        setFormData({ amount: '', description: '', category: 'Food' });
        loadExpenses(user.id);
      }
    } catch (error) {
      console.error('Add error:', error);
    }
    setLoading(false);
  };

  const deleteExpense = async (id) => {
    try {
      await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      loadExpenses(user.id);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  if (!user) {
    return (
      <div className="container">
        <div className="login-card">
          <h1>💰 Expense Tracker</h1>
          <p>Track your expenses efficiently</p>
          <button onClick={login} className="btn primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login as Demo User'}
          </button>
          <p className="demo-info">Demo credentials: demo / demo123</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <h1>💰 Expense Tracker</h1>
        <div className="total">Total Spent: <span className="amount">${total.toFixed(2)}</span></div>
        <button onClick={() => setUser(null)} className="btn secondary">Logout</button>
      </header>

      <div className="add-expense">
        <h2>Add New Expense</h2>
        <form onSubmit={addExpense} className="expense-form">
          <input
            type="number"
            step="0.01"
            placeholder="Amount ($)"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? 'Adding...' : 'Add Expense'}
          </button>
        </form>
      </div>

      <div className="expenses-section">
        <h2>Recent Expenses ({expenses.length})</h2>
        <div className="expenses">
          {expenses.length === 0 ? (
            <p className="no-expenses">No expenses yet. Add your first expense above!</p>
          ) : (
            expenses.map(expense => (
              <div key={expense._id} className="expense-item">
                <div className="expense-info">
                  <span className="expense-amount">${expense.amount}</span>
                  <span className="expense-desc">{expense.description}</span>
                  <span className="expense-category">{expense.category}</span>
                  <span className="expense-date">{new Date(expense.date).toLocaleDateString()}</span>
                </div>
                <button onClick={() => deleteExpense(expense._id)} className="delete-btn">❌</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
EOF

# Create App.css
cat > client/src/App.css << 'EOF'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  margin-top: 100px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.login-card h1 {
  color: #333;
  margin-bottom: 10px;
  font-size: 2.5rem;
}

.demo-info {
  margin-top: 15px;
  color: #666;
  font-size: 0.9rem;
}

.header {
  background: white;
  padding: 20px;
  border-radius: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  flex-wrap: wrap;
  gap: 10px;
}

.header h1 {
  color: #333;
  font-size: 1.8rem;
}

.total {
  font-size: 1.2rem;
  color: #333;
  font-weight: bold;
}

.amount {
  color: #e74c3c;
  font-size: 1.3rem;
}

.add-expense {
  background: white;
  padding: 25px;
  border-radius: 15px;
  margin-bottom: 20px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.add-expense h2 {
  margin-bottom: 20px;
  color: #333;
}

.expense-form {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr auto;
  gap: 15px;
  align-items: end;
}

.expense-form input, .expense-form select {
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.expense-form input:focus, .expense-form select:focus {
  outline: none;
  border-color: #667eea;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.btn.secondary {
  background: #6c757d;
  color: white;
}

.btn.secondary:hover:not(:disabled) {
  background: #5a6268;
}

.expenses-section {
  background: white;
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.expenses-section h2 {
  margin-bottom: 20px;
  color: #333;
}

.expenses {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.expense-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 10px;
  background: #f8f9fa;
  transition: all 0.3s;
}

.expense-item:hover {
  background: #e9ecef;
  transform: translateX(5px);
}

.expense-info {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 15px;
  align-items: center;
  flex: 1;
}

.expense-amount {
  font-weight: bold;
  color: #e74c3c;
  font-size: 1.1rem;
}

.expense-desc {
  color: #333;
  font-weight: 500;
}

.expense-category {
  background: #667eea;
  color: white;
  padding: 4px 8px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
}

.expense-date {
  color: #666;
  font-size: 0.9rem;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  transition: transform 0.2s;
}

.delete-btn:hover {
  transform: scale(1.2);
}

.no-expenses {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 40px;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
  
  .header {
    flex-direction: column;
    text-align: center;
  }
  
  .expense-form {
    grid-template-columns: 1fr;
  }
  
  .expense-info {
    grid-template-columns: 1fr;
    text-align: left;
  }
  
  .expense-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .delete-btn {
    align-self: flex-end;
    margin-top: 10px;
  }
}

@media (max-width: 480px) {
  .login-card {
    margin-top: 50px;
    padding: 30px 20px;
  }
  
  .header h1 {
    font-size: 1.5rem;
  }
  
  .total {
    font-size: 1rem;
  }
}
EOF

# Create root package.json for convenience
cat > package.json << 'EOF'
{
  "name": "expense-tracker",
  "version": "1.0.0",
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "cd server && npm run dev",
    "client": "cd client && npm start",
    "install-server": "cd server && npm install",
    "install-client": "cd client && npm install",
    "install-all": "npm run install-server && npm run install-client"
  },
  "devDependencies": {
    "concurrently": "^7.6.0"
  }
}
EOF

echo ""
echo "✅ Ultra-fast setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. cd expense-tracker"
echo "2. npm install"
echo "3. npm run install-all"
echo "4. Edit server/.env with your MongoDB URI"
echo "5. npm run dev"
echo ""
echo "🚀 Your app will run on:"
echo "   Frontend: http://localhost:3000" 
echo "   Backend:  http://localhost:5000"
echo ""
echo "💡 Demo login: demo / demo123"
echo ""
echo "⚡ Total setup time: ~2 minutes"
echo "🎯 Coding time remaining: 5+ hours!"