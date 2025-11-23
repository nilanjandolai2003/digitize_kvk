const mongoose = require('mongoose');
const User = require('../models/User');
const Report = require('../models/Report');
require('dotenv').config();

async function seedData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kvk_reports');
        console.log('Connected to MongoDB');

       const adminExists = await User.findOne({ username: 'admin' });
        if (adminExists) {
            console.log('Admin user already exists. Skipping seed.');
            process.exit(0);
        }

        // Create admin user
        const adminUser = new User({
            username: 'admin',
            email: 'admin@kvk.com',
            password: 'admin123',
            role: 'admin',
            kvkName: 'System Admin'
        });
        await adminUser.save();
        console.log('Created admin user');

        // Create sample KVK users
        const kvkUsers = [
            {
                username: 'kvk_bangalore',
                email: 'kvk.bangalore@example.com',
                password: 'kvk123',
                role: 'kvk_head',
                kvkName: 'KVK Bangalore'
            },
            {
                username: 'kvk_mysore',
                email: 'kvk.mysore@example.com',
                password: 'kvk123',
                role: 'user',
                kvkName: 'KVK Mysore'
            }
        ];

        const createdUsers = [];
        for (const userData of kvkUsers) {
            const user = new User(userData);
            await user.save();
            createdUsers.push(user);
            console.log(`Created user: ${user.username}`);
        }

        // Create sample report
        const sampleReport = new Report({
            kvkName: 'KVK Bangalore',
            kvkAddress: 'GKVK Campus, Bangalore - 560065',
            kvkTelephone: '080-23330277',
            kvkEmail: 'kvkbangalore@gmail.com',
            hostOrgName: 'University of Agricultural Sciences',
            hostOrgAddress: 'GKVK, Bangalore',
            headName: 'Dr. Sample Scientist',
            headMobile: '9876543210',
            headEmail: 'head@kvkbangalore.com',
            sanctionYear: 2010,
            
            landDetails: {
                buildings: 2.5,
                demoUnits: 5.0,
                crops: 15.5,
                orchard: 3.2,
                others: 1.8
            },
            
            majorFarmingSystem: 'Mixed farming with emphasis on cereals and horticulture',
            agroClimaticZone: 'Eastern Dry Zone',
            soilType: 'Red sandy loam',
            meanTemperature: 24.5,
            meanRainfall: 890,
            meanHumidity: 65,
            
            technicalAchievements: {
                oft: {
                    technologiesTested: 12,
                    numberTarget: 50,
                    numberAchievement: 48,
                    farmersTarget: 150
                },
                fld: {
                    technologiesDemonstrated: 8,
                    numberTarget: 100,
                    numberAchievement: 95,
                    farmersTarget: 300
                },
                training: {
                    coursesTarget: 25,
                    coursesAchievement: 24,
                    participantsTarget: 500,
                    participantsAchievement: 485
                },
                extension: {
                    activitiesTarget: 50,
                    activitiesAchievement: 52,
                    participantsTarget: 1000,
                    participantsAchievement: 1050
                }
            },
            
            publications: {
                researchPapers: 5,
                bulletins: 3,
                popularArticles: 12,
                extensionPamphlets: 8,
                technicalReports: 2,
                booksPublished: 1
            },
            
            majorAchievements: 'Successful demonstration of drought-resistant varieties, establishment of farmer producer organization.',
            constraintsSuggestions: 'Need for more technical staff, better connectivity to remote villages.',
            reportPreparedBy: 'Dr. Sample Scientist',
            reportDate: new Date(),
            submittedBy: createdUsers[0]._id,
            status: 'submitted'
        });

        await sampleReport.save();
        console.log('Created sample report');

        console.log('\n--- Seed Data Summary ---');
        console.log('Admin User: admin / admin123');
        console.log('KVK Users: kvk_bangalore, kvk_mysore / kvk123');
        console.log('Sample report created for KVK Bangalore');
        console.log('Seeding completed successfully!');

        process.exit(0);

    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    seedData();
}

module.exports = seedData;
