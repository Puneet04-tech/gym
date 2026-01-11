// Firebase client bootstrap
// NOTE: Replace the placeholder config with your Firebase project values (see firebase.config.template.json)
// and include Firebase CDN scripts in pages that use this module.

// Example CDN scripts (add to your HTML head before this file):
// <script src="https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.8.1/firebase-auth-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore-compat.js"></script>
// <script src="/js/firebase.js"></script>

(function initFirebase() {
    const storedConfig = window.localStorage.getItem('firebaseConfig');
    let config = null;
    if (storedConfig) {
        try { config = JSON.parse(storedConfig); } catch (e) { /* ignore */ }
    }

    // Fallback placeholders – replace with real values before deploying
    if (!config) {
        config = {
            apiKey: 'YOUR_API_KEY',
            authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
            projectId: 'YOUR_PROJECT_ID',
            storageBucket: 'YOUR_PROJECT_ID.appspot.com',
            messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
            appId: 'YOUR_APP_ID',
        };
    }

    if (!window.firebase || !window.firebase.apps) {
        console.warn('Firebase SDK not loaded. Include CDN scripts before firebase.js');
        return;
    }

    if (!firebase.apps.length) {
        firebase.initializeApp(config);
    }

    window.firebaseApp = firebase.app();
    window.firebaseAuth = firebase.auth();
    window.firebaseDb = firebase.firestore();
})();
