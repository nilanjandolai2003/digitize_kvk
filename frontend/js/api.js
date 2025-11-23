// Transform snake_case to camelCase
function transformFieldNames(data) {
    const fieldMapping = {
        'kvk_name': 'kvkName',
        'kvk_address': 'kvkAddress', 
        'kvk_telephone': 'kvkTelephone',
        'kvk_email': 'kvkEmail',
        'kvk_fax': 'kvkFax',
        'host_org_name': 'hostOrgName',
        'host_org_address': 'hostOrgAddress',
        'host_org_telephone': 'hostOrgTelephone', 
        'host_org_email': 'hostOrgEmail',
        'host_org_fax': 'hostOrgFax',
        'head_name': 'headName',
        'head_mobile': 'headMobile',
        'head_email': 'headEmail',
        'sanction_year': 'sanctionYear',
        'report_prepared_by': 'reportPreparedBy',
        'report_date': 'reportDate',
        'major_farming_system': 'majorFarmingSystem',
        'agro_climatic_zone': 'agroClimaticZone',
        'agro_ecological_situation': 'agroEcologicalSituation',
        'soil_type': 'soilType',
        'crop_productivity': 'cropProductivity',
        'mean_temperature': 'meanTemperature',
        'mean_rainfall': 'meanRainfall',
        'mean_humidity': 'meanHumidity',
        'livestock_production': 'livestockProduction',
        'major_achievements': 'majorAchievements',
        'constraints_suggestions': 'constraintsSuggestions'
    };

    const transformedData = {};
    
    for (const [key, value] of Object.entries(data)) {
        const newKey = fieldMapping[key] || key;
        transformedData[newKey] = value;
    }
    
    return transformedData;
}
function reverseTransformFieldNames(data) {
    const reverseFieldMapping = {
        // API field names (camelCase) to form field names (snake_case)
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

    const transformedData = {};
    
    for (const [key, value] of Object.entries(data)) {
        const newKey = reverseFieldMapping[key] || key;
        transformedData[newKey] = value;
    }
    
    return transformedData;
}
function getAuthHeaders() {
    const token = currentUser?.token;
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token; 
    }
    
    return headers;
}

async function loadReports() {
    console.log('Loading reports from API...');
    
    try {
        const response = await fetch(`${CONFIG.API_BASE}/reports`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('API Response data:', data);
            
            let fetchedReports = [];
            
            if (data.success && data.data && data.data.reports) {
                fetchedReports = data.data.reports;
            } else if (data.success && Array.isArray(data.data)) {
                fetchedReports = data.data;
            } else if (Array.isArray(data.reports)) {
                fetchedReports = data.reports;
            } else if (Array.isArray(data)) {
                fetchedReports = data;
            }
            
            // SIMPLIFIED: Just use the database ID as-is
            reports = fetchedReports.map(report => ({
                ...report,
                id: report._id || report.id, // MongoDB uses _id, some APIs normalize to id
                data: report.data || report,
                timestamp: report.timestamp || report.createdAt || report.updatedAt || Date.now(),
                status: report.status || 'submitted'
            }));
            
            console.log('Successfully loaded reports:', reports.length);
            return reports;
            
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `API request failed with status: ${response.status}`);
        }
        
    } catch (error) {
        console.error('Error loading reports:', error);
        reports = [];
        
        if (typeof showAlert === 'function') {
            showAlert('dashboardAlert', 
                'Unable to load reports. Please check your connection and try again.', 
                'error'
            );
        }
        
        return reports;
    }
}
async function loadLatestReportData() {
    try {
        const response = await fetch(`${CONFIG.API_BASE}/reports?limit=1&sortBy=createdAt&sortOrder=desc`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && data.data.reports && data.data.reports.length > 0) {
                return data.data.reports[0];
            }
        }
        return null;
    } catch (error) {
        console.error('Error loading latest report:', error);
        return null;
    }
}

function findReportById(reportId) {
    console.log('Searching for report with ID:', reportId);
    console.log('Available reports:', reports.map(r => ({ id: r.id })));
    
    const found = reports.find(r => r.id === reportId);
    console.log('Found report:', found ? 'YES' : 'NO');
    
    return found;
}

async function saveReport(reportData, isDraft = false) {
    try {
        console.log('Saving report, isDraft:', isDraft);
        console.log('Current report ID:', currentReportId);
        console.log('=== RAW REPORT DATA ===');
        console.log('Staff array:', reportData.staff);
        console.log('Infrastructure array:', reportData.infrastructure);
        console.log('Vehicles array:', reportData.vehicles);
        console.log('Equipment array:', reportData.equipment);
        console.log('SAC Meetings array:', reportData.sacMeetings);
        console.log('Operational Areas array:', reportData.operationalAreas);
        
        const transformedData = transformFieldNames(reportData);
        
        console.log('=== TRANSFORMED DATA ===');
        console.log('Staff after transform:', transformedData.staff);
        console.log('Infrastructure after transform:', transformedData.infrastructure);
        
        // SIMPLIFIED: If we have currentReportId, it's an update. If not, it's create.
        const endpoint = currentReportId ? 
            `${CONFIG.API_BASE}/reports/${currentReportId}` : 
            `${CONFIG.API_BASE}/reports`;
        
        const method = currentReportId ? 'PUT' : 'POST';
        
        const payload = {
            ...transformedData,
            status: isDraft ? 'draft' : 'submitted'
        };
        
        console.log('Sending request to:', endpoint);
        console.log('Method:', method);
        console.log('=== FULL PAYLOAD ===', JSON.stringify(payload, null, 2));
        
        const response = await fetch(endpoint, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        console.log('Save response:', data);
        
        if (response.ok && data.success) {
            if (data.data && data.data.report) {
                const serverReport = data.data.report;
                
                // SIMPLIFIED: Use the database ID that server returns
                currentReportId = serverReport._id || serverReport.id;
                
                console.log('Set currentReportId to:', currentReportId);
                
                // Update local reports array
                const existingIndex = reports.findIndex(r => r.id === currentReportId);
                
                const reportToStore = {
                    ...serverReport,
                    id: currentReportId // Normalize ID field
                };
                
                if (existingIndex >= 0) {
                    reports[existingIndex] = reportToStore;
                } else {
                    reports.push(reportToStore);
                }
            }
            
            return data;
        } else {
            console.error('Server validation errors:', data.errors);
            throw new Error(data.message || 'Server validation failed');
        }
    } catch (error) {
        console.error('Error saving report:', error);
        throw error;
    }}

async function deleteReportAPI(reportId) {
    try {
        console.log('Deleting report with ID:', reportId);
        
        const response = await fetch(`${CONFIG.API_BASE}/reports/${reportId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Remove from local array
            reports = reports.filter(r => r.id !== reportId);
            console.log('Report deleted successfully, remaining reports:', reports.length);
            
            return data;
        } else {
            throw new Error(data.message || 'Failed to delete report');
        }
    } catch (error) {
        console.error('Error deleting report:', error);
        throw error;
    }
}

// SIMPLIFIED: Fallback only for network errors, not validation
async function saveReportHybrid(reportData, isDraft = false) {
    try {
        return await saveReport(reportData, isDraft);
    } catch (error) {
        console.error('API save failed:', error);
        
        // Don't use fallback for validation errors
        if (error.message.includes('Server validation failed') || 
            error.message.includes('validation')) {
            throw error;
        }
        
        // Only fallback for network/connection issues
        console.warn('Using memory fallback due to network issues');
        
        // For new reports without currentReportId, we can't really have a meaningful fallback
        // since we don't have a database ID to work with
        if (!currentReportId) {
            throw new Error('Cannot save new report - server connection required');
        }
        
        // For existing reports, update in memory
        const existingIndex = reports.findIndex(r => r.id === currentReportId);
        if (existingIndex >= 0) {
            reports[existingIndex].data = reportData;
            reports[existingIndex].status = isDraft ? 'draft' : 'submitted';
            reports[existingIndex].timestamp = Date.now();
            
            console.warn('Report updated in memory only - changes will be lost on refresh!');
            return { success: true, data: { report: reports[existingIndex] } };
        }
        
        throw error;
    }
}
function populateFormWithReport(report) {
    if (!report) return;
    
    console.log('=== FULL REPORT DATA ===', report);
    console.log('Staff data:', report.staff);
    console.log('Infrastructure data:', report.infrastructure);
    console.log('Vehicles data:', report.vehicles);
    
    // First, reset the form to clear any existing data
    if (typeof resetForm === 'function') {
        resetForm();
    }
    
    // Transform and populate simple fields
    const transformedData = reverseTransformFieldNames(report);
    
    Object.keys(transformedData).forEach(key => {
        const input = document.querySelector(`[name="${key}"]`);
        if (input && transformedData[key] != null) {
            input.value = transformedData[key];
        }
    });
    
    // Populate land details
    if (report.landDetails) {
        const landFields = ['buildings', 'demoUnits', 'crops', 'orchard', 'others'];
        landFields.forEach(field => {
            const input = document.querySelector(`[name="land_${field}"]`);
            if (input && report.landDetails[field] != null) {
                input.value = report.landDetails[field];
            }
        });
    }
    
    // Populate technical achievements
    if (report.technicalAchievements) {
        const tech = report.technicalAchievements;
        
        // OFT
        if (tech.oft) {
            populateField('oft_technologies_tested', tech.oft.technologiesTested);
            populateField('oft_number_target', tech.oft.numberTarget);
            populateField('oft_number_achievement', tech.oft.numberAchievement);
            populateField('oft_farmers_target', tech.oft.farmersTarget);
        }
        
        // FLD
        if (tech.fld) {
            populateField('fld_technologies_demonstrated', tech.fld.technologiesDemonstrated);
            populateField('fld_number_target', tech.fld.numberTarget);
            populateField('fld_number_achievement', tech.fld.numberAchievement);
            populateField('fld_farmers_target', tech.fld.farmersTarget);
        }
        
        // Training
        if (tech.training) {
            populateField('training_courses_target', tech.training.coursesTarget);
            populateField('training_courses_achievement', tech.training.coursesAchievement);
            populateField('training_participants_target', tech.training.participantsTarget);
            populateField('training_participants_achievement', tech.training.participantsAchievement);
        }
        
        // Extension
        if (tech.extension) {
            populateField('extension_activities_target', tech.extension.activitiesTarget);
            populateField('extension_activities_achievement', tech.extension.activitiesAchievement);
            populateField('extension_participants_target', tech.extension.participantsTarget);
            populateField('extension_participants_achievement', tech.extension.participantsAchievement);
        }
        
        // Production
        if (tech.production) {
            populateField('seed_production_target', tech.production.seedProductionTarget);
            populateField('seed_production_achievement', tech.production.seedProductionAchievement);
            populateField('planting_material_target', tech.production.plantingMaterialTarget);
            populateField('planting_material_achievement', tech.production.plantingMaterialAchievement);
        }
    }
    
    // NOW POPULATE DYNAMIC TABLES
    
    // Populate staff table
    if (report.staff && Array.isArray(report.staff) && report.staff.length > 0) {
        console.log('Populating', report.staff.length, 'staff members');
        const tbody = document.getElementById('staffTable');
        if (tbody) {
            tbody.innerHTML = ''; // Clear existing rows
            
            report.staff.forEach((staffMember, index) => {
                const rowCount = index + 1;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${rowCount}</td>
                    <td><input type="text" name="staff_position_${rowCount}" class="form-control" value="${staffMember.position || ''}"></td>
                    <td><input type="text" name="staff_name_${rowCount}" class="form-control" value="${staffMember.name || ''}"></td>
                    <td><input type="text" name="staff_designation_${rowCount}" class="form-control" value="${staffMember.designation || ''}"></td>
                    <td><input type="text" name="staff_discipline_${rowCount}" class="form-control" value="${staffMember.discipline || ''}"></td>
                    <td><input type="text" name="staff_pay_scale_${rowCount}" class="form-control" value="${staffMember.payScale || ''}"></td>
                    <td><input type="date" name="staff_joining_date_${rowCount}" class="form-control" value="${staffMember.joiningDate ? staffMember.joiningDate.split('T')[0] : ''}"></td>
                    <td>
                        <select name="staff_status_${rowCount}" class="form-control">
                            <option value="">Select</option>
                            <option value="Permanent" ${staffMember.status === 'Permanent' ? 'selected' : ''}>Permanent</option>
                            <option value="Temporary" ${staffMember.status === 'Temporary' ? 'selected' : ''}>Temporary</option>
                            <option value="Contract" ${staffMember.status === 'Contract' ? 'selected' : ''}>Contract</option>
                        </select>
                    </td>
                    <td>
                        <select name="staff_category_${rowCount}" class="form-control">
                            <option value="">Select</option>
                            <option value="SC" ${staffMember.category === 'SC' ? 'selected' : ''}>SC</option>
                            <option value="ST" ${staffMember.category === 'ST' ? 'selected' : ''}>ST</option>
                            <option value="OBC" ${staffMember.category === 'OBC' ? 'selected' : ''}>OBC</option>
                            <option value="General" ${staffMember.category === 'General' ? 'selected' : ''}>General</option>
                        </select>
                    </td>
                    <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)">×</button></td>
                `;
                tbody.appendChild(row);
            });
        }
    }
    
    // Populate infrastructure table
    if (report.infrastructure && Array.isArray(report.infrastructure) && report.infrastructure.length > 0) {
        console.log('Populating', report.infrastructure.length, 'infrastructure items');
        const tbody = document.getElementById('infrastructureTable');
        if (tbody) {
            tbody.innerHTML = '';
            
            report.infrastructure.forEach((item, index) => {
                const rowCount = index + 1;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="text" name="infra_name_${rowCount}" class="form-control" value="${item.name || ''}"></td>
                    <td>
                        <select name="infra_status_${rowCount}" class="form-control">
                            <option value="">Select Status</option>
                            <option value="Not yet started" ${item.status === 'Not yet started' ? 'selected' : ''}>Not yet started</option>
                            <option value="Completed up to plinth level" ${item.status === 'Completed up to plinth level' ? 'selected' : ''}>Completed up to plinth level</option>
                            <option value="Completed up to lintel level" ${item.status === 'Completed up to lintel level' ? 'selected' : ''}>Completed up to lintel level</option>
                            <option value="Completed up to roof level" ${item.status === 'Completed up to roof level' ? 'selected' : ''}>Completed up to roof level</option>
                            <option value="Totally completed" ${item.status === 'Totally completed' ? 'selected' : ''}>Totally completed</option>
                        </select>
                    </td>
                    <td><input type="number" name="infra_plinth_area_${rowCount}" class="form-control" step="0.01" value="${item.plinthArea || ''}"></td>
                    <td>
                        <select name="infra_under_use_${rowCount}" class="form-control">
                            <option value="">Select</option>
                            <option value="Yes" ${item.underUse === 'Yes' ? 'selected' : ''}>Yes</option>
                            <option value="No" ${item.underUse === 'No' ? 'selected' : ''}>No</option>
                        </select>
                    </td>
                    <td><input type="text" name="infra_funding_source_${rowCount}" class="form-control" value="${item.fundingSource || ''}"></td>
                    <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)">×</button></td>
                `;
                tbody.appendChild(row);
            });
        }
    }
    
    // Populate vehicles table
    if (report.vehicles && Array.isArray(report.vehicles) && report.vehicles.length > 0) {
        console.log('Populating', report.vehicles.length, 'vehicles');
        const tbody = document.getElementById('vehiclesTable');
        if (tbody) {
            tbody.innerHTML = '';
            
            report.vehicles.forEach((vehicle, index) => {
                const rowCount = index + 1;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="text" name="vehicle_type_${rowCount}" class="form-control" value="${vehicle.type || ''}"></td>
                    <td><input type="number" name="vehicle_year_${rowCount}" class="form-control" value="${vehicle.yearOfPurchase || ''}"></td>
                    <td><input type="number" name="vehicle_cost_${rowCount}" class="form-control" value="${vehicle.cost || ''}"></td>
                    <td><input type="number" name="vehicle_km_run_${rowCount}" class="form-control" value="${vehicle.totalKmRun || ''}"></td>
                    <td>
                        <select name="vehicle_status_${rowCount}" class="form-control">
                            <option value="">Select Status</option>
                            <option value="Working" ${vehicle.status === 'Working' ? 'selected' : ''}>Working</option>
                            <option value="Under Repair" ${vehicle.status === 'Under Repair' ? 'selected' : ''}>Under Repair</option>
                            <option value="Out of Order" ${vehicle.status === 'Out of Order' ? 'selected' : ''}>Out of Order</option>
                            <option value="Disposed" ${vehicle.status === 'Disposed' ? 'selected' : ''}>Disposed</option>
                        </select>
                    </td>
                    <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)">×</button></td>
                `;
                tbody.appendChild(row);
            });
        }
    }
    
    // Populate equipment table
    if (report.equipment && Array.isArray(report.equipment) && report.equipment.length > 0) {
        console.log('Populating', report.equipment.length, 'equipment items');
        const tbody = document.getElementById('equipmentTable');
        if (tbody) {
            tbody.innerHTML = '';
            
            report.equipment.forEach((item, index) => {
                const rowCount = index + 1;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <select name="equipment_category_${rowCount}" class="form-control">
                            <option value="">Select Category</option>
                            <option value="Lab Equipment" ${item.category === 'Lab Equipment' ? 'selected' : ''}>Lab Equipment</option>
                            <option value="Farm Machinery" ${item.category === 'Farm Machinery' ? 'selected' : ''}>Farm Machinery</option>
                            <option value="AV Aids" ${item.category === 'AV Aids' ? 'selected' : ''}>AV Aids</option>
                            <option value="Others" ${item.category === 'Others' ? 'selected' : ''}>Others</option>
                        </select>
                    </td>
                    <td><input type="text" name="equipment_name_${rowCount}" class="form-control" value="${item.name || ''}"></td>
                    <td><input type="number" name="equipment_year_${rowCount}" class="form-control" value="${item.yearOfPurchase || ''}"></td>
                    <td><input type="number" name="equipment_cost_${rowCount}" class="form-control" value="${item.cost || ''}"></td>
                    <td>
                        <select name="equipment_status_${rowCount}" class="form-control">
                            <option value="">Select Status</option>
                            <option value="Working" ${item.status === 'Working' ? 'selected' : ''}>Working</option>
                            <option value="Under Repair" ${item.status === 'Under Repair' ? 'selected' : ''}>Under Repair</option>
                            <option value="Out of Order" ${item.status === 'Out of Order' ? 'selected' : ''}>Out of Order</option>
                            <option value="Disposed" ${item.status === 'Disposed' ? 'selected' : ''}>Disposed</option>
                        </select>
                    </td>
                    <td><input type="text" name="equipment_funding_${rowCount}" class="form-control" value="${item.fundingSource || ''}"></td>
                    <td><button type="button" class="btn btn-danger btn-sm" onclick="deleteTableRow(this)">×</button></td>
                `;
                tbody.appendChild(row);
            });
        }
    }
    
    console.log('Form populated with latest report data');
    showAlert('formAlert', 'Data loaded from latest report successfully!', 'success');
}

// Helper function to populate a single field
function populateField(fieldName, value) {
    const input = document.querySelector(`[name="${fieldName}"]`);
    if (input && value != null) {
        input.value = value;
    }
}