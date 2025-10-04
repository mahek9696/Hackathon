#!/bin/bash

# Expense Management System - MERN Stack Setup Script
echo "🚀 Setting up Expense Management System..."

# Create main project structure
mkdir -p client/public
mkdir -p client/src/{components/{common,auth,expense,budget,analytics,category},pages,hooks,context,utils,styles/{components,pages}}

mkdir -p server/{config,controllers,middleware,models,routes,utils}

# Create package.json files
echo "📦 Creating package.json files..."

# Root package.json
cat > package.json << 'EOF'
{
  "name": "expense-management-app",
  "version": "1.0.0",
  "description": "MERN Stack Expense Management System",
  "main": "server/server.js",
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "cd server && npm run dev",
    "client": "cd client && npm start",
    "build": "cd client && npm run build",
    "install-server": "cd server && npm install",
    "install-client": "cd client && npm install",
    "install-all": "npm run install-server && npm run install-client",
    "heroku-postbuild": "npm run install-all && npm run build"
  },
  "keywords": ["expense", "management", "mern", "react", "nodejs"],
  "author": "Your Name",
  "license": "MIT",
  "devDependencies": {
    "concurrently": "^7.6.0"
  }
}
EOF

# Server package.json
cat > server/package.json << 'EOF'
{
  "name": "expense-management-server",
  "version": "1.0.0",
  "description": "Backend for Expense Management System",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "multer": "^1.4.5-lts.1",
    "cloudinary": "^1.40.0",
    "nodemailer": "^6.9.4",
    "express-validator": "^7.0.1",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "express-rate-limit": "^6.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.4",
    "supertest": "^6.3.3"
  }
}
EOF

# Client package.json
cat > client/package.json << 'EOF'
{
  "name": "expense-management-client",
  "version": "1.0.0",
  "description": "Frontend for Expense Management System",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.15.0",
    "axios": "^1.5.0",
    "react-hook-form": "^7.45.4",
    "react-query": "^3.39.3",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "date-fns": "^2.30.0",
    "react-hot-toast": "^2.4.1",
    "@mui/material": "^5.14.5",
    "@mui/icons-material": "^5.14.3",
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0",
    "framer-motion": "^10.16.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "devDependencies": {
    "react-scripts": "5.0.1",
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.17.0",
    "@testing-library/user-event": "^13.5.0"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "proxy": "http://localhost:5000"
}
EOF

# Create basic server files
echo "🛠️ Creating server files..."

# Server main file
cat > server/server.js << 'EOF'
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-management')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOF

# Create environment file template
cat > server/.env.example << 'EOF'
# Database
MONGODB_URI=mongodb://localhost:27017/expense-management

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRE=7d

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Environment
NODE_ENV=development
EOF

# Create basic React files
echo "⚛️ Creating React files..."

# React index.html
cat > client/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Expense Management System - Track and manage your expenses efficiently" />
    <title>Expense Manager</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF

# React index.js
cat > client/src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import App from './App';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
EOF

# React App.js
cat > client/src/App.jsx << 'EOF'
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Budgets from './pages/Budgets';
import Analytics from './pages/Analytics';
import Categories from './pages/Categories';
import Profile from './pages/Profile';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Toaster position="top-right" />
        <Header />
        <div className="app-body">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Dashboard />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
*/node_modules/

# Production build
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# MacOS
.DS_Store

# Windows
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Uploads
uploads/
temp/
EOF

echo "✅ Project structure created successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Run 'npm run install-all' to install all dependencies"
echo "2. Copy server/.env.example to server/.env and configure your environment variables"
echo "3. Start development: 'npm run dev'"
echo ""
echo "🚀 Happy coding!"