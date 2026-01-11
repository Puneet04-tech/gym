// Simple Router for SPA
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    
    if (token) {
        // User is logged in, show dashboard
        window.location.href = '/pages/dashboard.html';
    } else {
        // User is not logged in, show login
        window.location.href = '/pages/login.html';
    }
});
