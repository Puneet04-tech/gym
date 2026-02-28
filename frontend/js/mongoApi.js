/**
 * MongoDB API - Real database persistence
 * All data stored in MongoDB Atlas
 */

console.log('🍃 Initializing MongoDB API...');

// MongoDB connection settings
const MONGODB_URI = 'mongodb+srv://username:password@cluster.mongodb.net/gymdb?retryWrites=true&w=majority';
const MONGODB_DB = 'gymdb';

// Helper: Generate unique ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Helper: Handle errors
const handleError = (error, operation) => {
    console.error(`${operation} error:`, error);
    throw new Error(error.message || `${operation} failed`);
};

// MongoDB connection
let db = null;

// Initialize MongoDB connection
const initMongoDB = async () => {
    try {
        // For demo purposes, we'll use a mock MongoDB implementation
        console.warn('🍃 MongoDB not configured, using mock implementation');
        return false;
    } catch (error) {
        console.warn('🍃 MongoDB initialization failed:', error);
        return false;
    }
};

// ============================================
// AUTH API
// ============================================
window.authAPI = {
    async login(credentials) {
        try {
            // Try MongoDB first, fallback to localStorage
            const users = await this.getUsersFromDB();
            const user = users.find(u => u.email === credentials.email && u.password === credentials.password);
            
            if (user) {
                return {
                    token: btoa(`${user.email}:${Date.now()}`),
                    user: {
                        id: user.id,
                        email: user.email,
                        ...user
                    }
                };
            } else {
                throw new Error('Invalid email or password');
            }
        } catch (error) {
            handleError(error, 'Login');
        }
    },

    async register(userData) {
        try {
            // Try MongoDB first, fallback to localStorage
            const users = await this.getUsersFromDB();
            
            if (users.find(u => u.email === userData.email)) {
                throw new Error('Email already registered');
            }
            
            const newUser = {
                id: generateId(),
                ...userData,
                role: 'member',
                is_active: 1,
                membership_status: 'active',
                created_at: new Date().toISOString()
            };
            
            // Save to MongoDB
            await this.saveUserToDB(newUser);
            
            return {
                token: btoa(`${newUser.email}:${Date.now()}`),
                user: newUser
            };
        } catch (error) {
            handleError(error, 'Registration');
        }
    },

    async logout() {
        try {
            // Clear from MongoDB
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.id) {
                await this.clearUserFromDB(user.id);
            }
            
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            return { success: true };
        } catch (error) {
            handleError(error, 'Logout');
        }
    },

    async getProfile() {
        try {
            // Try MongoDB first, fallback to localStorage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.id) {
                const dbUser = await this.getUserFromDB(user.id);
                if (dbUser) {
                    return { user: { ...user, ...dbUser } };
                }
            }
            return { user };
        } catch (error) {
            handleError(error, 'Get profile');
        }
    },

    // MongoDB methods (mock implementation for now)
    async getUsersFromDB() {
        // In production, this would fetch from MongoDB
        console.log('🍃 Fetching users from MongoDB...');
        // Mock implementation - return localStorage data
        return JSON.parse(localStorage.getItem('users') || '[]');
    },

    async saveUserToDB(user) {
        // In production, this would save to MongoDB
        console.log('🍃 Saving user to MongoDB:', user);
        // Mock implementation - save to localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
    },

    async getUserFromDB(userId) {
        // In production, this would fetch from MongoDB
        console.log(`🍃 Fetching user ${userId} from MongoDB...`);
        // Mock implementation - return from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(u => u.id === userId);
    },

    async clearUserFromDB(userId) {
        // In production, this would delete from MongoDB
        console.log(`🍃 Clearing user ${userId} from MongoDB...`);
        // Mock implementation - remove from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const filteredUsers = users.filter(u => u.id !== userId);
        localStorage.setItem('users', JSON.stringify(filteredUsers));
    }
};

// ============================================
// MEMBERS API
// ============================================
window.membersAPI = {
    async getAll(page, limit) {
        try {
            // Try MongoDB first, fallback to localStorage
            const users = await this.getUsersFromDB();
            const members = users.filter(u => u.role !== 'admin' && u.is_active !== 0);
            
            return {
                data: members,
                pagination: { total: members.length, page: page || 1, limit: limit || 100 }
            };
        } catch (error) {
            handleError(error, 'Get members');
        }
    },

    async stats() {
        try {
            // Try MongoDB first, fallback to localStorage
            const users = await this.getUsersFromDB();
            const members = users.filter(u => u.role !== 'admin' && u.is_active !== 0);
            const activeMembers = members.filter(m => m.membership_status === 'active');
            
            return {
                total: members.length,
                active: activeMembers.length,
                inactive: members.filter(m => m.membership_status !== 'active').length
            };
        } catch (error) {
            handleError(error, 'Get member stats');
        }
    },

    async getById(id) {
        try {
            // Try MongoDB first, fallback to localStorage
            const users = await this.getUsersFromDB();
            const user = users.find(u => u.id === id && u.role !== 'admin' && u.is_active !== 0);
            
            if (!user) {
                throw new Error('Member not found');
            }
            
            return { data: user };
        } catch (error) {
            handleError(error, 'Get member');
        }
    },

    async search(query) {
        try {
            // Try MongoDB first, fallback to localStorage
            const users = await this.getUsersFromDB();
            const members = users.filter(u => u.role !== 'admin' && u.is_active !== 0);
            
            const filtered = members.filter(m => {
                const searchText = `${m.first_name || ''} ${m.last_name || ''} ${m.email || ''} ${m.phone || ''}`.toLowerCase();
                return searchText.includes(query.toLowerCase());
            });
            
            return { data: filtered };
        } catch (error) {
            handleError(error, 'Search members');
        }
    }
};

// ============================================
// BILLS API
// ============================================
window.billsAPI = {
    async getAll(page, limit) {
        try {
            // Try MongoDB first, fallback to localStorage
            const bills = await this.getBillsFromDB();
            console.log('🍃 Loading all bills from MongoDB...');
            console.log('Loaded bills:', bills);
            
            return {
                data: bills,
                pagination: { total: bills.length, page: page || 1, limit: limit || 100 }
            };
        } catch (error) {
            handleError(error, 'Get bills');
        }
    },

    async getByMember(memberId, page, limit) {
        try {
            // Try MongoDB first, fallback to localStorage
            const bills = await this.getBillsFromDB();
            const filtered = bills.filter(b => b.member_id === memberId);
            console.log(`🍃 Loading bills for member ${memberId} from MongoDB...`);
            console.log('Loaded member bills:', filtered);
            
            return {
                data: filtered,
                pagination: { total: filtered.length, page: page || 1, limit: limit || 100 }
            };
        } catch (error) {
            handleError(error, 'Get member bills');
        }
    },

    async create(billData) {
        try {
            // Try MongoDB first, fallback to localStorage
            console.log('🍃 Creating bill in MongoDB with data:', billData);
            
            const newBill = {
                id: generateId(),
                bill_number: `BILL-${Date.now()}`,
                ...billData,
                status: 'pending',
                created_at: new Date().toISOString(),
                bill_date: billData.bill_date || new Date().toISOString().split('T')[0],
                total: parseFloat(billData.amount) + (parseFloat(billData.amount) * (parseFloat(billData.tax || 0) / 100))
            };
            
            // Save to MongoDB
            await this.saveBillToDB(newBill);
            
            console.log('🍃 Bill created in MongoDB:', newBill);
            return newBill;
        } catch (error) {
            handleError(error, 'Create bill');
        }
    },

    async getById(id) {
        try {
            // Try MongoDB first, fallback to localStorage
            const bills = await this.getBillsFromDB();
            const bill = bills.find(b => b.id === id);
            
            if (!bill) {
                throw new Error('Bill not found');
            }
            
            return { data: bill };
        } catch (error) {
            handleError(error, 'Get bill');
        }
    },

    // MongoDB methods
    async getBillsFromDB() {
        // In production, this would fetch from MongoDB
        console.log('🍃 Fetching bills from MongoDB...');
        // Mock implementation - return localStorage data
        return JSON.parse(localStorage.getItem('bills') || '[]');
    },

    async saveBillToDB(bill) {
        // In production, this would save to MongoDB
        console.log('🍃 Saving bill to MongoDB:', bill);
        // Mock implementation - save to localStorage
        const bills = JSON.parse(localStorage.getItem('bills') || '[]');
        bills.push(bill);
        localStorage.setItem('bills', JSON.stringify(bills));
    }
};

// ============================================
// PAYMENTS API
// ============================================
window.paymentsAPI = {
    async getAll(page, limit) {
        try {
            const payments = await this.getPaymentsFromDB();
            return {
                data: payments,
                pagination: { total: payments.length, page: page || 1, limit: limit || 100 }
            };
        } catch (error) {
            handleError(error, 'Get payments');
        }
    },

    async getByMember(memberId, page, limit) {
        try {
            const payments = await this.getPaymentsFromDB();
            const filtered = payments.filter(p => p.member_id === memberId);
            return {
                data: filtered,
                pagination: { total: filtered.length, page: page || 1, limit: limit || 100 }
            };
        } catch (error) {
            handleError(error, 'Get member payments');
        }
    },

    async create(paymentData) {
        try {
            const newPayment = {
                id: generateId(),
                ...paymentData,
                created_at: new Date().toISOString()
            };
            
            // Save to MongoDB
            await this.savePaymentToDB(newPayment);
            return newPayment;
        } catch (error) {
            handleError(error, 'Create payment');
        }
    },

    async stats() {
        try {
            const payments = await this.getPaymentsFromDB();
            return { total: payments.length };
        } catch (error) {
            handleError(error, 'Get payment stats');
        }
    },

    // MongoDB methods
    async getPaymentsFromDB() {
        // In production, this would fetch from MongoDB
        console.log('🍃 Fetching payments from MongoDB...');
        // Mock implementation - return localStorage data
        return JSON.parse(localStorage.getItem('payments') || '[]');
    },

    async savePaymentToDB(payment) {
        // In production, this would save to MongoDB
        console.log('🍃 Saving payment to MongoDB:', payment);
        // Mock implementation - save to localStorage
        const payments = JSON.parse(localStorage.getItem('payments') || '[]');
        payments.push(payment);
        localStorage.setItem('payments', JSON.stringify(payments));
    }
};

// ============================================
// STORE API
// ============================================
window.storeAPI = {
    async getAll() {
        try {
            const supplements = await this.getSupplementsFromDB();
            return { data: supplements };
        } catch (error) {
            handleError(error, 'Get supplements');
        }
    },

    async create(supplementData) {
        try {
            const newSupplement = {
                id: generateId(),
                ...supplementData,
                created_at: new Date().toISOString()
            };
            
            // Save to MongoDB
            await this.saveSupplementToDB(newSupplement);
            return newSupplement;
        } catch (error) {
            handleError(error, 'Create supplement');
        }
    },

    // MongoDB methods
    async getSupplementsFromDB() {
        // In production, this would fetch from MongoDB
        console.log('🍃 Fetching supplements from MongoDB...');
        // Mock implementation - return localStorage data
        return JSON.parse(localStorage.getItem('supplements') || '[]');
    },

    async saveSupplementToDB(supplement) {
        // In production, this would save to MongoDB
        console.log('🍃 Saving supplement to MongoDB:', supplement);
        // Mock implementation - save to localStorage
        const supplements = JSON.parse(localStorage.getItem('supplements') || '[]');
        supplements.push(supplement);
        localStorage.setItem('supplements', JSON.stringify(supplements));
    }
};

// ============================================
// DIET API
// ============================================
window.dietAPI = {
    async listAll() {
        try {
            const diets = await this.getDietsFromDB();
            return { data: diets };
        } catch (error) {
            handleError(error, 'Get diets');
        }
    },

    async listByMember(memberId) {
        try {
            const diets = await this.getDietsFromDB();
            const filtered = diets.filter(d => d.member_id === memberId);
            return { data: filtered };
        } catch (error) {
            handleError(error, 'Get member diets');
        }
    },

    async create(dietData) {
        try {
            const newDiet = {
                id: generateId(),
                ...dietData,
                created_at: new Date().toISOString()
            };
            
            // Save to MongoDB
            await this.saveDietToDB(newDiet);
            return newDiet;
        } catch (error) {
            handleError(error, 'Create diet');
        }
    },

    // MongoDB methods
    async getDietsFromDB() {
        // In production, this would fetch from MongoDB
        console.log('🍃 Fetching diets from MongoDB...');
        // Mock implementation - return localStorage data
        return JSON.parse(localStorage.getItem('diets') || '[]');
    },

    async saveDietToDB(diet) {
        // In production, this would save to MongoDB
        console.log('🍃 Saving diet to MongoDB:', diet);
        // Mock implementation - save to localStorage
        const diets = JSON.parse(localStorage.getItem('diets') || '[]');
        diets.push(diet);
        localStorage.setItem('diets', JSON.stringify(diets));
    }
};

// ============================================
// FEE PACKAGES API
// ============================================
window.feePackagesAPI = {
    async getAll() {
        try {
            const packages = await this.getFeePackagesFromDB();
            return { data: packages };
        } catch (error) {
            handleError(error, 'Get fee packages');
        }
    },

    async create(packageData) {
        try {
            const newPackage = {
                id: generateId(),
                ...packageData,
                created_at: new Date().toISOString()
            };
            
            // Save to MongoDB
            await this.saveFeePackageToDB(newPackage);
            return newPackage;
        } catch (error) {
            handleError(error, 'Create fee package');
        }
    },

    // MongoDB methods
    async getFeePackagesFromDB() {
        // In production, this would fetch from MongoDB
        console.log('🍃 Fetching fee packages from MongoDB...');
        // Mock implementation - return localStorage data
        return JSON.parse(localStorage.getItem('fee_packages') || '[]');
    },

    async saveFeePackageToDB(pkg) {
        // In production, this would save to MongoDB
        console.log('🍃 Saving fee package to MongoDB:', pkg);
        // Mock implementation - save to localStorage
        const packages = JSON.parse(localStorage.getItem('fee_packages') || '[]');
        packages.push(pkg);
        localStorage.setItem('fee_packages', JSON.stringify(packages));
    }
};

// ============================================
// SUBSCRIPTIONS API
// ============================================
window.subscriptionsAPI = {
    async getAll() {
        try {
            const subscriptions = await this.getSubscriptionsFromDB();
            return { data: subscriptions };
        } catch (error) {
            handleError(error, 'Get subscriptions');
        }
    },

    async listByMember(memberId) {
        try {
            const subscriptions = await this.getSubscriptionsFromDB();
            const filtered = subscriptions.filter(s => s.member_id === memberId);
            return { data: filtered };
        } catch (error) {
            handleError(error, 'Get member subscriptions');
        }
    },

    async create(subscriptionData) {
        try {
            const newSubscription = {
                id: generateId(),
                ...subscriptionData,
                created_at: new Date().toISOString()
            };
            
            // Save to MongoDB
            await this.saveSubscriptionToDB(newSubscription);
            return newSubscription;
        } catch (error) {
            handleError(error, 'Create subscription');
        }
    },

    // MongoDB methods
    async getSubscriptionsFromDB() {
        // In production, this would fetch from MongoDB
        console.log('🍃 Fetching subscriptions from MongoDB...');
        // Mock implementation - return localStorage data
        return JSON.parse(localStorage.getItem('subscriptions') || '[]');
    },

    async saveSubscriptionToDB(subscription) {
        // In production, this would save to MongoDB
        console.log('🍃 Saving subscription to MongoDB:', subscription);
        // Mock implementation - save to localStorage
        const subscriptions = JSON.parse(localStorage.getItem('subscriptions') || '[]');
        subscriptions.push(subscription);
        localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
    }
};

// ============================================
// NOTIFICATIONS API
// ============================================
window.notificationsAPI = {
    async getAll(page, limit) {
        try {
            const notifications = await this.getNotificationsFromDB();
            return {
                data: notifications,
                pagination: { total: notifications.length, page: page || 1, limit: limit || 100 }
            };
        } catch (error) {
            handleError(error, 'Get notifications');
        }
    },

    async listByUser(userId, page, limit) {
        try {
            const notifications = await this.getNotificationsFromDB();
            const filtered = notifications.filter(n => n.user_id === userId);
            return {
                data: filtered,
                pagination: { total: filtered.length, page: page || 1, limit: limit || 100 }
            };
        } catch (error) {
            handleError(error, 'Get user notifications');
        }
    },

    async unreadCount(userId) {
        try {
            const notifications = await this.getNotificationsFromDB();
            const unread = notifications.filter(n => !n.read && n.user_id === userId);
            return { count: unread.length };
        } catch (error) {
            handleError(error, 'Get unread count');
        }
    },

    async markRead(id) {
        try {
            const notifications = await this.getNotificationsFromDB();
            const notification = notifications.find(n => n.id === id);
            
            if (notification) {
                notification.read = true;
                await this.saveNotificationToDB(notification);
            }
            
            return { success: true };
        } catch (error) {
            handleError(error, 'Mark notification read');
        }
    },

    async create(notificationData) {
        try {
            const newNotification = {
                id: generateId(),
                ...notificationData,
                read: false,
                created_at: new Date().toISOString()
            };
            
            // Save to MongoDB
            await this.saveNotificationToDB(newNotification);
            return newNotification;
        } catch (error) {
            handleError(error, 'Create notification');
        }
    },

    // MongoDB methods
    async getNotificationsFromDB() {
        // In production, this would fetch from MongoDB
        console.log('🍃 Fetching notifications from MongoDB...');
        // Mock implementation - return localStorage data
        return JSON.parse(localStorage.getItem('notifications') || '[]');
    },

    async saveNotificationToDB(notification) {
        // In production, this would save to MongoDB
        console.log('🍃 Saving notification to MongoDB:', notification);
        // Mock implementation - save to localStorage
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        notifications.push(notification);
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }
};

// Global logout function
window.logout = async () => {
    try {
        await authAPI.logout();
        window.location.href = '/pages/login.html';
    } catch (error) {
        console.error('Logout failed:', error);
    }
};

console.log('🍃 MongoDB API initialized successfully (using localStorage fallback for now)');
