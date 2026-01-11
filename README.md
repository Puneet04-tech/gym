# Gym Management System

A comprehensive full-stack web application for managing gym operations, memberships, payments, and receipts digitally. This system helps gym owners streamline operations and provides members with a convenient way to manage their memberships and access receipts online.

## 📋 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Testing](#testing)
- [Logging](#logging)
- [Deployment](#deployment)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)
- [Firebase Migration](#firebase-migration)

## 🎯 Features

### Admin Features
- ✅ User and member management
- ✅ Create and manage fee packages
- ✅ View and process payments
- ✅ Generate bills and receipts
- ✅ Manage gym status and announcements
- ✅ Generate reports
- ✅ Activity logging and audit trail

### Member Features
- ✅ View membership details
- ✅ Download bill receipts
- ✅ View payment history
- ✅ Receive notifications for payment dues
- ✅ Manage profile information
- ✅ Change password

### General Features
- ✅ Secure authentication with JWT tokens
- ✅ Role-based access control
- ✅ Comprehensive logging and monitoring
- ✅ Responsive design for all devices
- ✅ RESTful API architecture
- ✅ SQLite database for data persistence

## 📁 Project Structure

```
gym/
├── backend/
│   ├── routes/
│   │   ├── authRoutes.js          # Authentication endpoints
│   │   ├── memberRoutes.js        # Member management endpoints
│   │   ├── billRoutes.js          # Bill management endpoints
│   │   └── paymentRoutes.js       # Payment management endpoints
│   ├── controllers/
│   │   ├── authController.js      # Auth business logic
│   │   ├── memberController.js    # Member business logic
│   │   ├── billController.js      # Bill business logic
│   │   └── paymentController.js   # Payment business logic
│   ├── middleware/
│   │   └── auth.js                # Authentication and authorization middleware
│   ├── utils/
│   │   └── helpers.js             # Utility functions
│   └── server.js                  # Main server file
├── frontend/
│   ├── pages/
│   │   ├── index.html             # Main entry point
│   │   ├── login.html             # Login and registration
│   │   └── dashboard.html         # Main dashboard
│   ├── css/
│   │   ├── style.css              # Global styles
│   │   ├── auth.css               # Authentication page styles
│   │   └── dashboard.css          # Dashboard styles
│   ├── js/
│   │   ├── api.js                 # API client and methods
│   │   ├── auth.js                # Authentication logic
│   │   ├── dashboard.js           # Dashboard logic
│   │   └── router.js              # SPA router
│   └── assets/                    # Images and other assets
├── database/
│   ├── init.js                    # Database initialization script
│   └── schema.md                  # Database schema documentation
├── config/
│   ├── database.js                # Database configuration
│   └── logger.js                  # Logging configuration
├── tests/
│   ├── auth.test.js               # Authentication tests
│   ├── members.test.js            # Members API tests
│   └── database.test.js           # Database operation tests
├── logs/                          # Application logs directory
├── package.json                   # Project dependencies
├── .env.example                   # Environment variables example
├── .gitignore                     # Git ignore rules
├── jest.config.js                 # Jest test configuration
└── README.md                      # This file
```

## 🛠️ Technologies Used

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **SQLite3** - Lightweight database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Winston** - Logging library
- **CORS** - Cross-origin requests
- **UUID** - Unique ID generation

### Frontend
- **HTML5** - Markup language
- **CSS3** - Styling with modern features
- **Vanilla JavaScript** - Client-side logic
- **Fetch API** - HTTP requests
- **LocalStorage** - Client-side storage

### Added backend modules (REST)
- Fee packages: `/api/fee-packages`
- Subscriptions: `/api/subscriptions`
- Notifications: `/api/notifications`
- Reports CSV: `/api/reports/bills`
- Store (supplements): `/api/store`
- Diet plans: `/api/diets`

## Firebase Migration

We are migrating auth and data to Firebase (Auth, Firestore, Functions, optional Storage). The plan and schemas are tracked in [docs/FIREBASE_MIGRATION_PLAN.md](docs/FIREBASE_MIGRATION_PLAN.md). Client config template: [firebase.config.template.json](firebase.config.template.json).

### Client bootstrap
- Include Firebase CDN scripts and load [frontend/js/firebase.js](frontend/js/firebase.js). Replace the placeholder config with your project values (or set `localStorage.firebaseConfig` during development).

### Functions and rules
- Functions source: [functions/](functions/), entry [functions/index.js](functions/index.js)
- Firestore rules: [firestore.rules](firestore.rules)
- Firebase config: [firebase.json](firebase.json)

### Local development (when ready)
1) Install Firebase CLI: `npm install -g firebase-tools`
2) Login: `firebase login`
3) Install functions deps: `cd functions && npm install`
4) Emulators: `firebase emulators:start`
5) Deploy (when configured): `firebase deploy --only hosting,functions,firestore:rules`

### Development & Testing
- **Jest** - Testing framework
- **Supertest** - HTTP assertion library
- **Nodemon** - Development server with auto-reload
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📋 System Requirements

- **Node.js**: v14.0.0 or higher
- **npm**: v6.0.0 or higher
- **OS**: Windows, macOS, or Linux
- **Browser**: Modern browser with ES6 support

## 🚀 Installation

### 1. Clone or Extract the Project

```bash
cd gym
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

```bash
copy .env.example .env
```

Edit `.env` and configure:
```env
PORT=5000
NODE_ENV=development
DB_PATH=./database/gym_management.db
JWT_SECRET=your_super_secret_jwt_key_change_in_production
```

### 4. Initialize Database

```bash
npm run db:init
```
This will create all necessary tables and indexes (rerun if new tables like supplements/diets are added).

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
HOST=localhost

# Database Configuration
DB_PATH=./database/gym_management.db

# JWT Configuration
JWT_SECRET=change_this_to_a_strong_secret_key
JWT_EXPIRATION=24h

# Logging Configuration
LOG_LEVEL=info
LOG_DIR=./logs

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# File Upload
MAX_FILE_SIZE=5242880
```

## 🎮 Running the Application

### Development Mode

```bash
npm run dev
```

The server will start with auto-reload on file changes.

### Production Mode

```bash
npm start
```

### Access the Application

- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

### Default Test Credentials

After initialization, use these credentials:
- **Email**: admin@example.com
- **Password**: Admin123

## 📊 Database Schema

### Users Table
Stores user information for all roles (admin, member, user)

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'member', 'user')),
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    address TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Members Table
Stores gym member specific information

```sql
CREATE TABLE members (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    membership_status TEXT CHECK(membership_status IN ('active', 'inactive', 'suspended')),
    emergency_contact TEXT,
    emergency_phone TEXT,
    medical_conditions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Payments Table
Stores payment records

```sql
CREATE TABLE payments (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('cash', 'card', 'upi', 'cheque')),
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('completed', 'pending', 'failed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id)
);
```

### Bills Table
Stores generated bills/receipts

```sql
CREATE TABLE bills (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    payment_id TEXT NOT NULL,
    bill_number TEXT UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    status TEXT CHECK(status IN ('generated', 'emailed', 'downloaded', 'printed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (payment_id) REFERENCES payments(id)
);
```

See [database/schema.md](database/schema.md) for complete schema documentation.

## 📡 API Documentation

### Authentication Endpoints

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePassword123",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user"
}

Response: 201 Created
{
    "message": "User registered successfully",
    "userId": "uuid"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
    "email": "john@example.com",
    "password": "SecurePassword123"
}

Response: 200 OK
{
    "message": "Login successful",
    "token": "eyJhbGc...",
    "user": {
        "id": "uuid",
        "username": "john_doe",
        "email": "john@example.com",
        "role": "user"
    }
}
```

#### Get Profile
```
GET /api/auth/profile
Authorization: Bearer <token>

Response: 200 OK
{
    "message": "Profile retrieved successfully",
    "user": { ... }
}
```

### Member Endpoints

#### Get All Members
```
GET /api/members?page=1&limit=10
Authorization: Bearer <admin_token>

Response: 200 OK
{
    "message": "Members retrieved successfully",
    "data": [ ... ],
    "pagination": { ... }
}
```

#### Add Member
```
POST /api/members
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "username": "jane_smith",
    "email": "jane@example.com",
    "password": "Password123",
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "1234567890"
}

Response: 201 Created
{
    "message": "Member added successfully",
    "memberId": "uuid"
}
```

### Bills Endpoints

#### Create Bill
```
POST /api/bills
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "member_id": "uuid",
    "payment_id": "uuid",
    "amount": 500.00,
    "tax": 50.00
}

Response: 201 Created
{
    "message": "Bill created successfully",
    "billId": "uuid",
    "billNumber": "BILL-timestamp-random"
}
```

#### Get Bills
```
GET /api/bills?page=1&limit=10
Authorization: Bearer <token>

Response: 200 OK
{
    "message": "Bills retrieved successfully",
    "data": [ ... ],
    "pagination": { ... }
}
```

### Payment Endpoints

#### Create Payment
```
POST /api/payments
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "member_id": "uuid",
    "amount": 500.00,
    "payment_method": "card",
    "transaction_id": "TXN123456"
}

Response: 201 Created
{
    "message": "Payment created successfully",
    "paymentId": "uuid"
}
```

For complete API documentation, see [API_DOCS.md](docs/API_DOCS.md).

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (SPA)                       │
│  HTML5 | CSS3 | Vanilla JavaScript | Fetch API          │
└─────────────────────────────────────────────────────────┘
                          ↓
                    HTTP/REST API
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Backend (Node.js)                      │
│        Express.js | Controllers | Middleware            │
├─────────────────────────────────────────────────────────┤
│               Authentication & Authorization            │
│              (JWT | bcryptjs | Role-based)             │
├─────────────────────────────────────────────────────────┤
│                  Business Logic Layer                    │
│    (User | Member | Bill | Payment Management)         │
├─────────────────────────────────────────────────────────┤
│                  Data Access Layer                       │
│              (Database Interface | Helpers)             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              SQLite Database                            │
│  (Users | Members | Payments | Bills | Notifications)  │
└─────────────────────────────────────────────────────────┘
```

### Design Patterns

1. **MVC Pattern** - Separation of concerns with Models, Views, Controllers
2. **Middleware Pattern** - Request/response interceptors
3. **DAO Pattern** - Data Access Objects for database operations
4. **Factory Pattern** - Token and ID generation
5. **Singleton Pattern** - Database connection

### Code Organization

- **Modular Architecture**: Each feature is in its own module
- **Separation of Concerns**: Clear boundaries between layers
- **Reusable Utilities**: Helper functions in utils directory
- **Consistent Error Handling**: Centralized error middleware
- **Logging Throughout**: Winston logger integrated at all levels

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm test -- --coverage
```

### Test Files

- `tests/auth.test.js` - Authentication API tests
- `tests/members.test.js` - Members API tests
- `tests/database.test.js` - Database operation tests

### Test Coverage

The project aims for 60% code coverage. Run tests to see current coverage:

```bash
npm test -- --coverage
```

## 📝 Logging

### Log Files

Logs are stored in the `logs/` directory:

- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

### Log Levels

- `error` - Error messages
- `warn` - Warning messages
- `info` - Information messages
- `debug` - Debug messages

### Log Format

```
2024-01-03 10:30:45 [INFO]: POST /api/auth/login - 200 (125ms)
2024-01-03 10:30:46 [INFO]: User logged in successfully {userId: "uuid", email: "user@example.com"}
```

### Configuration

Edit `config/logger.js` to customize logging behavior:

```javascript
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    // ... additional configuration
});
```

## 🚀 Deployment

### Local Deployment

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   copy .env.example .env
   # Edit .env with your configuration
   ```

3. **Initialize database**
   ```bash
   npm run db:init
   ```

4. **Start server**
   ```bash
   npm start
   ```

### Cloud Deployment (Heroku Example)

1. **Create Heroku app**
   ```bash
   heroku create your-gym-app
   ```

2. **Set environment variables**
   ```bash
   heroku config:set JWT_SECRET=your_secret_key
   heroku config:set NODE_ENV=production
   ```

3. **Deploy code**
   ```bash
   git push heroku main
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t gym-management .
docker run -p 5000:5000 gym-management
```

## 📈 Performance Optimization

### Database Optimization
- ✅ Indexes on frequently queried columns
- ✅ Proper foreign key relationships
- ✅ Connection pooling for SQLite

### Backend Optimization
- ✅ Compression middleware
- ✅ Pagination for large datasets
- ✅ Caching headers
- ✅ Asynchronous operations

### Frontend Optimization
- ✅ Lazy loading of resources
- ✅ Minified CSS and JavaScript
- ✅ Responsive design for all devices
- ✅ Efficient DOM manipulation

## 🔒 Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ CORS protection
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ Secure headers
- ✅ Activity logging for audit trail

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

### Database Lock Error
- Ensure only one instance is running
- Delete `.db-shm` and `.db-wal` files if corrupted

### CORS Issues
- Update `CORS_ORIGIN` in `.env`
- Ensure frontend and backend are on correct URLs

### Authentication Errors
- Check JWT_SECRET is set correctly
- Verify token format: `Bearer <token>`
- Check token expiration time

## 🚧 Future Enhancements

- [ ] Email notifications for payment reminders
- [ ] SMS notifications
- [ ] Supplement store integration
- [ ] Diet and nutrition planning
- [ ] Personal training sessions management
- [ ] Mobile app (React Native/Flutter)
- [ ] Advanced analytics and reporting
- [ ] QR code bill receipts
- [ ] Blockchain-based transactions
- [ ] Multi-language support
- [ ] Two-factor authentication
- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Online class scheduling
- [ ] Video tutorials and workout plans

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💼 Author

Gym Management System Development Team

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email support@gymmanagementsystem.com or open an issue in the GitHub repository.

## 🙏 Acknowledgments

- Express.js documentation
- SQLite documentation
- JWT best practices
- Web development community

---

**Last Updated**: January 3, 2024  
**Version**: 1.0.0
