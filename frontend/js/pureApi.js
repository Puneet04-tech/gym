/**
 * Pure localStorage API - No Firebase dependencies
 * Reliable and works without any configuration
 */

console.log('🔥 Initializing Pure localStorage API...');

// Helper: Generate unique ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Helper: Get collection from localStorage
const getCollection = (name) => {
    try {
        return JSON.parse(localStorage.getItem(name) || '[]');
    } catch (error) {
        console.warn(`Failed to get ${name} from localStorage:`, error);
        return [];
    }
};

// Helper: Save collection to localStorage
const saveCollection = (name, data) => {
    try {
        localStorage.setItem(name, JSON.stringify(data));
    } catch (error) {
        console.warn(`Failed to save ${name} to localStorage:`, error);
    }
};

// ============================================
// AUTH API
// ============================================
window.authAPI = {
    async login(credentials) {
        try {
            const users = getCollection('users');
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
            throw new Error(error.message || 'Login failed');
        }
    },

    async register(userData) {
        try {
            const users = getCollection('users');
            
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
            
            users.push(newUser);
            saveCollection('users', users);
            
            return {
                token: btoa(`${newUser.email}:${Date.now()}`),
                user: newUser
            };
        } catch (error) {
            throw new Error(error.message || 'Registration failed');
        }
    },

    async logout() {
        try {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            return { success: true };
        } catch (error) {
            throw new Error(error.message || 'Logout failed');
        }
    },

    async getProfile() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return { user };
        } catch (error) {
            throw new Error(error.message || 'Failed to get profile');
        }
    }
};

// ============================================
// MEMBERS API
// ============================================
window.membersAPI = {
    async getAll(page, limit) {
        try {
            const users = getCollection('users');
            const members = users.filter(u => u.role !== 'admin' && u.is_active !== 0);
            
            return {
                data: members,
                pagination: { total: members.length, page: page || 1, limit: limit || 100 }
            };
        } catch (error) {
            throw new Error(error.message || 'Failed to get members');
        }
    },

    async stats() {
        try {
            const users = getCollection('users');
            const members = users.filter(u => u.role !== 'admin' && u.is_active !== 0);
            const activeMembers = members.filter(m => m.membership_status === 'active');
            
            return {
                total: members.length,
                active: activeMembers.length,
                inactive: members.filter(m => m.membership_status !== 'active').length
            };
        } catch (error) {
            throw new Error(error.message || 'Failed to get member stats');
        }
    },

    async getById(id) {
        try {
            const users = getCollection('users');
            const user = users.find(u => u.id === id && u.role !== 'admin' && u.is_active !== 0);
            
            if (!user) {
                throw new Error('Member not found');
            }
            
            return { data: user };
        } catch (error) {
            throw new Error(error.message || 'Failed to get member');
        }
    },

    async search(query) {
        try {
            const users = getCollection('users');
            const members = users.filter(u => u.role !== 'admin' && u.is_active !== 0);
            
            const filtered = members.filter(m => {
                const searchText = `${m.first_name || ''} ${m.last_name || ''} ${m.email || ''} ${m.phone || ''}`.toLowerCase();
                return searchText.includes(query.toLowerCase());
            });
            
            return { data: filtered };
        } catch (error) {
            throw new Error(error.message || 'Failed to search members');
        }
    }
};

// ============================================
// BILLS API
// ============================================
window.billsAPI = {
    async getAll(page, limit) {
        try {
            console.log('Loading all bills from localStorage...');
            const bills = getCollection('bills');
            console.log('Loaded bills:', bills);
            
            return {
                data: bills,
                pagination: { total: bills.length, page: page || 1, limit: limit || 100 }
            };
        } catch (error) {
            throw new Error(error.message || 'Failed to get bills');
        }
    },

    async getByMember(memberId, page, limit) {
        try {
            console.log(`Loading bills for member ${memberId} from localStorage...`);
            const bills = getCollection('bills');
            const filtered = bills.filter(b => b.member_id === memberId);
            console.log('Loaded member bills:', filtered);
            
            return {
                data: filtered,
                pagination: { total: filtered.length, page: page || 1, limit: limit || 100 }
            };
        } catch (error) {
            throw new Error(error.message || 'Failed to get member bills');
        }
    },

    async create(billData) {
        try {
            console.log('Creating bill in localStorage with data:', billData);
            const bills = getCollection('bills');
            console.log('Current bills:', bills);
            
            const newBill = {
                id: generateId(),
                bill_number: `BILL-${Date.now()}`,
                ...billData,
                status: 'pending',
                created_at: new Date().toISOString(),
                bill_date: billData.bill_date || new Date().toISOString().split('T')[0],
                total: parseFloat(billData.amount) + (parseFloat(billData.amount) * (parseFloat(billData.tax || 0) / 100))
            };
            
            bills.push(newBill);
            saveCollection('bills', bills);
            console.log('Bill created:', newBill);
            console.log('All bills after creation:', bills);
            
            return newBill;
        } catch (error) {
            throw new Error(error.message || 'Failed to create bill');
        }
    },

    async getById(id) {
        try {
            const bills = getCollection('bills');
            const bill = bills.find(b => b.id === id);
            
            if (!bill) {
                throw new Error('Bill not found');
            }
            
            return { data: bill };
        } catch (error) {
            throw new Error(error.message || 'Failed to get bill');
        }
    }
};

// ============================================
// PAYMENTS API
// ============================================
window.paymentsAPI = {
    async getAll(page, limit) {
        try {
            const payments = getCollection('payments');
            
            return {
                data: payments,
                pagination: { total: payments.length, page: page || 1, limit: limit || 100 }
            };
        } catch (error) {
            throw new Error(error.message || 'Failed to get payments');
        }
    },

    async getByMember(memberId, page, limit) {
        try {
            const payments = getCollection('payments');
            const filtered = payments.filter(p => p.member_id === memberId);
            
            return {
                data: filtered,
                pagination: { total: filtered.length, page: page || 1, limit: limit || 100 }
            };
        } catch (error) {
            throw new Error(error.message || 'Failed to get member payments');
        }
    },

    async create(paymentData) {
        try {
            const payments = getCollection('payments');
            const newPayment = {
                id: generateId(),
                ...paymentData,
                created_at: new Date().toISOString()
            };
            
            payments.push(newPayment);
            saveCollection('payments', payments);
            
            return newPayment;
        } catch (error) {
            throw new Error(error.message || 'Failed to create payment');
        }
    },

    async stats() {
        try {
            const payments = getCollection('payments');
            return { total: payments.length };
        } catch (error) {
            throw new Error(error.message || 'Failed to get payment stats');
        }
    }
};

// ============================================
// STORE API - Supplements
// ============================================
window.storeAPI = {
    async getAll() {
        try {
            const supplements = getCollection('supplements');
            return { data: supplements };
        } catch (error) {
            throw new Error(error.message || 'Failed to get supplements');
        }
    },

    async create(supplementData) {
        try {
            const supplements = getCollection('supplements');
            const newSupplement = {
                id: generateId(),
                ...supplementData,
                created_at: new Date().toISOString()
            };
            
            supplements.push(newSupplement);
            saveCollection('supplements', supplements);
            
            return newSupplement;
        } catch (error) {
            throw new Error(error.message || 'Failed to create supplement');
        }
    }
};

// ============================================
// DIET API
// ============================================
window.dietAPI = {
    async listAll() {
        try {
            const diets = getCollection('diets');
            return { data: diets };
        } catch (error) {
            throw new Error(error.message || 'Failed to get diets');
        }
    },

    async listByMember(memberId) {
        try {
            const diets = getCollection('diets');
            const filtered = diets.filter(d => d.member_id === memberId);
            return { data: filtered };
        } catch (error) {
            throw new Error(error.message || 'Failed to get member diets');
        }
    },

    async create(dietData) {
        try {
            const diets = getCollection('diets');
            const newDiet = {
                id: generateId(),
                ...dietData,
                created_at: new Date().toISOString()
            };
            
            diets.push(newDiet);
            saveCollection('diets', diets);
            
            return newDiet;
        } catch (error) {
            throw new Error(error.message || 'Failed to create diet');
        }
    }
};

// ============================================
// FEE PACKAGES API
// ============================================
window.feePackagesAPI = {
    async getAll() {
        try {
            const packages = getCollection('fee_packages');
            return { data: packages };
        } catch (error) {
            throw new Error(error.message || 'Failed to get fee packages');
        }
    },

    async create(packageData) {
        try {
            const packages = getCollection('fee_packages');
            const newPackage = {
                id: generateId(),
                ...packageData,
                created_at: new Date().toISOString()
            };
            
            packages.push(newPackage);
            saveCollection('fee_packages', packages);
            
            return newPackage;
        } catch (error) {
            throw new Error(error.message || 'Failed to create fee package');
        }
    }
};

// ============================================
// SUBSCRIPTIONS API
// ============================================
window.subscriptionsAPI = {
    async getAll() {
        try {
            const subscriptions = getCollection('subscriptions');
            return { data: subscriptions };
        } catch (error) {
            throw new Error(error.message || 'Failed to get subscriptions');
        }
    },

    async listByMember(memberId) {
        try {
            const subscriptions = getCollection('subscriptions');
            const filtered = subscriptions.filter(s => s.member_id === memberId);
            return { data: filtered };
        } catch (error) {
            throw new Error(error.message || 'Failed to get member subscriptions');
        }
    },

    async create(subscriptionData) {
        try {
            const subscriptions = getCollection('subscriptions');
            const newSubscription = {
                id: generateId(),
                ...subscriptionData,
                created_at: new Date().toISOString()
            };
            
            subscriptions.push(newSubscription);
            saveCollection('subscriptions', subscriptions);
            
            return newSubscription;
        } catch (error) {
            throw new Error(error.message || 'Failed to create subscription');
        }
    }
};

// ============================================
// NOTIFICATIONS API
// ============================================
window.notificationsAPI = {
    async getAll(page, limit) {
        try {
            const notifications = getCollection('notifications');
            return {
                data: notifications,
                pagination: { total: notifications.length, page: page || 1, limit: limit || 100 }
            };
        } catch (error) {
            throw new Error(error.message || 'Failed to get notifications');
        }
    },

    async listByUser(userId, page, limit) {
        try {
            const notifications = getCollection('notifications');
            const filtered = notifications.filter(n => n.user_id === userId);
            return {
                data: filtered,
                pagination: { total: filtered.length, page: page || 1, limit: limit || 100 }
            };
        } catch (error) {
            throw new Error(error.message || 'Failed to get user notifications');
        }
    },

    async unreadCount(userId) {
        try {
            const notifications = getCollection('notifications');
            const unread = notifications.filter(n => !n.read && n.user_id === userId);
            return { count: unread.length };
        } catch (error) {
            throw new Error(error.message || 'Failed to get unread count');
        }
    },

    async markRead(id) {
        try {
            const notifications = getCollection('notifications');
            const notification = notifications.find(n => n.id === id);
            
            if (notification) {
                notification.read = true;
                saveCollection('notifications', notifications);
            }
            
            return { success: true };
        } catch (error) {
            throw new Error(error.message || 'Failed to mark notification as read');
        }
    },

    async create(notificationData) {
        try {
            const notifications = getCollection('notifications');
            const newNotification = {
                id: generateId(),
                ...notificationData,
                read: false,
                created_at: new Date().toISOString()
            };
            
            notifications.push(newNotification);
            saveCollection('notifications', notifications);
            
            return newNotification;
        } catch (error) {
            throw new Error(error.message || 'Failed to create notification');
        }
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

console.log('🔥 Pure localStorage API initialized successfully');
