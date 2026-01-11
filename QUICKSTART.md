# 🚀 Gym Management System - Quick Start Guide

## Get Started in 5 Minutes

### Prerequisites
- Node.js v14+ ([Download](https://nodejs.org/))
- npm (comes with Node.js)
- Git (for version control)

---

## ⚡ Quick Setup

### 1️⃣ Install Dependencies (1 minute)
```bash
cd d:\gym
npm install
```

### 2️⃣ Initialize Database (30 seconds)
```bash
npm run db:init
```

### 3️⃣ Start Development Server (30 seconds)
```bash
npm run dev
```

### 4️⃣ Open in Browser (30 seconds)
```
http://localhost:5000
```

### 5️⃣ Register or Login
- Register as new user
- Or test the system

---

## 🎯 What You Can Do

### As a Regular User
- ✅ Register and create account
- ✅ View personal profile
- ✅ Download bill receipts
- ✅ See notifications
- ✅ Change password

### As an Admin
- ✅ Manage all members
- ✅ Track payments
- ✅ Generate bills
- ✅ View reports
- ✅ See system analytics

---

## 📁 Project Structure

```
gym/
├── backend/         ← REST API
├── frontend/        ← Web Interface
├── database/        ← SQLite Database
├── config/          ← Configuration
├── tests/           ← Test Suite
└── docs/            ← Documentation
```

---

## 📚 Documentation

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **README.md** | Complete documentation | 15 min |
| **docs/EXECUTION.md** | How to run the app | 10 min |
| **docs/ARCHITECTURE.md** | System design | 15 min |
| **docs/FEATURES.md** | Features list | 5 min |

---

## 🔑 Key Commands

```bash
# Development
npm run dev              # Start with auto-reload

# Production
npm start                # Start server

# Testing
npm test                 # Run all tests
npm run test:watch      # Watch mode

# Database
npm run db:init         # Initialize database

# Code Quality
npm run lint            # Check code
npm run format          # Format code
```

---

## 🌐 API Endpoints

### Authentication
```bash
POST   /api/auth/register          # Register user
POST   /api/auth/login             # Login user
GET    /api/auth/profile           # Get profile
PUT    /api/auth/profile           # Update profile
POST   /api/auth/change-password   # Change password
```

### Members (Admin Only)
```bash
GET    /api/members                # List all
POST   /api/members                # Add new
GET    /api/members/:id            # Get one
PUT    /api/members/:id            # Update
DELETE /api/members/:id            # Delete
```

### Bills
```bash
GET    /api/bills                  # List all
POST   /api/bills                  # Create bill
GET    /api/bills/:id              # Get one
PATCH  /api/bills/:id/status       # Update status
```

### Payments
```bash
GET    /api/payments               # List all
POST   /api/payments               # Create payment
GET    /api/payments/:id           # Get one
```

---

## 🧪 Test the API with curl

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Test123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123"}'

# Get Members (with token)
curl -X GET http://localhost:5000/api/members \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔍 Check Application Status

```bash
# Health Check
curl http://localhost:5000/api/health

# Should return:
# {"status":"OK","message":"Gym Management API is running"}
```

---

## 📊 View Logs

```bash
# Windows
type logs\combined.log

# macOS/Linux
tail -f logs/combined.log
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### Database Error
```bash
# Delete and reinitialize database
del database\gym_management.db
npm run db:init
```

### Cannot Install Dependencies
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## 💡 Tips & Tricks

### Development Tips
- Use `npm run dev` for auto-reload while developing
- Check logs in `logs/combined.log` for debugging
- Use browser DevTools (F12) for frontend debugging

### Testing Tips
- Run `npm test` to verify everything works
- Run `npm run test:watch` for continuous testing
- Check code coverage with `npm test -- --coverage`

### Deployment Tips
- Set `NODE_ENV=production` before deploying
- Update `JWT_SECRET` in `.env` for production
- Use a proper database (PostgreSQL) for production
- Enable HTTPS in production

---

## 📦 What's Included

### Features
- ✅ User authentication with JWT
- ✅ Member management
- ✅ Payment tracking
- ✅ Bill generation
- ✅ Admin dashboard
- ✅ Activity logging
- ✅ Responsive design
- ✅ Comprehensive tests

### Documentation
- ✅ API documentation
- ✅ Architecture guide
- ✅ Execution guide
- ✅ Feature list
- ✅ Code comments

### Testing
- ✅ Jest configuration
- ✅ Unit tests
- ✅ Integration tests
- ✅ Database tests

---

## 🎓 Next Steps

1. **Explore the Code**
   - Check `backend/server.js` for main server
   - Check `frontend/pages/dashboard.html` for UI
   - Check `database/init.js` for schema

2. **Run Tests**
   ```bash
   npm test
   ```

3. **Read Documentation**
   - Start with README.md
   - Then read EXECUTION.md
   - Then explore ARCHITECTURE.md

4. **Customize**
   - Update styles in `frontend/css/`
   - Add new features in controllers
   - Extend API with new endpoints

5. **Deploy**
   - Follow deployment guide in README.md
   - Use environment variables
   - Enable HTTPS
   - Set up backups

---

## 📞 Need Help?

### Resources
- 📖 README.md - Full documentation
- 🏗️ docs/ARCHITECTURE.md - System design
- 🚀 docs/EXECUTION.md - How to run
- 📋 docs/FEATURES.md - Features list

### Debugging
- Check `logs/error.log` for errors
- Use browser DevTools for frontend
- Run tests with `npm test`
- Check .env configuration

---

## ✨ You're All Set!

Your Gym Management System is ready to use. Start with:

```bash
npm run dev
```

Then open **http://localhost:5000** in your browser.

Happy coding! 🎉

---

**Questions?** Check the documentation in the `docs/` folder.

**Want to contribute?** See CONTRIBUTING.md for guidelines.

**Ready to deploy?** Follow deployment guide in README.md.
