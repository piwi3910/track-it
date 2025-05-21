/**
 * Simple script to seed users for testing
 * This creates only the users needed for authentication testing
 */

const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seedUsers() {
  try {
    console.log('Starting user seeding...');
    
    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'demo@example.com' }
    });
    
    if (existingUser) {
      console.log('Demo user already exists, skipping creation');
      return;
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash('password123', 10);
    
    // Create demo user
    await prisma.user.create({
      data: {
        email: 'demo@example.com',
        name: 'Demo User',
        passwordHash,
        role: 'MEMBER',
        avatarUrl: 'https://i.pravatar.cc/150?u=demo',
        preferences: {
          theme: 'light',
          defaultView: 'dashboard'
        }
      }
    });
    
    console.log('Created demo user with email: demo@example.com');
    console.log('User seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();