/**
 * Test script to verify API availability checking
 * 
 * Usage:
 * 1. Run the backend server: cd backend && npm run dev
 * 2. Run this script: node scripts/test-api-availability.js
 * 3. Stop the backend server and observe the behavior
 */

// Import required modules
import fetch from 'node-fetch';
import chalk from 'chalk';

// Test configuration
const API_URL = process.env.API_URL || 'http://localhost:3001';
const MAX_ATTEMPTS = 5;
const INITIAL_BACKOFF = 1000; // 1 second

// Helper to create logger with timestamp
const log = {
  info: (msg) => console.log(`${chalk.gray(new Date().toISOString())} ${chalk.blue('INFO')} ${msg}`),
  success: (msg) => console.log(`${chalk.gray(new Date().toISOString())} ${chalk.green('SUCCESS')} ${msg}`),
  error: (msg) => console.log(`${chalk.gray(new Date().toISOString())} ${chalk.red('ERROR')} ${msg}`),
  warn: (msg) => console.log(`${chalk.gray(new Date().toISOString())} ${chalk.yellow('WARN')} ${msg}`),
};

// Function to check API availability
async function isApiAvailable() {
  try {
    const healthUrl = `${API_URL}/health`;
    log.info(`Checking API availability at ${healthUrl}`);
    
    // Set timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-From-Frontend': 'track-it-frontend'
        },
        // Don't include credentials for health check
        credentials: 'omit',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        log.success(`API health check succeeded: ${JSON.stringify(data)}`);
        return true;
      }
      
      log.warn(`Health check failed with status: ${response.status}`);
      return false;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        log.error('API health check timed out after 5 seconds');
      } else {
        log.error(`API health check network error: ${fetchError.message}`);
      }
      
      return false;
    }
  } catch (error) {
    log.error(`API health check failed: ${error.message}`);
    return false;
  }
}

// Function to implement backoff strategy
async function checkWithBackoff() {
  let attempts = 0;
  let backoffTime = INITIAL_BACKOFF;
  
  log.info(`Starting API availability test with ${MAX_ATTEMPTS} max attempts`);
  
  while (attempts < MAX_ATTEMPTS) {
    attempts++;
    log.info(`Attempt ${attempts}/${MAX_ATTEMPTS}...`);
    
    const available = await isApiAvailable();
    
    if (available) {
      log.success(`API is available on attempt ${attempts}/${MAX_ATTEMPTS}`);
      return true;
    }
    
    // If we've reached max attempts, exit
    if (attempts >= MAX_ATTEMPTS) {
      log.error(`API not available after ${MAX_ATTEMPTS} attempts. Giving up.`);
      return false;
    }
    
    // Calculate backoff time with exponential backoff
    backoffTime = Math.min(backoffTime * 2, 30000); // Max 30s
    
    log.warn(`API not available. Waiting ${backoffTime/1000}s before next attempt...`);
    await new Promise(resolve => setTimeout(resolve, backoffTime));
  }
  
  return false;
}

// Main function
async function main() {
  log.info('=== API Availability Test Script ===');
  
  try {
    const result = await checkWithBackoff();
    
    if (result) {
      log.success('API is available! Test passed.');
    } else {
      log.error('API is not available. Test failed.');
      log.info('Tips:');
      log.info('1. Make sure the backend server is running: cd backend && npm run dev');
      log.info('2. Check if the API URL is correct: ' + API_URL);
      log.info('3. Check for any CORS issues in the server configuration');
    }
  } catch (error) {
    log.error(`Unexpected error in test: ${error.message}`);
  }
}

// Run the test
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});