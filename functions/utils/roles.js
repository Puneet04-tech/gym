import admin from 'firebase-admin';

export async function setUserRoleClaim(uid, role) {
  await admin.auth().setCustomUserClaims(uid, { role });
}
