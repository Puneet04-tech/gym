/**
 * Smart Hybrid API - Automatically chooses Firebase or localStorage
 * Prioritizes Firebase, falls back to localStorage
 */

console.log('🔥 Initializing Smart Hybrid API...');

// Check which backend to use
let useFirebase = false;
let backendType = 'localStorage';

// Test Firebase availability
try {
    if (typeof firebase !== 'undefined' && firebase.firestore && auth) {
        // Test Firebase with a simple operation
        const testDb = firebase.firestore();
        useFirebase = true;
        backendType = 'firebase';
        console.log('🔥 Firebase available - Using Firebase Firestore');
    } else {
        console.log('🔥 Firebase not available - Using localStorage');
    }
} catch (error) {
    console.warn('🔥 Firebase test failed - Using localStorage:', error.message);
}

// Helper: Generate unique ID
const smartGenerateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Helper: Handle errors
const handleError = (error, operation) => {
    console.error(`${operation} error:`, error);
    throw new Error(error.message || `${operation} failed`);
};

// Helper: Get collection from localStorage
const getLocalCollection = (name) => {
    try {
        return JSON.parse(localStorage.getItem(name) || '[]');
    } catch (error) {
        console.warn(`Failed to get ${name} from localStorage:`, error);
        return [];
    }
};

// Helper: Save collection to localStorage
const saveLocalCollection = (name, data) => {
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
        if (useFirebase) {
            try {
                const result = await auth.signInWithEmailAndPassword(credentials.email, credentials.password);
                const user = result.user;
                
                // Get user data from Firestore
                const userDoc = await db.collection('users').doc(user.uid).get();
                const userData = userDoc.data();
                
                if (!userData) {
                    // Create user profile if it doesn't exist
                    const userProfile = {
                        first_name: credentials.email.split('@')[0],
                        last_name: 'User',
                        username: credentials.email.split('@')[0],
                        email: credentials.email,
                        role: 'member',
                        is_active: 1,
                        created_at: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    await db.collection('users').doc(user.uid).set(userProfile);
                    
                    return {
                        token: await user.getIdToken(),
                        user: {
                            id: user.uid,
                            email: user.email,
                            ...userProfile
                        }
                    };
                }
                
                return {
                    token: await user.getIdToken(),
                    user: {
                        id: user.uid,
                        email: user.email,
                        ...userData
                    }
                };
            } catch (error) {
                console.warn('Firebase login failed, falling back to localStorage:', error.message);
                // Fall back to localStorage
                return await this.loginLocalStorage(credentials);
            }
        } else {
            return await this.loginLocalStorage(credentials);
        }
    },

    async loginLocalStorage(credentials) {
        try {
            const users = getLocalCollection('users');
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
        if (useFirebase) {
            try {
                const result = await auth.createUserWithEmailAndPassword(userData.email, userData.password);
                const user = result.user;
                
                const userProfile = {
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    username: userData.username,
                    email: userData.email,
                    role: 'member',
                    is_active: 1,
                    created_at: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                await db.collection('users').doc(user.uid).set(userProfile);
                
                return {
                    token: await user.getIdToken(),
                    user: {
                        id: user.uid,
                        email: user.email,
                        ...userProfile
                    }
                };
            } catch (error) {
                console.warn('Firebase registration failed, falling back to localStorage:', error.message);
                return await this.registerLocalStorage(userData);
            }
        } else {
            return await this.registerLocalStorage(userData);
        }
    },

    async registerLocalStorage(userData) {
        try {
            const users = getLocalCollection('users');
            
            if (users.find(u => u.email === userData.email)) {
                throw new Error('Email already registered');
            }
            
            const newUser = {
                id: smartGenerateId(),
                ...userData,
                role: 'member',
                is_active: 1,
                created_at: new Date().toISOString()
            };
            
            users.push(newUser);
            saveLocalCollection('users', users);
            
            return {
                token: btoa(`${newUser.email}:${Date.now()}`),
                user: newUser
            };
        } catch (error) {
            throw new Error(error.message || 'Registration failed');
        }
    },

    async logout() {
        if (useFirebase) {
            try {
                await auth.signOut();
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                return { success: true };
            } catch (error) {
                console.warn('Firebase logout failed, using localStorage only:', error.message);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                return { success: true };
            }
        } else {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            return { success: true };
        }
    },

    async getProfile() {
        if (useFirebase) {
            try {
                const user = auth.currentUser;
                if (!user) {
                    throw new Error('Not authenticated');
                }
                
                const userDoc = await db.collection('users').doc(user.uid).get();
                const userData = userDoc.data();
                
                return { 
                    user: {
                        id: user.uid,
                        email: user.email,
                        ...userData
                    }
                };
            } catch (error) {
                console.warn('Firebase getProfile failed, falling back to localStorage:', error.message);
                return this.getProfileLocalStorage();
            }
        } else {
            return this.getProfileLocalStorage();
        }
    },

    async getProfileLocalStorage() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return { user };
        } catch (error) {
            throw new Error(error.message || 'Failed to get profile');
        }
    }
};

// ============================================
// BILLS API
// ============================================
window.billsAPI = {
    async getAll(page, limit) {
        if (useFirebase) {
            try {
                console.log('Loading all bills from Firebase...');
                const snapshot = await db.collection('bills')
                    .orderBy('created_at', 'desc')
                    .get();
                
                const bills = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                console.log('Loaded bills from Firebase:', bills);
                return {
                    data: bills,
                    pagination: { total: bills.length, page: page || 1, limit: limit || 100 }
                };
            } catch (error) {
                console.warn('Firebase bills failed, falling back to localStorage:', error.message);
                return await this.getAllLocalStorage(page, limit);
            }
        } else {
            return await this.getAllLocalStorage(page, limit);
        }
    },

    async getAllLocalStorage(page, limit) {
        try {
            console.log('Loading all bills from localStorage...');
            const bills = getLocalCollection('bills');
            console.log('Loaded bills from localStorage:', bills);
            
            return {
                data: bills,
                pagination: { total: bills.length, page: page || 1, limit: limit || 100 }
            };
        } catch (error) {
            handleError(error, 'Get bills');
        }
    },

    async getByMember(memberId, page, limit) {
        if (useFirebase) {
            try {
                const snapshot = await db.collection('bills')
                    .where('member_id', '==', memberId)
                    .orderBy('created_at', 'desc')
                    .get();
                
                const bills = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                return {
                    data: bills,
                    pagination: { total: bills.length, page: page || 1, limit: limit || 100 }
                };
            } catch (error) {
                console.warn('Firebase member bills failed, falling back to localStorage:', error.message);
                return await this.getByMemberLocalStorage(memberId, page, limit);
            }
        } else {
            return await this.getByMemberLocalStorage(memberId, page, limit);
        }
    },

    async getByMemberLocalStorage(memberId, page, limit) {
        try {
            const bills = getLocalCollection('bills');
            const filtered = bills.filter(b => b.member_id === memberId);
            
            return {
                data: filtered,
                pagination: { total: filtered.length, page: page || 1, limit: limit || 100 }
            };
        } catch (error) {
            handleError(error, 'Get member bills');
        }
    },

    async create(billData) {
        if (useFirebase) {
            try {
                console.log('Creating bill in Firebase with data:', billData);
                
                const newBill = {
                    ...billData,
                    status: 'pending',
                    created_at: firebase.firestore.FieldValue.serverTimestamp(),
                    bill_date: billData.bill_date || new Date().toISOString().split('T')[0],
                    total: parseFloat(billData.amount) + (parseFloat(billData.amount) * (parseFloat(billData.tax || 0) / 100))
                };
                
                const docRef = await db.collection('bills').add(newBill);
                const createdBill = { id: docRef.id, ...newBill };
                
                console.log('Bill created in Firebase:', createdBill);
                return createdBill;
            } catch (error) {
                console.warn('Firebase bill creation failed, falling back to localStorage:', error.message);
                return await this.createLocalStorage(billData);
            }
        } else {
            return await this.createLocalStorage(billData);
        }
    },

    async createLocalStorage(billData) {
        try {
            console.log('Creating bill in localStorage with data:', billData);
            const bills = getLocalCollection('bills');
            
            const newBill = {
                id: smartGenerateId(),
                bill_number: `BILL-${Date.now()}`,
                ...billData,
                status: 'pending',
                created_at: new Date().toISOString(),
                bill_date: billData.bill_date || new Date().toISOString().split('T')[0],
                total: parseFloat(billData.amount) + (parseFloat(billData.amount) * (parseFloat(billData.tax || 0) / 100))
            };
            
            bills.push(newBill);
            saveLocalCollection('bills', bills);
            
            console.log('Bill created in localStorage:', newBill);
            return newBill;
        } catch (error) {
            handleError(error, 'Create bill');
        }
    },

    async getById(id) {
        if (useFirebase) {
            try {
                const doc = await db.collection('bills').doc(id).get();
                if (!doc.exists) {
                    throw new Error('Bill not found');
                }
                return { data: { id: doc.id, ...doc.data() } };
            } catch (error) {
                console.warn('Firebase get bill failed, falling back to localStorage:', error.message);
                return await this.getByIdLocalStorage(id);
            }
        } else {
            return await this.getByIdLocalStorage(id);
        }
    },

    async getByIdLocalStorage(id) {
        try {
            const bills = getLocalCollection('bills');
            const bill = bills.find(b => b.id === id);
            
            if (!bill) {
                throw new Error('Bill not found');
            }
            
            return { data: bill };
        } catch (error) {
            handleError(error, 'Get bill');
        }
    }
};

// ============================================
// MEMBERS API
// ============================================
window.membersAPI = {
    async getAll(page, limit) {
        if (useFirebase) {
            try {
                const snapshot = await db.collection('users')
                    .where('role', '!=', 'admin')
                    .where('is_active', '==', 1)
                    .orderBy('role')
                    .orderBy('created_at', 'desc')
                    .get();
                
                const members = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                return {
                    data: members,
                    pagination: { total: members.length, page: page || 1, limit: limit || 100 }
                };
            } catch (error) {
                console.warn('Firebase members failed, falling back to localStorage:', error.message);
                return await this.getAllLocalStorage(page, limit);
            }
        } else {
            return await this.getAllLocalStorage(page, limit);
        }
    },

    async getAllLocalStorage(page, limit) {
        try {
            const users = getLocalCollection('users');
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
        if (useFirebase) {
            try {
                const snapshot = await db.collection('users')
                    .where('role', '!=', 'admin')
                    .where('is_active', '==', 1)
                    .get();
                
                const members = snapshot.docs.map(doc => doc.data());
                const activeMembers = members.filter(m => m.membership_status === 'active');
                
                return {
                    total: members.length,
                    active: activeMembers.length,
                    inactive: members.filter(m => m.membership_status !== 'active').length
                };
            } catch (error) {
                console.warn('Firebase member stats failed, falling back to localStorage:', error.message);
                return await this.statsLocalStorage();
            }
        } else {
            return await this.statsLocalStorage();
        }
    },

    async statsLocalStorage() {
        try {
            const users = getLocalCollection('users');
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
    }
};

// ============================================
// PAYMENTS API
// ============================================
window.paymentsAPI = {
    async getAll(page, limit) {
        if (useFirebase) {
            try {
                const snapshot = await db.collection('payments')
                    .orderBy('created_at', 'desc')
                    .get();
                
                const payments = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                return {
                    data: payments,
                    pagination: { total: payments.length, page: page || 1, limit: limit || 100 }
                };
            } catch (error) {
                console.warn('Firebase payments failed, falling back to localStorage:', error.message);
                return await this.getAllLocalStorage(page, limit);
            }
        } else {
            return await this.getAllLocalStorage(page, limit);
        }
    },

    async getAllLocalStorage(page, limit) {
        try {
            const payments = getLocalCollection('payments');
            
            return {
                data: payments,
                pagination: { total: payments.length, page: page || 1, limit: limit || 100 }
            };
        } catch (error) {
            handleError(error, 'Get payments');
        }
    },

    async getByMember(memberId, page, limit) {
        if (useFirebase) {
            try {
                const snapshot = await db.collection('payments')
                    .where('member_id', '==', memberId)
                    .orderBy('created_at', 'desc')
                    .get();
                
                const payments = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                return {
                    data: payments,
                    pagination: { total: payments.length, page: page || 1, limit: limit || 100 }
                };
            } catch (error) {
                console.warn('Firebase member payments failed, falling back to localStorage:', error.message);
                return await this.getByMemberLocalStorage(memberId, page, limit);
            }
        } else {
            return await this.getByMemberLocalStorage(memberId, page, limit);
        }
    },

    async getByMemberLocalStorage(memberId, page, limit) {
        try {
            const payments = getLocalCollection('payments');
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
        if (useFirebase) {
            try {
                const newPayment = {
                    ...paymentData,
                    created_at: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                const docRef = await db.collection('payments').add(newPayment);
                return { id: docRef.id, ...newPayment };
            } catch (error) {
                console.warn('Firebase payment creation failed, falling back to localStorage:', error.message);
                return await this.createLocalStorage(paymentData);
            }
        } else {
            return await this.createLocalStorage(paymentData);
        }
    },

    async createLocalStorage(paymentData) {
        try {
            const payments = getLocalCollection('payments');
            const newPayment = {
                id: smartGenerateId(),
                ...paymentData,
                created_at: new Date().toISOString()
            };
            
            payments.push(newPayment);
            saveLocalCollection('payments', payments);
            
            return newPayment;
        } catch (error) {
            handleError(error, 'Create payment');
        }
    },

    async stats() {
        if (useFirebase) {
            try {
                const snapshot = await db.collection('payments').get();
                const payments = snapshot.docs.map(doc => doc.data());
                return { total: payments.length };
            } catch (error) {
                console.warn('Firebase payment stats failed, falling back to localStorage:', error.message);
                return await this.statsLocalStorage();
            }
        } else {
            return await this.statsLocalStorage();
        }
    },

    async statsLocalStorage() {
        try {
            const payments = getLocalCollection('payments');
            return { total: payments.length };
        } catch (error) {
            handleError(error, 'Get payment stats');
        }
    }
};

// ============================================
// STORE API
// ============================================
window.storeAPI = {
    async getAll() {
        if (useFirebase) {
            try {
                const snapshot = await db.collection('supplements')
                    .orderBy('name')
                    .get();
                
                const supplements = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                return { data: supplements };
            } catch (error) {
                console.warn('Firebase supplements failed, falling back to localStorage:', error.message);
                return await this.getAllLocalStorage();
            }
        } else {
            return await this.getAllLocalStorage();
        }
    },

    async getAllLocalStorage() {
        try {
            const supplements = getLocalCollection('supplements');
            return { data: supplements };
        } catch (error) {
            handleError(error, 'Get supplements');
        }
    },

    async create(supplementData) {
        if (useFirebase) {
            try {
                const newSupplement = {
                    ...supplementData,
                    created_at: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                const docRef = await db.collection('supplements').add(newSupplement);
                return { id: docRef.id, ...newSupplement };
            } catch (error) {
                console.warn('Firebase supplement creation failed, falling back to localStorage:', error.message);
                return await this.createLocalStorage(supplementData);
            }
        } else {
            return await this.createLocalStorage(supplementData);
        }
    },

    async createLocalStorage(supplementData) {
        try {
            const supplements = getLocalCollection('supplements');
            const newSupplement = {
                id: smartGenerateId(),
                ...supplementData,
                created_at: new Date().toISOString()
            };
            
            supplements.push(newSupplement);
            saveLocalCollection('supplements', supplements);
            
            return newSupplement;
        } catch (error) {
            handleError(error, 'Create supplement');
        }
    }
};

// ============================================
// DIET API
// ============================================
window.dietAPI = {
    async listAll() {
        if (useFirebase) {
            try {
                const snapshot = await db.collection('diets')
                    .orderBy('created_at', 'desc')
                    .get();
                
                const diets = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                return { data: diets };
            } catch (error) {
                console.warn('Firebase diets failed, falling back to localStorage:', error.message);
                return await this.listAllLocalStorage();
            }
        } else {
            return await this.listAllLocalStorage();
        }
    },

    async listAllLocalStorage() {
        try {
            const diets = getLocalCollection('diets');
            return { data: diets };
        } catch (error) {
            handleError(error, 'Get diets');
        }
    },

    async listByMember(memberId) {
        if (useFirebase) {
            try {
                const snapshot = await db.collection('diets')
                    .where('member_id', '==', memberId)
                    .orderBy('created_at', 'desc')
                    .get();
                
                const diets = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                return { data: diets };
            } catch (error) {
                console.warn('Firebase member diets failed, falling back to localStorage:', error.message);
                return await this.listByMemberLocalStorage(memberId);
            }
        } else {
            return await this.listByMemberLocalStorage(memberId);
        }
    },

    async listByMemberLocalStorage(memberId) {
        try {
            const diets = getLocalCollection('diets');
            const filtered = diets.filter(d => d.member_id === memberId);
            return { data: filtered };
        } catch (error) {
            handleError(error, 'Get member diets');
        }
    },

    async create(dietData) {
        if (useFirebase) {
            try {
                const newDiet = {
                    ...dietData,
                    created_at: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                const docRef = await db.collection('diets').add(newDiet);
                return { id: docRef.id, ...newDiet };
            } catch (error) {
                console.warn('Firebase diet creation failed, falling back to localStorage:', error.message);
                return await this.createLocalStorage(dietData);
            }
        } else {
            return await this.createLocalStorage(dietData);
        }
    },

    async createLocalStorage(dietData) {
        try {
            const diets = getLocalCollection('diets');
            const newDiet = {
                id: smartGenerateId(),
                ...dietData,
                created_at: new Date().toISOString()
            };
            
            diets.push(newDiet);
            saveLocalCollection('diets', diets);
            
            return newDiet;
        } catch (error) {
            handleError(error, 'Create diet');
        }
    }
};

// ============================================
// FEE PACKAGES API
// ============================================
window.feePackagesAPI = {
    async getAll() {
        if (useFirebase) {
            try {
                const snapshot = await db.collection('fee_packages')
                    .orderBy('name')
                    .get();
                
                const packages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                return { data: packages };
            } catch (error) {
                console.warn('Firebase fee packages failed, falling back to localStorage:', error.message);
                return await this.getAllLocalStorage();
            }
        } else {
            return await this.getAllLocalStorage();
        }
    },

    async getAllLocalStorage() {
        try {
            const packages = getLocalCollection('fee_packages');
            return { data: packages };
        } catch (error) {
            handleError(error, 'Get fee packages');
        }
    },

    async create(packageData) {
        if (useFirebase) {
            try {
                const newPackage = {
                    ...packageData,
                    created_at: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                const docRef = await db.collection('fee_packages').add(newPackage);
                return { id: docRef.id, ...newPackage };
            } catch (error) {
                console.warn('Firebase fee package creation failed, falling back to localStorage:', error.message);
                return await this.createLocalStorage(packageData);
            }
        } else {
            return await this.createLocalStorage(packageData);
        }
    },

    async createLocalStorage(packageData) {
        try {
            const packages = getLocalCollection('fee_packages');
            const newPackage = {
                id: smartGenerateId(),
                ...packageData,
                created_at: new Date().toISOString()
            };
            
            packages.push(newPackage);
            saveLocalCollection('fee_packages', packages);
            
            return newPackage;
        } catch (error) {
            handleError(error, 'Create fee package');
        }
    }
};

// ============================================
// SUBSCRIPTIONS API
// ============================================
window.subscriptionsAPI = {
    async getAll() {
        if (useFirebase) {
            try {
                const snapshot = await db.collection('subscriptions')
                    .orderBy('created_at', 'desc')
                    .get();
                
                const subscriptions = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                return { data: subscriptions };
            } catch (error) {
                console.warn('Firebase subscriptions failed, falling back to localStorage:', error.message);
                return await this.getAllLocalStorage();
            }
        } else {
            return await this.getAllLocalStorage();
        }
    },

    async getAllLocalStorage() {
        try {
            const subscriptions = getLocalCollection('subscriptions');
            return { data: subscriptions };
        } catch (error) {
            handleError(error, 'Get subscriptions');
        }
    },

    async listByMember(memberId) {
        if (useFirebase) {
            try {
                const snapshot = await db.collection('subscriptions')
                    .where('member_id', '==', memberId)
                    .orderBy('created_at', 'desc')
                    .get();
                
                const subscriptions = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                return { data: subscriptions };
            } catch (error) {
                console.warn('Firebase member subscriptions failed, falling back to localStorage:', error.message);
                return await this.listByMemberLocalStorage(memberId);
            }
        } else {
            return await this.listByMemberLocalStorage(memberId);
        }
    },

    async listByMemberLocalStorage(memberId) {
        try {
            const subscriptions = getLocalCollection('subscriptions');
            const filtered = subscriptions.filter(s => s.member_id === memberId);
            return { data: filtered };
        } catch (error) {
            handleError(error, 'Get member subscriptions');
        }
    },

    async create(subscriptionData) {
        if (useFirebase) {
            try {
                const newSubscription = {
                    ...subscriptionData,
                    created_at: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                const docRef = await db.collection('subscriptions').add(newSubscription);
                return { id: docRef.id, ...newSubscription };
            } catch (error) {
                console.warn('Firebase subscription creation failed, falling back to localStorage:', error.message);
                return await this.createLocalStorage(subscriptionData);
            }
        } else {
            return await this.createLocalStorage(subscriptionData);
        }
    },

    async createLocalStorage(subscriptionData) {
        try {
            const subscriptions = getLocalCollection('subscriptions');
            const newSubscription = {
                id: smartGenerateId(),
                ...subscriptionData,
                created_at: new Date().toISOString()
            };
            
            subscriptions.push(newSubscription);
            saveLocalCollection('subscriptions', subscriptions);
            
            return newSubscription;
        } catch (error) {
            handleError(error, 'Create subscription');
        }
    }
};

// ============================================
// NOTIFICATIONS API
// ============================================
window.notificationsAPI = {
    async getAll(page, limit) {
        if (useFirebase) {
            try {
                const user = auth.currentUser;
                if (!user) return { data: [], pagination: { total: 0, page: 1, limit: 100 } };
                
                const snapshot = await db.collection('notifications')
                    .where('user_id', '==', user.uid)
                    .orderBy('created_at', 'desc')
                    .get();
                
                const notifications = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                return {
                    data: notifications,
                    pagination: { total: notifications.length, page: page || 1, limit: limit || 100 }
                };
            } catch (error) {
                console.warn('Firebase notifications failed, falling back to localStorage:', error.message);
                return await this.getAllLocalStorage(page, limit);
            }
        } else {
            return await this.getAllLocalStorage(page, limit);
        }
    },

    async listByUser(userId, page, limit) {
        if (useFirebase) {
            try {
                const snapshot = await db.collection('notifications')
                    .where('user_id', '==', userId)
                    .orderBy('created_at', 'desc')
                    .get();
                
                const notifications = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                return {
                    data: notifications,
                    pagination: { total: notifications.length, page: page || 1, limit: limit || 100 }
                };
            } catch (error) {
                console.warn('Firebase user notifications failed, falling back to localStorage:', error.message);
                return await this.listByUserLocalStorage(userId, page, limit);
            }
        } else {
            return await this.listByUserLocalStorage(userId, page, limit);
        }
    },

    async listByUserLocalStorage(userId, page, limit) {
        try {
            const notifications = getLocalCollection('notifications');
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
        if (useFirebase) {
            try {
                const snapshot = await db.collection('notifications')
                    .where('user_id', '==', userId)
                    .where('read', '==', false)
                    .get();
                
                return { count: snapshot.size };
            } catch (error) {
                console.warn('Firebase unread count failed, falling back to localStorage:', error.message);
                return await this.unreadCountLocalStorage(userId);
            }
        } else {
            return await this.unreadCountLocalStorage(userId);
        }
    },

    async unreadCountLocalStorage(userId) {
        try {
            const notifications = getLocalCollection('notifications');
            const unread = notifications.filter(n => !n.read && n.user_id === userId);
            return { count: unread.length };
        } catch (error) {
            handleError(error, 'Get unread count');
        }
    },

    async markRead(id) {
        if (useFirebase) {
            try {
                await db.collection('notifications').doc(id).update({ read: true });
                return { success: true };
            } catch (error) {
                console.warn('Firebase mark read failed, falling back to localStorage:', error.message);
                return await this.markReadLocalStorage(id);
            }
        } else {
            return await this.markReadLocalStorage(id);
        }
    },

    async markReadLocalStorage(id) {
        try {
            const notifications = getLocalCollection('notifications');
            const notification = notifications.find(n => n.id === id);
            
            if (notification) {
                notification.read = true;
                saveLocalCollection('notifications', notifications);
            }
            
            return { success: true };
        } catch (error) {
            handleError(error, 'Mark notification read');
        }
    },

    async create(notificationData) {
        if (useFirebase) {
            try {
                const newNotification = {
                    ...notificationData,
                    read: false,
                    created_at: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                const docRef = await db.collection('notifications').add(newNotification);
                return { id: docRef.id, ...newNotification };
            } catch (error) {
                console.warn('Firebase notification creation failed, falling back to localStorage:', error.message);
                return await this.createLocalStorage(notificationData);
            }
        } else {
            return await this.createLocalStorage(notificationData);
        }
    },

    async createLocalStorage(notificationData) {
        try {
            const notifications = getLocalCollection('notifications');
            const newNotification = {
                id: smartGenerateId(),
                ...notificationData,
                read: false,
                created_at: new Date().toISOString()
            };
            
            notifications.push(newNotification);
            saveLocalCollection('notifications', notifications);
            
            return newNotification;
        } catch (error) {
            handleError(error, 'Create notification');
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

console.log(`🔥 Smart Hybrid API initialized successfully - Using ${backendType}`);
