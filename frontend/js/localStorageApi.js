/**
 * LocalStorage API - Client-side data persistence
 * All data stored in browser localStorage
 */

console.log('📦 Initializing LocalStorage API...');

// Helper: Generate unique ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Helper: Get data from localStorage
const getCollection = (collectionName) => {
    const data = localStorage.getItem(collectionName);
    return data ? JSON.parse(data) : [];
};

// Helper: Save data to localStorage
const saveCollection = (collectionName, data) => {
    localStorage.setItem(collectionName, JSON.stringify(data));
};

// ============================================
// AUTH API - Simple Authentication
// ============================================
window.authAPI = {
    async login(credentials) {
        const users = getCollection('users');
        const user = users.find(u => u.email === credentials.email && u.password === credentials.password);
        
        if (!user) {
            throw new Error('Invalid email or password');
        }
        
        const token = generateId();
        const userData = { ...user };
        delete userData.password;
        
        return {
            token,
            user: userData
        };
    },

    async register(userData) {
        const users = getCollection('users');
        
        if (users.find(u => u.email === userData.email)) {
            throw new Error('Email already exists');
        }
        
        const newUser = {
            id: generateId(),
            ...userData,
            role: 'member',
            is_active: 1,
            created_at: new Date().toISOString()
        };
        
        users.push(newUser);
        saveCollection('users', users);
        
        const token = generateId();
        const userReturn = { ...newUser };
        delete userReturn.password;
        
        return { token, user: userReturn };
    },

    async logout() {
        return { success: true };
    },

    async getProfile() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return { user };
    },

    async updateProfile(profileData) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const users = getCollection('users');
        const index = users.findIndex(u => u.id === user.id);
        
        if (index !== -1) {
            users[index] = { ...users[index], ...profileData };
            saveCollection('users', users);
            
            const updatedUser = { ...users[index] };
            delete updatedUser.password;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            return { user: updatedUser };
        }
        throw new Error('User not found');
    },

    async changePassword(passwordData) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const users = getCollection('users');
        const index = users.findIndex(u => u.id === user.id);
        
        if (index !== -1) {
            if (users[index].password !== passwordData.oldPassword) {
                throw new Error('Incorrect old password');
            }
            users[index].password = passwordData.newPassword;
            saveCollection('users', users);
            return { success: true };
        }
        throw new Error('User not found');
    }
};

// ============================================
// MEMBERS API
// ============================================
window.membersAPI = {
    async getAll(page, limit) {
        const members = getCollection('members');
        const filtered = members.filter(m => m.is_active !== 0);
        return {
            data: filtered,
            pagination: { total: filtered.length, page: page || 1, limit: limit || 100 }
        };
    },

    async stats() {
        const members = getCollection('members');
        const activeMembers = members.filter(m => m.is_active !== 0);
        return {
            total: activeMembers.length,
            active: activeMembers.filter(m => m.membership_status === 'active').length,
            inactive: activeMembers.filter(m => m.membership_status !== 'active').length
        };
    },

    async getById(id) {
        const members = getCollection('members');
        const member = members.find(m => m.id === id && m.is_active !== 0);
        if (!member) throw new Error('Member not found');
        return { data: member };
    },

    async search(query) {
        const members = getCollection('members');
        const filtered = members.filter(m => {
            if (m.is_active === 0) return false;
            const searchText = `${m.first_name} ${m.last_name} ${m.email} ${m.phone}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });
        return { data: filtered };
    },

    async add(memberData) {
        const members = getCollection('members');
        const users = getCollection('users');
        
        const newMember = {
            id: generateId(),
            ...memberData,
            is_active: 1,
            membership_status: 'active',
            created_at: new Date().toISOString()
        };
        
        // Also create user record
        const newUser = {
            id: newMember.id,
            email: memberData.email,
            username: memberData.username,
            first_name: memberData.first_name,
            last_name: memberData.last_name,
            phone: memberData.phone,
            password: memberData.password,
            role: 'member',
            is_active: 1,
            created_at: new Date().toISOString()
        };
        
        members.push(newMember);
        users.push(newUser);
        
        saveCollection('members', members);
        saveCollection('users', users);
        
        return newMember;
    },

    async update(id, memberData) {
        const members = getCollection('members');
        const index = members.findIndex(m => m.id === id);
        
        if (index !== -1) {
            members[index] = { ...members[index], ...memberData };
            saveCollection('members', members);
            return members[index];
        }
        throw new Error('Member not found');
    },

    async delete(id) {
        const members = getCollection('members');
        const index = members.findIndex(m => m.id === id);
        
        if (index !== -1) {
            members[index].is_active = 0;
            saveCollection('members', members);
            return { success: true };
        }
        throw new Error('Member not found');
    }
};

// ============================================
// BILLS API
// ============================================
window.billsAPI = {
    async getAll(page, limit) {
        const bills = getCollection('bills');
        return {
            data: bills,
            pagination: { total: bills.length, page: page || 1, limit: limit || 100 }
        };
    },

    async getByMember(memberId, page, limit) {
        const bills = getCollection('bills');
        const filtered = bills.filter(b => b.member_id === memberId);
        return {
            data: filtered,
            pagination: { total: filtered.length, page: page || 1, limit: limit || 100 }
        };
    },

    async create(billData) {
        const bills = getCollection('bills');
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
        console.log('Bill created:', newBill); // Debug log
        console.log('All bills after creation:', bills); // Debug all bills
        return newBill;
    },

    async getById(id) {
        const bills = getCollection('bills');
        const bill = bills.find(b => b.id === id);
        if (!bill) {
            throw new Error('Bill not found');
        }
        return { data: bill };
    },

    async update(id, billData) {
        const bills = getCollection('bills');
        const index = bills.findIndex(b => b.id === id);
        
        if (index !== -1) {
            bills[index] = { ...bills[index], ...billData };
            saveCollection('bills', bills);
            return bills[index];
        }
        throw new Error('Bill not found');
    },

    async delete(id) {
        const bills = getCollection('bills');
        const filtered = bills.filter(b => b.id !== id);
        saveCollection('bills', filtered);
        return { success: true };
    }
};

// ============================================
// PAYMENTS API
// ============================================
window.paymentsAPI = {
    async list(params = {}) {
        let payments = getCollection('payments');
        
        if (params.member_id) {
            payments = payments.filter(p => p.member_id === params.member_id);
        }
        
        return payments;
    },

    async getAll(page, limit) {
        const payments = getCollection('payments');
        return {
            data: payments,
            pagination: { total: payments.length, page: page || 1, limit: limit || 100 }
        };
    },

    async getByMember(memberId, page, limit) {
        const payments = getCollection('payments');
        const filtered = payments.filter(p => p.member_id === memberId);
        return {
            data: filtered,
            pagination: { total: filtered.length, page: page || 1, limit: limit || 100 }
        };
    },

    async stats() {
        const payments = getCollection('payments');
        let totalAmount = 0;
        payments.forEach(p => {
            totalAmount += parseFloat(p.amount || 0);
        });
        return {
            total: payments.length,
            totalAmount: totalAmount.toFixed(2)
        };
    },

    async create(paymentData) {
        const payments = getCollection('payments');
        const newPayment = {
            id: generateId(),
            ...paymentData,
            status: 'completed',
            payment_date: new Date().toISOString()
        };
        
        payments.push(newPayment);
        saveCollection('payments', payments);
        return newPayment;
    }
};

// ============================================
// FEE PACKAGES API
// ============================================
window.feePackagesAPI = {
    async getAll() {
        const packages = getCollection('fee_packages').filter(p => p.is_active !== 0);
        return { data: packages };
    },

    async create(packageData) {
        const packages = getCollection('fee_packages');
        const newPackage = {
            id: generateId(),
            ...packageData,
            is_active: 1,
            created_at: new Date().toISOString()
        };
        
        packages.push(newPackage);
        saveCollection('fee_packages', packages);
        return newPackage;
    },

    async update(id, packageData) {
        const packages = getCollection('fee_packages');
        const index = packages.findIndex(p => p.id === id);
        
        if (index !== -1) {
            packages[index] = { ...packages[index], ...packageData };
            saveCollection('fee_packages', packages);
            return packages[index];
        }
        throw new Error('Package not found');
    },

    async delete(id) {
        const packages = getCollection('fee_packages');
        const index = packages.findIndex(p => p.id === id);
        
        if (index !== -1) {
            packages[index].is_active = 0;
            saveCollection('fee_packages', packages);
            return { success: true };
        }
        throw new Error('Package not found');
    }
};

// ============================================
// SUBSCRIPTIONS API
// ============================================
window.subscriptionsAPI = {
    async getAll() {
        return getCollection('subscriptions');
    },

    async listByMember(memberId) {
        const subscriptions = getCollection('subscriptions');
        const filtered = subscriptions.filter(s => s.member_id === memberId);
        return { data: filtered };
    },

    async assign(subscriptionData) {
        const subscriptions = getCollection('subscriptions');
        const newSubscription = {
            id: generateId(),
            ...subscriptionData,
            status: 'active',
            created_at: new Date().toISOString()
        };
        
        subscriptions.push(newSubscription);
        saveCollection('subscriptions', subscriptions);
        return newSubscription;
    },

    async create(subscriptionData) {
        const subscriptions = getCollection('subscriptions');
        const newSubscription = {
            id: generateId(),
            ...subscriptionData,
            status: 'active',
            created_at: new Date().toISOString()
        };
        
        subscriptions.push(newSubscription);
        saveCollection('subscriptions', subscriptions);
        return newSubscription;
    }
};

// ============================================
// NOTIFICATIONS API
// ============================================
window.notificationsAPI = {
    async listByUser(userId) {
        const user = userId ? { id: userId } : JSON.parse(localStorage.getItem('user') || '{}');
        const notifications = getCollection('notifications');
        const filtered = notifications.filter(n => n.user_id === user.id).slice(0, 50);
        return { data: filtered };
    },

    async unreadCount(userId) {
        const user = userId ? { id: userId } : JSON.parse(localStorage.getItem('user') || '{}');
        const notifications = getCollection('notifications');
        const unread = notifications.filter(n => n.user_id === user.id && n.is_read === 0);
        return { count: unread.length };
    },

    async markRead(id) {
        return this.markAsRead(id);
    },

    async markAsRead(id) {
        const notifications = getCollection('notifications');
        const index = notifications.findIndex(n => n.id === id);
        
        if (index !== -1) {
            notifications[index].is_read = 1;
            notifications[index].read_at = new Date().toISOString();
            saveCollection('notifications', notifications);
            return { success: true };
        }
        throw new Error('Notification not found');
    },

    async create(notificationData) {
        const notifications = getCollection('notifications');
        const newNotification = {
            id: generateId(),
            ...notificationData,
            is_read: 0,
            created_at: new Date().toISOString()
        };
        
        notifications.push(newNotification);
        saveCollection('notifications', notifications);
        return { id: newNotification.id };
    },

    async seedMonthly() {
        const members = getCollection('members').filter(m => m.is_active !== 0);
        const notifications = getCollection('notifications');
        let count = 0;
        
        members.forEach(member => {
            const notif = {
                id: generateId(),
                user_id: member.id,
                title: 'Monthly Payment Reminder',
                message: `Your monthly gym fee is due. Please make a payment at your earliest convenience.`,
                type: 'payment_due',
                is_read: 0,
                created_at: new Date().toISOString()
            };
            notifications.push(notif);
            count++;
        });
        
        saveCollection('notifications', notifications);
        return { count };
    }
};

// ============================================
// DIET API
// ============================================
window.dietAPI = {
    async listAll() {
        const diets = getCollection('diets');
        return { data: diets };
    },

    async listByMember(memberId) {
        const diets = getCollection('diets');
        const filtered = diets.filter(d => d.member_id === memberId);
        return { data: filtered };
    },

    async getById(id) {
        const diets = getCollection('diets');
        const diet = diets.find(d => d.id === id);
        if (!diet) throw new Error('Diet not found');
        return { data: diet };
    },

    async create(dietData) {
        const diets = getCollection('diets');
        const newDiet = {
            id: generateId(),
            ...dietData,
            created_at: new Date().toISOString()
        };
        
        diets.push(newDiet);
        saveCollection('diets', diets);
        return newDiet;
    },

    async update(id, dietData) {
        const diets = getCollection('diets');
        const index = diets.findIndex(d => d.id === id);
        
        if (index !== -1) {
            diets[index] = { ...diets[index], ...dietData };
            saveCollection('diets', diets);
            return diets[index];
        }
        throw new Error('Diet not found');
    },

    async delete(id) {
        const diets = getCollection('diets');
        const filtered = diets.filter(d => d.id !== id);
        saveCollection('diets', filtered);
        return { success: true };
    }
};

// ============================================
// STORE (SUPPLEMENTS) API
// ============================================
window.storeAPI = {
    async listSupplements() {
        return getCollection('supplements');
    },

    async getAll() {
        return { data: getCollection('supplements') };
    },

    async getById(id) {
        const supplements = getCollection('supplements');
        const supplement = supplements.find(s => s.id === id);
        if (!supplement) throw new Error('Supplement not found');
        return { data: supplement };
    },

    async create(supplementData) {
        const supplements = getCollection('supplements');
        const newSupplement = {
            id: generateId(),
            ...supplementData,
            created_at: new Date().toISOString()
        };
        
        supplements.push(newSupplement);
        saveCollection('supplements', supplements);
        return newSupplement;
    },

    async update(id, supplementData) {
        const supplements = getCollection('supplements');
        const index = supplements.findIndex(s => s.id === id);
        
        if (index !== -1) {
            supplements[index] = { ...supplements[index], ...supplementData };
            saveCollection('supplements', supplements);
            return supplements[index];
        }
        throw new Error('Supplement not found');
    },

    async updateSupplement(id, supplementData) {
        return this.update(id, supplementData);
    },

    async delete(id) {
        const supplements = getCollection('supplements');
        const filtered = supplements.filter(s => s.id !== id);
        saveCollection('supplements', filtered);
        return { success: true };
    },

    async deleteSupplement(id) {
        return this.delete(id);
    }
};

// ============================================
// REPORTS API
// ============================================
window.reportsAPI = {
    async exportBills() {
        const bills = getCollection('bills');
        const members = getCollection('members');
        
        // Create CSV content
        let csv = 'Bill Number,Member,Amount,Tax,Total,Status,Date\n';
        bills.forEach(bill => {
            const member = members.find(m => m.id === bill.member_id);
            const memberName = member ? `${member.first_name} ${member.last_name}` : 'Unknown';
            const amount = parseFloat(bill.amount || 0);
            const tax = parseFloat(bill.tax || 0);
            const total = amount + (amount * tax / 100);
            csv += `${bill.bill_number},${memberName},${amount.toFixed(2)},${tax.toFixed(2)},${total.toFixed(2)},${bill.status},${bill.created_at}\n`;
        });
        
        // Create blob and return
        const blob = new Blob([csv], { type: 'text/csv' });
        return blob;
    },

    async export() {
        const members = getCollection('members');
        const bills = getCollection('bills');
        const payments = getCollection('payments');

        let totalRevenue = 0;
        payments.forEach(p => {
            totalRevenue += parseFloat(p.amount || 0);
        });

        return {
            summary: {
                totalMembers: members.filter(m => m.is_active !== 0).length,
                totalBills: bills.length,
                totalPayments: payments.length,
                totalRevenue: totalRevenue.toFixed(2)
            },
            bills: bills
        };
    }
};

// Initialize with sample data if empty
function initializeSampleData() {
    // Check if we already have data
    if (getCollection('users').length > 0) {
        console.log('✅ LocalStorage already has data');
        return;
    }
    
    console.log('📝 Initializing sample data...');
    
    // Create admin user
    const users = [{
        id: 'admin-' + generateId(),
        email: 'admin@gym.com',
        password: 'admin123',
        username: 'admin',
        first_name: 'Admin',
        last_name: 'User',
        phone: '+1234567890',
        role: 'admin',
        is_active: 1,
        created_at: new Date().toISOString()
    }];
    
    // Create sample fee packages
    const packages = [
        {
            id: generateId(),
            name: 'Monthly Basic',
            description: 'Basic gym access for 1 month',
            amount: 50,
            duration_days: 30,
            is_active: 1,
            created_at: new Date().toISOString()
        },
        {
            id: generateId(),
            name: 'Monthly Premium',
            description: 'Full gym access + trainer for 1 month',
            amount: 100,
            duration_days: 30,
            is_active: 1,
            created_at: new Date().toISOString()
        }
    ];
    
    saveCollection('users', users);
    saveCollection('fee_packages', packages);
    saveCollection('members', []);
    saveCollection('bills', []);
    saveCollection('payments', []);
    saveCollection('subscriptions', []);
    saveCollection('notifications', []);
    saveCollection('diets', []);
    saveCollection('supplements', []);
    
    console.log('✅ Sample data initialized!');
}

// Initialize on load
initializeSampleData();

console.log('✅ LocalStorage API initialized - All data stored in browser!');
