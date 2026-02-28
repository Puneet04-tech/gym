// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCTrXq7Lj9n2H3t4d5e6f7g8h9i0j1k2l3m",
    authDomain: "gym-app-b5298.firebaseapp.com",
    projectId: "gym-app-b5298",
    storageBucket: "gym-app-b5298.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890abcdef12"
};

// Initialize Firebase with error handling
try {
    firebase.initializeApp(firebaseConfig);
    console.log('🔥 Firebase app initialized successfully');
} catch (error) {
    console.error('🔥 Firebase initialization error:', error);
    // Handle case where app is already initialized
    if (!error.message.includes('already exists')) {
        throw error;
    }
}

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Configure Firestore settings for better performance
db.settings({
    timestampsInSnapshots: true,
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Export Firebase services
window.firebase = firebase;
window.auth = auth;
window.db = db;

console.log('🔥 Firebase services initialized successfully');
