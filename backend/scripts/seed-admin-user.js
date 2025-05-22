/**
 * Script to seed admin user for pascal.watteel@azrty.com
 * Can be run safely multiple times (idempotent)
 */

const { PrismaClient, UserRole } = require('../src/generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seedAdminUser() {
  const email = 'pascal.watteel@azrty.com';
  const password = 'Jbz49teq01!';
  const name = 'Pascal Watteel';
  
  try {
    console.log(`🔍 Checking if user ${email} already exists...`);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    if (existingUser) {
      console.log(`✅ User ${email} already exists`);
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Created: ${existingUser.createdAt}`);
      
      // Check if user is already admin
      if (existingUser.role === UserRole.ADMIN) {
        console.log(`✅ User already has ADMIN role - no action needed`);
        return existingUser;
      } else {
        console.log(`⚠️  User exists but role is ${existingUser.role}, updating to ADMIN...`);
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: UserRole.ADMIN },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            updatedAt: true
          }
        });
        console.log(`✅ User role updated to ADMIN`);
        return updatedUser;
      }
    }

    console.log(`📝 Creating new admin user: ${email}`);
    
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create the admin user
    const adminUser = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: UserRole.ADMIN,
        avatarUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
        preferences: {
          theme: 'light',
          defaultView: 'dashboard'
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    console.log(`✅ Admin user created successfully!`);
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Created: ${adminUser.createdAt}`);
    
    return adminUser;
    
  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    
    // Handle specific error cases
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      console.error('   Email already exists in database');
    } else {
      console.error('   Unexpected error:', error);
    }
    
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting admin user seeding...');
  console.log('=====================================');
  
  try {
    await seedAdminUser();
    console.log('=====================================');
    console.log('✅ Admin user seeding completed successfully!');
  } catch (error) {
    console.log('=====================================');
    console.error('❌ Admin user seeding failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = { seedAdminUser };