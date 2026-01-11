# Firebase Migration Plan

## Objectives
- Move authentication and data storage to Firebase (Auth + Firestore; optional Storage for receipts; Cloud Functions for server-side logic and scheduling).
- Preserve existing roles (admin, member, user) with rule-based access control.
- Deliver required features: bills/receipts, fee package assignment, monthly notifications, report export, supplement store stub, diet details, search, logging, tests, and deployment guidance.

## Architecture Overview
- Client: Static frontend (HTML/CSS/JS) served via Firebase Hosting (or existing server) using Firebase Web SDK.
- Auth: Firebase Auth (Email/Password). Custom claims for roles (`admin`, `member`, `user`).
- Data: Firestore collections (see schema) with security rules enforcing per-role access.
- Functions: Cloud Functions for privileged operations (bill generation, scheduled notifications, report exports, receipt rendering) and role claim setting on signup.
- Storage (optional): Store PDF receipts/exports if needed; otherwise generate on-demand via Functions.

## Firestore Collections (proposed)
- `users`: { displayName, email, role, memberId?, phone, address, city, state, postalCode, createdAt, updatedAt }
- `members`: { userId (ref), status, emergencyContact, emergencyPhone, medicalConditions, feePackageId?, createdAt, updatedAt }
- `feePackages`: { name, description, monthlyFee, durationDays, benefits, isActive, createdAt }
- `memberSubscriptions`: { memberId, feePackageId, startDate, endDate, renewalDate, status }
- `payments`: { memberId, amount, method, transactionId, status, notes, paymentDate }
- `bills`: { memberId, paymentId, billNumber, amount, tax, total, status, billDate }
- `notifications`: { userId, title, message, type, isRead, scheduledAt, sentAt }
- `activityLogs`: { userId, action, entityType, entityId, details, ip, createdAt }
- Optional (future): `supplements`, `diets`, `orders` for store/diet modules.

## Security Rules (high-level)
- Auth required for all read/write (except public assets).
- Admin: full read/write on operational collections.
- Member: read own profile, own member record, own bills/payments/notifications; cannot modify others.
- User: minimal access (profile only) until upgraded.
- Writes validated per collection (schema checks, role checks). Use custom claims set via Functions.

## Cloud Functions (initial set)
- `auth.onCreate` trigger: set default role `member` (or `user`) and create member document when appropriate.
- `createBill`: validate payment/member, compute totals, write bill record, optionally render receipt (HTML/PDF) to Storage.
- `scheduleMonthlyNotifications`: time-triggered to enqueue monthly fee reminders.
- `sendNotification`: send push/email (stub if no provider yet) and mark `notifications` entries.
- `exportReport`: generate CSV/JSON summary for admin download.
- `setRole`: admin-only callable to assign roles/claims.

## Frontend Changes (summary)
- Replace REST client with Firebase SDK calls (Auth, Firestore reads/writes, Callable Functions).
- Use custom claims to gate admin UI and data queries.
- Implement download buttons that call `exportReport`/`createBill` receipt rendering.
- Add supplement/diet stubs as separate views backed by Firestore collections.

## Environment & Config
- `firebase.config.json` (client) with: apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId.
- Functions `.env` via Firebase env: `ADMIN_EMAILS`, notification provider keys (if any).

## Deployment
- Firebase Hosting for frontend; Firebase Functions for backend; Firestore as DB; optional Storage for receipts.
- Commands (after setup): `firebase login`, `firebase init` (hosting, functions, firestore), `firebase deploy --only hosting,functions,firestore:rules`.

## Testing
- Unit tests for Functions (using `firebase-functions-test`).
- Integration tests using the Firebase Emulator Suite.
- Document manual test cases for auth, CRUD flows, receipts, notifications, exports.

## Migration Steps (phased)
1) Initialize Firebase project locally (config + rules + functions skeleton).
2) Implement Auth + role claims + seed admin.
3) Port data models to Firestore; implement CRUD via Functions/SDK with rules.
4) Update frontend to Firebase SDK (auth, data, calls for bills/payments/notifications/packages).
5) Add receipts/export, notifications scheduling, and remaining feature stubs (supplement store, diet details, search).
6) Expand logging/tests and update docs/README/project report.

## Open Decisions
- Receipt format (HTML vs PDF via Functions + Storage).
- Notification channel (email vs FCM) — can stub logging first.
- Whether to keep legacy Express server during transition or go all-in on Firebase.
