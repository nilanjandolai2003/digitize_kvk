let formSubmissionInProgress = false; // Global flag to prevent double submissions

// Enhanced form submission handler with duplicate prevention
function initializeFormHandlers() {
    const form = document.getElementById('annualReportForm');
    if (!form) {
        console.error('Form not found in initializeFormHandlers');
        return;
    }

    // Remove any existing event listeners to prevent duplicates
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Add single event listener with proper duplicate prevention
    newForm.addEventListener('submit', handleFormSubmission);
    
    console.log('Form handlers initialized with duplicate prevention');
    
    // Add initial rows when form is loaded
    addInitialStaffRows();
    addInitialInfrastructureRows();
    addInitialEquipmentRows();
}

// Enhanced form submission handler
// Replace the handleFormSubmission function in form-handlers.js with this

async function handleFormSubmission(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('=== FORM SUBMISSION STARTED ===');
    
    if (formSubmissionInProgress) {
        console.warn('Form submission already in progress, ignoring duplicate');
        return false;
    }
    
    formSubmissionInProgress = true;
    
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    submitButtons.forEach(btn => {
        btn.disabled = true;
        btn.textContent = 'Submitting...';
    });
    
    try {
        if (!validateForm()) {
            return false;
        }
        
        const formData = new FormData(e.target);
        const reportData = {};

        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            reportData[key] = value;
        }
        
        console.log('Raw form data extracted:', Object.keys(reportData).length, 'fields');
        
        // ===== STRUCTURE NESTED OBJECTS =====
        
        // Land Details
        reportData.landDetails = {
            buildings: parseFloat(reportData.land_buildings) || 0,
            demoUnits: parseFloat(reportData.land_demoUnits) || 0,
            crops: parseFloat(reportData.land_crops) || 0,
            orchard: parseFloat(reportData.land_orchard) || 0,
            others: parseFloat(reportData.land_others) || 0
        };
        delete reportData.land_buildings;
        delete reportData.land_demoUnits;
        delete reportData.land_crops;
        delete reportData.land_orchard;
        delete reportData.land_others;
        
        // Technical Achievements
        reportData.technicalAchievements = {
            oft: {
                technologiesTested: parseInt(reportData.oft_technologies_tested) || 0,
                numberTarget: parseInt(reportData.oft_number_target) || 0,
                numberAchievement: parseInt(reportData.oft_number_achievement) || 0,
                farmersTarget: parseInt(reportData.oft_farmers_target) || 0
            },
            fld: {
                technologiesDemonstrated: parseInt(reportData.fld_technologies_demonstrated) || 0,
                numberTarget: parseInt(reportData.fld_number_target) || 0,
                numberAchievement: parseInt(reportData.fld_number_achievement) || 0,
                farmersTarget: parseInt(reportData.fld_farmers_target) || 0
            },
            training: {
                coursesTarget: parseInt(reportData.training_courses_target) || 0,
                coursesAchievement: parseInt(reportData.training_courses_achievement) || 0,
                participantsTarget: parseInt(reportData.training_participants_target) || 0,
                participantsAchievement: parseInt(reportData.training_participants_achievement) || 0
            },
            extension: {
                activitiesTarget: parseInt(reportData.extension_activities_target) || 0,
                activitiesAchievement: parseInt(reportData.extension_activities_achievement) || 0,
                participantsTarget: parseInt(reportData.extension_participants_target) || 0,
                participantsAchievement: parseInt(reportData.extension_participants_achievement) || 0
            },
            production: {
                seedProductionTarget: parseInt(reportData.seed_production_target) || 0,
                seedProductionAchievement: parseInt(reportData.seed_production_achievement) || 0,
                plantingMaterialTarget: parseInt(reportData.planting_material_target) || 0,
                plantingMaterialAchievement: parseInt(reportData.planting_material_achievement) || 0
            }
        };
        
        // Remove flat technical achievement fields
        const techFieldsToRemove = [
            'oft_technologies_tested', 'oft_number_target', 'oft_number_achievement', 'oft_farmers_target',
            'fld_technologies_demonstrated', 'fld_number_target', 'fld_number_achievement', 'fld_farmers_target',
            'training_courses_target', 'training_courses_achievement', 'training_participants_target', 'training_participants_achievement',
            'extension_activities_target', 'extension_activities_achievement', 'extension_participants_target', 'extension_participants_achievement',
            'seed_production_target', 'seed_production_achievement', 'planting_material_target', 'planting_material_achievement'
        ];
        techFieldsToRemove.forEach(field => delete reportData[field]);
        
        // Publications
        reportData.publications = {
            researchPapers: parseInt(reportData.research_papers) || 0,
            bulletins: parseInt(reportData.bulletins) || 0,
            popularArticles: parseInt(reportData.popular_articles) || 0,
            extensionPamphlets: parseInt(reportData.extension_pamphlets) || 0,
            technicalReports: parseInt(reportData.technical_reports) || 0,
            booksPublished: parseInt(reportData.books_published) || 0
        };
        ['research_papers', 'bulletins', 'popular_articles', 'extension_pamphlets', 
         'technical_reports', 'books_published'].forEach(field => delete reportData[field]);
        
        // Livestock
        reportData.livestock = {
            dairyDemonstrations: parseInt(reportData.dairy_demonstrations) || 0,
            poultryDemonstrations: parseInt(reportData.poultry_demonstrations) || 0,
            goatSheepDemonstrations: parseInt(reportData.goat_sheep_demonstrations) || 0
        };
        ['dairy_demonstrations', 'poultry_demonstrations', 'goat_sheep_demonstrations']
            .forEach(field => delete reportData[field]);
        
        // ===== EXTRACT DYNAMIC TABLE DATA =====
        
        reportData.staff = extractTableData('staff', {
            'position': 'position',
            'name': 'name',
            'designation': 'designation',
            'discipline': 'discipline',
            'pay_scale': 'payScale',
            'joining_date': 'joiningDate',
            'status': 'status',
            'category': 'category'
        });
        
        reportData.infrastructure = extractTableData('infra', {
            'name': 'name',
            'status': 'status',
            'plinth_area': 'plinthArea',
            'under_use': 'underUse',
            'funding_source': 'fundingSource'
        });
        
        reportData.vehicles = extractTableData('vehicle', {
            'type': 'type',
            'year': 'yearOfPurchase',
            'cost': 'cost',
            'km_run': 'totalKmRun',
            'status': 'status'
        });
        
        reportData.equipment = extractTableData('equipment', {
            'category': 'category',
            'name': 'name',
            'year': 'yearOfPurchase',
            'cost': 'cost',
            'status': 'status',
            'funding': 'fundingSource'
        });
        
        reportData.sacMeetings = extractTableData('sac', {
            'date': 'date',
            'participants': 'participants',
            'recommendations': 'recommendations',
            'action_taken': 'actionTaken'
        });
        
        reportData.operationalAreas = extractTableData('op', {
            'taluk': 'taluk',
            'block': 'block',
            'villages': 'villages',
            'crops': 'majorCrops',
            'problems': 'problems',
            'thrust_areas': 'thrustAreas'
        });
        
        reportData.villageAdoption = extractTableData('village', {
            'name': 'name',
            'block': 'block',
            'action': 'actionTaken'
        });
        
        reportData.oftDetails = extractTableData('oft', {
            'title': 'title',
            'problem': 'problemDiagnosed',
            'technology': 'technologySelected',
            'source': 'source',
            'production_system': 'productionSystem',
            'performance': 'performanceIndicators'
        });
        
        reportData.oftPerformance = extractTableData('oft_perf', {
            'technology': 'technologyOption',
            'trials': 'numberOfTrials',
            'yield': 'yield',
            'cost': 'costOfCultivation',
            'gross': 'grossReturn',
            'net': 'netReturn',
            'bc_ratio': 'bcRatio'
        });
        
        reportData.cerealsDemo = extractTableData('cereals', {
            'crop': 'crop',
            'technology': 'technologyDemonstrated',
            'area': 'area',
            'farmers': 'numberOfFarmers',
            'demo_yield': 'demoYield',
            'check_yield': 'checkYield',
            'increase': 'percentageIncrease'
        });
        
        reportData.pulsesDemo = extractTableData('pulses', {
            'crop': 'crop',
            'technology': 'technologyDemonstrated',
            'area': 'area',
            'farmers': 'numberOfFarmers',
            'demo_yield': 'demoYield',
            'check_yield': 'checkYield',
            'increase': 'percentageIncrease'
        });
        
        reportData.oilseedsDemo = extractTableData('oilseeds', {
            'crop': 'crop',
            'technology': 'technologyDemonstrated',
            'area': 'area',
            'farmers': 'numberOfFarmers',
            'demo_yield': 'demoYield',
            'check_yield': 'checkYield',
            'increase': 'percentageIncrease'
        });
        
        console.log('=== STRUCTURED DATA ===');
        console.log('Staff:', reportData.staff?.length, 'entries');
        console.log('Infrastructure:', reportData.infrastructure?.length, 'entries');
        console.log('Vehicles:', reportData.vehicles?.length, 'entries');
        console.log('Equipment:', reportData.equipment?.length, 'entries');
        console.log('Land Details:', reportData.landDetails);
        console.log('Technical Achievements:', reportData.technicalAchievements);
        console.log('Current report ID:', currentReportId);
        
        // Submit the report
        const result = await saveReportHybrid(reportData, false);
        
        console.log('Report submission successful:', result);
        showAlert('formAlert', 'Annual report submitted successfully!', 'success');
        
        // Reset form and navigate to dashboard after success
        setTimeout(() => {
            e.target.reset();
            currentReportId = null;
            showSection('dashboard');
            
            // Refresh the reports list
            if (typeof loadReports === 'function') {
                loadReports().then(() => {
                    if (typeof updateDashboard === 'function') {
                        updateDashboard();
                    }
                });
            }
        }, 2000);
        
    } catch (error) {
        console.error('Form submission error:', error);
        showAlert('formAlert', error.message || 'Failed to submit report', 'error');
    } finally {
        formSubmissionInProgress = false;
        
        submitButtons.forEach(btn => {
            btn.disabled = false;
            btn.textContent = 'Submit Report';
        });
        
        console.log('=== FORM SUBMISSION COMPLETED ===');
    }
    
    return false;
}
    


// Enhanced save as draft with duplicate prevention
async function saveAsDraft() {
    console.log('=== SAVE AS DRAFT STARTED ===');
    
    // Prevent duplicate draft saves
    if (formSubmissionInProgress) {
        console.warn('Form operation already in progress, ignoring draft save');
        return;
    }
    
    formSubmissionInProgress = true;
    
    // Disable draft button
    const draftButtons = document.querySelectorAll('button[onclick*="saveAsDraft"]');
    draftButtons.forEach(btn => {
        btn.disabled = true;
        btn.textContent = 'Saving...';
    });
    
    try {
        const form = document.getElementById('annualReportForm');
        if (!form) {
            throw new Error('Form not found');
        }
        
        const formData = new FormData(form);
        const reportData = {};

        for (let [key, value] of formData.entries()) {
            reportData[key] = value;
        }

        console.log('Saving draft with', Object.keys(reportData).length, 'fields');
        
        await saveReportHybrid(reportData, true);
        showAlert('formAlert', 'Report saved as draft!', 'success');
        
    } catch (error) {
        console.error('Draft save error:', error);
        showAlert('formAlert', error.message || 'Failed to save draft', 'error');
    } finally {
        // Reset flag and re-enable buttons
        formSubmissionInProgress = false;
        
        draftButtons.forEach(btn => {
            btn.disabled = false;
            btn.textContent = 'Save as Draft';
        });
        
        console.log('=== SAVE AS DRAFT COMPLETED ===');
    }
}

// Enhanced validation function
function validateForm() {
    const form = document.getElementById('annualReportForm');
    if (!form) {
        console.error('Form not found for validation');
        return false;
    }
    
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    let firstInvalidField = null;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#f5576c';
            field.style.boxShadow = '0 0 0 0.2rem rgba(245, 87, 108, 0.25)';
            if (!firstInvalidField) {
                firstInvalidField = field;
            }
            isValid = false;
        } else {
            field.style.borderColor = '#e1e5e9';
            field.style.boxShadow = '';
        }
    });
    
    if (!isValid) {
        showAlert('formAlert', 'Please fill in all required fields marked with *', 'error');
        
        // Scroll to first invalid field
        if (firstInvalidField) {
            firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalidField.focus();
        }
    }
    
    return isValid;
}

// Generic delete row function with improved error handling
function deleteTableRow(button) {
    if (confirm('Are you sure you want to delete this row?')) {
        try {
            const row = button.closest('tr');
            const tbody = row.parentNode;
            const tableId = tbody.id;
            
            row.remove();
            
            // Update row numbers for tables that have numbered rows
            if (tableId === 'staffTable' || tableId === 'oftDetailsTable' || 
                tableId === 'sacMeetingTable' || tableId === 'operationalAreaTable' ||
                tableId === 'thrustAreasTable') {
                updateRowNumbers(tableId, 0);
            }
            
            console.log(`Row deleted from table: ${tableId}`);
        } catch (error) {
            console.error('Error deleting table row:', error);
            showAlert('formAlert', 'Error deleting row', 'error');
        }
    }
}

// Function to update row numbers after deletion
function updateRowNumbers(tableId, startColumn) {
    try {
        const tbody = document.getElementById(tableId);
        if (!tbody) {
            console.warn(`Table body not found: ${tableId}`);
            return;
        }
        
        const rows = tbody.getElementsByTagName('tr');
        
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].getElementsByTagName('td');
            if (cells.length > startColumn) {
                cells[startColumn].textContent = i + 1;
            }
        }
        
        console.log(`Updated row numbers for table: ${tableId}`);
    } catch (error) {
        console.error('Error updating row numbers:', error);
    }
}

// Enhanced staff row addition
function addStaffRow(position = '') {
    try {
        const tbody = document.getElementById('staffTable');
        if (!tbody) {
            console.error('Staff table body not found');
            return;
        }
        
        const rowCount = tbody.children.length + 1;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${rowCount}</td>
            <td><input type="text" name="staff_position_${rowCount}" class="form-control" value="${position}"></td>
            <td><input type="text" name="staff_name_${rowCount}" class="form-control"></td>
            <td><input type="text" name="staff_designation_${rowCount}" class="form-control"></td>
            <td><input type="text" name="staff_discipline_${rowCount}" class="form-control"></td>
            <td><input type="text" name="staff_pay_scale_${rowCount}" class="form-control"></td>
            <td><input type="date" name="staff_joining_date_${rowCount}" class="form-control"></td>
            <td>
                <select name="staff_status_${rowCount}" class="form-control">
                    <option value="">Select</option>
                    <option value="Permanent">Permanent</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Contract">Contract</option>
                </select>
            </td>
            <td>
                <select name="staff_category_${rowCount}" class="form-control">
                    <option value="">Select</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="OBC">OBC</option>
                    <option value="General">General</option>
                </select>
            </td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)" title="Delete Row">×</button></td>
        `;
        tbody.appendChild(row);
        updateRowNumbers('staffTable', 0);
        
        console.log(`Added staff row ${rowCount}: ${position}`);
    } catch (error) {
        console.error('Error adding staff row:', error);
    }
}

// Initialize default rows with error handling
function addInitialStaffRows() {
    try {
        const tbody = document.getElementById('staffTable');
        if (!tbody) {
            console.warn('Staff table not found, skipping initial rows');
            return;
        }
        
        // Only add if table is empty
        if (tbody.children.length === 0) {
            const defaultPositions = [
                'Senior Scientist & Head',
                'Subject Matter Specialist (Crop Production)',
            ];
            
            defaultPositions.forEach(position => {
                addStaffRow(position);
            });
            
            console.log('Added initial staff rows');
        }
    } catch (error) {
        console.error('Error adding initial staff rows:', error);
    }
}

function addInitialInfrastructureRows() {
    try {
        const tbody = document.getElementById('infrastructureTable');
        if (!tbody) {
            console.warn('Infrastructure table not found, skipping initial rows');
            return;
        }
        
        if (tbody.children.length === 0) {
            const defaultInfrastructure = [
                'Administrative Building',
                'Training Hall',
            ];
            
            defaultInfrastructure.forEach(infra => {
                addInfrastructureRow(infra);
            });
            
            console.log('Added initial infrastructure rows');
        }
    } catch (error) {
        console.error('Error adding initial infrastructure rows:', error);
    }
}

function addInitialEquipmentRows() {
    try {
        const tbody = document.getElementById('equipmentTable');
        if (!tbody) {
            console.warn('Equipment table not found, skipping initial rows');
            return;
        }
        
        if (tbody.children.length === 0) {
            const defaultCategories = [
                'Lab Equipment',
            ];
            
            defaultCategories.forEach(category => {
                addEquipmentRow(category);
            });
            
            console.log('Added initial equipment rows');
        }
    } catch (error) {
        console.error('Error adding initial equipment rows:', error);
    }
}

// Infrastructure table functions
function addInfrastructureRow(infraName = '') {
    try {
        const tbody = document.getElementById('infrastructureTable');
        if (!tbody) {
            console.error('Infrastructure table body not found');
            return;
        }
        
        const rowCount = tbody.children.length + 1;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" name="infra_name_${rowCount}" class="form-control" value="${infraName}"></td>
            <td>
                <select name="infra_status_${rowCount}" class="form-control">
                    <option value="">Select Status</option>
                    <option value="Not yet started">Not yet started</option>
                    <option value="Completed up to plinth level">Completed up to plinth level</option>
                    <option value="Completed up to lintel level">Completed up to lintel level</option>
                    <option value="Completed up to roof level">Completed up to roof level</option>
                    <option value="Totally completed">Totally completed</option>
                </select>
            </td>
            <td><input type="number" name="infra_plinth_area_${rowCount}" class="form-control" step="0.01"></td>
            <td>
                <select name="infra_under_use_${rowCount}" class="form-control">
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                </select>
            </td>
            <td><input type="text" name="infra_funding_source_${rowCount}" class="form-control"></td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)" title="Delete Row">×</button></td>
        `;
        tbody.appendChild(row);
        
        console.log(`Added infrastructure row ${rowCount}: ${infraName}`);
    } catch (error) {
        console.error('Error adding infrastructure row:', error);
    }
}

// Equipment table functions  
function addEquipmentRow(category = '') {
    try {
        const tbody = document.getElementById('equipmentTable');
        if (!tbody) {
            console.error('Equipment table body not found');
            return;
        }
        
        const rowCount = tbody.children.length + 1;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <select name="equipment_category_${rowCount}" class="form-control">
                    <option value="">Select Category</option>
                    <option value="Lab Equipment" ${category === 'Lab Equipment' ? 'selected' : ''}>Lab Equipment</option>
                    <option value="Farm Machinery" ${category === 'Farm Machinery' ? 'selected' : ''}>Farm Machinery</option>
                    <option value="AV Aids" ${category === 'AV Aids' ? 'selected' : ''}>AV Aids</option>
                    <option value="Others">Others</option>
                </select>
            </td>
            <td><input type="text" name="equipment_name_${rowCount}" class="form-control"></td>
            <td><input type="number" name="equipment_year_${rowCount}" class="form-control" min="1950" max="2024"></td>
            <td><input type="number" name="equipment_cost_${rowCount}" class="form-control" min="0"></td>
            <td>
                <select name="equipment_status_${rowCount}" class="form-control">
                    <option value="">Select Status</option>
                    <option value="Working">Working</option>
                    <option value="Under Repair">Under Repair</option>
                    <option value="Out of Order">Out of Order</option>
                    <option value="Disposed">Disposed</option>
                </select>
            </td>
            <td><input type="text" name="equipment_funding_${rowCount}" class="form-control"></td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)" title="Delete Row">×</button></td>
        `;
        tbody.appendChild(row);
        
        console.log(`Added equipment row ${rowCount}: ${category}`);
    } catch (error) {
        console.error('Error adding equipment row:', error);
    }
}

// Vehicle table functions
function addVehicleRow() {
    try {
        const tbody = document.getElementById('vehiclesTable');
        if (!tbody) {
            console.error('Vehicles table body not found');
            return;
        }
        
        const rowCount = tbody.children.length + 1;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" name="vehicle_type_${rowCount}" class="form-control" placeholder="e.g., Tractor, Car, Motorcycle"></td>
            <td><input type="number" name="vehicle_year_${rowCount}" class="form-control" min="1950" max="2024"></td>
            <td><input type="number" name="vehicle_cost_${rowCount}" class="form-control" min="0"></td>
            <td><input type="number" name="vehicle_km_run_${rowCount}" class="form-control" min="0"></td>
            <td>
                <select name="vehicle_status_${rowCount}" class="form-control">
                    <option value="">Select Status</option>
                    <option value="Working">Working</option>
                    <option value="Under Repair">Under Repair</option>
                    <option value="Out of Order">Out of Order</option>
                    <option value="Disposed">Disposed</option>
                </select>
            </td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)" title="Delete Row">×</button></td>
        `;
        tbody.appendChild(row);
        
        console.log(`Added vehicle row ${rowCount}`);
    } catch (error) {
        console.error('Error adding vehicle row:', error);
    }
}

// OFT Details table functions
function addOFTDetailsRow() {
    try {
        const tbody = document.getElementById('oftDetailsTable');
        if (!tbody) {
            console.error('OFT Details table body not found');
            return;
        }
        
        const rowCount = tbody.children.length + 1;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${rowCount}</td>
            <td><input type="text" name="oft_title_${rowCount}" class="form-control" placeholder="Enter OFT title"></td>
            <td><textarea name="oft_problem_${rowCount}" class="form-control" rows="2" placeholder="Describe the problem diagnosed"></textarea></td>
            <td><textarea name="oft_technology_${rowCount}" class="form-control" rows="2" placeholder="Technology selected for testing"></textarea></td>
            <td><input type="text" name="oft_source_${rowCount}" class="form-control" placeholder="Source of technology"></td>
            <td><input type="text" name="oft_production_system_${rowCount}" class="form-control" placeholder="Production system"></td>
            <td><textarea name="oft_performance_${rowCount}" class="form-control" rows="2" placeholder="Performance indicators"></textarea></td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)" title="Delete Row">×</button></td>
        `;
        tbody.appendChild(row);
        updateRowNumbers('oftDetailsTable', 0);
        
        console.log(`Added OFT details row ${rowCount}`);
    } catch (error) {
        console.error('Error adding OFT details row:', error);
    }
}

// OFT Performance table functions
function addOFTPerformanceRow() {
    try {
        const tbody = document.getElementById('oftPerformanceTable');
        if (!tbody) {
            console.error('OFT Performance table body not found');
            return;
        }
        
        const rowCount = tbody.children.length + 1;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" name="oft_perf_technology_${rowCount}" class="form-control" placeholder="Technology option"></td>
            <td><input type="number" name="oft_perf_trials_${rowCount}" class="form-control" min="0" placeholder="No. of trials"></td>
            <td><input type="number" name="oft_perf_yield_${rowCount}" class="form-control" step="0.01" min="0" placeholder="Yield (q/ha)"></td>
            <td><input type="number" name="oft_perf_cost_${rowCount}" class="form-control" min="0" placeholder="Cost (Rs./ha)"></td>
            <td><input type="number" name="oft_perf_gross_${rowCount}" class="form-control" min="0" placeholder="Gross return"></td>
            <td><input type="number" name="oft_perf_net_${rowCount}" class="form-control" min="0" placeholder="Net return"></td>
            <td><input type="number" name="oft_perf_bc_ratio_${rowCount}" class="form-control" step="0.01" min="0" placeholder="BC ratio"></td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)" title="Delete Row">×</button></td>
        `;
        tbody.appendChild(row);
        
        // Add event listeners for automatic calculation
        const grossInput = row.querySelector(`input[name="oft_perf_gross_${rowCount}"]`);
        const costInput = row.querySelector(`input[name="oft_perf_cost_${rowCount}"]`);
        const netInput = row.querySelector(`input[name="oft_perf_net_${rowCount}"]`);
        const bcRatioInput = row.querySelector(`input[name="oft_perf_bc_ratio_${rowCount}"]`);

        function calculateFinancials() {
            const grossReturn = parseFloat(grossInput.value) || 0;
            const costOfCultivation = parseFloat(costInput.value) || 0;
            
            if (grossReturn > 0 && costOfCultivation > 0) {
                const netReturn = grossReturn - costOfCultivation;
                const bcRatio = grossReturn / costOfCultivation;
                
                netInput.value = netReturn.toFixed(2);
                bcRatioInput.value = bcRatio.toFixed(2);
            }
        }

        grossInput.addEventListener('input', calculateFinancials);
        costInput.addEventListener('input', calculateFinancials);
        
        console.log(`Added OFT performance row ${rowCount}`);
    } catch (error) {
        console.error('Error adding OFT performance row:', error);
    }
}

// Demo table functions
function addCerealsRow() {
    addDemoRowWithDelete('cerealsTable', 'cereals');
}

function addPulsesRow() {
    addDemoRowWithDelete('pulsesTable', 'pulses');
}

function addOilseedsRow() {
    addDemoRowWithDelete('oilseedsTable', 'oilseeds');
}

function addDemoRowWithDelete(tableId, category) {
    try {
        const tbody = document.getElementById(tableId);
        if (!tbody) {
            console.error(`Demo table body not found: ${tableId}`);
            return;
        }
        
        const rowCount = tbody.children.length + 1;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" name="${category}_crop_${rowCount}" class="form-control" placeholder="Crop name"></td>
            <td><input type="text" name="${category}_technology_${rowCount}" class="form-control" placeholder="Technology demonstrated"></td>
            <td><input type="number" name="${category}_area_${rowCount}" class="form-control" step="0.01" min="0"></td>
            <td><input type="number" name="${category}_farmers_${rowCount}" class="form-control" min="0"></td>
            <td><input type="number" name="${category}_demo_yield_${rowCount}" class="form-control" step="0.01" min="0"></td>
            <td><input type="number" name="${category}_check_yield_${rowCount}" class="form-control" step="0.01" min="0"></td>
            <td><input type="number" name="${category}_increase_${rowCount}" class="form-control" step="0.01" readonly></td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)" title="Delete Row">×</button></td>
        `;
        tbody.appendChild(row);

        // Add event listeners for automatic calculation
        const demoInput = row.querySelector(`input[name="${category}_demo_yield_${rowCount}"]`);
        const checkInput = row.querySelector(`input[name="${category}_check_yield_${rowCount}"]`);
        const increaseInput = row.querySelector(`input[name="${category}_increase_${rowCount}"]`);

        function calculateIncrease() {
            const demoYield = parseFloat(demoInput.value) || 0;
            const checkYield = parseFloat(checkInput.value) || 0;
            if (checkYield > 0) {
                const increase = ((demoYield - checkYield) / checkYield) * 100;
                increaseInput.value = increase.toFixed(2);
            }
        }

        demoInput.addEventListener('input', calculateIncrease);
        checkInput.addEventListener('input', calculateIncrease);
        
        console.log(`Added ${category} demo row ${rowCount}`);
    } catch (error) {
        console.error(`Error adding ${category} demo row:`, error);
    }
}

// SAC Meeting table functions
function addSACMeetingRow() {
    try {
        const tbody = document.getElementById('sacMeetingTable');
        if (!tbody) {
            console.error('SAC Meeting table body not found');
            return;
        }
        
        const rowCount = tbody.children.length + 1;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${rowCount}</td>
            <td><input type="date" name="sac_date_${rowCount}" class="form-control"></td>
            <td><input type="number" name="sac_participants_${rowCount}" class="form-control" min="0"></td>
            <td><textarea name="sac_recommendations_${rowCount}" class="form-control" rows="3"></textarea></td>
            <td><textarea name="sac_action_taken_${rowCount}" class="form-control" rows="3"></textarea></td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)" title="Delete Row">×</button></td>
        `;
        tbody.appendChild(row);
        updateRowNumbers('sacMeetingTable', 0);
        
        console.log(`Added SAC meeting row ${rowCount}`);
    } catch (error) {
        console.error('Error adding SAC meeting row:', error);
    }
}

// Additional table functions with similar error handling...
function addOperationalAreaRow() {
    try {
        const tbody = document.getElementById('operationalAreaTable');
        if (!tbody) {
            console.error('Operational Area table body not found');
            return;
        }
        
        const rowCount = tbody.children.length + 1;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${rowCount}</td>
            <td><input type="text" name="op_taluk_${rowCount}" class="form-control"></td>
            <td><input type="text" name="op_block_${rowCount}" class="form-control"></td>
            <td><textarea name="op_villages_${rowCount}" class="form-control" rows="2"></textarea></td>
            <td><textarea name="op_crops_${rowCount}" class="form-control" rows="2"></textarea></td>
            <td><textarea name="op_problems_${rowCount}" class="form-control" rows="2"></textarea></td>
            <td><textarea name="op_thrust_areas_${rowCount}" class="form-control" rows="2"></textarea></td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)" title="Delete Row">×</button></td>
        `;
        tbody.appendChild(row);
        updateRowNumbers('operationalAreaTable', 0);
        
        console.log(`Added operational area row ${rowCount}`);
    } catch (error) {
        console.error('Error adding operational area row:', error);
    }
}

function addVillageAdoptionRow() {
    try {
        const tbody = document.getElementById('villageAdoptionTable');
        if (!tbody) {
            console.error('Village Adoption table body not found');
            return;
        }
        
        const rowCount = tbody.children.length + 1;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" name="village_name_${rowCount}" class="form-control"></td>
            <td><input type="text" name="village_block_${rowCount}" class="form-control"></td>
            <td><textarea name="village_action_${rowCount}" class="form-control" rows="3"></textarea></td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)" title="Delete Row">×</button></td>
        `;
        tbody.appendChild(row);
        
        console.log(`Added village adoption row ${rowCount}`);
    } catch (error) {
        console.error('Error adding village adoption row:', error);
    }
}

// Continuing from addThrustAreaRow() function...

function addThrustAreaRow() {
    try {
        const tbody = document.getElementById('thrustAreasTable');
        if (!tbody) {
            console.error('Thrust Areas table body not found');
            return;
        }
        
        const rowCount = tbody.children.length + 1;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${rowCount}</td>
            <td><input type="text" name="thrust_area_${rowCount}" class="form-control" placeholder="Enter thrust area"></td>
            <td><textarea name="thrust_description_${rowCount}" class="form-control" rows="2" placeholder="Brief description"></textarea></td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)" title="Delete Row">×</button></td>
        `;
        tbody.appendChild(row);
        updateRowNumbers('thrustAreasTable', 0);
        
        console.log(`Added thrust area row ${rowCount}`);
    } catch (error) {
        console.error('Error adding thrust area row:', error);
    }
}

// Implements table functions
function addImplementsRow() {
    try {
        const tbody = document.getElementById('implementsTable');
        if (!tbody) {
            console.error('Implements table body not found');
            return;
        }
        
        const rowCount = tbody.children.length + 1;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" name="implements_name_${rowCount}" class="form-control" placeholder="Implement name"></td>
            <td><input type="text" name="implements_crop_${rowCount}" class="form-control" placeholder="Crop/purpose"></td>
            <td><input type="text" name="implements_technology_${rowCount}" class="form-control" placeholder="Technology demonstrated"></td>
            <td><input type="number" name="implements_farmers_${rowCount}" class="form-control" min="0" placeholder="No. of farmers"></td>
            <td><input type="number" name="implements_area_${rowCount}" class="form-control" step="0.01" min="0" placeholder="Area (ha)"></td>
            <td><input type="text" name="implements_demo_observation_${rowCount}" class="form-control" placeholder="Demo observation"></td>
            <td><input type="text" name="implements_check_observation_${rowCount}" class="form-control" placeholder="Check observation"></td>
            <td><input type="number" name="implements_percent_change_${rowCount}" class="form-control" step="0.01" readonly></td>
            <td><input type="number" name="implements_labor_reduction_${rowCount}" class="form-control" min="0" placeholder="Labor reduction (man days)"></td>
            <td><input type="number" name="implements_cost_reduction_${rowCount}" class="form-control" min="0" placeholder="Cost reduction (Rs./ha)"></td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)" title="Delete Row">×</button></td>
        `;
        tbody.appendChild(row);
        
        console.log(`Added implements row ${rowCount}`);
    } catch (error) {
        console.error('Error adding implements row:', error);
    }
}

// Publication functions
function addPublicationRow() {
    try {
        const tbody = document.getElementById('publicationTable');
        if (!tbody) {
            console.error('Publication table body not found');
            return;
        }
        
        const rowCount = tbody.children.length + 1;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <select name="publication_type_${rowCount}" class="form-control">
                    <option value="">Select Type</option>
                    <option value="Research paper">Research paper</option>
                    <option value="Bulletins">Bulletins</option>
                    <option value="Popular Articles">Popular Articles</option>
                    <option value="Extension Pamphlets">Extension Pamphlets</option>
                    <option value="Technical reports">Technical reports</option>
                    <option value="Books">Books</option>
                    <option value="Book Chapters">Book Chapters</option>
                </select>
            </td>
            <td><input type="text" name="publication_title_${rowCount}" class="form-control" placeholder="Title"></td>
            <td><input type="text" name="publication_authors_${rowCount}" class="form-control" placeholder="Authors"></td>
            <td><input type="text" name="publication_journal_${rowCount}" class="form-control" placeholder="Journal/Publisher"></td>
            <td><input type="number" name="publication_naas_rating_${rowCount}" class="form-control" step="0.01" min="0" max="15" placeholder="NAAS rating"></td>
            <td><input type="number" name="publication_year_${rowCount}" class="form-control" min="2000" max="2030" placeholder="Year"></td>
            <td><input type="number" name="publication_circulated_${rowCount}" class="form-control" min="0" placeholder="No. circulated"></td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)" title="Delete Row">×</button></td>
        `;
        tbody.appendChild(row);
        
        console.log(`Added publication row ${rowCount}`);
    } catch (error) {
        console.error('Error adding publication row:', error);
    }
}

// Training functions
function addTrainingRow() {
    try {
        const tbody = document.getElementById('trainingTable');
        if (!tbody) {
            console.error('Training table body not found');
            return;
        }
        
        const rowCount = tbody.children.length + 1;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${rowCount}</td>
            <td><input type="text" name="training_course_${rowCount}" class="form-control" placeholder="Course title"></td>
            <td>
                <select name="training_category_${rowCount}" class="form-control">
                    <option value="">Select Category</option>
                    <option value="Farmers">Farmers</option>
                    <option value="Farm Women">Farm Women</option>
                    <option value="Rural Youth">Rural Youth</option>
                    <option value="Extension Personnel">Extension Personnel</option>
                    <option value="NGO Personnel">NGO Personnel</option>
                    <option value="Others">Others</option>
                </select>
            </td>
            <td><input type="date" name="training_from_date_${rowCount}" class="form-control"></td>
            <td><input type="date" name="training_to_date_${rowCount}" class="form-control"></td>
            <td><input type="number" name="training_duration_${rowCount}" class="form-control" min="1" placeholder="Days"></td>
            <td><input type="number" name="training_participants_${rowCount}" class="form-control" min="0" placeholder="No. of participants"></td>
            <td><textarea name="training_topics_${rowCount}" class="form-control" rows="2" placeholder="Topics covered"></textarea></td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)" title="Delete Row">×</button></td>
        `;
        tbody.appendChild(row);
        updateRowNumbers('trainingTable', 0);
        
        console.log(`Added training row ${rowCount}`);
    } catch (error) {
        console.error('Error adding training row:', error);
    }
}

// Extension Activities functions
function addExtensionActivityRow() {
    try {
        const tbody = document.getElementById('extensionActivitiesTable');
        if (!tbody) {
            console.error('Extension Activities table body not found');
            return;
        }
        
        const rowCount = tbody.children.length + 1;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${rowCount}</td>
            <td>
                <select name="extension_activity_type_${rowCount}" class="form-control">
                    <option value="">Select Activity Type</option>
                    <option value="Field Days">Field Days</option>
                    <option value="Farmers Meetings">Farmers Meetings</option>
                    <option value="Exhibitions">Exhibitions</option>
                    <option value="Kisan Mela">Kisan Mela</option>
                    <option value="Farm School">Farm School</option>
                    <option value="Radio Talks">Radio Talks</option>
                    <option value="TV Programmes">TV Programmes</option>
                    <option value="Newspaper Articles">Newspaper Articles</option>
                    <option value="Others">Others</option>
                </select>
            </td>
            <td><input type="text" name="extension_activity_title_${rowCount}" class="form-control" placeholder="Activity title/description"></td>
            <td><input type="date" name="extension_activity_date_${rowCount}" class="form-control"></td>
            <td><input type="text" name="extension_activity_venue_${rowCount}" class="form-control" placeholder="Venue"></td>
            <td><input type="number" name="extension_activity_participants_${rowCount}" class="form-control" min="0" placeholder="No. of participants"></td>
            <td><textarea name="extension_activity_outcomes_${rowCount}" class="form-control" rows="2" placeholder="Key outcomes/impact"></textarea></td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)" title="Delete Row">×</button></td>
        `;
        tbody.appendChild(row);
        updateRowNumbers('extensionActivitiesTable', 0);
        
        console.log(`Added extension activity row ${rowCount}`);
    } catch (error) {
        console.error('Error adding extension activity row:', error);
    }
}

// Awards and Recognition functions
function addAwardRow() {
    try {
        const tbody = document.getElementById('awardsTable');
        if (!tbody) {
            console.error('Awards table body not found');
            return;
        }
        
        const rowCount = tbody.children.length + 1;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" name="award_name_${rowCount}" class="form-control" placeholder="Award name"></td>
            <td><input type="text" name="award_recipient_${rowCount}" class="form-control" placeholder="Recipient name"></td>
            <td><input type="text" name="award_organization_${rowCount}" class="form-control" placeholder="Awarding organization"></td>
            <td>
                <select name="award_category_${rowCount}" class="form-control">
                    <option value="">Select Category</option>
                    <option value="Individual">Individual</option>
                    <option value="KVK">KVK</option>
                    <option value="Team">Team</option>
                </select>
            </td>
            <td><input type="number" name="award_year_${rowCount}" class="form-control" min="2000" max="2030" placeholder="Year"></td>
            <td><textarea name="award_details_${rowCount}" class="form-control" rows="2" placeholder="Details"></textarea></td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)" title="Delete Row">×</button></td>
        `;
        tbody.appendChild(row);
        
        console.log(`Added award row ${rowCount}`);
    } catch (error) {
        console.error('Error adding award row:', error);
    }
}

// Seed Production functions
function addSeedProductionRow() {
    try {
        const tbody = document.getElementById('seedProductionTable');
        if (!tbody) {
            console.error('Seed Production table body not found');
            return;
        }
        
        const rowCount = tbody.children.length + 1;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" name="seed_crop_${rowCount}" class="form-control" placeholder="Crop name"></td>
            <td><input type="text" name="seed_variety_${rowCount}" class="form-control" placeholder="Variety name"></td>
            <td><input type="text" name="seed_class_${rowCount}" class="form-control" placeholder="Seed class (Breeder/Foundation/Certified)"></td>
            <td><input type="number" name="seed_area_${rowCount}" class="form-control" step="0.01" min="0" placeholder="Area (ha)"></td>
            <td><input type="number" name="seed_target_${rowCount}" class="form-control" step="0.01" min="0" placeholder="Target (q)"></td>
            <td><input type="number" name="seed_achievement_${rowCount}" class="form-control" step="0.01" min="0" placeholder="Achievement (q)"></td>
            <td><input type="number" name="seed_distributed_${rowCount}" class="form-control" step="0.01" min="0" placeholder="Distributed (q)"></td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)" title="Delete Row">×</button></td>
        `;
        tbody.appendChild(row);
        
        console.log(`Added seed production row ${rowCount}`);
    } catch (error) {
        console.error('Error adding seed production row:', error);
    }
}

// Planting Material functions
function addPlantingMaterialRow() {
    try {
        const tbody = document.getElementById('plantingMaterialTable');
        if (!tbody) {
            console.error('Planting Material table body not found');
            return;
        }
        
        const rowCount = tbody.children.length + 1;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" name="planting_crop_${rowCount}" class="form-control" placeholder="Crop/Plant name"></td>
            <td><input type="text" name="planting_variety_${rowCount}" class="form-control" placeholder="Variety name"></td>
            <td><input type="text" name="planting_type_${rowCount}" class="form-control" placeholder="Type (Seedlings/Grafts/Cuttings)"></td>
            <td><input type="number" name="planting_target_${rowCount}" class="form-control" min="0" placeholder="Target (in numbers/lakh)"></td>
            <td><input type="number" name="planting_achievement_${rowCount}" class="form-control" min="0" placeholder="Achievement (in numbers/lakh)"></td>
            <td><input type="number" name="planting_distributed_${rowCount}" class="form-control" min="0" placeholder="Distributed (in numbers/lakh)"></td>
            <td><textarea name="planting_beneficiaries_${rowCount}" class="form-control" rows="2" placeholder="Beneficiary details"></textarea></td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)" title="Delete Row">×</button></td>
        `;
        tbody.appendChild(row);
        
        console.log(`Added planting material row ${rowCount}`);
    } catch (error) {
        console.error('Error adding planting material row:', error);
    }
}

// Livestock demonstrations functions
function addLivestockDemoRow() {
    try {
        const tbody = document.getElementById('livestockDemoTable');
        if (!tbody) {
            console.error('Livestock Demo table body not found');
            return;
        }
        
        const rowCount = tbody.children.length + 1;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <select name="livestock_category_${rowCount}" class="form-control">
                    <option value="">Select Category</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Poultry">Poultry</option>
                    <option value="Goat">Goat</option>
                    <option value="Sheep">Sheep</option>
                    <option value="Pig">Pig</option>
                    <option value="Fishery">Fishery</option>
                    <option value="Others">Others</option>
                </select>
            </td>
            <td><input type="text" name="livestock_technology_${rowCount}" class="form-control" placeholder="Technology demonstrated"></td>
            <td><input type="number" name="livestock_farmers_${rowCount}" class="form-control" min="0" placeholder="No. of farmers"></td>
            <td><input type="number" name="livestock_units_${rowCount}" class="form-control" min="0" placeholder="No. of units"></td>
            <td><input type="text" name="livestock_demo_param_${rowCount}" class="form-control" placeholder="Demo parameters"></td>
            <td><input type="text" name="livestock_check_param_${rowCount}" class="form-control" placeholder="Check parameters"></td>
            <td><input type="number" name="livestock_percent_change_${rowCount}" class="form-control" step="0.01" readonly></td>
            <td><input type="number" name="livestock_gross_cost_${rowCount}" class="form-control" min="0" placeholder="Gross cost"></td>
            <td><input type="number" name="livestock_gross_return_${rowCount}" class="form-control" min="0" placeholder="Gross return"></td>
            <td><input type="number" name="livestock_net_return_${rowCount}" class="form-control" min="0" readonly></td>
            <td><input type="number" name="livestock_bc_ratio_${rowCount}" class="form-control" step="0.01" readonly></td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)" title="Delete Row">×</button></td>
        `;
        tbody.appendChild(row);

        // Add calculation functionality
        const grossCostInput = row.querySelector(`input[name="livestock_gross_cost_${rowCount}"]`);
        const grossReturnInput = row.querySelector(`input[name="livestock_gross_return_${rowCount}"]`);
        const netReturnInput = row.querySelector(`input[name="livestock_net_return_${rowCount}"]`);
        const bcRatioInput = row.querySelector(`input[name="livestock_bc_ratio_${rowCount}"]`);

        function calculateLivestockFinancials() {
            const grossCost = parseFloat(grossCostInput.value) || 0;
            const grossReturn = parseFloat(grossReturnInput.value) || 0;
            
            if (grossCost > 0 && grossReturn > 0) {
                const netReturn = grossReturn - grossCost;
                const bcRatio = grossReturn / grossCost;
                
                netReturnInput.value = netReturn.toFixed(2);
                bcRatioInput.value = bcRatio.toFixed(2);
            }
        }

        grossCostInput.addEventListener('input', calculateLivestockFinancials);
        grossReturnInput.addEventListener('input', calculateLivestockFinancials);
        
        console.log(`Added livestock demo row ${rowCount}`);
    } catch (error) {
        console.error('Error adding livestock demo row:', error);
    }
}

// Form navigation and utility functions
function goToSection(sectionNumber) {
    try {
        const sections = document.querySelectorAll('.form-section');
        sections.forEach(section => {
            section.style.display = 'none';
        });
        
        const targetSection = document.getElementById(`section${sectionNumber}`);
        if (targetSection) {
            targetSection.style.display = 'block';
            
            // Scroll to top of section
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Update section navigation
            updateSectionNavigation(sectionNumber);
        }
        
        console.log(`Navigated to section ${sectionNumber}`);
    } catch (error) {
        console.error(`Error navigating to section ${sectionNumber}:`, error);
    }
}

function updateSectionNavigation(currentSection) {
    try {
        const navItems = document.querySelectorAll('.section-nav .nav-item');
        navItems.forEach((item, index) => {
            const sectionNum = index + 1;
            if (sectionNum === currentSection) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    } catch (error) {
        console.error('Error updating section navigation:', error);
    }
}

// Auto-save functionality
let autoSaveTimeout;
function enableAutoSave() {
    const form = document.getElementById('annualReportForm');
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                if (currentReportId) {
                    console.log('Auto-saving form data...');
                    saveAsDraft();
                }
            }, 30000); // Auto-save after 30 seconds of inactivity
        });
    });
    
    console.log('Auto-save enabled for form inputs');
}

// Form validation utilities
function validateSection(sectionNumber) {
    const section = document.getElementById(`section${sectionNumber}`);
    if (!section) return true;
    
    const requiredFields = section.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
        }
    });
    
    return isValid;
}

// Clear form function
function clearEntireForm() {
    if (confirm('Are you sure you want to clear the entire form? This action cannot be undone.')) {
        const form = document.getElementById('annualReportForm');
        if (form) {
            form.reset();
            
            // Clear all dynamic tables
            const dynamicTables = [
                'staffTable', 'infrastructureTable', 'vehiclesTable', 'equipmentTable', 
                'implementsTable', 'sacMeetingTable', 'operationalAreaTable', 
                'villageAdoptionTable', 'thrustAreasTable', 'oftDetailsTable', 
                'oftPerformanceTable', 'cerealsTable', 'pulsesTable', 'oilseedsTable',
                'trainingTable', 'extensionActivitiesTable', 'awardsTable',
                'seedProductionTable', 'plantingMaterialTable', 'livestockDemoTable',
                'publicationTable'
            ];
            
            dynamicTables.forEach(tableId => {
                const tbody = document.getElementById(tableId);
                if (tbody) {
                    tbody.innerHTML = '';
                }
            });
            
            // Reset current report ID
            currentReportId = null;
            
            // Add initial rows back
            addInitialStaffRows();
            addInitialInfrastructureRows();
            addInitialEquipmentRows();
            
            showAlert('formAlert', 'Form cleared successfully!', 'success');
        }
    }
}

// Print form function
function printForm() {
    window.print();
}

// Export form data as JSON
function exportFormData() {
    try {
        const form = document.getElementById('annualReportForm');
        if (!form) {
            throw new Error('Form not found');
        }
        
        const formData = new FormData(form);
        const exportData = {};
        
        for (let [key, value] of formData.entries()) {
            exportData[key] = value;
        }
        
        // Add metadata
        exportData._metadata = {
            exportDate: new Date().toISOString(),
            kvkName: exportData.kvk_name || 'Unknown KVK',
            reportId: currentReportId || 'new_report',
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `kvk_report_${exportData._metadata.kvkName}_${new Date().getFullYear()}.json`;
        downloadLink.click();
        
        URL.revokeObjectURL(url);
        showAlert('formAlert', 'Form data exported successfully!', 'success');
        
    } catch (error) {
        console.error('Error exporting form data:', error);
        showAlert('formAlert', 'Error exporting form data: ' + error.message, 'error');
    }
}

// Import form data from JSON
function importFormData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            
            // Validate data structure
            if (typeof importData !== 'object') {
                throw new Error('Invalid JSON format');
            }
            
            // Populate form fields
            Object.keys(importData).forEach(key => {
                if (key === '_metadata') return; // Skip metadata
                
                const field = document.querySelector(`[name="${key}"]`);
                if (field) {
                    field.value = importData[key] || '';
                }
            });
            
            showAlert('formAlert', 'Form data imported successfully!', 'success');
            
        } catch (error) {
            console.error('Error importing form data:', error);
            showAlert('formAlert', 'Error importing form data: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}
/**
 * Extract table data from form inputs and structure it according to schema
 * @param {string} prefix - The prefix used in input names (e.g., 'staff', 'infra')
 * @param {Object} fieldMapping - Maps form field suffixes to schema field names
 * @returns {Array} Array of structured objects matching the schema
 */
function extractTableData(prefix, fieldMapping) {
    const data = [];
    const form = document.getElementById('annualReportForm');
    
    if (!form) {
        console.error('Form not found in extractTableData');
        return data;
    }
    
    // Find all inputs with the given prefix
    const inputs = form.querySelectorAll(`[name^="${prefix}_"]`);
    const rowIndices = new Set();
    
    // Extract row numbers from input names
    inputs.forEach(input => {
        const match = input.name.match(new RegExp(`${prefix}_\\w+_(\\d+)`));
        if (match) {
            rowIndices.add(parseInt(match[1]));
        }
    });
    
    // Convert to sorted array
    const sortedIndices = Array.from(rowIndices).sort((a, b) => a - b);
    
    // Extract data for each row
    sortedIndices.forEach(rowIndex => {
        const rowData = {};
        let hasData = false;
        
        // Map each field according to the provided mapping
        Object.keys(fieldMapping).forEach(formSuffix => {
            const schemaField = fieldMapping[formSuffix];
            const inputName = `${prefix}_${formSuffix}_${rowIndex}`;
            const input = form.querySelector(`[name="${inputName}"]`);
            
            if (input && input.value) {
                let value = input.value.trim();
                
                // Type conversion based on input type
                if (input.type === 'number' || input.type === 'range') {
                    value = value ? parseFloat(value) : null;
                } else if (input.type === 'date') {
                    value = value ? new Date(value) : null;
                } else if (input.type === 'checkbox') {
                    value = input.checked;
                }
                
                if (value !== null && value !== '') {
                    rowData[schemaField] = value;
                    hasData = true;
                }
            }
        });
        
        // Only add row if it has at least some data
        if (hasData && Object.keys(rowData).length > 0) {
            data.push(rowData);
        }
    });
    
    console.log(`Extracted ${data.length} rows for ${prefix}:`, data);
    return data;
}

// Make it globally available
window.extractTableData = extractTableData;
// Initialize all form handlers and make them globally available
window.initializeFormHandlers = initializeFormHandlers;
window.saveAsDraft = saveAsDraft;
window.validateForm = validateForm;
window.deleteTableRow = deleteTableRow;
window.addStaffRow = addStaffRow;
window.addInfrastructureRow = addInfrastructureRow;
window.addVehicleRow = addVehicleRow;
window.addEquipmentRow = addEquipmentRow;
window.addImplementsRow = addImplementsRow;
window.addOFTDetailsRow = addOFTDetailsRow;
window.addOFTPerformanceRow = addOFTPerformanceRow;
window.addCerealsRow = addCerealsRow;
window.addPulsesRow = addPulsesRow;
window.addOilseedsRow = addOilseedsRow;
window.addSACMeetingRow = addSACMeetingRow;
window.addOperationalAreaRow = addOperationalAreaRow;
window.addVillageAdoptionRow = addVillageAdoptionRow;
window.addThrustAreaRow = addThrustAreaRow;
window.addPublicationRow = addPublicationRow;
window.addTrainingRow = addTrainingRow;
window.addExtensionActivityRow = addExtensionActivityRow;
window.addAwardRow = addAwardRow;
window.addSeedProductionRow = addSeedProductionRow;
window.addPlantingMaterialRow = addPlantingMaterialRow;
window.addLivestockDemoRow = addLivestockDemoRow;
window.goToSection = goToSection;
window.clearEntireForm = clearEntireForm;
window.printForm = printForm;
window.exportFormData = exportFormData;
window.importFormData = importFormData;
window.enableAutoSave = enableAutoSave;

console.log('Complete form handlers loaded and initialized');
