document.addEventListener('DOMContentLoaded', function() {
    console.log('Application initializing...');
    
    // Check if all required modules are loaded first
    if (!checkModulesLoaded()) {
        console.error('Required modules not loaded. Application may not work correctly.');
    }
    
    // Initialize authentication listeners first
    if (typeof initializeAuthListeners === 'function') {
        initializeAuthListeners();
        console.log('Auth listeners initialized');
    } else {
        console.error('initializeAuthListeners not found');
    }
    
    // Initialize navigation click handlers
    initializeNavigationHandlers();
    
    // Check authentication status and load data properly
    initializeApp();
    
    console.log('Application initialized successfully');
});

async function initializeApp() {
    try {
        // Check authentication status with proper session storage support
        await checkAuthStatusWithDataLoad();
        console.log('Auth status checked and data loaded');
    } catch (error) {
        console.error('App initialization failed:', error);
        // Fallback to login screen
        showLogin();
    }
}

async function checkAuthStatusWithDataLoad() {
    console.log('=== AUTH STATUS CHECK WITH DATA LOAD ===');
    
    // First check global variable, then sessionStorage (consistent with auth.js)
    if (!currentUser) {
        try {
            const storedUser = sessionStorage.getItem('kvk_user');
            if (storedUser) {
                currentUser = JSON.parse(storedUser);
                console.log('User restored from sessionStorage:', currentUser?.username);
            }
        } catch (error) {
            console.error('Error reading from sessionStorage:', error);
            currentUser = null;
        }
    }
    
    // Check if we have a valid authenticated user
    if (currentUser && currentUser.token) {
        try {
            console.log('Valid user found:', currentUser.username || currentUser.name);
            
            // Load reports with proper error handling
            console.log('Loading reports before showing dashboard...');
            if (typeof loadReports === 'function') {
                await loadReports();
                console.log('Reports loaded successfully:', reports.length, 'reports');
                
                // Filter reports based on user role
                filterReportsForCurrentUser();
                
            } else {
                console.error('loadReports function not found');
                // Initialize empty reports array as fallback
                reports = [];
            }
            
            // Set the flag that reports are loaded
            reportsLoaded = true;
            
            // Now show the main app with loaded data
            if (typeof showMainApp === 'function') {
                showMainApp();
            } else {
                console.error('showMainApp function not found');
                // Fallback navigation
                showSection('dashboard');
            }
            
            return;
            
        } catch (error) {
            console.error('Error during data loading:', error);
            
            // Clear invalid authentication data
            currentUser = null;
            sessionStorage.removeItem('kvk_user');
            
            // Show error message
            if (typeof showAlert === 'function') {
                showAlert('loginAlert', 
                    'Session expired or data loading failed. Please login again.', 
                    'error'
                );
            }
        }
    }
    
    console.log('No valid authentication found, showing login');
    showLogin();
}

// Filter reports based on current user role and permissions
function filterReportsForCurrentUser() {
    if (!currentUser) {
        console.warn('No current user for filtering reports');
        reports = []; // Clear reports if no user
        return;
    }
    
    console.log('=== FILTERING REPORTS FOR CURRENT USER ===');
    console.log('Current user:', {
        username: currentUser.username,
        name: currentUser.name,
        role: currentUser.role
    });
    console.log('Total reports before filtering:', reports.length);
    
    try {
        // If admin, show all reports
        if (currentUser.role === 'admin') {
            console.log('Admin user - showing all reports');
            return;
        }
        
        // For non-admin users, filter to only show their own reports
        const currentUsername = currentUser.username || currentUser.name;
        const originalCount = reports.length;
        
        reports = reports.filter(report => {
            if (!report) {
                console.warn('Found null/undefined report, filtering out');
                return false;
            }
            
            let reportSubmitter = 'Unknown';
            
            // Handle different formats of submittedBy field
            if (typeof report.submittedBy === 'string') {
                reportSubmitter = report.submittedBy;
            } else if (typeof report.submittedBy === 'object' && report.submittedBy !== null) {
                reportSubmitter = report.submittedBy.username || report.submittedBy.name || 'Unknown';
            }
            
            const isUserReport = reportSubmitter === currentUsername;
            
            console.log(`Report ${report.id}: submitted by "${reportSubmitter}", current user: "${currentUsername}", match: ${isUserReport}`);
            
            return isUserReport;
        });
        
        console.log(`Filtered from ${originalCount} to ${reports.length} reports for user: ${currentUsername}`);
        
    } catch (error) {
        console.error('Error during report filtering:', error);
        // On error, show no reports to be safe
        reports = [];
    }
    
    console.log('=== END FILTERING REPORTS ===');
}

function initializeNavigationHandlers() {
    console.log('Initializing navigation handlers...');
    
    // Get all navigation links and add click handlers
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (navLinks.length === 0) {
        console.warn('No navigation links found');
        return;
    }
    
    navLinks.forEach((link, index) => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const onclick = this.getAttribute('onclick');
            const href = this.getAttribute('href');
            
            console.log(`Nav link ${index} clicked:`, { onclick, href });
            
            try {
                if (onclick) {
                    // Extract section name from onclick attribute
                    if (onclick.includes('dashboard')) {
                        showSection('dashboard');
                    } else if (onclick.includes('form')) {
                        // Clear current report ID when creating new report
                        currentReportId = null;
                        showSection('form');
                    } else if (onclick.includes('logout')) {
                        if (typeof logout === 'function') {
                            logout();
                        } else {
                            console.error('logout function not found');
                        }
                    }
                } else if (href) {
                    // Handle href-based navigation as fallback
                    if (href.includes('#dashboard')) {
                        showSection('dashboard');
                    } else if (href.includes('#form')) {
                        currentReportId = null;
                        showSection('form');
                    }
                }
            } catch (error) {
                console.error('Navigation error:', error);
                showAlert('dashboardAlert', 'Navigation error occurred', 'error');
            }
        });
    });
    
    console.log(`Navigation handlers initialized for ${navLinks.length} links`);
}

// Enhanced module checking with more detailed logging
function checkModulesLoaded() {
    console.log('=== CHECKING REQUIRED MODULES ===');
    
    const requiredFunctions = [
        'initializeAuthListeners',  // from auth.js
        'loadReports',              // from api.js
        'showSection',              // from config.js
        'updateDashboard',          // from dashboard.js
        'showLogin',                // from config.js
        'showMainApp',              // from config.js
        'logout'                    // from auth.js
    ];
    
    const optionalFunctions = [
        'initializeFormHandlers',   // from form.js (may not be loaded yet)
        'checkAuthStatus'           // from auth.js (we have our own version)
    ];
    
    const missingRequired = [];
    const missingOptional = [];
    
    requiredFunctions.forEach(func => {
        if (typeof window[func] !== 'function') {
            missingRequired.push(func);
        } else {
            console.log(`✓ ${func} - loaded`);
        }
    });
    
    optionalFunctions.forEach(func => {
        if (typeof window[func] !== 'function') {
            missingOptional.push(func);
        } else {
            console.log(`✓ ${func} - loaded`);
        }
    });
    
    if (missingRequired.length > 0) {
        console.error('❌ Missing required functions:', missingRequired);
        return false;
    }
    
    if (missingOptional.length > 0) {
        console.warn('⚠️  Missing optional functions:', missingOptional);
    }
    
    // Check global variables
    const requiredGlobals = ['CONFIG'];
    const missingGlobals = requiredGlobals.filter(global => typeof window[global] === 'undefined');
    
    if (missingGlobals.length > 0) {
        console.error('❌ Missing required global variables:', missingGlobals);
        return false;
    }
    
    console.log('✅ All required modules loaded successfully');
    return true;
}

// Enhanced error handler for unhandled errors
window.addEventListener('error', function(event) {
    console.error('Unhandled error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
    
    // Show user-friendly error message
    if (typeof showAlert === 'function') {
        showAlert('dashboardAlert', 
            'An unexpected error occurred. Please refresh the page and try again.', 
            'error'
        );
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (typeof showAlert === 'function') {
        showAlert('dashboardAlert', 
            'A network or system error occurred. Please check your connection and try again.', 
            'error'
        );
    }
    
    // Prevent the default behavior (which would log to console)
    event.preventDefault();
});

// Debug function to check application state
window.debugAppState = function() {
    console.log('=== APPLICATION STATE DEBUG ===');
    console.log('Current User:', currentUser);
    console.log('Reports:', reports.length, 'reports loaded');
    console.log('Current Report ID:', currentReportId);
    console.log('Reports Loaded Flag:', reportsLoaded);
    console.log('CONFIG:', CONFIG);
    console.log('=== END APPLICATION STATE ===');
};