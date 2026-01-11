// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    // Get token from localStorage
    getToken() {
        return localStorage.getItem('token');
    }

    // Set common headers
    getHeaders(isFormData = false) {
        const headers = {};
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    // GET request
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${this.baseURL}${endpoint}?${queryString}` : `${this.baseURL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    }

    // POST request
    async post(endpoint, data = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    }

    // PUT request
    async put(endpoint, data = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('API PUT Error:', error);
            throw error;
        }
    }

    // PATCH request
    async patch(endpoint, data = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('API PATCH Error:', error);
            throw error;
        }
    }

    // DELETE request
    async delete(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('API DELETE Error:', error);
            throw error;
        }
    }

    // Handle response
    async handleResponse(response) {
        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/pages/login.html';
            }
            throw new Error(data.message || 'API Error');
        }

        return data;
    }
}

// Create API client instance
const api = new APIClient(API_BASE_URL);

// Auth API methods
const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
    changePassword: (data) => api.post('/auth/change-password', data),
};

// Members API methods
const membersAPI = {
    getAll: (page = 1, limit = 10) => api.get('/members', { page, limit }),
    getById: (id) => api.get(`/members/${id}`),
    stats: () => api.get('/members/stats'),
    add: (data) => api.post('/members', data),
    update: (id, data) => api.put(`/members/${id}`, data),
    delete: (id) => api.delete(`/members/${id}`),
    search: (q) => api.get('/members/search', { q }),
};

// Bills API methods
const billsAPI = {
    create: (data) => api.post('/bills', data),
    getAll: (page = 1, limit = 10) => api.get('/bills', { page, limit }),
    getById: (id) => api.get(`/bills/${id}`),
    getByMember: (memberId, page = 1, limit = 10) => api.get(`/bills/member/${memberId}`, { page, limit }),
    updateStatus: (id, status) => api.patch(`/bills/${id}/status`, { status }),
    delete: (id) => api.delete(`/bills/${id}`),
};

// Payments API methods
const paymentsAPI = {
    create: (data) => api.post('/payments', data),
    getAll: (page = 1, limit = 10) => api.get('/payments', { page, limit }),
    getById: (id) => api.get(`/payments/${id}`),
    getByMember: (memberId, page = 1, limit = 10) => api.get(`/payments/member/${memberId}`, { page, limit }),
    stats: () => api.get('/payments/stats'),
};

// Fee Packages API methods
const feePackagesAPI = {
    getAll: () => api.get('/fee-packages'),
    create: (data) => api.post('/fee-packages', data),
    update: (id, data) => api.put(`/fee-packages/${id}`, data),
    delete: (id) => api.delete(`/fee-packages/${id}`),
};

// Subscriptions API methods
const subscriptionsAPI = {
    assign: (data) => api.post('/subscriptions', data),
    listByMember: (memberId) => api.get(`/subscriptions/member/${memberId}`),
};

// Notifications API methods
const notificationsAPI = {
    create: (data) => api.post('/notifications', data),
    listByUser: (userId) => api.get(`/notifications/user/${userId}`),
    unreadCount: (userId) => api.get(`/notifications/user/${userId}/unread-count`),
    markRead: (id) => api.patch(`/notifications/${id}/read`),
    seedMonthly: () => api.post('/notifications/seed/monthly'),
};

// Store API methods
const storeAPI = {
    getAll: () => api.get('/store'),
    getById: (id) => api.get(`/store/${id}`),
    create: (data) => api.post('/store', data),
    update: (id, data) => api.put(`/store/${id}`, data),
    delete: (id) => api.delete(`/store/${id}`),
};

// Diet API methods
const dietAPI = {
    listAll: () => api.get('/diets'),
    listByMember: (memberId) => api.get(`/diets/member/${memberId}`),
    getById: (id) => api.get(`/diets/${id}`),
    create: (data) => api.post('/diets', data),
    update: (id, data) => api.put(`/diets/${id}`, data),
    delete: (id) => api.delete(`/diets/${id}`),
};

// Reports API
const reportsAPI = {
    exportBills: () => fetch(`${API_BASE_URL}/reports/bills`, {
        method: 'GET',
        headers: api.getHeaders(),
    }).then(r => r.blob()),
};

// Utility functions
function showMessage(element, message, type = 'info') {
    if (!element) return;
    
    element.textContent = message;
    element.className = `message show ${type}`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

// Export for use in other files
window.api = api;
window.authAPI = authAPI;
window.membersAPI = membersAPI;
window.billsAPI = billsAPI;
window.paymentsAPI = paymentsAPI;
window.feePackagesAPI = feePackagesAPI;
window.subscriptionsAPI = subscriptionsAPI;
window.notificationsAPI = notificationsAPI;
window.storeAPI = storeAPI;
window.dietAPI = dietAPI;
window.reportsAPI = reportsAPI;
window.showMessage = showMessage;
window.formatDate = formatDate;
window.formatCurrency = formatCurrency;
