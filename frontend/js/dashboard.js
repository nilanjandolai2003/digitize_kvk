// Enhanced viewReport function - displays data in table format instead of form
async function viewReport(reportId) {
    console.log('=== VIEW REPORT (TABLE FORMAT) ===');
    console.log('Requested Report ID:', reportId);
    
    const report = findReportById(reportId);
    
    if (!report) {
        console.error('Report not found:', reportId);
        showAlert('dashboardAlert', 'Report not found!', 'error');
        return;
    }

    console.log('Found report:', report.id);
    
    // Set current report ID
    currentReportId = report.id;
    
    try {
        // Create and show report view modal/section
        showReportViewModal(report);
        
    } catch (error) {
        console.error('Error in viewReport:', error);
        showAlert('dashboardAlert', 'Failed to display report: ' + error.message, 'error');
    }
}

// Create full-screen section to display report in table format
function showReportViewModal(report) {
    // Hide all other sections
    document.getElementById('dashboardSection')?.classList.add('hidden');
    document.getElementById('formSection')?.classList.add('hidden');
    
    // Create or get report view section
    let viewSection = document.getElementById('reportViewSection');
    
    if (!viewSection) {
        viewSection = document.createElement('div');
        viewSection.id = 'reportViewSection';
        document.querySelector('.container')?.appendChild(viewSection);
    }
    
    // Transform data if needed
    let reportData = report.data || report;
    if (typeof reverseTransformFieldNames === 'function') {
        reportData = reverseTransformFieldNames(reportData);
    }
    
    // Generate HTML content
    const reportContent = generateReportViewHTML(reportData, report);
    
    viewSection.innerHTML = `
        <div style="background: #fff; min-height: 100vh; padding: 20px;">
            <div style="max-width: 1400px; margin: 0 auto;">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px; background: #f8f9fa; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="margin: 0; color: #2c3e50; font-size: 28px;">📋 Data in Details</h2>
                    
                </div>
                
                <!-- Report Content -->
                <div style="background: #fff;">
                    ${reportContent}
                </div>
                
                <!-- Footer Actions -->
                <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <button onclick="editReport('${report.id}')" class="btn btn-primary" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: 500;">
                        ✏️ Edit 
                    </button>
                    <button onclick="printReportView()" class="btn btn-secondary" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: 500;">
                        🖨️ Print 
                    </button>
                    <button onclick="closeReportViewModal()" class="btn btn-secondary" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: 500;">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Show the view section
    viewSection.classList.remove('hidden');
    viewSection.style.display = 'block';
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Generate HTML content for report view
function generateReportViewHTML(data, report) {
    const kvkName = data.kvk_name || data.kvkName || 'N/A';
    const submittedBy = report.submittedBy?.username || report.submittedBy || 'Unknown';
    const timestamp = report.timestamp || report.createdAt || Date.now();
    const status = report.status || 'Submitted';
    
    let html = `
        <style>
            .report-section {
                margin-bottom: 30px;
                background: white;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                overflow: hidden;
            }
            .report-section-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 20px;
                font-size: 18px;
                font-weight: bold;
            }
            .report-section-content {
                padding: 20px;
            }
            .info-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
            }
            .info-table tr {
                border-bottom: 1px solid #e9ecef;
            }
            .info-table tr:last-child {
                border-bottom: none;
            }
            .info-table td {
                padding: 12px 15px;
                vertical-align: top;
            }
            .info-table td:first-child {
                font-weight: 600;
                color: #495057;
                width: 35%;
                background: #f8f9fa;
            }
            .info-table td:last-child {
                color: #212529;
            }
            .data-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
            }
            .data-table th {
                background: #e9ecef;
                padding: 10px;
                text-align: left;
                font-weight: 600;
                border: 1px solid #dee2e6;
            }
            .data-table td {
                padding: 10px;
                border: 1px solid #dee2e6;
            }
            .data-table tbody tr:hover {
                background: #f8f9fa;
            }
            .badge {
                display: inline-block;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
            }
            .badge-success {
                background: #d4edda;
                color: #155724;
            }
            .badge-warning {
                background: #fff3cd;
                color: #856404;
            }
            .empty-data {
                color: #6c757d;
                font-style: italic;
                text-align: center;
                padding: 20px;
            }
        </style>
        
        <!-- Report Header Info -->
        <div class="report-section">
            <div class="report-section-header">📄 Report Information</div>
            <div class="report-section-content">
                <table class="info-table">
                    <tr>
                        <td>Report ID</td>
                        <td><strong>${report.id}</strong></td>
                    </tr>
                    <tr>
                        <td>KVK Name</td>
                        <td><strong>${kvkName}</strong></td>
                    </tr>
                    <tr>
                        <td>Submitted By</td>
                        <td>${submittedBy}</td>
                    </tr>
                    <tr>
                        <td>Submission Date</td>
                        <td>${new Date(timestamp).toLocaleDateString('en-IN', { 
                            day: '2-digit', 
                            month: 'long', 
                            year: 'numeric' 
                        })}</td>
                    </tr>
                    <tr>
                        <td>Status</td>
                        <td><span class="badge badge-${status === 'draft' ? 'warning' : 'success'}">${status.toUpperCase()}</span></td>
                    </tr>
                </table>
            </div>
        </div>
        
        <!-- General Information -->
        <div class="report-section">
            <div class="report-section-header">🏢 General Information</div>
            <div class="report-section-content">
                <table class="info-table">
                    <tr>
                        <td>KVK Name</td>
                        <td>${data.kvk_name || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td>KVK Address</td>
                        <td>${data.kvk_address || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td>Telephone</td>
                        <td>${data.kvk_telephone || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td>Email</td>
                        <td>${data.kvk_email || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td>Host Organization</td>
                        <td>${data.host_org_name || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td>Head Name</td>
                        <td>${data.head_name || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td>Head Mobile</td>
                        <td>${data.head_mobile || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td>Sanction Year</td>
                        <td>${data.sanction_year || 'N/A'}</td>
                    </tr>
                </table>
            </div>
        </div>
    `;
    
    // Staff Details
    if (report.staff && report.staff.length > 0) {
        html += `
        <div class="report-section">
            <div class="report-section-header">👥 Staff Details (${report.staff.length} members)</div>
            <div class="report-section-content">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Position</th>
                            <th>Name</th>
                            <th>Designation</th>
                            <th>Discipline</th>
                            <th>Pay Scale</th>
                            <th>Joining Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.staff.map((staff, idx) => `
                            <tr>
                                <td>${idx + 1}</td>
                                <td>${staff.position || '-'}</td>
                                <td>${staff.name || '-'}</td>
                                <td>${staff.designation || '-'}</td>
                                <td>${staff.discipline || '-'}</td>
                                <td>${staff.payScale || '-'}</td>
                                <td>${staff.joiningDate ? new Date(staff.joiningDate).toLocaleDateString() : '-'}</td>
                                <td>${staff.status || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `;
    }
    
    // Land Details
    if (report.landDetails) {
        html += `
        <div class="report-section">
            <div class="report-section-header">🌾 Land Details</div>
            <div class="report-section-content">
                <table class="info-table">
                    <tr>
                        <td>Under Buildings</td>
                        <td>${report.landDetails.buildings || 0} ha</td>
                    </tr>
                    <tr>
                        <td>Under Demonstration Units</td>
                        <td>${report.landDetails.demoUnits || 0} ha</td>
                    </tr>
                    <tr>
                        <td>Under Crops</td>
                        <td>${report.landDetails.crops || 0} ha</td>
                    </tr>
                    <tr>
                        <td>Orchard/Agro-forestry</td>
                        <td>${report.landDetails.orchard || 0} ha</td>
                    </tr>
                    <tr>
                        <td>Others</td>
                        <td>${report.landDetails.others || 0} ha</td>
                    </tr>
                    <tr style="background: #f8f9fa;">
                        <td><strong>Total Land</strong></td>
                        <td><strong>${(
                            (report.landDetails.buildings || 0) + 
                            (report.landDetails.demoUnits || 0) + 
                            (report.landDetails.crops || 0) + 
                            (report.landDetails.orchard || 0) + 
                            (report.landDetails.others || 0)
                        ).toFixed(2)} ha</strong></td>
                    </tr>
                </table>
            </div>
        </div>
        `;
    }
    
    // Infrastructure
    if (report.infrastructure && report.infrastructure.length > 0) {
        html += `
        <div class="report-section">
            <div class="report-section-header">🏗️ Infrastructure (${report.infrastructure.length} items)</div>
            <div class="report-section-content">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Plinth Area (sq.m)</th>
                            <th>Under Use</th>
                            <th>Funding Source</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.infrastructure.map(infra => `
                            <tr>
                                <td>${infra.name || '-'}</td>
                                <td>${infra.status || '-'}</td>
                                <td>${infra.plinthArea || '-'}</td>
                                <td>${infra.underUse || '-'}</td>
                                <td>${infra.fundingSource || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `;
    }
    
    // Vehicles
    if (report.vehicles && report.vehicles.length > 0) {
        html += `
        <div class="report-section">
            <div class="report-section-header">🚗 Vehicles (${report.vehicles.length} vehicles)</div>
            <div class="report-section-content">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Year of Purchase</th>
                            <th>Cost (Rs.)</th>
                            <th>Total Km Run</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.vehicles.map(vehicle => `
                            <tr>
                                <td>${vehicle.type || '-'}</td>
                                <td>${vehicle.yearOfPurchase || '-'}</td>
                                <td>${vehicle.cost ? '₹' + vehicle.cost.toLocaleString('en-IN') : '-'}</td>
                                <td>${vehicle.totalKmRun || '-'}</td>
                                <td>${vehicle.status || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `;
    }
    
    // Equipment
    if (report.equipment && report.equipment.length > 0) {
        html += `
        <div class="report-section">
            <div class="report-section-header">🔧 Equipment (${report.equipment.length} items)</div>
            <div class="report-section-content">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Name</th>
                            <th>Year</th>
                            <th>Cost (Rs.)</th>
                            <th>Status</th>
                            <th>Funding</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.equipment.map(equip => `
                            <tr>
                                <td>${equip.category || '-'}</td>
                                <td>${equip.name || '-'}</td>
                                <td>${equip.yearOfPurchase || '-'}</td>
                                <td>${equip.cost ? '₹' + equip.cost.toLocaleString('en-IN') : '-'}</td>
                                <td>${equip.status || '-'}</td>
                                <td>${equip.fundingSource || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `;
    }
    
    // Technical Achievements
    if (report.technicalAchievements) {
        const tech = report.technicalAchievements;
        html += `
        <div class="report-section">
            <div class="report-section-header">📊 Technical Achievements</div>
            <div class="report-section-content">
                <h4 style="color: #667eea; margin-bottom: 15px;">On Farm Trials (OFT)</h4>
                <table class="info-table">
                    <tr>
                        <td>Technologies Tested</td>
                        <td>${tech.oft?.technologiesTested || 0}</td>
                    </tr>
                    <tr>
                        <td>Number Target</td>
                        <td>${tech.oft?.numberTarget || 0}</td>
                    </tr>
                    <tr>
                        <td>Number Achievement</td>
                        <td>${tech.oft?.numberAchievement || 0}</td>
                    </tr>
                    <tr>
                        <td>Farmers Target</td>
                        <td>${tech.oft?.farmersTarget || 0}</td>
                    </tr>
                </table>
                
                <h4 style="color: #667eea; margin: 20px 0 15px;">Frontline Demonstrations (FLD)</h4>
                <table class="info-table">
                    <tr>
                        <td>Technologies Demonstrated</td>
                        <td>${tech.fld?.technologiesDemonstrated || 0}</td>
                    </tr>
                    <tr>
                        <td>Number Target</td>
                        <td>${tech.fld?.numberTarget || 0}</td>
                    </tr>
                    <tr>
                        <td>Number Achievement</td>
                        <td>${tech.fld?.numberAchievement || 0}</td>
                    </tr>
                    <tr>
                        <td>Farmers Target</td>
                        <td>${tech.fld?.farmersTarget || 0}</td>
                    </tr>
                </table>
                
                <h4 style="color: #667eea; margin: 20px 0 15px;">Training Programs</h4>
                <table class="info-table">
                    <tr>
                        <td>Courses Target</td>
                        <td>${tech.training?.coursesTarget || 0}</td>
                    </tr>
                    <tr>
                        <td>Courses Achievement</td>
                        <td>${tech.training?.coursesAchievement || 0}</td>
                    </tr>
                    <tr>
                        <td>Participants Target</td>
                        <td>${tech.training?.participantsTarget || 0}</td>
                    </tr>
                    <tr>
                        <td>Participants Achievement</td>
                        <td>${tech.training?.participantsAchievement || 0}</td>
                    </tr>
                </table>
            </div>
        </div>
        `;
    }
    
    // District Information
    html += `
    <div class="report-section">
        <div class="report-section-header">🌍 District Information</div>
        <div class="report-section-content">
            <table class="info-table">
                <tr>
                    <td>Major Farming System</td>
                    <td>${data.major_farming_system || 'N/A'}</td>
                </tr>
                <tr>
                    <td>Agro-Climatic Zone</td>
                    <td>${data.agro_climatic_zone || 'N/A'}</td>
                </tr>
                <tr>
                    <td>Agro-Ecological Situation</td>
                    <td>${data.agro_ecological_situation || 'N/A'}</td>
                </tr>
                <tr>
                    <td>Soil Type</td>
                    <td>${data.soil_type || 'N/A'}</td>
                </tr>
                <tr>
                    <td>Crop Productivity</td>
                    <td>${data.crop_productivity || 'N/A'}</td>
                </tr>
            </table>
        </div>
    </div>
    `;
    
    return html;
}

// Close view section and return to dashboard
function closeReportViewModal() {
    const viewSection = document.getElementById('reportViewSection');
    if (viewSection) {
        viewSection.style.display = 'none';
        viewSection.classList.add('hidden');
    }
    
    // Show dashboard section
    if (typeof showSection === 'function') {
        showSection('dashboard');
    } else {
        document.getElementById('dashboardSection')?.classList.remove('hidden');
    }
    
    currentReportId = null;
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Print report view
function printReportView() {
    const viewContent = document.querySelector('#reportViewSection > div');
    if (!viewContent) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Downloaded Data</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .report-section {
                    margin-bottom: 30px;
                    background: white;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    overflow: hidden;
                    page-break-inside: avoid;
                }
                .report-section-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px 20px;
                    font-size: 18px;
                    font-weight: bold;
                }
                .report-section-content {
                    padding: 20px;
                }
                .info-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 15px;
                }
                .info-table tr {
                    border-bottom: 1px solid #e9ecef;
                }
                .info-table tr:last-child {
                    border-bottom: none;
                }
                .info-table td {
                    padding: 12px 15px;
                    vertical-align: top;
                }
                .info-table td:first-child {
                    font-weight: 600;
                    color: #495057;
                    width: 35%;
                    background: #f8f9fa;
                }
                .info-table td:last-child {
                    color: #212529;
                }
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                }
                .data-table th {
                    background: #e9ecef;
                    padding: 10px;
                    text-align: left;
                    font-weight: 600;
                    border: 1px solid #dee2e6;
                }
                .data-table td {
                    padding: 10px;
                    border: 1px solid #dee2e6;
                }
                .badge {
                    display: inline-block;
                    padding: 5px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                }
                .badge-success {
                    background: #d4edda;
                    color: #155724;
                }
                .badge-warning {
                    background: #fff3cd;
                    color: #856404;
                }
                @media print {
                    .no-print { display: none; }
                    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            ${viewContent.innerHTML}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Make functions globally available
window.viewReport = viewReport;
window.closeReportViewModal = closeReportViewModal;
window.printReportView = printReportView;

console.log('Enhanced table view for reports loaded successfully');

// ENHANCED: Intercept showSection to always close report view
const originalShowSection = window.showSection;
if (typeof originalShowSection === 'function') {
    window.showSection = function(sectionName) {
        console.log('Intercepted showSection call for:', sectionName);
        
        // Always close report view section when navigating
        const viewSection = document.getElementById('reportViewSection');
        if (viewSection) {
            viewSection.style.display = 'none';
            viewSection.classList.add('hidden');
            console.log('Report view section closed during navigation');
        }
        
        // Call original showSection
        return originalShowSection.apply(this, arguments);
    };
    console.log('showSection intercepted to auto-close report view');
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Enhanced Dashboard script loaded');
    
    // Set up dashboard navigation
    const dashboardLink = document.querySelector('a[onclick*="showSection(\'dashboard\')"]');
    if (dashboardLink) {
        dashboardLink.addEventListener('click', function(e) {
            e.preventDefault();
            closeReportViewModal(); // Close view first
            showSection('dashboard');
            updateDashboard(); // Refresh dashboard when showing
        });
    }
    
    // Set up form navigation
    const formLink = document.querySelector('a[onclick*="showSection(\'form\')"]');
    if (formLink) {
        formLink.addEventListener('click', function(e) {
            e.preventDefault();
            closeReportViewModal(); // Close view first
            showSection('form');
        });
    }
    
    // Set up logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                closeReportViewModal(); // Close view before logout
                logout();
            }
        });
    }
    
    // Set up refresh dashboard button if exists
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            console.log('Manually refreshing dashboard...');
            updateDashboard();
        });
    }
    
    console.log('Enhanced Dashboard event listeners initialized');
    
    // Initial dashboard update if we're on the dashboard section
    if (document.getElementById('dashboard') && 
        !document.getElementById('dashboard').style.display === 'none') {
        updateDashboard();
    }
});

// ENHANCED: Main editReport function with field transformation
async function editReport(reportId) {
    console.log('=== EDIT REPORT DEBUG ===');
    console.log('1. Requested Report ID:', reportId);
    
    const report = findReportById(reportId);
    
    console.log('2. Found report:', report ? 'YES' : 'NO');
    
    if (!report) {
        console.error('3. Report not found:', reportId);
        console.log('4. Available report IDs:', reports.map(r => ({ id: r.id })));
        showAlert('dashboardAlert', 'Report not found!', 'error');
        return;
    }
    
    console.log('5. Report data structure:', {
        id: report.id,
        hasData: !!report.data,
        dataKeys: report.data ? Object.keys(report.data).length : 0
    });
    
    // Set the current report ID BEFORE showing the form
    currentReportId = report.id;
    console.log('6. Set currentReportId to:', currentReportId);
    
    try {
        // Show form section and wait for it to be fully loaded
        await showSection('form');
        
        // Wait for form to be completely ready
        await waitForFormReady();
        
        // Transform the data to match form field names
        console.log('7. Form is ready, transforming and populating with report data...');
        let dataToPopulate = report.data;
        
        // Apply reverse transformation if we have camelCase data
        if (typeof reverseTransformFieldNames === 'function') {
            dataToPopulate = reverseTransformFieldNames(report.data);
            console.log('Data transformed for form population');
        }
        
        populateFormWithData(dataToPopulate);
        makeFormReadOnly(false);
        console.log('8. Form populated and set to edit mode');
        
    } catch (error) {
        console.error('Error in editReport:', error);
        showAlert('formAlert', 'Failed to load form for editing: ' + error.message, 'error');
    }
    
    console.log('=== END EDIT REPORT DEBUG ===');
}

// ENHANCED: Robust function to wait for form readiness
async function waitForFormReady(maxAttempts = 20, interval = 250) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        
        const checkForm = () => {
            attempts++;
            console.log(`Checking form readiness attempt ${attempts}...`);
            
            const form = document.getElementById('annualReportForm');
            
            if (form) {
                // Check if form has the essential elements
                const essentialElements = [
                    'input[name="kvk_name"]',
                    'textarea[name="kvk_address"]',
                    'input[name="head_name"]'
                ];
                
                const allElementsExist = essentialElements.every(selector => {
                    const element = form.querySelector(selector);
                    const exists = !!element;
                    if (!exists) {
                        console.log(`Missing element: ${selector}`);
                    }
                    return exists;
                });
                
                if (allElementsExist) {
                    console.log('Form is ready with all essential elements');
                    resolve(true);
                    return;
                }
            }
            
            if (attempts >= maxAttempts) {
                console.error(`Form not ready after ${attempts} attempts`);
                reject(new Error(`Form not ready after ${attempts} attempts`));
                return;
            }
            
            setTimeout(checkForm, interval);
        };
        
        // Start checking
        checkForm();
    });
}

// ENHANCED: Robust form population function optimized for your form structure
function populateFormWithData(data) {
    console.log('=== POPULATE FORM WITH DATA ===');
    console.log('Data to populate:', data);
    
    if (!data) {
        console.error('No data provided to populate form');
        return;
    }
    
    const form = document.getElementById('annualReportForm');
    if (!form) {
        console.error('Form not found for population');
        return;
    }
    
    console.log('Form found, beginning population...');
    
    // Field mapping from camelCase (data) to snake_case (form fields)
    const fieldMapping = {
        'kvkName': 'kvk_name',
        'kvkAddress': 'kvk_address', 
        'kvkTelephone': 'kvk_telephone',
        'kvkEmail': 'kvk_email',
        'kvkFax': 'kvk_fax',
        'hostOrgName': 'host_org_name',
        'hostOrgAddress': 'host_org_address',
        'hostOrgTelephone': 'host_org_telephone', 
        'hostOrgEmail': 'host_org_email',
        'hostOrgFax': 'host_org_fax',
        'headName': 'head_name',
        'headMobile': 'head_mobile',
        'headEmail': 'head_email',
        'sanctionYear': 'sanction_year',
        'reportPreparedBy': 'report_prepared_by',
        'reportDate': 'report_date',
        'majorFarmingSystem': 'major_farming_system',
        'agroClimaticZone': 'agro_climatic_zone',
        'agroEcologicalSituation': 'agro_ecological_situation',
        'soilType': 'soil_type',
        'cropProductivity': 'crop_productivity',
        'meanTemperature': 'mean_temperature',
        'meanRainfall': 'mean_rainfall',
        'meanHumidity': 'mean_humidity',
        'livestockProduction': 'livestock_production',
        'majorAchievements': 'major_achievements',
        'constraintsSuggestions': 'constraints_suggestions'
    };
    
    let populatedCount = 0;
    let errorCount = 0;
    let notFoundFields = [];
    
    // Direct field population with mapping
    Object.keys(data).forEach(key => {
        try {
            const value = data[key];
            if (value === null || value === undefined || value === '') return;
            
            // Skip complex objects and arrays for now
            if (typeof value === 'object' && value !== null) {
                notFoundFields.push(key);
                return;
            }
            
            // Get the form field name (mapped or original)
            const formFieldName = fieldMapping[key] || key;
            
            // Try to find the field with exact name match first
            let field = form.querySelector(`[name="${formFieldName}"]`);
            
            // If not found, try ID match
            if (!field) {
                field = form.querySelector(`#${formFieldName}`);
            }
            
            // Try with underscore to dash conversion
            if (!field && formFieldName.includes('_')) {
                field = form.querySelector(`[name="${formFieldName.replace(/_/g, '-')}"]`) ||
                       form.querySelector(`#${formFieldName.replace(/_/g, '-')}`);
            }
            
            // Try with dash to underscore conversion
            if (!field && formFieldName.includes('-')) {
                field = form.querySelector(`[name="${formFieldName.replace(/-/g, '_')}"]`) ||
                       form.querySelector(`#${formFieldName.replace(/-/g, '_')}`);
            }
            
            if (field) {
                populateField(field, value, key);
                populatedCount++;
            } else {
                notFoundFields.push(key);
                console.warn(`Field not found for key: ${key} (looking for form field: ${formFieldName})`);
            }
        } catch (error) {
            errorCount++;
            console.error(`Error populating field ${key}:`, error);
        }
    });
    
    console.log(`Population complete: ${populatedCount} fields populated, ${errorCount} errors`);
    
    if (notFoundFields.length > 0) {
        console.log('Fields not found in form:', notFoundFields);
        console.log('These might be dynamic table fields or nested data');
    }
    
    // Handle any special field mappings or transformations
    handleSpecialFieldPopulation(data);
    
    console.log('=== END POPULATE FORM WITH DATA ===');
}

// Helper function to populate individual fields
function populateField(field, value, debugKey) {
    try {
        if (field.type === 'checkbox') {
            field.checked = !!value;
            console.log(`✅ Populated checkbox ${debugKey}: ${!!value}`);
        } else if (field.type === 'radio') {
            if (field.value === value.toString()) {
                field.checked = true;
                console.log(`✅ Populated radio ${debugKey}: ${value}`);
            }
        } else {
            field.value = value;
            console.log(`✅ Populated ${debugKey}: ${value}`);
        }
    } catch (error) {
        console.error(`❌ Error populating ${debugKey}:`, error);
    }
}

// ENHANCED: Comprehensive makeFormReadOnly function with complete Excel section removal
function makeFormReadOnly(readOnly = true) {
    const form = document.getElementById('annualReportForm');
    if (!form) {
        console.error('Form not found for read-only mode');
        return;
    }

    console.log(`Setting form to ${readOnly ? 'read-only' : 'editable'} mode...`);

    // Handle all form elements
    const formElements = form.querySelectorAll('input, textarea, select, button');
    
    formElements.forEach(element => {
        if (readOnly) {
            // For read-only mode
            if (element.tagName === 'BUTTON') {
                // Hide most buttons except back to dashboard
                if (!element.textContent?.includes('Back') && 
                    element.id !== 'backToDashboard' &&
                    !element.textContent?.includes('Dashboard')) {
                    element.style.display = 'none';
                }
            } else {
                // Disable input elements and add visual styling
                element.disabled = true;
                element.style.backgroundColor = '#f8f9fa';
                element.style.cursor = 'not-allowed';
            }
        } else {
            // For edit mode - enable all elements
            element.disabled = false;
            element.style.backgroundColor = '';
            element.style.cursor = '';
            element.style.display = '';
        }
    });

    // ENHANCED: Complete Excel import section removal/restoration with multiple selectors
    const excelSelectors = [
        '.excel-import-section',
        '#excel-import-section', 
        '[class*="excel-import"]',
        '.import-section',
        '.excel-data-import',
        '#excelImportSection',
        '[class*="Excel"]',
        '.excel-upload',
        '#excelUpload',
        '.file-upload-section',
        '[class*="upload"]',
        '.template-download',
        // Bootstrap card selectors that might contain Excel import
        '.card-body:has([class*="excel"])',
        '.card-header:has([class*="excel"])'
    ];
    
    let excelSections = [];
    
    // Find all Excel import sections using multiple selectors
    for (const selector of excelSelectors) {
        try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (!excelSections.includes(el)) {
                    excelSections.push(el);
                }
            });
        } catch (e) {
            // Continue to next selector if this one fails
            continue;
        }
    }
    
    // If not found by selectors, try to find by text content
    if (excelSections.length === 0) {
        const allElements = document.querySelectorAll('div, section, header, h1, h2, h3, h4, h5, h6');
        for (const element of allElements) {
            const textContent = element.textContent?.toLowerCase() || '';
            if (textContent.includes('excel') && (
                textContent.includes('import') || 
                textContent.includes('upload') || 
                textContent.includes('template') ||
                textContent.includes('data import')
            )) {
                // Find the closest container (parent div, section, card, etc.)
                let excelSection = element.closest('div.card, div.section, div[class*="excel"], div[class*="import"], section');
                if (!excelSection) {
                    excelSection = element.parentElement;
                }
                if (excelSection && !excelSections.includes(excelSection)) {
                    excelSections.push(excelSection);
                }
            }
        }
    }
    
    // Store original sections for restoration
    if (!window.removedExcelSections) {
        window.removedExcelSections = [];
    }
    
    // Apply visibility changes to the Excel sections
    if (excelSections.length > 0) {
        excelSections.forEach((excelSection, index) => {
            if (readOnly) {
                // Store the section and its parent for restoration
                const sectionData = {
                    element: excelSection,
                    parent: excelSection.parentNode,
                    nextSibling: excelSection.nextSibling,
                    originalHTML: excelSection.outerHTML
                };
                
                // Only store if not already stored
                if (!window.removedExcelSections.find(stored => stored.element === excelSection)) {
                    window.removedExcelSections.push(sectionData);
                }
                
                // Completely remove the section from DOM
                excelSection.remove();
                console.log(`Excel import section ${index + 1} completely removed from DOM in view mode`);
            }
        });
        
        if (readOnly) {
            console.log(`${excelSections.length} Excel import sections completely removed in view mode`);
        }
    } else if (readOnly) {
        console.warn('Excel import section not found - it may not exist or use different class names');
        
        // Fallback: Remove any element that contains "Excel Data Import" text
        const allDivs = document.querySelectorAll('div, section');
        allDivs.forEach(div => {
            if (div.textContent && div.textContent.includes('Excel Data Import')) {
                const sectionData = {
                    element: div,
                    parent: div.parentNode,
                    nextSibling: div.nextSibling,
                    originalHTML: div.outerHTML
                };
                
                // Only store if not already stored
                if (!window.removedExcelSections.find(stored => stored.element === div)) {
                    window.removedExcelSections.push(sectionData);
                }
                
                div.remove();
                console.log('Removed div containing "Excel Data Import" text from DOM');
            }
        });
    }
    
    // Restore Excel sections when switching to edit mode
    if (!readOnly && window.removedExcelSections && window.removedExcelSections.length > 0) {
        window.removedExcelSections.forEach((sectionData, index) => {
            try {
                // Create element from stored HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = sectionData.originalHTML;
                const restoredElement = tempDiv.firstElementChild;
                
                // Insert the element back into its original position
                if (sectionData.nextSibling) {
                    sectionData.parent.insertBefore(restoredElement, sectionData.nextSibling);
                } else {
                    sectionData.parent.appendChild(restoredElement);
                }
                
                console.log(`Excel import section ${index + 1} restored to DOM in edit mode`);
            } catch (error) {
                console.error(`Error restoring Excel section ${index + 1}:`, error);
            }
        });
        
        // Clear the stored sections
        window.removedExcelSections = [];
        console.log('All Excel import sections restored in edit mode');
    }

    // Add or remove read-only indicator
    const existingIndicator = form.querySelector('.read-only-indicator');
    
    if (readOnly && !existingIndicator) {
        const indicator = document.createElement('div');
        indicator.className = 'read-only-indicator';
        indicator.innerHTML = `
            <div style="background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; 
                        padding: 15px; margin-bottom: 20px; border-radius: 5px; font-size: 14px;">
                <strong>📖 Read-Only Mode:</strong> This report is being viewed in read-only mode. 
                To make changes, click the Edit button from the dashboard.
            </div>
        `;
        form.insertBefore(indicator, form.firstChild);
    } else if (!readOnly && existingIndicator) {
        existingIndicator.remove();
    }
    
    console.log(`Form set to ${readOnly ? 'read-only' : 'editable'} mode successfully`);
}
// ENHANCED: Dashboard update function with comprehensive debugging
function updateDashboard() {
    console.log('=== Dashboard Update Debug ===');
    console.log('Current user:', currentUser);
    console.log('User role:', currentUser?.role);
    console.log('Reports array:', reports);
    console.log('Reports count:', reports.length);
    
    debugReportsStructure();
    
    document.getElementById('totalReports').textContent = reports.length;
    
    let totalFarmers = 0;
    let totalTraining = 0;
    let totalDemos = 0;

    reports.forEach(report => {
        if (report && report.data) {
            totalFarmers += parseInt(report.data.oft_farmers_target || 0);
            totalFarmers += parseInt(report.data.fld_farmers_target || 0);
            totalTraining += parseInt(report.data.training_courses_achievement || 0);
            totalDemos += parseInt(report.data.fld_number_achievement || 0);
        }
    });

   

    updateReportsList();
}

// ENHANCED: Reports list with comprehensive action buttons
function updateReportsList() {
    const reportsListDiv = document.getElementById('reportsList');
    
    if (reports.length === 0) {
        const noReportsMsg = currentUser?.role === 'admin' 
            ? '<p class="alert alert-info">No reports submitted by any users yet.</p>' 
            : '<p class="alert alert-info">You have not submitted any reports yet.</p>';
        reportsListDiv.innerHTML = noReportsMsg;
        return;
    }

    let html = '<div id="dashboardAlert"></div>';
    
    if (currentUser?.role === 'admin') {
        html += '<div class="alert alert-info">Admin View: Showing all reports from all users</div>';
    } else {
        html += '<div class="alert alert-info">User View: Showing only your reports</div>';
    }
    
    html += `
        <table class="table table-striped table-hover">
            <thead class="thead-dark">
                <tr>
                    <th>Report ID</th>
                    <th>KVK Name</th>
                    <th>Submitted By</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    reports.forEach(report => {
        let kvkName = 'N/A';
        if (report && report.data) {
            kvkName = report.kvkName ||
                     report.data.kvk_name ||
                     report.data.kvkName ||
                     report.data.regKvkName ||
                     report.data.generalInfo?.kvkName ||
                     'N/A';
        }
        
        console.log(`Report ${report.id}: KVK Name resolved to "${kvkName}"`);
        
        let submittedBy = 'Unknown';
        if (report.submittedBy) {
            if (typeof report.submittedBy === 'string') {
                submittedBy = report.submittedBy;
            } else if (typeof report.submittedBy === 'object' && report.submittedBy !== null) {
                submittedBy = report.submittedBy.username || 
                             report.submittedBy.name || 
                             'Unknown';
            }
        }
        
        const timestamp = report.timestamp || report.createdAt || Date.now();
        const status = report.status || 'Submitted';
        const reportId = report.id;
        
        html += `
            <tr>
                <td><strong>${reportId}</strong></td>
                <td>${kvkName}</td>
                <td>${submittedBy}</td>
                <td>${new Date(timestamp).toLocaleDateString()}</td>
                <td>
                    <span class="badge badge-${status === 'draft' ? 'warning' : 'success'}">
                        ${status}
                    </span>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-info btn-sm" 
                                onclick="viewReport('${reportId}')" 
                                title="View Report (Read-only)">
                            📖 View
                        </button>
                        <button class="btn btn-secondary btn-sm" 
                                onclick="editReport('${reportId}')" 
                                title="Edit Report">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-danger btn-sm" 
                                onclick="deleteReport('${reportId}')" 
                                title="Delete Report">
                            🗑️ Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    reportsListDiv.innerHTML = html;
    
    console.log('Reports list updated with', reports.length, 'reports');
}

// ENHANCED: Delete report with comprehensive error handling
async function deleteReport(reportId) {
    console.log('=== DELETE REPORT DEBUG ===');
    console.log('1. Requested Report ID:', reportId);
    
    const report = findReportById(reportId);
    if (!report) {
        console.error('2. Report not found:', reportId);
        showAlert('dashboardAlert', 'Report not found!', 'error');
        return;
    }

    const kvkName = report.kvkName || report.data?.kvk_name || report.data?.kvkName || 'Unknown KVK';
    const confirmMessage = `Are you sure you want to delete the report from "${kvkName}"?\n\nReport ID: ${reportId}\n\nThis action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
        console.log('3. User cancelled deletion');
        return;
    }

    try {
        console.log('4. Attempting to delete report via API...');
        await deleteReportAPI(reportId);
        console.log('5. Report deleted successfully via API');
        showAlert('dashboardAlert', 'Report deleted successfully!', 'success');
        updateDashboard();
        
    } catch (error) {
        console.error('6. API deletion failed, trying local deletion:', error);
        
        const initialLength = reports.length;
        reports = reports.filter(r => r.id !== reportId);
        
        if (reports.length < initialLength) {
            console.log('7. Report deleted from local storage');
            showAlert('dashboardAlert', 'Report deleted locally (API unavailable)', 'success');
            updateDashboard();
        } else {
            console.error('8. Failed to delete report locally');
            showAlert('dashboardAlert', 'Failed to delete report', 'error');
        }
    }
    
    console.log('=== END DELETE REPORT DEBUG ===');
}

// ENHANCED: Debug reports structure with comprehensive logging
function debugReportsStructure() {
    console.log('=== DEBUG REPORTS STRUCTURE ===');
    
    if (reports.length === 0) {
        console.log('No reports to debug');
        return;
    }
    
    reports.forEach((report, index) => {
        console.log(`Report ${index + 1}:`, {
            id: report.id,
            kvkName: report.kvkName,
            hasData: !!report.data,
            status: report.status,
            timestamp: report.timestamp,
            submittedBy: report.submittedBy,
            dataKeys: report.data ? Object.keys(report.data).length : 0,
            sampleDataKeys: report.data ? Object.keys(report.data).slice(0, 5) : []
        });
    });
    
    console.log('=== END DEBUG REPORTS STRUCTURE ===');
}

// ENHANCED: Handle special field population cases including dynamic tables
function handleSpecialFieldPopulation(data) {
    console.log('Handling special field population...');
    
    // Handle date fields with proper formatting
    const dateFields = ['report_date', 'reportDate'];
    dateFields.forEach(dateKey => {
        if (data[dateKey]) {
            const dateField = document.querySelector(`input[name="${dateKey}"]`);
            if (dateField) {
                const date = new Date(data[dateKey]);
                if (!isNaN(date.getTime())) {
                    dateField.value = date.toISOString().split('T')[0];
                    console.log(`Populated date field ${dateKey}:`, dateField.value);
                }
            }
        }
    });
    
    // Handle nested objects
    if (data.generalInfo && typeof data.generalInfo === 'object') {
        Object.keys(data.generalInfo).forEach(key => {
            const field = document.querySelector(`input[name="${key}"]`) ||
                         document.querySelector(`textarea[name="${key}"]`) ||
                         document.querySelector(`select[name="${key}"]`);
            if (field) {
                field.value = data.generalInfo[key] || '';
                console.log(`Populated nested field ${key}:`, data.generalInfo[key]);
            }
        });
    }
    
    // Handle dynamic table data
    const tableDataMap = {
        'staffMembers': 'staffTable',
        'infrastructure': 'infrastructureTable',
        'vehicles': 'vehiclesTable',
        'equipment': 'equipmentTable',
        'implements': 'implementsTable',
        'sacMeetings': 'sacMeetingTable',
        'operationalAreas': 'operationalAreaTable',
        'villageAdoption': 'villageAdoptionTable',
        'thrustAreas': 'thrustAreasTable',
        'oftDetails': 'oftDetailsTable',
        'oftPerformance': 'oftPerformanceTable',
        'cereals': 'cerealsTable',
        'pulses': 'pulsesTable',
        'oilseeds': 'oilseedsTable'
    };
    
    // Populate dynamic tables if data exists
    Object.keys(tableDataMap).forEach(dataKey => {
        if (data[dataKey] && Array.isArray(data[dataKey])) {
            const tableId = tableDataMap[dataKey];
            console.log(`Found ${dataKey} data with ${data[dataKey].length} items for table ${tableId}`);
            
            // Clear existing rows
            const tbody = document.getElementById(tableId);
            if (tbody) {
                tbody.innerHTML = '';
                
                // Add each row
                data[dataKey].forEach((rowData, index) => {
                    console.log(`Adding row ${index + 1} to ${tableId}:`, rowData);
                    // You might need to call specific functions here depending on your table structure
                    // For now, we'll log that the data exists
                });
            }
        }
    });
    
    // Handle arrays and other complex data structures
    Object.keys(data).forEach(key => {
        if (Array.isArray(data[key])) {
            console.log(`Found array field ${key} with ${data[key].length} items`);
        } else if (typeof data[key] === 'object' && data[key] !== null) {
            console.log(`Found object field ${key}:`, Object.keys(data[key]));
        }
    });
}

// NEW: Debug function to show available form fields
function debugFormFields() {
    console.log('=== AVAILABLE FORM FIELDS DEBUG ===');
    
    const form = document.getElementById('annualReportForm');
    if (!form) {
        console.error('Form not found');
        return;
    }
    
    const formElements = form.querySelectorAll('input, textarea, select');
    console.log(`Found ${formElements.length} form elements:`);
    
    const fieldsByType = {
        input: [],
        textarea: [],
        select: []
    };
    
    formElements.forEach((element, index) => {
        const fieldInfo = {
            index: index,
            tag: element.tagName.toLowerCase(),
            type: element.type || 'text',
            name: element.name || 'NO_NAME',
            id: element.id || 'NO_ID',
            placeholder: element.placeholder || ''
        };
        
        fieldsByType[element.tagName.toLowerCase()].push(fieldInfo);
        
        // Log first 20 fields for debugging
        if (index < 20) {
            console.log(`Field ${index}:`, fieldInfo);
        }
    });
    
    console.log('Fields by type:', fieldsByType);
    console.log('=== END FORM FIELDS DEBUG ===');
    
    return fieldsByType;
}



// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Enhanced Dashboard script loaded');
    
    // Set up dashboard navigation
    const dashboardLink = document.querySelector('a[onclick*="showSection(\'dashboard\')"]');
    if (dashboardLink) {
        dashboardLink.addEventListener('click', function(e) {
            e.preventDefault();
            showSection('dashboard');
            updateDashboard(); // Refresh dashboard when showing
        });
    }
    
    // Set up logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
    }
    
    // Set up refresh dashboard button if exists
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            console.log('Manually refreshing dashboard...');
            updateDashboard();
        });
    }
    
    console.log('Enhanced Dashboard event listeners initialized');
    
    // Initial dashboard update if we're on the dashboard section
    if (document.getElementById('dashboard') && 
        !document.getElementById('dashboard').style.display === 'none') {
        updateDashboard();
    }
});
