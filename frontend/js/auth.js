// Authentication functions
async function loginUser(username, password) {
    try {
        const response = await fetch(`${CONFIG.API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = {
                ...data.data.user,
                token: data.data.token
            };
            
            // Store in sessionStorage to persist during page reload
            sessionStorage.setItem('kvk_user', JSON.stringify(currentUser));
            
            return data;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

async function registerUser(userData) {
    try {
        const response = await fetch(`${CONFIG.API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = {
                ...data.data.user,
                token: data.data.token
            };
            
            // Store in sessionStorage to persist during page reload
            sessionStorage.setItem('kvk_user', JSON.stringify(currentUser));
            
            return data;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

function checkAuthStatus() {
    // First check global variable, then sessionStorage
    if (!currentUser) {
        try {
            const storedUser = sessionStorage.getItem('kvk_user');
            if (storedUser) {
                currentUser = JSON.parse(storedUser);
            }
        } catch (error) {
            console.error('Error reading from sessionStorage:', error);
            currentUser = null;
        }
    }
    
    if (currentUser && currentUser.token) {
        try {
            showMainApp();
            return;
        } catch (error) {
            currentUser = null;
            sessionStorage.removeItem('kvk_user');
        }
    }
    
    console.log('No valid authentication found');
    showLogin();
}

function getCurrentUser() {
    return currentUser;
}

function getAuthHeaders() {
    const token = currentUser?.token;
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

function logout() {
    currentUser = null;
    currentReportId = null;
    reportsLoaded = false;
    reports = [];
    
    // Clear sessionStorage
    sessionStorage.removeItem('kvk_user');
    
    showLogin();
    showAlert('loginAlert', 'Logged out successfully!', 'success');
}

// Initialize event listeners for auth forms
function initializeAuthListeners() {
    // Login form handler
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const result = await loginUser(username, password);
            showAlert('loginAlert', 'Login successful!', 'success');
            setTimeout(() => {
                showMainApp();
            }, 1);
        } catch (error) {
            showAlert('loginAlert', error.message || 'Login failed!', 'error');
        }
    });

    // Registration form handler
    document.getElementById('registerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const userData = {
            username: document.getElementById('regUsername').value,
            email: document.getElementById('regEmail').value,
            password: document.getElementById('regPassword').value,
            kvkName: document.getElementById('regKvkName').value,
            role: 'user'
        };
        
        try {
            const result = await registerUser(userData);
            showAlert('registerAlert', 'Registration successful!', 'success');
            setTimeout(() => {
                showMainApp();
            }, 1);
        } catch (error) {
            showAlert('registerAlert', error.message || 'Registration failed!', 'error');
        }
    });

    // Register link handler
    document.getElementById('registerLink').addEventListener('click', function(e) {
        e.preventDefault();
        showRegistration();
    });
}