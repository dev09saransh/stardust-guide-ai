const { hashData } = require('../src/utils/hash');
const User = require('../src/models/userModel');
const db = require('../src/config/db');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        console.log('🚀 Starting Admin Seeding...');

        // Data for the first admin
        const adminData = {
            full_name: 'Basit Perwaiz',
            email: 'admin@stardust.com',
            mobile: '9876543210', // Placeholder, update as needed
            password_hash: await hashData('Admin@123'),
            role: 'ADMIN'
        };

        const userId = await User.create(adminData);
        console.log(`✅ Admin created successfully with ID: ${userId}`);
        console.log(`📧 Email: ${adminData.email}`);
        console.log(`🔑 Password: Admin@123`);

        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.log('ℹ️ Admin already exists in the database.');
        } else {
            console.error('❌ Error seeding admin:', error);
        }
        process.exit(1);
    }
};

seedAdmin();
