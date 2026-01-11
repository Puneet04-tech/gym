// Dashboard JavaScript
let currentUser = null;
let currentPage = 'home';

function setStatValue(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login.html';
        return;
    }

    currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Load user info
    loadUserInfo();
    
    // Setup navigation
    setupNavigation();
    
    // Setup logout
    setupLogout();

    // Setup modal and actions
    setupModal();
    setupAddMember();
        setupMemberSearch();
        setupReportExport();
        setupCreateBill();
        setupStoreAndDiets();
        setupFeePackages();
        setupSubscriptions();
        setupNotificationsPage();
    
    // Setup forms
    setupForms();
    
    // Load initial page
    loadPage('home');
});

function loadUserInfo() {
    document.getElementById('userName').textContent = currentUser.first_name || currentUser.username;
    const roleElement = document.getElementById('userRole');
    roleElement.textContent = (currentUser.role || 'user').toUpperCase();

    // Persist member id if provided by backend
    if (!localStorage.getItem('memberId') && currentUser.member_id) {
        localStorage.setItem('memberId', currentUser.member_id);
    }
    
    // Show/hide admin menu based on role
    if (currentUser.role === 'admin') {
        document.getElementById('adminMenu').style.display = 'block';
    }
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        if (item.id === 'logoutBtn') return;
        
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            loadPage(page);
        });
    });

    const quickLinks = document.querySelectorAll('.quick-link');
    quickLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            if (!page) return;
            navItems.forEach(nav => {
                if (nav.getAttribute('data-page') === page) {
                    nav.classList.add('active');
                } else if (!nav.id) {
                    nav.classList.remove('active');
                }
            });
            loadPage(page);
        });
    });
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/pages/login.html';
        });
    }
}

function setupModal() {
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('#modal .close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function openModal(contentHtml) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');
    if (modal && modalBody) {
        modalBody.innerHTML = contentHtml;
        modal.style.display = 'block';
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');
    if (modal && modalBody) {
        modal.style.display = 'none';
        modalBody.innerHTML = '';
    }
}

function setupAddMember() {
    const addMemberBtn = document.getElementById('addMemberBtn');
    if (!addMemberBtn) return;

    addMemberBtn.addEventListener('click', () => {
        openModal(`
            <h3>Add Member</h3>
            <div class="message" id="addMemberMessage"></div>
            <form id="addMemberForm" class="form-grid">
                <div class="form-group">
                    <label>First Name</label>
                    <input type="text" id="memberFirstName" required>
                </div>
                <div class="form-group">
                    <label>Last Name</label>
                    <input type="text" id="memberLastName" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="memberEmail" required>
                </div>
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="memberUsername" required>
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input type="tel" id="memberPhone">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="memberPassword" required>
                </div>
                <button type="submit" class="btn btn-primary">Save</button>
            </form>
        `);

        const form = document.getElementById('addMemberForm');
        const messageEl = document.getElementById('addMemberMessage');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    await membersAPI.add({
                        first_name: document.getElementById('memberFirstName').value,
                        last_name: document.getElementById('memberLastName').value,
                        email: document.getElementById('memberEmail').value,
                        username: document.getElementById('memberUsername').value,
                        phone: document.getElementById('memberPhone').value,
                        password: document.getElementById('memberPassword').value,
                        emergency_contact: '',
                        emergency_phone: '',
                        medical_conditions: '',
                    });

                    showMessage(messageEl, 'Member added successfully', 'success');
                    await loadMembersData();
                    await refreshQuickStats();
                    setTimeout(() => closeModal(), 800);
                } catch (error) {
                    showMessage(messageEl, error.message || 'Failed to add member', 'error');
                }
            });
        }
    });
}

function loadPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Show requested page
    const pageElement = document.getElementById(`${page}Page`);
    if (pageElement) {
        pageElement.classList.add('active');
        document.getElementById('pageTitle').textContent = 
            page.charAt(0).toUpperCase() + page.slice(1);
        
        // Load page-specific content
        switch(page) {
            case 'home':
                loadHomeData();
                break;
            case 'profile':
                loadProfileData();
                break;
            case 'bills':
                loadBillsData();
                break;
            case 'notifications':
                loadNotificationsData();
                break;
            case 'members':
                loadMembersData();
                break;
            case 'payments':
                loadPaymentsData();
                break;
        }
    }
    
    currentPage = page;
}

async function loadHomeData() {
    try {
        document.getElementById('welcomeMessage').textContent =
            `Welcome back, ${currentUser.first_name || currentUser.username}!`;
        const heading = document.getElementById('welcomeHeading');
        if (heading) {
            heading.textContent = `Welcome, ${currentUser.first_name || currentUser.username}`;
        }

        await refreshQuickStats();
    } catch (error) {
        console.error('Failed to load home data:', error);
    }
}

async function loadProfileData() {
    try {
        const response = await authAPI.getProfile();
        const user = response.user;
        
        document.getElementById('profileFirstName').value = user.first_name || '';
        document.getElementById('profileLastName').value = user.last_name || '';
        document.getElementById('profileEmail').value = user.email;
        document.getElementById('profilePhone').value = user.phone || '';
        document.getElementById('profileAddress').value = user.address || '';
        document.getElementById('profileCity').value = user.city || '';
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

async function loadBillsData() {
    try {
        let response;
        if (currentUser.role === 'admin') {
            response = await billsAPI.getAll(1, 10);
        } else {
            const memberId = getMemberId();
            if (!memberId) {
                console.warn('No member id available; skipping bills table load');
                return;
            }
            response = await billsAPI.getByMember(memberId, 1, 10);
        }
        
        const billsTable = document.getElementById('billsTable');
        billsTable.innerHTML = '';
        
        if (response.data.length === 0) {
            billsTable.innerHTML = '<tr><td colspan="5" class="text-center">No bills found</td></tr>';
            return;
        }
        
        response.data.forEach(bill => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${bill.bill_number}</td>
                <td>${formatDate(bill.bill_date)}</td>
                <td>${formatCurrency(bill.total)}</td>
                <td><span class="badge badge-primary">${bill.status}</span></td>
                <td>
                    <button class="btn btn-small btn-success" onclick="downloadBill('${bill.id}')">Download</button>
                </td>
            `;
            billsTable.appendChild(row);
        });
    } catch (error) {
        console.error('Failed to load bills:', error);
        document.getElementById('billsTable').innerHTML = 
            '<tr><td colspan="5" class="text-center text-light">Failed to load bills</td></tr>';
    }
}

async function loadNotificationsData() {
    try {
        const notificationsList = document.getElementById('notificationsList');
        notificationsList.innerHTML = '<p class="text-center">Loading notifications...</p>';
        const userId = currentUser.id;
        const response = await notificationsAPI.listByUser(userId);
        if (response.data.length === 0) {
            notificationsList.innerHTML = '<p class="text-center">No notifications</p>';
            return;
        }
        notificationsList.innerHTML = '';
        response.data.forEach(n => {
            const div = document.createElement('div');
            div.className = 'notification-item';
            div.innerHTML = `
                <div class="notification-content">
                    <h4>${n.title}</h4>
                    <p>${n.message}</p>
                    <small class="text-light">${formatDate(n.created_at || n.scheduled_date || new Date())}</small>
                </div>
                <button class="btn btn-small" onclick="markNotificationRead('${n.id}')">Mark read</button>
            `;
            notificationsList.appendChild(div);
        });
    } catch (error) {
        console.error('Failed to load notifications:', error);
    }
}

async function refreshQuickStats() {
    try {
        if (currentUser.role === 'admin') {
            const [billsResponse, memberStats, paymentStats, unreadRes] = await Promise.all([
                billsAPI.getAll(1, 1),
                membersAPI.stats(),
                paymentsAPI.stats(),
                notificationsAPI.unreadCount(currentUser.id),
            ]);

            setStatValue('totalBills', billsResponse.pagination?.total ?? billsResponse.data?.length ?? 0);
            setStatValue('activeMembers', memberStats.data?.active ?? memberStats.active ?? 0);
            setStatValue('totalPayments', paymentStats.data?.total ?? paymentStats.total ?? 0);
            setStatValue('unreadNotifs', unreadRes.count ?? unreadRes.data?.count ?? '-');
        } else {
            const memberId = getMemberId();
            if (!memberId) {
                console.warn('No member id available; skipping home stats');
                return;
            }
            const [billsResponse, paymentsResponse, unreadRes] = await Promise.all([
                billsAPI.getByMember(memberId, 1, 1),
                paymentsAPI.getByMember(memberId, 1, 1),
                notificationsAPI.unreadCount(currentUser.id),
            ]);

            setStatValue('totalBills', billsResponse.pagination?.total ?? billsResponse.data?.length ?? 0);
            setStatValue('activeMembers', '-');
            setStatValue('totalPayments', paymentsResponse.pagination?.total ?? paymentsResponse.data?.length ?? 0);
            setStatValue('unreadNotifs', unreadRes.count ?? unreadRes.data?.count ?? '-');
        }
    } catch (error) {
        console.error('Failed to refresh quick stats:', error);
    }
}

async function refreshUnreadCount() {
    try {
        const statEl = document.getElementById('unreadNotifs');
        if (!statEl) return;
        const res = await notificationsAPI.unreadCount(currentUser.id);
        statEl.textContent = res.count ?? res.data?.count ?? '-';
    } catch (error) {
        console.error('Failed to fetch unread count', error);
    }
}

async function loadMembersData() {
    try {
        const response = await membersAPI.getAll(1, 10);
        const membersTable = document.getElementById('membersTable');
        membersTable.innerHTML = '';
        
        if (response.data.length === 0) {
            membersTable.innerHTML = '<tr><td colspan="5" class="text-center">No members found</td></tr>';
            return;
        }
        
        response.data.forEach(member => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${member.first_name} ${member.last_name}</td>
                <td>${member.email}</td>
                <td>${member.phone}</td>
                <td><span class="badge badge-success">${member.membership_status}</span></td>
                <td>
                        <button class="btn btn-small btn-secondary" onclick="editMember('${member.id}')">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="deleteMember('${member.id}')">Delete</button>
                </td>
            `;
            membersTable.appendChild(row);
        });
    } catch (error) {
        console.error('Failed to load members:', error);
    }
}

async function loadPaymentsData() {
    try {
        const response = await paymentsAPI.getAll(1, 10);
        const paymentsTable = document.getElementById('paymentsTable');
        paymentsTable.innerHTML = '';
        
        if (response.data.length === 0) {
            paymentsTable.innerHTML = '<tr><td colspan="5" class="text-center">No payments found</td></tr>';
            return;
        }
        
        response.data.forEach(payment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${payment.username}</td>
                <td>${formatCurrency(payment.amount)}</td>
                <td>${payment.payment_method}</td>
                <td>${formatDate(payment.payment_date)}</td>
                <td><span class="badge badge-success">${payment.status}</span></td>
            `;
            paymentsTable.appendChild(row);
        });
    } catch (error) {
        console.error('Failed to load payments:', error);
    }
}

function setupForms() {
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                await authAPI.updateProfile({
                    first_name: document.getElementById('profileFirstName').value,
                    last_name: document.getElementById('profileLastName').value,
                    phone: document.getElementById('profilePhone').value,
                    address: document.getElementById('profileAddress').value,
                    city: document.getElementById('profileCity').value,
                });
                
                showMessage(document.querySelector('.message'), 'Profile updated successfully', 'success');
            } catch (error) {
                showMessage(document.querySelector('.message'), error.message, 'error');
            }
        });
    }
    
    // Change password form
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (newPassword !== confirmPassword) {
                showMessage(document.querySelector('.message'), 'Passwords do not match', 'error');
                return;
            }
            
            try {
                await authAPI.changePassword({
                    oldPassword: document.getElementById('oldPassword').value,
                    newPassword: newPassword,
                });
                
                changePasswordForm.reset();
                showMessage(document.querySelector('.message'), 'Password changed successfully', 'success');
            } catch (error) {
                showMessage(document.querySelector('.message'), error.message, 'error');
            }
        });
    }
}

function setupNotificationsPage() {
    const refreshBtn = document.getElementById('refreshNotificationsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => loadNotificationsData());
    }
    const seedBtn = document.getElementById('seedNotificationsBtn');
    if (seedBtn) {
        seedBtn.addEventListener('click', async () => {
            try {
                await notificationsAPI.seedMonthly();
                loadNotificationsData();
                refreshUnreadCount();
            } catch (error) {
                console.error('Seed notifications failed', error);
            }
        });
    }
    // initial load when page switches
}

async function markNotificationRead(id) {
    try {
        await notificationsAPI.markRead(id);
        loadNotificationsData();
        refreshUnreadCount();
    } catch (error) {
        console.error('Failed to mark notification', error);
    }
}

function getMemberId() {
    // Get member ID from user data
    return localStorage.getItem('memberId') || currentUser.member_id || '';
}

function downloadBill(billId) {
    window.open(`/api/bills/${billId}/receipt`, '_blank');
}

function editMember(memberId) {
    // open modal to edit
    openModal(`
        <h3>Edit Member</h3>
        <div class="message" id="editMemberMessage"></div>
        <form id="editMemberForm" class="form-grid">
            <div class="form-group">
                <label>First Name</label>
                <input type="text" id="editFirstName" required>
            </div>
            <div class="form-group">
                <label>Last Name</label>
                <input type="text" id="editLastName" required>
            </div>
            <div class="form-group">
                <label>Phone</label>
                <input type="tel" id="editPhone">
            </div>
            <div class="form-group">
                <label>Address</label>
                <input type="text" id="editAddress">
            </div>
            <div class="form-group">
                <label>City</label>
                <input type="text" id="editCity">
            </div>
            <button type="submit" class="btn btn-primary">Save</button>
        </form>
    `);

    // load existing
    membersAPI.getById(memberId).then(({ data }) => {
        document.getElementById('editFirstName').value = data.first_name || '';
        document.getElementById('editLastName').value = data.last_name || '';
        document.getElementById('editPhone').value = data.phone || '';
        document.getElementById('editAddress').value = data.address || '';
        document.getElementById('editCity').value = data.city || '';
    }).catch(() => {});

    const form = document.getElementById('editMemberForm');
    const msg = document.getElementById('editMemberMessage');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await membersAPI.update(memberId, {
                first_name: document.getElementById('editFirstName').value,
                last_name: document.getElementById('editLastName').value,
                phone: document.getElementById('editPhone').value,
                address: document.getElementById('editAddress').value,
                city: document.getElementById('editCity').value,
            });
            showMessage(msg, 'Member updated', 'success');
            await loadMembersData();
            setTimeout(closeModal, 800);
        } catch (error) {
            showMessage(msg, error.message || 'Update failed', 'error');
        }
    });
}

async function deleteMember(memberId) {
    if (confirm('Are you sure you want to delete this member?')) {
        try {
            await membersAPI.delete(memberId);
            loadMembersData();
            refreshQuickStats();
            showMessage(document.querySelector('.message'), 'Member deleted successfully', 'success');
        } catch (error) {
            showMessage(document.querySelector('.message'), error.message, 'error');
        }
    }
}

function setupMemberSearch() {
    const searchInput = document.getElementById('memberSearch');
    if (!searchInput) return;
    searchInput.addEventListener('input', async (e) => {
        const q = e.target.value.trim();
        if (!q) {
            loadMembersData();
            return;
        }
        try {
            const response = await membersAPI.search(q);
            const membersTable = document.getElementById('membersTable');
            membersTable.innerHTML = '';
            if (response.data.length === 0) {
                membersTable.innerHTML = '<tr><td colspan="5" class="text-center">No members found</td></tr>';
                return;
            }
            response.data.forEach(member => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${member.first_name} ${member.last_name}</td>
                    <td>${member.email}</td>
                    <td>${member.phone}</td>
                    <td><span class="badge badge-success">${member.membership_status}</span></td>
                    <td>
                        <button class="btn btn-small btn-secondary" onclick="editMember('${member.id}')">Edit</button>
                        <button class="btn btn-small btn-danger" onclick="deleteMember('${member.id}')">Delete</button>
                    </td>
                `;
                membersTable.appendChild(row);
            });
        } catch (error) {
            console.error('Search members failed', error);
        }
    });
}

function setupReportExport() {
    const exportBtn = document.getElementById('exportReportBtn');
    if (!exportBtn) return;
    exportBtn.addEventListener('click', async () => {
        try {
            const blob = await reportsAPI.exportBills();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'bills_report.csv';
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export report failed', error);
        }
    });
}

function setupCreateBill() {
    const generateBillBtn = document.getElementById('generateBillBtn');
    if (!generateBillBtn) return;
    generateBillBtn.addEventListener('click', () => {
        openModal(`
            <h3>Create Bill</h3>
            <div class="message" id="createBillMessage"></div>
            <form id="createBillForm" class="form-grid">
                <div class="form-group">
                    <label>Member ID</label>
                    <input type="text" id="billMemberId" required>
                </div>
                <div class="form-group">
                    <label>Payment ID</label>
                    <input type="text" id="billPaymentId" required>
                </div>
                <div class="form-group">
                    <label>Amount</label>
                    <input type="number" id="billAmount" required>
                </div>
                <div class="form-group">
                    <label>Tax %</label>
                    <input type="number" id="billTax" value="0">
                </div>
                <button type="submit" class="btn btn-primary">Create</button>
            </form>
        `);

        const form = document.getElementById('createBillForm');
        const msg = document.getElementById('createBillMessage');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await billsAPI.create({
                    member_id: document.getElementById('billMemberId').value,
                    payment_id: document.getElementById('billPaymentId').value,
                    amount: parseFloat(document.getElementById('billAmount').value),
                    tax: parseFloat(document.getElementById('billTax').value || '0'),
                });
                showMessage(msg, 'Bill created', 'success');
                await loadBillsData();
                setTimeout(closeModal, 800);
            } catch (error) {
                showMessage(msg, error.message || 'Failed to create bill', 'error');
            }
        });
    });
}

function setupStoreAndDiets() {
    // Supplements list
    const supplementsList = document.getElementById('supplementsList');
    if (supplementsList) {
        storeAPI.getAll().then((res) => {
            supplementsList.innerHTML = '';
            if (!res.data.length) {
                supplementsList.innerHTML = 'No supplements';
                return;
            }
            res.data.forEach((i) => {
                const div = document.createElement('div');
                div.className = 'list-row';
                div.innerHTML = `
                    <span>${i.name} - $${i.price}</span>
                    <span>
                        <button class="btn btn-small" onclick="editSupplement('${i.id}')">Edit</button>
                        <button class="btn btn-small btn-danger" onclick="deleteSupplement('${i.id}')">Delete</button>
                    </span>
                `;
                supplementsList.appendChild(div);
            });
        }).catch(() => { supplementsList.innerHTML = 'Failed to load'; });
    }

    // Diets list for current member
    const dietsList = document.getElementById('dietsList');
    if (dietsList) {
        const memberId = getMemberId();
        const fetcher = currentUser.role === 'admin'
            ? dietAPI.listAll()
            : (memberId ? dietAPI.listByMember(memberId) : Promise.resolve({ data: [] }));

        fetcher.then((res) => {
            dietsList.innerHTML = '';
            if (!res.data.length) {
                dietsList.innerHTML = memberId ? 'No diets' : 'No diets available';
                return;
            }
            res.data.forEach((i) => {
                const div = document.createElement('div');
                div.className = 'list-row';
                const memberLabel = currentUser.role === 'admin' ? ` (Member: ${i.member_id || 'N/A'})` : '';
                div.innerHTML = `
                    <span>${i.title || 'Plan'}${memberLabel}: ${i.plan || ''}</span>
                    <span>
                        <button class="btn btn-small" onclick="editDiet('${i.id}')">Edit</button>
                        <button class="btn btn-small btn-danger" onclick="deleteDiet('${i.id}')">Delete</button>
                    </span>
                `;
                dietsList.appendChild(div);
            });
        }).catch(() => { dietsList.innerHTML = 'Failed to load'; });
    }
}

// Supplement creation
const addSupplementBtn = document.getElementById('addSupplementBtn');
if (addSupplementBtn) {
    addSupplementBtn.addEventListener('click', () => {
        openModal(`
            <h3>Add Supplement</h3>
            <div class="message" id="suppMsg"></div>
            <form id="suppForm" class="form-grid">
                <div class="form-group"><label>Name</label><input id="suppName" required></div>
                <div class="form-group"><label>Description</label><input id="suppDesc"></div>
                <div class="form-group"><label>Price</label><input type="number" id="suppPrice" required></div>
                <div class="form-group"><label>Stock</label><input type="number" id="suppStock" value="0"></div>
                <button class="btn btn-primary" type="submit">Save</button>
            </form>
        `);
        const form = document.getElementById('suppForm');
        const msg = document.getElementById('suppMsg');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await storeAPI.create({
                    name: document.getElementById('suppName').value,
                    description: document.getElementById('suppDesc').value,
                    price: parseFloat(document.getElementById('suppPrice').value),
                    stock: parseInt(document.getElementById('suppStock').value || '0', 10),
                });
                showMessage(msg, 'Supplement added', 'success');
                setupStoreAndDiets();
                setTimeout(closeModal, 800);
            } catch (error) {
                showMessage(msg, error.message || 'Failed to add supplement', 'error');
            }
        });
    });
}

// Diet creation
const addDietBtn = document.getElementById('addDietBtn');
if (addDietBtn) {
    addDietBtn.addEventListener('click', () => {
        openModal(`
            <h3>Add Diet</h3>
            <div class="message" id="dietMsg"></div>
            <form id="dietForm" class="form-grid">
                <div class="form-group"><label>Member ID</label><input id="dietMemberId" value="${getMemberId() || ''}" required></div>
                <div class="form-group"><label>Title</label><input id="dietTitle"></div>
                <div class="form-group"><label>Plan</label><textarea id="dietPlan"></textarea></div>
                <div class="form-group"><label>Notes</label><textarea id="dietNotes"></textarea></div>
                <button class="btn btn-primary" type="submit">Save</button>
            </form>
        `);
        const form = document.getElementById('dietForm');
        const msg = document.getElementById('dietMsg');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await dietAPI.create({
                    member_id: document.getElementById('dietMemberId').value,
                    title: document.getElementById('dietTitle').value,
                    plan: document.getElementById('dietPlan').value,
                    notes: document.getElementById('dietNotes').value,
                });
                showMessage(msg, 'Diet added', 'success');
                setupStoreAndDiets();
                setTimeout(closeModal, 800);
            } catch (error) {
                showMessage(msg, error.message || 'Failed to add diet', 'error');
            }
        });
    });
}

function setupFeePackages() {
    const listEl = document.getElementById('feePackagesList');
    if (listEl) {
        feePackagesAPI.getAll().then((res) => {
            listEl.innerHTML = '';
            if (!res.data.length) {
                listEl.innerHTML = 'No fee packages';
                return;
            }
            res.data.forEach((p) => {
                const div = document.createElement('div');
                div.className = 'list-row';
                div.innerHTML = `${p.name} - $${p.monthly_fee} (${p.duration_days || '-'} days) <button class="btn btn-small btn-danger" onclick="deleteFeePackage('${p.id}')">Delete</button>`;
                listEl.appendChild(div);
            });
        }).catch(() => { listEl.innerHTML = 'Failed to load fee packages'; });
    }

    const addBtn = document.getElementById('addFeePackageBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            openModal(`
                <h3>Add Fee Package</h3>
                <div class="message" id="feePkgMsg"></div>
                <form id="feePkgForm" class="form-grid">
                    <div class="form-group"><label>Name</label><input id="feePkgName" required></div>
                    <div class="form-group"><label>Description</label><input id="feePkgDesc"></div>
                    <div class="form-group"><label>Monthly Fee</label><input type="number" id="feePkgFee" required></div>
                    <div class="form-group"><label>Duration Days</label><input type="number" id="feePkgDays"></div>
                    <button class="btn btn-primary" type="submit">Save</button>
                </form>
            `);
            const form = document.getElementById('feePkgForm');
            const msg = document.getElementById('feePkgMsg');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    await feePackagesAPI.create({
                        name: document.getElementById('feePkgName').value,
                        description: document.getElementById('feePkgDesc').value,
                        monthly_fee: parseFloat(document.getElementById('feePkgFee').value),
                        duration_days: parseInt(document.getElementById('feePkgDays').value || '0', 10),
                    });
                    showMessage(msg, 'Fee package added', 'success');
                    setupFeePackages();
                    setTimeout(closeModal, 800);
                } catch (error) {
                    showMessage(msg, error.message || 'Failed to add', 'error');
                }
            });
        });
    }
}

function setupSubscriptions() {
    const listEl = document.getElementById('subscriptionsList');
    const memberId = getMemberId();
    if (listEl && memberId) {
        subscriptionsAPI.listByMember(memberId).then((res) => {
            listEl.innerHTML = '';
            if (!res.data.length) {
                listEl.innerHTML = 'No subscriptions';
                return;
            }
            res.data.forEach((s) => {
                const div = document.createElement('div');
                div.className = 'list-row';
                div.textContent = `${s.package_name} - ${s.status}`;
                listEl.appendChild(div);
            });
        }).catch(() => { listEl.innerHTML = 'Failed to load subscriptions'; });
    }

    const addBtn = document.getElementById('addSubscriptionBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            openModal(`
                <h3>Assign Subscription</h3>
                <div class="message" id="subMsg"></div>
                <form id="subForm" class="form-grid">
                    <div class="form-group"><label>Member ID</label><input id="subMemberId" value="${memberId || ''}" required></div>
                    <div class="form-group"><label>Fee Package ID</label><input id="subPkgId" required></div>
                    <div class="form-group"><label>Start Date</label><input type="date" id="subStart"></div>
                    <div class="form-group"><label>End Date</label><input type="date" id="subEnd"></div>
                    <button class="btn btn-primary" type="submit">Assign</button>
                </form>
            `);
            const form = document.getElementById('subForm');
            const msg = document.getElementById('subMsg');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    await subscriptionsAPI.assign({
                        member_id: document.getElementById('subMemberId').value,
                        fee_package_id: document.getElementById('subPkgId').value,
                        start_date: document.getElementById('subStart').value,
                        end_date: document.getElementById('subEnd').value,
                    });
                    showMessage(msg, 'Subscription assigned', 'success');
                    setupSubscriptions();
                    setTimeout(closeModal, 800);
                } catch (error) {
                    showMessage(msg, error.message || 'Failed to assign', 'error');
                }
            });
        });
    }
}

// Deletion helpers for lists
async function deleteSupplement(id) {
    try {
        await storeAPI.delete(id);
        setupStoreAndDiets();
    } catch (error) {
        console.error('Delete supplement failed', error);
    }
}

async function deleteDiet(id) {
    try {
        await dietAPI.delete(id);
        setupStoreAndDiets();
    } catch (error) {
        console.error('Delete diet failed', error);
    }
}

async function deleteFeePackage(id) {
    try {
        await feePackagesAPI.delete(id);
        setupFeePackages();
    } catch (error) {
        console.error('Delete fee package failed', error);
    }
}

// Edit supplement
async function editSupplement(id) {
    try {
        const { data } = await storeAPI.getById(id);
        openModal(`
            <h3>Edit Supplement</h3>
            <div class="message" id="editSuppMsg"></div>
            <form id="editSuppForm" class="form-grid">
                <div class="form-group"><label>Name</label><input id="editSuppName" value="${data.name}" required></div>
                <div class="form-group"><label>Description</label><input id="editSuppDesc" value="${data.description || ''}"></div>
                <div class="form-group"><label>Price</label><input type="number" id="editSuppPrice" value="${data.price}" required></div>
                <div class="form-group"><label>Stock</label><input type="number" id="editSuppStock" value="${data.stock}" required></div>
                <button class="btn btn-primary" type="submit">Update</button>
            </form>
        `);
        const form = document.getElementById('editSuppForm');
        const msg = document.getElementById('editSuppMsg');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await storeAPI.update(id, {
                    name: document.getElementById('editSuppName').value,
                    description: document.getElementById('editSuppDesc').value,
                    price: parseFloat(document.getElementById('editSuppPrice').value),
                    stock: parseInt(document.getElementById('editSuppStock').value || '0', 10),
                    is_active: 1,
                });
                showMessage(msg, 'Supplement updated', 'success');
                setupStoreAndDiets();
                setTimeout(closeModal, 800);
            } catch (error) {
                showMessage(msg, error.message || 'Failed to update supplement', 'error');
            }
        });
    } catch (error) {
        console.error('Edit supplement failed', error);
    }
}

// Edit diet
async function editDiet(id) {
    try {
        const { data } = await dietAPI.getById(id);
        openModal(`
            <h3>Edit Diet</h3>
            <div class="message" id="editDietMsg"></div>
            <form id="editDietForm" class="form-grid">
                <div class="form-group"><label>Member ID</label><input id="editDietMember" value="${data.member_id}" disabled></div>
                <div class="form-group"><label>Title</label><input id="editDietTitle" value="${data.title || ''}"></div>
                <div class="form-group"><label>Plan</label><textarea id="editDietPlan">${data.plan || ''}</textarea></div>
                <div class="form-group"><label>Notes</label><textarea id="editDietNotes">${data.notes || ''}</textarea></div>
                <button class="btn btn-primary" type="submit">Update</button>
            </form>
        `);
        const form = document.getElementById('editDietForm');
        const msg = document.getElementById('editDietMsg');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await dietAPI.update(id, {
                    title: document.getElementById('editDietTitle').value,
                    plan: document.getElementById('editDietPlan').value,
                    notes: document.getElementById('editDietNotes').value,
                });
                showMessage(msg, 'Diet updated', 'success');
                setupStoreAndDiets();
                setTimeout(closeModal, 800);
            } catch (error) {
                showMessage(msg, error.message || 'Failed to update diet', 'error');
            }
        });
    } catch (error) {
        console.error('Edit diet failed', error);
    }
}
