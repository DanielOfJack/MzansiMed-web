# MzansiMed Setup Guide

## ✅ **Completed Steps**
- ✅ PostgreSQL 15 installed via Homebrew
- ✅ PostgreSQL service started
- ✅ Database `mzansimed_db` created
- ✅ User `admin` created with password `MM_admin`
- ✅ Backend dependencies installed

## 🔧 **Next Steps**

### **1. Configure Backend Environment**

Edit the backend `.env` file:
```bash
cd backend
nano .env
```

Update with these values:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mzansimed_db
DB_USER=admin
DB_PASSWORD=MM_admin

# Server Configuration
PORT=3001
NODE_ENV=development

# Security
JWT_SECRET=mzansimed_secret_key_2024
```

### **2. Initialize Database Schema**

Run the database setup script:
```bash
cd backend
npm run db:setup
```

### **3. Start Backend Server**

```bash
cd backend
npm run dev
```

You should see:
```
🚀 MzansiMed API server running on port 3001
🏥 Health check available at http://localhost:3001/api/health
👥 Patients API available at http://localhost:3001/api/patients
```

### **4. Configure Frontend Environment**

Create frontend environment file:
```bash
cd ..  # back to main directory
cp env.example .env
```

The `.env` file should contain:
```env
REACT_APP_API_URL=http://localhost:3001/api
```

### **5. Start Frontend**

```bash
npm start
```

## 🧪 **Test the Setup**

1. **Backend Health Check**: Visit http://localhost:3001/api/health
2. **API Test**: Visit http://localhost:3001/api/patients
3. **Frontend**: Visit http://localhost:3000

## 📝 **Quick Commands Summary**

```bash
# Start PostgreSQL (if stopped)
brew services start postgresql@15

# Start backend
cd backend && npm run dev

# Start frontend (in new terminal)
npm start

# Check database
psql -d mzansimed_db -U admin
```

## 🔍 **Troubleshooting**

### Database Connection Issues
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Restart PostgreSQL if needed
brew services restart postgresql@15

# Test database connection
psql -d mzansimed_db -U admin -h localhost
```

### Port Issues
- Backend runs on port 3001
- Frontend runs on port 3000
- Make sure these ports are available

### Environment Variables
- Backend: Check `backend/.env` file exists and has correct database credentials
- Frontend: Check `.env` file has `REACT_APP_API_URL=http://localhost:3001/api`
