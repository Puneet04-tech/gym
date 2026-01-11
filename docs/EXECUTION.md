# Gym Management System - Execution Guide

## Quick Start

### Prerequisites
- Node.js v14+ installed
- npm v6+ installed
- A terminal/command prompt

### Step 1: Navigate to Project Directory
```bash
cd d:\gym
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install all required packages listed in `package.json`:
- Express.js (web framework)
- SQLite3 (database)
- bcryptjs (password hashing)
- jsonwebtoken (JWT)
- winston (logging)
- And more...

### Step 3: Setup Environment
```bash
# Copy example environment file
copy .env.example .env

# Edit .env file with your settings (optional)
# Default settings will work for local development
```

### Step 4: Initialize Database
```bash
npm run db:init
```

Output:
```
✅ Database initialized successfully!
📁 Database file created at: d:\gym\database\gym_management.db

Tables created:
  - users
  - members
  - fee_packages
  - member_subscriptions
  - payments
  - bills
  - notifications
  - gym_status
  - activity_logs
```

### Step 5: Start the Server

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

You should see:
```
╔════════════════════════════════════════╗
║  Gym Management System API             ║
║  Server running successfully!          ║
╠════════════════════════════════════════╣
║  Host: http://localhost:5000
║  Environment: development
║  Database: ./database/gym_management.db
╚════════════════════════════════════════╝
```

### Step 6: Access the Application
- Open your browser and navigate to: `http://localhost:5000`
- You will be redirected to the login page

## Using the Application

### Login

First Time:
- Register as a new user
- Or use existing test credentials (after manual admin creation)

### User Roles and Features

#### Admin Role
1. Navigate to Members tab to:
   - View all gym members
   - Add new members
   - Update member details
   - Delete members
   - Search for members

2. Navigate to Payments tab to:
   - View all payments
   - See payment details
   - Track payment status

3. Navigate to Reports tab to:
   - Generate payment reports
   - Export data
   - Create bills

#### Member/User Role
1. Navigate to Profile to:
   - View personal information
   - Update profile details
   - Change password

2. Navigate to Bills to:
   - View payment receipts
   - Download bills

3. Navigate to Notifications to:
   - View system notifications
   - Check payment reminders

## API Usage

### Testing API Endpoints

#### Using curl

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"admin@example.com\", \"password\": \"Admin123\"}"
```

**Get Profile:**
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Using Postman

1. Open Postman
2. Create a new request
3. Set method to POST
4. URL: `http://localhost:5000/api/auth/login`
5. Headers: `Content-Type: application/json`
6. Body (raw JSON):
```json
{
    "email": "admin@example.com",
    "password": "Admin123"
}
```
7. Send request
8. Copy the token from response
9. Use token in Authorization header for other requests

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Test Files Located In
- `tests/auth.test.js` - Authentication tests
- `tests/members.test.js` - Members API tests
- `tests/database.test.js` - Database tests

## Checking Logs

### View Real-time Logs
Logs appear in console when running in development mode.

### View Stored Logs
```bash
# View recent errors
tail -f logs/error.log

# View all logs
tail -f logs/combined.log

# On Windows
type logs\combined.log
```

## Database Management

### View Database File
```bash
# The database is a SQLite file at:
d:\gym\database\gym_management.db

# To view with SQLite Browser:
# 1. Download SQLite Browser
# 2. Open the file
# 3. Browse tables and data
```

### Reset Database
```bash
# Delete the database file
del database\gym_management.db

# Reinitialize
npm run db:init
```

## Stopping the Server

Press `Ctrl + C` in the terminal where the server is running.

## Troubleshooting

### Issue: "Port 5000 already in use"
```bash
# Find what's using the port
netstat -ano | findstr :5000

# Kill the process (replace PID)
taskkill /PID 12345 /F

# Or change PORT in .env
```

### Issue: "Database locked"
- Ensure only one instance of the app is running
- Check for corrupted database files (.db-shm, .db-wal)
- Delete corrupted files and reinitialize

### Issue: "Cannot find module"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: "CORS error"
- Check CORS_ORIGIN in .env matches your frontend URL
- For development: `http://localhost:5000` or `http://localhost:3000`

## Performance Monitoring

### Check Server Health
```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
    "status": "OK",
    "timestamp": "2024-01-03T10:30:45.123Z",
    "message": "Gym Management API is running"
}
```

### Monitor Logs for Issues
```bash
# Watch for errors in real-time
grep "ERROR" logs/combined.log | tail -f
```

## Next Steps

1. **Customize**: Edit CSS and HTML to match your gym's branding
2. **Extend**: Add more features in controllers and routes
3. **Deploy**: Follow deployment guide for cloud hosting
4. **Scale**: Optimize database and add caching as needed

## Production Deployment

See [README.md](../README.md#-deployment) for production deployment instructions.

## Support and Debugging

### Enable Debug Logging
```bash
# In .env
LOG_LEVEL=debug
```

### Check System Requirements
```bash
node --version
npm --version
```

### Validate Installation
```bash
npm list
```

---

**Last Updated**: January 3, 2024
