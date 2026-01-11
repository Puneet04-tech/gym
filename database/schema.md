/**
 * Database Schema Documentation
 * 
 * This file documents the database structure for the Gym Management System
 */

// USERS TABLE
// Stores user information for all roles (admin, member, user)
// Fields:
// - id: Unique identifier
// - username: Login username
// - email: User email address
// - password: Hashed password
// - role: admin | member | user
// - is_active: Account status

// MEMBERS TABLE
// Stores gym member specific information
// Related to users table
// Fields:
// - id: Unique identifier
// - user_id: Reference to users table
// - membership_status: active | inactive | suspended

// FEE_PACKAGES TABLE
// Stores membership fee packages
// Fields:
// - id: Unique identifier
// - name: Package name (e.g., "Basic", "Premium")
// - monthly_fee: Amount charged per month
// - duration_days: Package duration

// MEMBER_SUBSCRIPTIONS TABLE
// Stores member subscription history
// Fields:
// - member_id: Reference to members
// - fee_package_id: Reference to fee_packages
// - status: active | expired | cancelled

// PAYMENTS TABLE
// Stores payment records
// Fields:
// - member_id: Which member made payment
// - amount: Payment amount
// - payment_method: cash | card | upi | cheque
// - status: completed | pending | failed

// BILLS TABLE
// Stores generated bills/receipts
// Fields:
// - member_id: Which member
// - payment_id: Related payment
// - bill_number: Unique bill identifier
// - status: generated | emailed | downloaded | printed

// NOTIFICATIONS TABLE
// Stores user notifications
// Fields:
// - user_id: Which user
// - type: payment_due | payment_received | membership_expiring | gym_update
// - is_read: Read status

// GYM_STATUS TABLE
// Stores gym operational status
// Fields:
// - gym_name: Name of the gym
// - is_open: Current open/closed status
// - opening_time: Gym opening time
// - closing_time: Gym closing time

// ACTIVITY_LOGS TABLE
// Logs all system activities for audit trail
// Fields:
// - user_id: Which user performed action
// - action: What action was performed
// - entity_type: Type of entity affected
// - ip_address: IP address of user
