# ⚡ 2-Minute MongoDB Atlas Setup

## 🚀 Quick Setup (2 minutes total!)

### Step 1: Create Account (30 seconds)

1. Go to https://www.mongodb.com/atlas
2. Click "Try Free"
3. Sign up with Google/GitHub (fastest)

### Step 2: Create Cluster (30 seconds)

1. Choose "M0 Sandbox" (FREE tier)
2. Select any region close to you
3. Click "Create Cluster"

### Step 3: Create User & Get Connection String (60 seconds)

1. Go to "Database Access" → "Add New Database User"
2. Username: `hackathon`
3. Password: `password123` (or autogenerate)
4. Click "Add User"

5. Go to "Network Access" → "Add IP Address"
6. Click "Allow Access from Anywhere" (for hackathon speed)
7. Click "Confirm"

8. Go back to "Clusters" → Click "Connect"
9. Choose "Connect your application"
10. Copy the connection string

### Step 4: Update Your .env File

```bash
# Replace in server/.env:
MONGODB_URI=mongodb+srv://hackathon:password123@cluster0.xxxxx.mongodb.net/expense-tracker
```

**That's it! Ready to code! 🚀**

---

## 🔥 Alternative: localStorage Backup Plan (No DB needed!)

If MongoDB setup takes too long, I can quickly modify the app to use localStorage instead!
