// Authentication JavaScript

// Helper function to show messages
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');
    const authMessage = document.getElementById('authMessage');

    // DO NOT check if user is logged in - causes redirect loop

    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and forms
            tabButtons.forEach(btn => btn.classList.remove('active'));
            authForms.forEach(form => form.classList.remove('active'));
            
            // Add active class to clicked button and corresponding form
            button.classList.add('active');
            document.getElementById(`${tabName}Form`).classList.add('active');
        });
    });

    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                const response = await authAPI.login({ email, password });
                
                // Store token and user data
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
                if (response.user && response.user.member_id) {
                    localStorage.setItem('memberId', response.user.member_id);
                }
                
                // Immediate redirect
                window.location.replace('/pages/dashboard.html');
            } catch (error) {
                showMessage(authMessage, error.message || 'Login failed', 'error');
            }
        });
    }

    // Register form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const first_name = document.getElementById('regFirstName').value;
            const last_name = document.getElementById('regLastName').value;
            const username = document.getElementById('regUsername').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            
            try {
                await authAPI.register({
                    first_name,
                    last_name,
                    username,
                    email,
                    password,
                    role: 'member',
                });
                
                showMessage(authMessage, 'Registration successful! Please login.', 'success');
                
                // Reset form and switch to login
                registerForm.reset();
                document.querySelector('[data-tab="login"]').click();
            } catch (error) {
                showMessage(authMessage, error.message || 'Registration failed', 'error');
            }
        });
    }
});
