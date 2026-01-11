import functions from 'firebase-functions';
import admin from 'firebase-admin';
import { setUserRoleClaim } from './utils/roles.js';

// Lightweight helpers mirroring backend billing logic
const generateBillNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `BILL-${timestamp}-${random}`;
};

const calculateBillTotal = (amount = 0, taxPercent = 0) => {
  const tax = (amount * taxPercent) / 100;
  return { amount, tax, total: amount + tax };
};

// Initialize admin SDK once
try {
  admin.initializeApp();
} catch (err) {
  // ignore if already initialized in emulator/hot-reload
}

const db = admin.firestore();

// Helper: ensure user doc exists and role claim is set
async function ensureUserProfile(user) {
  const userRef = db.collection('users').doc(user.uid);
  const snap = await userRef.get();
  if (!snap.exists) {
    await userRef.set({
      email: user.email || '',
      displayName: user.displayName || '',
      role: 'member',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  await setUserRoleClaim(user.uid, 'member');
}

// Trigger: on signup, assign default role and create profile/member skeleton
export const authOnCreate = functions.auth.user().onCreate(async (user) => {
  await ensureUserProfile(user);
  // Create member doc for default member role
  const memberId = user.uid;
  const memberRef = db.collection('members').doc(memberId);
  const snap = await memberRef.get();
  if (!snap.exists) {
    await memberRef.set({
      userId: user.uid,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
});

// Callable: admin sets role and optional member link
export const setRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Auth required');
  }
  const callerRole = context.auth.token.role;
  if (callerRole !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const { uid, role } = data || {};
  if (!uid || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'uid and role required');
  }

  await setUserRoleClaim(uid, role);
  await db.collection('users').doc(uid).set({ role, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  return { success: true, role };
});

// Stub: createBill callable (to be expanded)
export const createBill = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Auth required');
  }
  if (context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const { memberId, paymentId, amount, taxPercent = 0 } = data || {};
  if (!memberId || !paymentId) {
    throw new functions.https.HttpsError('invalid-argument', 'memberId and paymentId required');
  }
  if (typeof amount !== 'number' || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'amount must be a positive number');
  }

  // Verify member and payment docs exist
  const memberSnap = await db.collection('members').doc(memberId).get();
  if (!memberSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Member not found');
  }
  const paymentSnap = await db.collection('payments').doc(paymentId).get();
  if (!paymentSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Payment not found');
  }

  const billNumber = generateBillNumber();
  const { tax, total } = calculateBillTotal(amount, taxPercent);
  const now = admin.firestore.FieldValue.serverTimestamp();
  const billRef = db.collection('bills').doc();
  await billRef.set({
    memberId,
    paymentId,
    billNumber,
    amount,
    tax,
    total,
    status: 'generated',
    billDate: now,
    createdAt: now,
    updatedAt: now,
  });

  // Optional notification to member about new bill
  await db.collection('notifications').add({
    userId: memberSnap.data().userId || memberId,
    title: 'New bill generated',
    message: `Your bill ${billNumber} has been generated with total ${total.toFixed(2)}.` ,
    type: 'payment_due',
    isRead: false,
    createdAt: now,
    updatedAt: now,
  });

  return { success: true, billId: billRef.id, billNumber, total };
});

// Stub: monthly notification scheduler placeholder
export const scheduleMonthlyNotifications = functions.pubsub
  .schedule('0 9 1 * *')
  .timeZone('UTC')
  .onRun(async () => {
    const membersSnap = await db.collection('members').get();
    if (membersSnap.empty) return null;

    const title = 'Monthly fee reminder';
    const message = 'Your monthly fee is due soon. Please make payment.';

    // Use batched writes to avoid oversized payloads
    const batches = [];
    let batch = db.batch();
    let batchCount = 0;

    membersSnap.forEach((doc) => {
      const data = doc.data();
      const targetUserId = data.userId || doc.id;
      const notifRef = db.collection('notifications').doc();
      batch.set(notifRef, {
        userId: targetUserId,
        title,
        message,
        type: 'payment_due',
        isRead: false,
        scheduledDate: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      batchCount += 1;
      if (batchCount === 400) { // stay under Firestore 500 writes limit
        batches.push(batch.commit());
        batch = db.batch();
        batchCount = 0;
      }
    });

    // Commit remaining batch
    if (batchCount > 0) {
      batches.push(batch.commit());
    }

    await Promise.all(batches);
    return null;
  });
