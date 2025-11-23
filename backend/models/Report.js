const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    slNo: Number,
    position: String,
    name: String,
    designation: String,
    discipline: String,
    payScale: String,
    joiningDate: Date,
    status: {
        type: String,
        enum: ['Permanent', 'Temporary', 'Contract']
    },
    category: {
        type: String,
        enum: ['SC', 'ST', 'OBC', 'General']
    }
});

const infrastructureSchema = new mongoose.Schema({
    name: String,
    status: {
        type: String,
        enum: ['Not yet started', 'Completed up to plinth level', 'Completed up to lintel level', 'Completed up to roof level', 'Totally completed']
    },
    plinthArea: Number,
    underUse: {
        type: String,
        enum: ['Yes', 'No']
    },
    fundingSource: String
});

const vehicleSchema = new mongoose.Schema({
    type: String,
    yearOfPurchase: Number,
    cost: Number,
    totalKmRun: Number,
    status: {
        type: String,
        enum: ['Working', 'Under Repair', 'Out of Order', 'Disposed']
    }
});

const equipmentSchema = new mongoose.Schema({
    category: {
        type: String,
        enum: ['Lab Equipment', 'Farm Machinery', 'AV Aids', 'Others']
    },
    name: String,
    yearOfPurchase: Number,
    cost: Number,
    status: {
        type: String,
        enum: ['Working', 'Under Repair', 'Out of Order', 'Disposed']
    },
    fundingSource: String
});

const sacMeetingSchema = new mongoose.Schema({
    date: Date,
    participants: Number,
    recommendations: String,
    actionTaken: String
});

const operationalAreaSchema = new mongoose.Schema({
    taluk: String,
    block: String,
    villages: String,
    majorCrops: String,
    problems: String,
    thrustAreas: String
});

const villageAdoptionSchema = new mongoose.Schema({
    name: String,
    block: String,
    actionTaken: String
});

const oftDetailsSchema = new mongoose.Schema({
    title: String,
    problemDiagnosed: String,
    technologySelected: String,
    source: {
        type: String,
        enum: ['ICAR', 'AICRP', 'SAU', 'Other']
    },
    productionSystem: String,
    performanceIndicators: String
});

const oftPerformanceSchema = new mongoose.Schema({
    technologyOption: String,
    numberOfTrials: Number,
    yield: Number,
    costOfCultivation: Number,
    grossReturn: Number,
    netReturn: Number,
    bcRatio: Number
});

const demonstrationSchema = new mongoose.Schema({
    crop: String,
    technologyDemonstrated: String,
    area: Number,
    numberOfFarmers: Number,
    demoYield: Number,
    checkYield: Number,
    percentageIncrease: Number
});

const reportSchema = new mongoose.Schema({
    // General Information
    kvkName: {
        type: String,
        required: true,
        trim: true
    },
    kvkAddress: {
        type: String,
        required: true
    },
    kvkTelephone: String,
    kvkEmail: String,
    kvkFax: String,
    hostOrgName: {
        type: String,
        required: true
    },
    hostOrgAddress: String,
    hostOrgTelephone: String,
    hostOrgEmail: String,
    hostOrgFax: String,
    headName: {
        type: String,
        required: true
    },
    headMobile: String,
    headEmail: String,
    sanctionYear: Number,
    
    // Staff Position
    staff: [staffSchema],
    
    // Land Details
    landDetails: {
        buildings: Number,
        demoUnits: Number,
        crops: Number,
        orchard: Number,
        others: Number
    },
    
    // Infrastructure
    infrastructure: [infrastructureSchema],
    vehicles: [vehicleSchema],
    equipment: [equipmentSchema],
    
    // SAC Meeting
    sacMeetings: [sacMeetingSchema],
    sacNotConductedReason: String,
    
    // District Level Data
    majorFarmingSystem: String,
    agroClimaticZone: String,
    agroEcologicalSituation: String,
    soilType: String,
    cropProductivity: String,
    meanTemperature: Number,
    meanRainfall: Number,
    meanHumidity: Number,
    livestockProduction: String,
    
    // Operational Areas
    operationalAreas: [operationalAreaSchema],
    villageAdoption: [villageAdoptionSchema],
    thrustAreas: [String],
    
    // Technical Achievements
    technicalAchievements: {
        oft: {
            technologiesTested: Number,
            numberTarget: Number,
            numberAchievement: Number,
            farmersTarget: Number
        },
        fld: {
            technologiesDemonstrated: Number,
            numberTarget: Number,
            numberAchievement: Number,
            farmersTarget: Number
        },
        training: {
            coursesTarget: Number,
            coursesAchievement: Number,
            participantsTarget: Number,
            participantsAchievement: Number
        },
        extension: {
            activitiesTarget: Number,
            activitiesAchievement: Number,
            participantsTarget: Number,
            participantsAchievement: Number
        },
        production: {
            seedProductionTarget: Number,
            seedProductionAchievement: Number,
            plantingMaterialTarget: Number,
            plantingMaterialAchievement: Number
        }
    },
    
    // OFT Details
    oftDetails: [oftDetailsSchema],
    oftPerformance: [oftPerformanceSchema],
    
    // Publications
    publications: {
        researchPapers: Number,
        bulletins: Number,
        popularArticles: Number,
        extensionPamphlets: Number,
        technicalReports: Number,
        booksPublished: Number
    },
    
    // Demonstrations
    cerealsDemo: [demonstrationSchema],
    pulsesDemo: [demonstrationSchema],
    oilseedsDemo: [demonstrationSchema],
    
    // Livestock
    livestock: {
        dairyDemonstrations: Number,
        poultryDemonstrations: Number,
        goatSheepDemonstrations: Number
    },
    
    // Additional Information
    majorAchievements: String,
    constraintsSuggestions: String,
    reportPreparedBy: {
        type: String,
        required: true
    },
    reportDate: {
        type: Date,
        required: true
    },
    
    // Metadata
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'submitted', 'reviewed', 'approved'],
        default: 'draft'
    },
    reviewComments: String,
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: Date,
    
    // File attachments
    attachments: [{
        filename: String,
        originalName: String,
        path: String,
        mimetype: String,
        size: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Indexes for better query performance
reportSchema.index({ submittedBy: 1, createdAt: -1 });
reportSchema.index({ kvkName: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ 'reportDate': 1 });

// Virtual for calculating total land
reportSchema.virtual('totalLand').get(function() {
    const land = this.landDetails || {};
    return (land.buildings || 0) + (land.demoUnits || 0) + 
           (land.crops || 0) + (land.orchard || 0) + (land.others || 0);
});

// Pre-save middleware to calculate percentage increase in demonstrations
reportSchema.pre('save', function(next) {
    const calculatePercentage = (demos) => {
        demos.forEach(demo => {
            if (demo.demoYield && demo.checkYield && demo.checkYield > 0) {
                demo.percentageIncrease = ((demo.demoYield - demo.checkYield) / demo.checkYield) * 100;
            }
        });
    };
    
    calculatePercentage(this.cerealsDemo || []);
    calculatePercentage(this.pulsesDemo || []);
    calculatePercentage(this.oilseedsDemo || []);
    
    next();
});

module.exports = mongoose.model('Report', reportSchema);