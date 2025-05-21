/**
 * Test script for reproducing the email validation issue
 */
import { createValidationError } from '../src/utils/error-handler.js';
import { TRPCError } from '@trpc/server';

// Mock the logger for this test
global.logger = {
  info: console.log,
  warn: console.warn,
  error: console.error
};

// Simulate the registration flow's unique email check
async function testEmailValidation() {
  console.log('\n=== Testing Email Validation ===');
  
  try {
    // Simulate finding existing user with same email
    const existingUser = { id: 'user1', email: 'test@example.com' };
    
    if (existingUser) {
      console.log('Found existing user with email:', existingUser.email);
      
      // This is the key part - throws validation error with 'Email already exists'
      const appError = createValidationError('Email already exists', 'email');
      console.log('Created validation error:', appError);
      
      // In actual code, this would be handled by the safeProcedure function
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: appError.message,
        cause: appError
      });
    }
  } catch (error) {
    // Log the error as it would be returned to the client
    console.log('\nReturned error:');
    console.log('- Type:', error.constructor.name);
    console.log('- Code:', error.code);
    console.log('- Message:', error.message);
    console.log('- Cause:', error.cause ? JSON.stringify(error.cause, null, 2) : 'None');
  }
}

// Run the test
testEmailValidation();