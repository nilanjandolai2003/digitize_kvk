// Excel template functions
       async function downloadExcelTemplate() {
    try {
        // Fetch the Excel file from your project folder
        const response = await fetch('KVK_Report_Template.xlsx');
        
        if (!response.ok) {
            throw new Error('Template file not found');
        }
        
        // Get the file as a blob
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'KVK_Annual_Report_Template.xlsx';
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        alert('Excel template downloaded successfully!');
    } catch (error) {
        alert('Error downloading template: ' + error.message);
        console.error('Download error:', error);
    }
}

// Reset form before importing new Excel data
function resetFormBeforeImport() {
    // Reset all input fields, textareas, and selects using .value property
    const allInputs = document.querySelectorAll('input, textarea, select');
    allInputs.forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });
    
    // Clear all dynamic tables
    const tablesToClear = [
        'staffTable',
        'cerealsTable', 
        'pulsesTable',
        'oftDetailsTable',
        'infrastructureTable',
        'vehiclesTable',
        'equipmentTable',
        'operationalAreasTable',
        'villageAdoptionTable',
        'thrustAreasTable',
        'publicationsTable'
    ];
    
    tablesToClear.forEach(tableId => {
        const table = document.getElementById(tableId);
        if (table) {
            table.innerHTML = '';
        }
    });
    
    // Reset any global row counters if they exist
    if (typeof window.staffRowCount !== 'undefined') window.staffRowCount = 0;
    if (typeof window.cerealsRowCount !== 'undefined') window.cerealsRowCount = 0;
    if (typeof window.pulsesRowCount !== 'undefined') window.pulsesRowCount = 0;
    if (typeof window.oftRowCount !== 'undefined') window.oftRowCount = 0;
    if (typeof window.infrastructureRowCount !== 'undefined') window.infrastructureRowCount = 0;
    if (typeof window.vehiclesRowCount !== 'undefined') window.vehiclesRowCount = 0;
    if (typeof window.equipmentRowCount !== 'undefined') window.equipmentRowCount = 0;
    if (typeof window.operationalAreasRowCount !== 'undefined') window.operationalAreasRowCount = 0;
    if (typeof window.villageAdoptionRowCount !== 'undefined') window.villageAdoptionRowCount = 0;
    if (typeof window.thrustAreasRowCount !== 'undefined') window.thrustAreasRowCount = 0;
    if (typeof window.publicationsRowCount !== 'undefined') window.publicationsRowCount = 0;
    
    console.log('Form reset completed - ready for new import');
}

function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            
             // Reset the entire form before importing new data
            resetFormBeforeImport();
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Process all sheets
            const allData = {};
            
            // Read General Information sheet
            if (workbook.SheetNames.includes('General Information')) {
                const worksheet = workbook.Sheets['General Information'];
                allData.generalInfo = parseGeneralInfoSheet(worksheet);
            }
            
            // Read Staff & Infrastructure sheet
            if (workbook.SheetNames.includes('Staff & Infrastructure')) {
                const worksheet = workbook.Sheets['Staff & Infrastructure'];
                allData.staffInfra = parseStaffInfraSheet(worksheet);
            }
            
            // Read District Data sheet
            if (workbook.SheetNames.includes('District Data')) {
                const worksheet = workbook.Sheets['District Data'];
                allData.districtData = parseDistrictDataSheet(worksheet);
            }
            
            // Read Technical Achievements sheet
            if (workbook.SheetNames.includes('Technical Achievements')) {
                const worksheet = workbook.Sheets['Technical Achievements'];
                allData.techAchievements = parseTechAchievementsSheet(worksheet);
            }
            
            // Read OFT Details sheet
            if (workbook.SheetNames.includes('OFT Details')) {
                const worksheet = workbook.Sheets['OFT Details'];
                allData.oftDetails = parseOFTDetailsSheet(worksheet);
            }
            
            // Read FLD Cereals & Pulses sheet
            if (workbook.SheetNames.includes('FLD Cereals & Pulses')) {
                const worksheet = workbook.Sheets['FLD Cereals & Pulses'];
                allData.fldCereals = parseFLDCerealsSheet(worksheet);
            }
            
            // Read Publications sheet
            if (workbook.SheetNames.includes('FLD Oilseeds & Others')) {
                const worksheet = workbook.Sheets['FLD Oilseeds & Others'];
                allData.publications = parsePublicationsSheet(worksheet);
            }
            
            // Populate the form with all collected data
            populateFormFromMultiSheetExcel(allData);
            showAlert('formAlert', 'Multi-sheet Excel data imported successfully!', 'success');
            
        } catch (error) {
            showAlert('formAlert', 'Error reading Excel file: ' + error.message, 'error');
            console.error('Excel import error:', error);
        }
    };
    reader.readAsArrayBuffer(file);
}

// Parse General Information sheet
function parseGeneralInfoSheet(worksheet) {
    const data = {};
    
    // Direct cell mapping (more reliable)
    const cellMappings = {
        'B6': 'kvkName',
        'B7': 'kvkAddress',
        'B8': 'kvkTelephone',
        'B9': 'kvkEmail',
        'B10': 'kvkFax',
        'B13': 'hostOrgName',
        'B14': 'hostOrgAddress',
        'B15': 'hostOrgTelephone',
        'B16': 'hostOrgEmail',
        'B17': 'hostOrgFax',
        'B20': 'headName',
        'B21': 'headMobile',
        'B22': 'headEmail',
        'B24': 'sanctionYear'  // Year of sanction
    };
    
    // Read values from specific cells
    for (const [cellAddress, fieldName] of Object.entries(cellMappings)) {
        const cell = worksheet[cellAddress];
        if (cell && cell.v) {
            data[fieldName] = cell.v.toString().trim();
        }
    }
    
    console.log('Parsed General Info:', data);
    return data;
}

// Parse Staff & Infrastructure sheet - Enhanced to capture ALL rows
function parseStaffInfraSheet(worksheet) {
    const data = { staff: [], landDetails: {}, infrastructure: [], vehicles: [], equipment: [] };
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    let currentSection = '';
    let headerFound = false;
    
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        // Section detection
        if (row[0] === '1.5. Staff Position (as on 1st January, 2023)') {
            currentSection = 'staff';
            headerFound = false;
            continue;
        } else if (row[0] === '1.6. Total land with KVK (in ha)') {
            currentSection = 'land';
            headerFound = false;
            continue;
        } else if (row[1] === 'Name of infrastructure' || (row[0] === 'S. No.' && row[1] === 'Name of infrastructure')) {
            currentSection = 'infrastructure';
            headerFound = true;
            continue;
        } else if (row[0] === 'Type of vehicle' || (Array.isArray(row) && row.includes('Type of vehicle'))) {
            currentSection = 'vehicles';
            headerFound = true;
            continue;
        } else if (row[0] === 'Equipment Category' || (Array.isArray(row) && row.includes('Equipment Category'))) {
            currentSection = 'equipment';
            headerFound = true;
            continue;
        }
        
        // Skip header rows
        if (!headerFound && (row[0] === 'Sl. No.' || row[0] === 'S. No.')) {
            headerFound = true;
            continue;
        }
        
        // Process ALL data rows until next section or end
        if (currentSection === 'staff' && headerFound && row.length > 1) {
            // Continue reading until we hit an empty row or new section
            if (row[0] && (typeof row[0] === 'number' || !isNaN(parseInt(row[0])))) {
                data.staff.push({
                    slNo: row[0],
                    position: row[1] || '',
                    name: row[2] || '',
                    designation: row[3] || '',
                    discipline: row[4] || '',
                    payScale: row[5] || '',
                    joiningDate: row[6] || '',
                    status: row[7] || '',
                    category: row[8] || ''
                });
            } else if (row[1] && row[2]) {
                // Handle cases where serial number might be missing
                data.staff.push({
                    slNo: data.staff.length + 1,
                    position: row[1] || '',
                    name: row[2] || '',
                    designation: row[3] || '',
                    discipline: row[4] || '',
                    payScale: row[5] || '',
                    joiningDate: row[6] || '',
                    status: row[7] || '',
                    category: row[8] || ''
                });
            }
        } else if (currentSection === 'land' && row[0] && row[1]) {
            const item = row[1];
            const area = row[2];
            if (item && area && item !== 'Item') {
                if (item.includes('Buildings')) data.landDetails.buildings = area;
                else if (item.includes('Demonstration')) data.landDetails.demoUnits = area;
                else if (item.includes('Crops')) data.landDetails.crops = area;
                else if (item.includes('Orchard')) data.landDetails.orchard = area;
                else if (item.includes('Others')) data.landDetails.others = area;
            }
        } else if (currentSection === 'infrastructure' && headerFound && row.length > 1) {
    // Read ALL infrastructure rows with NEW structure
    if (row[1] && row[1] !== 'Name of infrastructure') {
        data.infrastructure.push({
            name: row[1] || '',
            status: row[2] || '',  
            plinthArea: parseFloat(row[3]) || 0,  
            underUse: row[4] || '',  
            fundingSource: row[5] || ''  
        });
    }
} else if (currentSection === 'vehicles' && headerFound && row.length > 1) {
            // Read ALL vehicle rows
            if (row[0] && row[0] !== 'Type of vehicle' && !row[0].includes('Vehicles')) {
                data.vehicles.push({
                    type: row[0] || '',
                    year: row[1] || '',
                    cost: row[2] || '',
                    kmRun: row[3] || '',
                    status: row[4] || ''
                });
            }
        } else if (currentSection === 'equipment' && headerFound && row.length > 1) {
            // Read ALL equipment rows
            if (row[0] && row[0] !== 'Equipment Category' && !row[0].includes('Equipment')) {
                data.equipment.push({
                    category: row[0] || '',
                    name: row[1] || '',
                    year: row[2] || '',
                    cost: row[3] || '',
                    status: row[4] || '',
                    funding: row[5] || ''
                });
            }
        }
    }
    
    return data;
}

// Parse District Data sheet
function parseDistrictDataSheet(worksheet) {
    const data = { operationalAreas: [], villageAdoption: [], thrustAreas: [] };
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        if (row[1] === 'Major Farming system/enterprise' && row[2]) {
            data.majorFarmingSystem = row[2];
        } else if (row[1] === 'Agro-climatic Zone' && row[2]) {
            data.agroClimaticZone = row[2];
        } else if (row[1] === 'Agro ecological situation' && row[2]) {
            data.agroEcologicalSituation = row[2];
        } else if (row[1] === 'Soil type' && row[2]) {
            data.soilType = row[2];
        } else if (row[1] === 'Productivity of major 2-3 crops' && row[2]) {
            data.cropProductivity = row[2];
        } else if (row[1] === 'Mean yearly temperature' && row[2]) {
            data.climateData = row[2];
        }
    }
    
    return data;
}

// Parse Technical Achievements sheet
function parseTechAchievementsSheet(worksheet) {
    const data = {};
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    let currentSection = '';
    
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        if (row[0] === 'OFT (On Farm Trials)') {
            currentSection = 'oft';
        } else if (row[0] === 'FLD (Frontline Demonstrations)') {
            currentSection = 'fld';
        } else if (row[0] === 'Training') {
            currentSection = 'training';
        } else if (row[0] === 'Extension activities') {
            currentSection = 'extension';
        } else if (row[0] === 'Seed production (q)') {
            currentSection = 'seedProduction';
        }
        
        // Extract target and achievement values
        if (currentSection && row[1] === 'Target' && row[2] === 'Achievement') {
            i++; // Move to data row
            const nextRow = jsonData[i];
            if (nextRow) {
                if (currentSection === 'oft') {
                    data.oftNumberTarget = nextRow[1];
                    data.oftNumberAchievement = nextRow[2];
                    if (jsonData[i+1]) {
                        data.oftFarmersTarget = jsonData[i+1][1];
                    }
                } else if (currentSection === 'fld') {
                    data.fldNumberTarget = nextRow[1];
                    data.fldNumberAchievement = nextRow[2];
                    if (jsonData[i+1]) {
                        data.fldFarmersTarget = jsonData[i+1][1];
                    }
                } else if (currentSection === 'training') {
                    data.trainingCoursesTarget = nextRow[1];
                    data.trainingCoursesAchievement = nextRow[2];
                    if (jsonData[i+1]) {
                        data.trainingParticipantsTarget = jsonData[i+1][1];
                        data.trainingParticipantsAchievement = jsonData[i+1][2];
                    }
                }
            }
        }
    }
    
    return data;
}

// Parse OFT Details sheet
function parseOFTDetailsSheet(worksheet) {
    const data = { oftDetails: [], oftPerformance: [] };
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    let currentSection = '';
    
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        if (row[0] === 'OFT Details') {
            currentSection = 'details';
            i += 1; // Skip header row
            continue;
        } else if (row[0] === 'OFT Performance Data') {
            currentSection = 'performance';
            i += 1; // Skip header row
            continue;
        }
        
        if (currentSection === 'details' && row[0] && typeof row[0] === 'number') {
            data.oftDetails.push({
                oftNo: row[0],
                title: row[1] || '',
                problem: row[2] || '',
                technology: row[3] || '',
                source: row[4] || '',
                productionSystem: row[5] || '',
                performance: row[6] || ''
            });
        } else if (currentSection === 'performance' && row[0] && row[0] !== 'Technology option') {
            data.oftPerformance.push({
                technology: row[0],
                trials: row[1] || 0,
                yield: row[2] || 0,
                cost: row[3] || 0,
                grossReturn: row[4] || 0,
                netReturn: row[5] || 0,
                bcRatio: row[6] || 0
            });
        }
    }
    
    return data;
}

// Parse FLD Cereals sheet - Enhanced to capture ALL demonstration rows
function parseFLDCerealsSheet(worksheet) {
    const data = { cereals: [], pulses: [], farmingSituation: [] };
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    let currentSection = '';
    let headerFound = false;
    
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        // Section detection
        if (row[0] === 'Cereals') {
            currentSection = 'cereals';
            headerFound = false;
            continue;
        } else if (row[0] === 'Pulses') {
            currentSection = 'pulses';
            headerFound = false;
            continue;
        } else if (row[0] === 'Details of farming situation') {
            currentSection = 'farmingSituation';
            headerFound = false;
            continue;
        }
        
        // Skip header rows
        if (!headerFound && (row[0] === 'Sl. No.' || row[0] === 'Crop')) {
            headerFound = true;
            continue;
        }
        
        // Process ALL cereals demonstrations
        if (currentSection === 'cereals' && headerFound && row.length > 1) {
            if (row[1] && row[1] !== '' && row[1] !== 'Crop') { // Has crop name
                data.cereals.push({
                    slNo: row[0] || data.cereals.length + 1,
                    crop: row[1] || '',
                    technology: row[2] || '',
                    area: parseFloat(row[3]) || 0,
                    farmers: parseInt(row[4]) || 0,
                    demoYield: parseFloat(row[5]) || 0,
                    checkYield: parseFloat(row[6]) || 0,
                    percentIncrease: parseFloat(row[7]) || 0,
                    grossCostDemo: parseFloat(row[8]) || 0,
                    grossReturnDemo: parseFloat(row[9]) || 0,
                    netReturnDemo: parseFloat(row[10]) || 0,
                    bcrDemo: parseFloat(row[11]) || 0
                });
            }
        }
        // Process ALL pulses demonstrations
        else if (currentSection === 'pulses' && headerFound && row.length > 1) {
            if (row[1] && row[1] !== '' && row[1] !== 'Crop') { // Has crop name
                data.pulses.push({
                    slNo: row[0] || data.pulses.length + 1,
                    crop: row[1] || '',
                    technology: row[2] || '',
                    area: parseFloat(row[3]) || 0,
                    farmers: parseInt(row[4]) || 0,
                    demoYield: parseFloat(row[5]) || 0,
                    checkYield: parseFloat(row[6]) || 0,
                    percentIncrease: parseFloat(row[7]) || 0,
                    grossCostDemo: parseFloat(row[8]) || 0,
                    grossReturnDemo: parseFloat(row[9]) || 0,
                    netReturnDemo: parseFloat(row[10]) || 0,
                    bcrDemo: parseFloat(row[11]) || 0
                });
            }
        }
        // Process farming situation data
        else if (currentSection === 'farmingSituation' && headerFound && row.length > 1) {
            if (row[0] && row[0] !== 'Crop') {
                data.farmingSituation.push({
                    crop: row[0] || '',
                    season: row[1] || '',
                    farmingSituation: row[2] || '',
                    soilType: row[3] || '',
                    soilN: row[4] || '',
                    soilP2O5: row[5] || '',
                    soilK2O: row[6] || '',
                    previousCrop: row[7] || '',
                    sowingDate: row[8] || '',
                    harvestDate: row[9] || ''
                });
            }
        }
    }
    
    return data;
}

// Enhanced OFT Details parser to capture ALL trials and performance data
function parseOFTDetailsSheet(worksheet) {
    const data = { oftDetails: [], oftPerformance: [] };
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    let currentSection = '';
    let headerFound = false;
    
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        if (row[0] === 'OFT Details') {
            currentSection = 'details';
            headerFound = false;
            continue;
        } else if (row[0] === 'OFT Performance Data') {
            currentSection = 'performance';
            headerFound = false;
            continue;
        }
        
        // Skip header rows
        if (!headerFound && (row[0] === 'OFT No.' || row[0] === 'Technology option')) {
            headerFound = true;
            continue;
        }
        
        // Process ALL OFT details
        if (currentSection === 'details' && headerFound && row.length > 1) {
            if (row[1] && row[1] !== '' && row[1] !== 'Title of On farm Trial') { // Has title
                data.oftDetails.push({
                    oftNo: row[0] || data.oftDetails.length + 1,
                    title: row[1] || '',
                    problem: row[2] || '',
                    technology: row[3] || '',
                    source: row[4] || '',
                    productionSystem: row[5] || '',
                    performance: row[6] || ''
                });
            }
        }
        // Process ALL performance data
        else if (currentSection === 'performance' && headerFound && row.length > 1) {
            if (row[0] && row[0] !== '' && row[0] !== 'Technology option') {
                data.oftPerformance.push({
                    technology: row[0] || '',
                    trials: parseInt(row[1]) || 0,
                    yield: parseFloat(row[2]) || 0,
                    cost: parseFloat(row[3]) || 0,
                    grossReturn: parseFloat(row[4]) || 0,
                    netReturn: parseFloat(row[5]) || 0,
                    bcRatio: parseFloat(row[6]) || 0
                });
            }
        }
    }
    
    return data;
}

// Enhanced District Data parser to capture ALL operational areas and villages
function parseDistrictDataSheet(worksheet) {
    const data = { 
        operationalAreas: [], 
        villageAdoption: [], 
        thrustAreas: [],
        districtInfo: {}
    };
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    let currentSection = '';
    let headerFound = false;
    
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        // Section detection
        if (row[0] === '2.b. Details of operational area/villages (2023)') {
            currentSection = 'operationalAreas';
            headerFound = false;
            continue;
        } else if (row[0] === '2.c. Details of village adoption programme') {
            currentSection = 'villageAdoption';
            headerFound = false;
            continue;
        } else if (row[0] === '2.1 Priority thrust areas') {
            currentSection = 'thrustAreas';
            headerFound = false;
            continue;
        }
        
        // Extract district-level information
        if (row[1] === 'Major Farming system/enterprise' && row[2]) {
            data.districtInfo.majorFarmingSystem = row[2];
        } else if (row[1] === 'Agro-climatic Zone' && row[2]) {
            data.districtInfo.agroClimaticZone = row[2];
        } else if (row[1] === 'Agro ecological situation' && row[2]) {
            data.districtInfo.agroEcologicalSituation = row[2];
        } else if (row[1] === 'Soil type' && row[2]) {
            data.districtInfo.soilType = row[2];
        } else if (row[1] && row[1].includes('Productivity') && row[2]) {
            data.districtInfo.cropProductivity = row[2];
        } else if (row[1] && row[1].includes('Mean yearly') && row[2]) {
            data.districtInfo.climateData = row[2];
        } else if (row[1] && row[1].includes('livestock products') && row[2]) {
            data.districtInfo.livestockProduction = row[2];
        }
        
        // Skip header rows
        if (!headerFound && (row[0] === 'Sl. No.' || row[0] === 'S. No' || row[0] === 'Name of village')) {
            headerFound = true;
            continue;
        }
        
        // Process ALL operational areas
        if (currentSection === 'operationalAreas' && headerFound && row.length > 1) {
            if (row[1] && row[1] !== '' && row[1] !== 'Name of Taluk') { // Has taluk name
                data.operationalAreas.push({
                    slNo: row[0] || data.operationalAreas.length + 1,
                    taluk: row[1] || '',
                    block: row[2] || '',
                    villages: row[3] || '',
                    majorCrops: row[4] || '',
                    problems: row[5] || '',
                    thrustAreas: row[6] || ''
                });
            }
        }
        // Process ALL village adoption data
        else if (currentSection === 'villageAdoption' && headerFound && row.length > 1) {
            if (row[0] && row[0] !== '' && row[0] !== 'Name of village') {
                data.villageAdoption.push({
                    village: row[0] || '',
                    block: row[1] || '',
                    actionTaken: row[2] || ''
                });
            }
        }
        // Process ALL thrust areas
        else if (currentSection === 'thrustAreas' && headerFound && row.length > 1) {
            if (row[1] && row[1] !== '' && row[1] !== 'Thrust area') {
                data.thrustAreas.push({
                    slNo: row[0] || data.thrustAreas.length + 1,
                    thrustArea: row[1] || ''
                });
            }
        }
    }
    
    return data;
}

// Parse Publications sheet
function parsePublicationsSheet(worksheet) {
    const data = { publications: [] };
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Extract publication data
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row[0] && row[0] !== 'Title' && row[0] !== 'Research Papers and Publications') {
            data.publications.push({
                title: row[0],
                authors: row[1] || '',
                journal: row[2] || '',
                rating: row[3] || '',
                year: row[4] || ''
            });
        }
    }
    
    return data;
}

// Updated populateFormFromExcel function for multi-sheet data
function populateFormFromMultiSheetExcel(allData) {
    try {
        // Populate General Information
        if (allData.generalInfo) {
            const generalMapping = {
                'kvkName': 'kvk_name',
                'kvkAddress': 'kvk_address',
                'kvkTelephone': 'kvk_telephone',
                'kvkEmail': 'kvk_email',
                'kvkFax': 'kvk_fax',
                'hostOrgName': 'host_org_name',
                'headName': 'head_name',
                'host_org_address': 'hostOrgAddress',
                'headMobile': 'head_mobile',
                'headEmail': 'head_email',
                'sanctionYear': 'sanction_year'
            };
            
            for (const [dataKey, formField] of Object.entries(generalMapping)) {
                if (allData.generalInfo[dataKey]) {
                    const element = document.querySelector(`[name="${formField}"]`);
                    if (element) {
                        element.value = allData.generalInfo[dataKey];
                    }
                }
            }
        }
        
// Populate Land Details
        if (allData.staffInfra && allData.staffInfra.landDetails) {
            const land = allData.staffInfra.landDetails;
            if (land.buildings) document.querySelector('[name="land_buildings"]')?.setAttribute('value', land.buildings);
            if (land.demoUnits) document.querySelector('[name="land_demo_units"]')?.setAttribute('value', land.demoUnits);
            if (land.crops) document.querySelector('[name="land_crops"]')?.setAttribute('value', land.crops);
            if (land.orchard) document.querySelector('[name="land_orchard"]')?.setAttribute('value', land.orchard);
            if (land.others) document.querySelector('[name="land_others"]')?.setAttribute('value', land.others);
        }
// Populate Infrastructure Data
if (allData.staffInfra && allData.staffInfra.infrastructure) {
    // Clear existing infrastructure rows first
    const infraTable = document.getElementById('infrastructureTable');
    if (infraTable) {
        infraTable.innerHTML = '';
    }
    
    // Add infrastructure rows with data
    allData.staffInfra.infrastructure.forEach((infra, index) => {
        if (infra.name) { // Only add rows with actual data
            addInfrastructureRow(infra.name);
            
            // Use .value instead of .setAttribute for immediate display
            const nameInput = document.querySelector(`[name="infra_name_${index + 1}"]`);
            if (nameInput) nameInput.value = infra.name;
            
            const statusInput = document.querySelector(`[name="infra_status_${index + 1}"]`);
            if (statusInput) statusInput.value = infra.status;
            
            const plinthInput = document.querySelector(`[name="infra_plinth_area_${index + 1}"]`);
            if (plinthInput) plinthInput.value = infra.plinthArea;
            
            const useInput = document.querySelector(`[name="infra_under_use_${index + 1}"]`);
            if (useInput) useInput.value = infra.underUse;
            
            const fundingInput = document.querySelector(`[name="infra_funding_source_${index + 1}"]`);
            if (fundingInput) fundingInput.value = infra.fundingSource;
        }
    });
    
    console.log('Populated', allData.staffInfra.infrastructure.length, 'infrastructure rows');
}
        // Populate District Data
        if (allData.districtData) {
            const district = allData.districtData;
            const districtMapping = {
                'majorFarmingSystem': 'major_farming_system',
                'agroClimaticZone': 'agro_climatic_zone',
                'agroEcologicalSituation': 'agro_ecological_situation',
                'soilType': 'soil_type',
                'cropProductivity': 'crop_productivity'
            };
            
            for (const [dataKey, formField] of Object.entries(districtMapping)) {
                if (district[dataKey]) {
                    const element = document.querySelector(`[name="${formField}"]`);
                    if (element) {
                        element.value = district[dataKey];
                    }
                }
            }
        }
        
        // Populate Technical Achievements
        if (allData.techAchievements) {
            const tech = allData.techAchievements;
            const techMapping = {
                'oftNumberTarget': 'oft_number_target',
                'oftNumberAchievement': 'oft_number_achievement',
                'oftFarmersTarget': 'oft_farmers_target',
                'fldNumberTarget': 'fld_number_target',
                'fldNumberAchievement': 'fld_number_achievement',
                'fldFarmersTarget': 'fld_farmers_target',
                'trainingCoursesTarget': 'training_courses_target',
                'trainingCoursesAchievement': 'training_courses_achievement',
                'trainingParticipantsTarget': 'training_participants_target',
                'trainingParticipantsAchievement': 'training_participants_achievement'
            };
            
            for (const [dataKey, formField] of Object.entries(techMapping)) {
                if (tech[dataKey]) {
                    const element = document.querySelector(`[name="${formField}"]`);
                    if (element) {
                        element.value = tech[dataKey];
                    }
                }
            }
        }
        
        // Populate Staff Data
        if (allData.staffInfra && allData.staffInfra.staff) {
            // Clear existing staff rows first
            const staffTable = document.getElementById('staffTable');
            if (staffTable) {
                staffTable.innerHTML = '';
            }
            
            // Add staff rows with data
            allData.staffInfra.staff.forEach((staff, index) => {
                if (staff.name || staff.position) { // Only add rows with actual data
                    addStaffRow(staff.position);
                    // Populate the added row with data
                    document.querySelector(`[name="staff_name_${index + 1}"]`).value= staff.name||'';
                    document.querySelector(`[name="staff_designation_${index + 1}"]`).value= staff.designation||'';
                    document.querySelector(`[name="staff_discipline_${index + 1}"]`).value=staff.discipline||'';
                    document.querySelector(`[name="staff_pay_scale_${index + 1}"]`).value=staff.payScale||'';
                    document.querySelector(`[name="staff_joining_date_${index + 1}"]`).value= staff.joiningDate||'';
                    document.querySelector(`[name="staff_status_${index + 1}"]`).value=staff.status||'';
                    document.querySelector(`[name="staff_category_${index + 1}"]`).value=staff.category||'';
                }
            });
        }
        
        // Populate Cereals and Pulses Demonstrations
        if (allData.fldCereals) {
            // Clear existing demo tables
            const cerealsTable = document.getElementById('cerealsTable');
            const pulsesTable = document.getElementById('pulsesTable');
            
            if (cerealsTable) cerealsTable.innerHTML = '';
            if (pulsesTable) pulsesTable.innerHTML = '';
            
            // Add cereals data
            if (allData.fldCereals.cereals) {
                allData.fldCereals.cereals.forEach((cereal, index) => {
                    if (cereal.crop) {
                        addCerealsRow();
                        document.querySelector(`[name="cereals_crop_${index + 1}"]`)?.setAttribute('value', cereal.crop);
                        document.querySelector(`[name="cereals_technology_${index + 1}"]`)?.setAttribute('value', cereal.technology);
                        document.querySelector(`[name="cereals_area_${index + 1}"]`)?.setAttribute('value', cereal.area);
                        document.querySelector(`[name="cereals_farmers_${index + 1}"]`)?.setAttribute('value', cereal.farmers);
                        document.querySelector(`[name="cereals_demo_yield_${index + 1}"]`)?.setAttribute('value', cereal.demoYield);
                        document.querySelector(`[name="cereals_check_yield_${index + 1}"]`)?.setAttribute('value', cereal.checkYield);
                    }
                });
            }
            
            // Add pulses data
            if (allData.fldCereals.pulses) {
                allData.fldCereals.pulses.forEach((pulse, index) => {
                    if (pulse.crop) {
                        addPulsesRow();
                        document.querySelector(`[name="pulses_crop_${index + 1}"]`)?.setAttribute('value', pulse.crop);
                        document.querySelector(`[name="pulses_technology_${index + 1}"]`)?.setAttribute('value', pulse.technology);
                        document.querySelector(`[name="pulses_area_${index + 1}"]`)?.setAttribute('value', pulse.area);
                        document.querySelector(`[name="pulses_farmers_${index + 1}"]`)?.setAttribute('value', pulse.farmers);
                        document.querySelector(`[name="pulses_demo_yield_${index + 1}"]`)?.setAttribute('value', pulse.demoYield);
                        document.querySelector(`[name="pulses_check_yield_${index + 1}"]`)?.setAttribute('value', pulse.checkYield);
                    }
                });
            }
        }
        
        // Populate OFT Details
        if (allData.oftDetails && allData.oftDetails.oftDetails) {
            const oftTable = document.getElementById('oftDetailsTable');
            if (oftTable) oftTable.innerHTML = '';
            
            allData.oftDetails.oftDetails.forEach((oft, index) => {
                if (oft.title) {
                    addOFTDetailsRow();
                    document.querySelector(`[name="oft_title_${index + 1}"]`)?.setAttribute('value', oft.title);
                    document.querySelector(`[name="oft_problem_${index + 1}"]`)?.setAttribute('value', oft.problem);
                    document.querySelector(`[name="oft_technology_${index + 1}"]`)?.setAttribute('value', oft.technology);
                    document.querySelector(`[name="oft_source_${index + 1}"]`)?.setAttribute('value', oft.source);
                    document.querySelector(`[name="oft_production_system_${index + 1}"]`)?.setAttribute('value', oft.productionSystem);
                    document.querySelector(`[name="oft_performance_${index + 1}"]`)?.setAttribute('value', oft.performance);
                }
            });
        }
        
        console.log('Multi-sheet Excel data populated successfully');
       
        
    } catch (error) {
         
        console.error('Error populating form from multi-sheet Excel:', error);
        showAlert('formAlert', 'Error populating form: ' + error.message, 'error');
    }
}
window.downloadExcelTemplate = downloadExcelTemplate;
window.handleExcelUpload = handleExcelUpload;