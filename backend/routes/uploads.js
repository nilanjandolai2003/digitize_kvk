// routes/uploads.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { auth } = require('../middleware/auth');
const Report = require('../models/Report');
const { AuditLog } = require('../models/AuditLog');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads', req.user.userId);
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Allow Excel files, PDFs, and images
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only Excel, PDF, and image files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Maximum 5 files per request
    },
    fileFilter: fileFilter
});

// Upload Excel template for auto-filling
router.post('/excel', auth, upload.single('excel'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No Excel file uploaded'
            });
        }

        // Read the Excel file
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Excel file is empty or invalid format'
            });
        }

        // Transform Excel data to match our schema
        const transformedData = transformExcelData(jsonData[0]);

        // Log the upload
        await new AuditLog({
            action: 'CREATE',
            resourceType: 'SYSTEM',
            userId: req.user.userId,
            userEmail: req.user.email,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            metadata: { 
                action: 'excel_upload',
                filename: req.file.originalname,
                size: req.file.size
            }
        }).save();

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            message: 'Excel data processed successfully',
            data: transformedData
        });

    } catch (error) {
        // Clean up file if processing failed
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        console.error('Excel upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process Excel file',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Transform Excel data to match our schema
function transformExcelData(excelRow) {
    return {
        // General Information
        kvkName: excelRow['KVK Name'] || '',
        kvkAddress: excelRow['KVK Address'] || '',
        kvkTelephone: excelRow['KVK Telephone'] || '',
        kvkEmail: excelRow['KVK Email'] || '',
        kvkFax: excelRow['KVK FAX'] || '',
        hostOrgName: excelRow['Host Organization Name'] || '',
        hostOrgAddress: excelRow['Host Organization Address'] || '',
        hostOrgTelephone: excelRow['Host Org Telephone'] || '',
        hostOrgEmail: excelRow['Host Org Email'] || '',
        headName: excelRow['Senior Scientist Name'] || '',
        headMobile: excelRow['Senior Scientist Mobile'] || '',
        headEmail: excelRow['Senior Scientist Email'] || '',
        sanctionYear: excelRow['Year of Sanction'] || null,
        
        // Land Details
        landDetails: {
            buildings: excelRow['Land Under Buildings (ha)'] || 0,
            demoUnits: excelRow['Land Under Demo Units (ha)'] || 0,
            crops: excelRow['Land Under Crops (ha)'] || 0,
            orchard: excelRow['Land Under Orchard (ha)'] || 0,
            others: excelRow['Land Others (ha)'] || 0
        },
        
        // District Level Data
        majorFarmingSystem: excelRow['Major Farming System'] || '',
        agroClimaticZone: excelRow['Agro-climatic Zone'] || '',
        agroEcologicalSituation: excelRow['Agro Ecological Situation'] || '',
        soilType: excelRow['Soil Type'] || '',
        cropProductivity: excelRow['Crop Productivity'] || '',
        meanTemperature: excelRow['Mean Temperature (°C)'] || null,
        meanRainfall: excelRow['Mean Rainfall (mm)'] || null,
        meanHumidity: excelRow['Mean Humidity (%)'] || null,
        livestockProduction: excelRow['Livestock Production'] || '',
        
        // Technical Achievements
        technicalAchievements: {
            oft: {
                technologiesTested: excelRow['OFT Technologies Tested'] || 0,
                numberTarget: excelRow['OFT Number Target'] || 0,
                numberAchievement: excelRow['OFT Number Achievement'] || 0,
                farmersTarget: excelRow['OFT Farmers Target'] || 0
            },
            fld: {
                technologiesDemonstrated: excelRow['FLD Technologies Demonstrated'] || 0,
                numberTarget: excelRow['FLD Number Target'] || 0,
                numberAchievement: excelRow['FLD Number Achievement'] || 0,
                farmersTarget: excelRow['FLD Farmers Target'] || 0
            },
            training: {
                coursesTarget: excelRow['Training Courses Target'] || 0,
                coursesAchievement: excelRow['Training Courses Achievement'] || 0,
                participantsTarget: excelRow['Training Participants Target'] || 0,
                participantsAchievement: excelRow['Training Participants Achievement'] || 0
            },
            extension: {
                activitiesTarget: excelRow['Extension Activities Target'] || 0,
                activitiesAchievement: excelRow['Extension Activities Achievement'] || 0,
                participantsTarget: excelRow['Extension Participants Target'] || 0,
                participantsAchievement: excelRow['Extension Participants Achievement'] || 0
            },
            production: {
                seedProductionTarget: excelRow['Seed Production Target (q)'] || 0,
                seedProductionAchievement: excelRow['Seed Production Achievement (q)'] || 0,
                plantingMaterialTarget: excelRow['Planting Material Target (Lakh)'] || 0,
                plantingMaterialAchievement: excelRow['Planting Material Achievement (Lakh)'] || 0
            }
        },
        
        // Publications
        publications: {
            researchPapers: excelRow['Research Papers'] || 0,
            bulletins: excelRow['Bulletins'] || 0,
            popularArticles: excelRow['Popular Articles'] || 0,
            extensionPamphlets: excelRow['Extension Pamphlets'] || 0,
            technicalReports: excelRow['Technical Reports'] || 0,
            booksPublished: excelRow['Books Published'] || 0
        },
        
        // Livestock
        livestock: {
            dairyDemonstrations: excelRow['Dairy Demonstrations'] || 0,
            poultryDemonstrations: excelRow['Poultry Demonstrations'] || 0,
            goatSheepDemonstrations: excelRow['Goat Sheep Demonstrations'] || 0
        },
        
        // Additional Information
        majorAchievements: excelRow['Major Achievements'] || '',
        constraintsSuggestions: excelRow['Constraints Suggestions'] || '',
        reportPreparedBy: excelRow['Report Prepared By'] || '',
        reportDate: excelRow['Report Date'] ? new Date(excelRow['Report Date']) : new Date(),
        
        // Parse dynamic data (staff, infrastructure, etc.)
        staff: parseStaffData(excelRow),
        infrastructure: parseInfrastructureData(excelRow),
        vehicles: parseVehicleData(excelRow),
        equipment: parseEquipmentData(excelRow),
        operationalAreas: parseOperationalAreaData(excelRow),
        villageAdoption: parseVillageAdoptionData(excelRow),
        thrustAreas: parseThrustAreasData(excelRow),
        cerealsDemo: parseDemoData(excelRow, 'Cereals'),
        pulsesDemo: parseDemoData(excelRow, 'Pulses'),
        oilseedsDemo: parseDemoData(excelRow, 'Oilseeds')
    };
}

// Helper functions to parse dynamic data
function parseStaffData(row) {
    const staff = [];
    for (let i = 1; i <= 10; i++) {
        if (row[`Staff ${i} Name`]) {
            staff.push({
                slNo: i,
                position: row[`Staff ${i} Position`] || '',
                name: row[`Staff ${i} Name`],
                designation: row[`Staff ${i} Designation`] || '',
                discipline: row[`Staff ${i} Discipline`] || '',
                payScale: row[`Staff ${i} Pay Scale`] || '',
                joiningDate: row[`Staff ${i} Joining Date`] ? new Date(row[`Staff ${i} Joining Date`]) : null,
                status: row[`Staff ${i} Status`] || '',
                category: row[`Staff ${i} Category`] || ''
            });
        }
    }
    return staff;
}

function parseInfrastructureData(row) {
    const infrastructure = [];
    for (let i = 1; i <= 5; i++) {
        if (row[`Infrastructure ${i} Name`]) {
            infrastructure.push({
                name: row[`Infrastructure ${i} Name`],
                status: row[`Infrastructure ${i} Status`] || '',
                plinthArea: row[`Infrastructure ${i} Plinth Area`] || 0,
                underUse: row[`Infrastructure ${i} Under Use`] || '',
                fundingSource: row[`Infrastructure ${i} Funding Source`] || ''
            });
        }
    }
    return infrastructure;
}

function parseVehicleData(row) {
    const vehicles = [];
    for (let i = 1; i <= 3; i++) {
        if (row[`Vehicle ${i} Type`]) {
            vehicles.push({
                type: row[`Vehicle ${i} Type`],
                yearOfPurchase: row[`Vehicle ${i} Year`] || null,
                cost: row[`Vehicle ${i} Cost`] || 0,
                totalKmRun: row[`Vehicle ${i} Km Run`] || 0,
                status: row[`Vehicle ${i} Status`] || ''
            });
        }
    }
    return vehicles;
}

function parseEquipmentData(row) {
    const equipment = [];
    for (let i = 1; i <= 5; i++) {
        if (row[`Equipment ${i} Name`]) {
            equipment.push({
                category: row[`Equipment ${i} Category`] || '',
                name: row[`Equipment ${i} Name`],
                yearOfPurchase: row[`Equipment ${i} Year`] || null,
                cost: row[`Equipment ${i} Cost`] || 0,
                status: row[`Equipment ${i} Status`] || '',
                fundingSource: row[`Equipment ${i} Funding`] || ''
            });
        }
    }
    return equipment;
}

function parseOperationalAreaData(row) {
    const areas = [];
    for (let i = 1; i <= 3; i++) {
        if (row[`Op Area ${i} Taluk`]) {
            areas.push({
                taluk: row[`Op Area ${i} Taluk`],
                block: row[`Op Area ${i} Block`] || '',
                villages: row[`Op Area ${i} Villages`] || '',
                majorCrops: row[`Op Area ${i} Major Crops`] || '',
                problems: row[`Op Area ${i} Problems`] || '',
                thrustAreas: row[`Op Area ${i} Thrust Areas`] || ''
            });
        }
    }
    return areas;
}

function parseVillageAdoptionData(row) {
    const villages = [];
    for (let i = 1; i <= 3; i++) {
        if (row[`Village ${i} Name`]) {
            villages.push({
                name: row[`Village ${i} Name`],
                block: row[`Village ${i} Block`] || '',
                actionTaken: row[`Village ${i} Action`] || ''
            });
        }
    }
    return villages;
}

function parseThrustAreasData(row) {
    const thrustAreas = [];
    for (let i = 1; i <= 5; i++) {
        if (row[`Thrust Area ${i}`]) {
            thrustAreas.push(row[`Thrust Area ${i}`]);
        }
    }
    return thrustAreas;
}

function parseDemoData(row, category) {
    const demos = [];
    for (let i = 1; i <= 3; i++) {
        if (row[`${category} Demo ${i} Crop`]) {
            const demoYield = row[`${category} Demo ${i} Demo Yield`] || 0;
            const checkYield = row[`${category} Demo ${i} Check Yield`] || 0;
            const percentageIncrease = checkYield > 0 ? ((demoYield - checkYield) / checkYield) * 100 : 0;
            
            demos.push({
                crop: row[`${category} Demo ${i} Crop`],
                technologyDemonstrated: row[`${category} Demo ${i} Technology`] || '',
                area: row[`${category} Demo ${i} Area`] || 0,
                numberOfFarmers: row[`${category} Demo ${i} Farmers`] || 0,
                demoYield,
                checkYield,
                percentageIncrease
            });
        }
    }
    return demos;
}

// Upload multiple files (attachments)
router.post('/attachments', auth, upload.array('files', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const attachments = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size,
            uploadedAt: new Date()
        }));

        // Log the uploads
        await new AuditLog({
            action: 'CREATE',
            resourceType: 'SYSTEM',
            userId: req.user.userId,
            userEmail: req.user.email,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            metadata: { 
                action: 'file_upload',
                fileCount: req.files.length,
                totalSize: req.files.reduce((sum, file) => sum + file.size, 0)
            }
        }).save();

        res.json({
            success: true,
            message: 'Files uploaded successfully',
            data: { attachments }
        });

    } catch (error) {
        // Clean up files if upload failed
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }
        
        console.error('File upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload files',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Download Excel template
router.get('/template', auth, (req, res) => {
    try {
        const templateData = [{
            'KVK Name': '',
            'KVK Address': '',
            'KVK Telephone': '',
            'KVK Email': '',
            'KVK FAX': '',
            'Host Organization Name': '',
            'Host Organization Address': '',
            'Host Org Telephone': '',
            'Host Org Email': '',
            'Senior Scientist Name': '',
            'Senior Scientist Mobile': '',
            'Senior Scientist Email': '',
            'Year of Sanction': '',
            'Land Under Buildings (ha)': '',
            'Land Under Demo Units (ha)': '',
            'Land Under Crops (ha)': '',
            'Land Under Orchard (ha)': '',
            'Land Others (ha)': '',
            'Major Farming System': '',
            'Agro-climatic Zone': '',
            'Agro Ecological Situation': '',
            'Soil Type': '',
            'Crop Productivity': '',
            'Mean Temperature (°C)': '',
            'Mean Rainfall (mm)': '',
            'Mean Humidity (%)': '',
            'Livestock Production': '',
            'OFT Technologies Tested': '',
            'OFT Number Target': '',
            'OFT Number Achievement': '',
            'OFT Farmers Target': '',
            'FLD Technologies Demonstrated': '',
            'FLD Number Target': '',
            'FLD Number Achievement': '',
            'FLD Farmers Target': '',
            'Training Courses Target': '',
            'Training Courses Achievement': '',
            'Training Participants Target': '',
            'Training Participants Achievement': '',
            'Extension Activities Target': '',
            'Extension Activities Achievement': '',
            'Extension Participants Target': '',
            'Extension Participants Achievement': '',
            'Seed Production Target (q)': '',
            'Seed Production Achievement (q)': '',
            'Planting Material Target (Lakh)': '',
            'Planting Material Achievement (Lakh)': '',
            'Research Papers': '',
            'Bulletins': '',
            'Popular Articles': '',
            'Extension Pamphlets': '',
            'Technical Reports': '',
            'Books Published': '',
            'Dairy Demonstrations': '',
            'Poultry Demonstrations': '',
            'Goat Sheep Demonstrations': '',
            'Major Achievements': '',
            'Constraints Suggestions': '',
            'Report Prepared By': '',
            'Report Date': ''
        }];

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        
        // Set column widths
        const columnWidths = Object.keys(templateData[0]).map(() => ({ wch: 20 }));
        worksheet['!cols'] = columnWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'KVK Report Template');
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename=kvk_annual_report_template.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        console.error('Template download error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate template'
        });
    }
});

module.exports = { router };
