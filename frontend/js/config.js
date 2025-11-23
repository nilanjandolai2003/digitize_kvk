const CONFIG = {
    API_BASE: 'http://localhost:5000/api'
};

// Global variables
let currentUser = null;
let reports = [];
let currentReportId = null; // This will  hold database IDs only
let reportsLoaded = false;
let formStructureLoaded = false;




// Utility functions
function showAlert(elementId, message, type) {
    const alertDiv = document.getElementById(elementId);
    if (!alertDiv) {
        console.warn(`Alert element not found: ${elementId}`);
        return;
    }
    
    alertDiv.innerHTML = `<div class="alert alert-${type === 'error' ? 'error' : 'success'}">${message}</div>`;
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 5000);
}

// Show/Hide sections
function showLogin() {
    document.getElementById('loginSection')?.classList.remove('hidden');
    document.getElementById('registrationSection')?.classList.add('hidden');
    document.getElementById('dashboardSection')?.classList.add('hidden');
    document.getElementById('formSection')?.classList.add('hidden');
    document.getElementById('navbar')?.classList.add('hidden');
    
    currentUser = null;
    currentReportId = null; // Reset to null - will be set by database
    reportsLoaded = false;
}

function showRegistration() {
    document.getElementById('loginSection')?.classList.add('hidden');
    document.getElementById('registrationSection')?.classList.remove('hidden');
    document.getElementById('dashboardSection')?.classList.add('hidden');
    document.getElementById('formSection')?.classList.add('hidden');
    document.getElementById('navbar')?.classList.add('hidden');
}

async function showMainApp() {
    document.getElementById('loginSection')?.classList.add('hidden');
    document.getElementById('registrationSection')?.classList.add('hidden');
    document.getElementById('navbar')?.classList.remove('hidden');
    
    console.log('Showing main app. Reports loaded status:', reportsLoaded);
    
    if (!reportsLoaded) {
        console.log('Reports not loaded yet, loading now...');
        try {
            await loadReports();
            reportsLoaded = true;
            console.log('Reports loaded in showMainApp:', reports.length);
        } catch (error) {
            console.error('Failed to load reports in showMainApp:', error);
            reports = [];
            reportsLoaded = true;
        }
    }
    
    showSection('dashboard');
}

async function loadFormStructure() {
    const formSection = document.getElementById('formSection');
    
    if (!formSection) {
        console.error('Form section not found in DOM');
        return false;
    }
    
    if (formStructureLoaded && formSection.innerHTML.trim() !== '') {
        console.log('Form structure already loaded, skipping reload');
        return true;
    }
    
    try {
        console.log('Loading form structure for the first time...');
        const response = await fetch('form-structure.html');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        let formHTML = await response.text();
        
        formHTML = formHTML.replace(/<div id="formSection" class="hidden">/, '');
        formHTML = formHTML.replace(/<\/div>\s*$/, '');
        
        formSection.innerHTML = formHTML;
        formSection.classList.remove('hidden');
        formSection.style.display = 'block';
        
        console.log('Form HTML loaded, waiting for DOM to settle...');
        
        return new Promise(async(resolve) => {
            setTimeout(async() => {
                if (typeof initializeFormHandlers === 'function') {
                    initializeFormHandlers();
                }
                 await ensureExcelFunctionsLoaded();
                formStructureLoaded = true;
                console.log('Form structure loaded and initialized successfully');
                resolve(true);
            }, 200);
        });
        
    } catch (error) {
        console.error('Error loading form structure:', error);
        return false;
    }
}
async function loadAndPopulateLatestReport() {
    try {
        const latestReport = await loadLatestReportData();
        if (latestReport) {
            populateFormWithReport(latestReport);
            showAlert('formAlert', 'Latest report data loaded successfully!', 'success');
        } else {
            showAlert('formAlert', 'No previous report found', 'warning');
        }
    } catch (error) {
        console.error('Error loading latest report:', error);
        showAlert('formAlert', 'Failed to load latest report data', 'error');
    }
}
async function showSection(section) {
    console.log(`=== Showing section: ${section} ===`);
    
    // Clear currentReportId when navigating away from form (except for edit/view)
    if (section !== 'form' && section !== 'edit-form' && section !== 'view-form') {
        if (currentReportId && section !== 'dashboard') {
            currentReportId = null; // Reset to null instead of custom ID
        }
    }
    
    const sections = ['dashboardSection', 'formSection'];
    sections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.classList.add('hidden');
            element.style.display = 'none';
        }
    });
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    if (section === 'dashboard') {
        const dashboardSection = document.getElementById('dashboardSection');
        if (dashboardSection) {
            dashboardSection.classList.remove('hidden');
            dashboardSection.style.display = 'block';
            console.log('Dashboard section made visible');
        }
        
        if (!reportsLoaded) {
            console.log('Reports not loaded, loading for dashboard...');
            try {
                await loadReports();
                reportsLoaded = true;
                console.log('Reports loaded for dashboard:', reports.length);
            } catch (error) {
                console.error('Failed to load reports for dashboard:', error);
                reports = [];
            }
        }
        
        if (typeof updateDashboard === 'function') {
            updateDashboard();
        } else {
            console.error('updateDashboard function not found');
        }
        
    } else if (section === 'form') {
        const formSection = document.getElementById('formSection');
        if (formSection) {
            formSection.classList.remove('hidden');
            formSection.style.display = 'block';
            console.log('Form section made visible');
        }
        
        try {
            const formLoaded = await loadFormStructure();
            if (!formLoaded) {
                throw new Error('Form structure failed to load');
            }
            console.log('Form structure ready');
            await ensureExcelFunctionsLoaded();
         if (!currentReportId) {
        console.log('Creating new form - clearing any existing data');
        resetForm();  
    }
            
           
            
        } catch (error) {
            console.error('Failed to load form structure:', error);
            showAlert('formAlert', 'Failed to load form. Please try again.', 'error');
        }
    }
    
    document.querySelectorAll('.nav-link').forEach(link => {
        const onclick = link.getAttribute('onclick');
        if (onclick && onclick.includes(section)) {
            link.classList.add('active');
        }
    });
    
    console.log(`=== Section ${section} display completed ===`);
}

function resetForm() {
    const form = document.getElementById('annualReportForm');
    if (form) {
        form.reset();
        
        const dynamicTables = ['staffTable', 'infrastructureTable', 'vehiclesTable', 
                              'equipmentTable', 'implementsTable', 'sacMeetingTable', 
                              'operationalAreaTable', 'villageAdoptionTable', 'thrustAreasTable',
                              'oftDetailsTable', 'oftPerformanceTable', 'cerealsTable', 
                              'pulsesTable', 'oilseedsTable'];
        
        dynamicTables.forEach(tableId => {
            const tbody = document.getElementById(tableId);
            if (tbody) {
                tbody.innerHTML = '';
            }
        });
        
        const indicator = form.querySelector('.read-only-indicator');
        if (indicator) {
            indicator.remove();
        }
        
        console.log('Form reset to blank state');
    }
}
async function ensureExcelFunctionsLoaded() {
    console.log('Checking Excel import functions...');
    
    // Check if Excel functions exist
    if (typeof window.downloadExcelTemplate !== 'function' || 
        typeof window.handleExcelUpload !== 'function') {
        
        console.log('Excel functions not found, loading excel-import.js...');
        
        // Dynamically load excel-import.js if not loaded
        if (!document.querySelector('script[src*="excel-import.js"]')) {
            const script = document.createElement('script');
            script.src = 'excel-import.js';
            script.onload = () => {
                console.log('Excel import script loaded successfully');
            };
            script.onerror = () => {
                console.error('Failed to load excel-import.js');
                showAlert('formAlert', 'Excel import features unavailable', 'warning');
            };
            document.head.appendChild(script);
        }
        
        // Wait for functions to be available
        let attempts = 0;
        while (attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (typeof window.downloadExcelTemplate === 'function' && 
                typeof window.handleExcelUpload === 'function') {
                console.log('Excel functions now available');
                return true;
            }
            attempts++;
        }
        
        console.warn('Excel functions still not available after waiting');
        return false;
    } else {
        console.log('Excel functions already available');
        return true;
    }
}