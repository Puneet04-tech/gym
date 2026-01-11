// Firebase-backed data provider (auth, members, bills, payments)
// Requires firebase compat SDKs and firebase.js bootstrap loaded first.
// This module mirrors the shape of authAPI/membersAPI/billsAPI/paymentsAPI from api.js
// so the UI can be switched to Firebase by swapping the imports/usages.

function ensureFirebase() {
    if (!window.firebaseAuth || !window.firebaseDb) {
        throw new Error('Firebase not initialized. Load firebase.js and configure SDK.');
    }
}

// Helpers
const usersCol = () => window.firebaseDb.collection('users');
const membersCol = () => window.firebaseDb.collection('members');
const billsCol = () => window.firebaseDb.collection('bills');
const paymentsCol = () => window.firebaseDb.collection('payments');

async function withProfile(userCredential, role = 'member') {
    ensureFirebase();
    const { user } = userCredential;
    const userRef = usersCol().doc(user.uid);
    const snap = await userRef.get();
    if (!snap.exists) {
        await userRef.set({
            email: user.email,
            displayName: user.displayName || '',
            role,
            createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        });
    }
    const profile = (await userRef.get()).data();
    return {
        token: await user.getIdToken(/* forceRefresh */ true),
        user: {
            id: user.uid,
            email: user.email,
            username: profile.displayName || user.email,
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            role: profile.role || role,
            member_id: profile.memberId,
        },
    };
}

export const firebaseAuthAPI = {
    async register({ email, password, first_name, last_name }) {
        ensureFirebase();
        const cred = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
        // store names
        await usersCol().doc(cred.user.uid).set({
            email,
            first_name,
            last_name,
            role: 'member',
            createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return withProfile(cred, 'member');
    },
    async login({ email, password }) {
        ensureFirebase();
        const cred = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
        return withProfile(cred);
    },
    async getProfile() {
        ensureFirebase();
        const user = window.firebaseAuth.currentUser;
        if (!user) throw new Error('Not authenticated');
        const snap = await usersCol().doc(user.uid).get();
        return { user: snap.data() };
    },
    async updateProfile(data) {
        ensureFirebase();
        const user = window.firebaseAuth.currentUser;
        if (!user) throw new Error('Not authenticated');
        await usersCol().doc(user.uid).set({
            ...data,
            updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return { message: 'Profile updated successfully' };
    },
};

export const firebaseMembersAPI = {
    async getAll(page = 1, limit = 10) {
        ensureFirebase();
        const snapshot = await membersCol().limit(limit).get();
        const data = [];
        snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
        return { data, pagination: { page, limit, total: data.length, totalPages: 1 } };
    },
    async add(member) {
        ensureFirebase();
        // Create user via Auth
        const cred = await window.firebaseAuth.createUserWithEmailAndPassword(member.email, member.password);
        await usersCol().doc(cred.user.uid).set({
            email: member.email,
            first_name: member.first_name,
            last_name: member.last_name,
            phone: member.phone,
            role: 'member',
            createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        const memberDoc = await membersCol().add({
            userId: cred.user.uid,
            status: 'active',
            createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        });
        await usersCol().doc(cred.user.uid).set({ memberId: memberDoc.id }, { merge: true });
        return { memberId: memberDoc.id, userId: cred.user.uid };
    },
};

export const firebaseBillsAPI = {
    async getAll(page = 1, limit = 10) {
        ensureFirebase();
        const snapshot = await billsCol().limit(limit).get();
        const data = [];
        snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
        return { data, pagination: { page, limit, total: data.length, totalPages: 1 } };
    },
    async getByMember(memberId, page = 1, limit = 10) {
        ensureFirebase();
        const snapshot = await billsCol().where('memberId', '==', memberId).limit(limit).get();
        const data = [];
        snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
        return { data, pagination: { page, limit, total: data.length, totalPages: 1 } };
    },
};

export const firebasePaymentsAPI = {
    async getAll(page = 1, limit = 10) {
        ensureFirebase();
        const snapshot = await paymentsCol().limit(limit).get();
        const data = [];
        snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
        return { data, pagination: { page, limit, total: data.length, totalPages: 1 } };
    },
    async getByMember(memberId, page = 1, limit = 10) {
        ensureFirebase();
        const snapshot = await paymentsCol().where('memberId', '==', memberId).limit(limit).get();
        const data = [];
        snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
        return { data, pagination: { page, limit, total: data.length, totalPages: 1 } };
    },
};

// Convenience export to mirror api.js globals (opt-in)
window.firebaseAuthAPI = firebaseAuthAPI;
window.firebaseMembersAPI = firebaseMembersAPI;
window.firebaseBillsAPI = firebaseBillsAPI;
window.firebasePaymentsAPI = firebasePaymentsAPI;
