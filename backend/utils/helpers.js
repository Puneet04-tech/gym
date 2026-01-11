const { v4: uuidv4 } = require('uuid');

// Generate unique ID
const generateId = () => uuidv4();

// Hash password
const hashPassword = async (password) => {
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
const generateToken = (payload) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRATION || '24h',
  });
};

// Verify JWT token
const verifyToken = (token) => {
  const jwt = require('jsonwebtoken');
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret');
  } catch (error) {
    return null;
  }
};

// Format date
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

// Validate email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone
const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
};

// Generate bill number
const generateBillNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `BILL-${timestamp}-${random}`;
};

// Calculate bill total with tax
const calculateBillTotal = (amount, taxPercent = 0) => {
  const tax = (amount * taxPercent) / 100;
  return {
    amount,
    tax,
    total: amount + tax,
  };
};

// Paginate results
const paginate = (items, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: items.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit),
    },
  };
};

module.exports = {
  generateId,
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  formatDate,
  validateEmail,
  validatePhone,
  generateBillNumber,
  calculateBillTotal,
  paginate,
};
