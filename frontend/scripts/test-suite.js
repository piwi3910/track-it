#!/usr/bin/env node

/**
 * Main test runner script for frontend-backend integration tests
 * This script will execute all test flows in sequence
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import fetch from 'cross-fetch';

// ANSI color codes for prettier output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Test configuration
const testConfig = {
  // Base names of test scripts (without the .js extension)
  tests: [
    'test-live-login',
    'test-live-registration',
    'test-live-tasks',
    'test-live-user-profile',
    'test-live-comments'
  ],
  // Backend URL for health check
  backendUrl: 'http://localhost:3001',
  // Timeout in milliseconds for backend health check
  healthCheckTimeout: 5000,
  // Directory containing test scripts
  scriptDir: path.resolve(__dirname),
  // Whether to continue tests after a failure
  continueOnFailure: false
};

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};

/**
 * Check if the backend server is running
 * @returns {Promise<boolean>} True if the backend server is running
 */
async function isBackendRunning() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), testConfig.healthCheckTimeout);
    
    const response = await fetch(testConfig.backendUrl, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Run a single test script
 * @param {string} testName The base name of the test script
 * @returns {boolean} True if the test passed
 */
function runTest(testName) {
  const scriptPath = path.join(testConfig.scriptDir, `${testName}.js`);
  
  // Check if test file exists
  if (!fs.existsSync(scriptPath)) {
    console.error(`${colors.yellow}WARNING: Test script ${scriptPath} does not exist. Skipping.${colors.reset}`);
    testResults.skipped++;
    testResults.details.push({
      name: testName,
      status: 'skipped',
      reason: 'Script not found'
    });
    return false;
  }
  
  console.log(`\n${colors.cyan}${colors.bright}===== Running Test: ${testName} =====${colors.reset}\n`);
  
  try {
    // Run the test script
    execSync(`node ${scriptPath}`, { stdio: 'inherit' });
    
    console.log(`\n${colors.green}✓ Test ${testName} passed${colors.reset}\n`);
    testResults.passed++;
    testResults.details.push({
      name: testName,
      status: 'passed'
    });
    return true;
  } catch (error) {
    console.error(`\n${colors.red}✗ Test ${testName} failed${colors.reset}`);
    console.error(`${colors.red}Error: ${error.message}${colors.reset}\n`);
    testResults.failed++;
    testResults.details.push({
      name: testName,
      status: 'failed',
      error: error.message
    });
    return false;
  }
}

/**
 * Print test summary at the end
 */
function printSummary() {
  console.log(`\n${colors.cyan}${colors.bright}===== Test Summary =====${colors.reset}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.yellow}Skipped: ${testResults.skipped}${colors.reset}`);
  
  console.log(`\n${colors.cyan}${colors.bright}===== Test Details =====${colors.reset}`);
  testResults.details.forEach(test => {
    const statusColor = 
      test.status === 'passed' ? colors.green :
      test.status === 'failed' ? colors.red :
      colors.yellow;
    
    console.log(`${statusColor}${test.name}: ${test.status}${colors.reset}`);
    if (test.reason) {
      console.log(`  ${colors.dim}Reason: ${test.reason}${colors.reset}`);
    }
    if (test.error) {
      console.log(`  ${colors.dim}Error: ${test.error}${colors.reset}`);
    }
  });
}

/**
 * Main function to run all tests
 */
async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}===== Frontend-Backend Integration Test Suite =====${colors.reset}\n`);
  
  // Check if backend is running
  console.log('Checking if backend server is running...');
  const backendRunning = await isBackendRunning();
  
  if (!backendRunning) {
    console.error(`${colors.red}ERROR: Backend server is not running at ${testConfig.backendUrl}${colors.reset}`);
    console.error(`${colors.red}Please start the backend server and try again.${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.green}Backend server is running. Starting tests...${colors.reset}\n`);
  
  // Filter tests to only include those that exist
  const availableTests = testConfig.tests.filter(test => {
    const exists = fs.existsSync(path.join(testConfig.scriptDir, `${test}.js`));
    if (!exists) {
      console.warn(`${colors.yellow}WARNING: Test script ${test}.js not found${colors.reset}`);
    }
    return exists;
  });
  
  // Run all tests
  for (const test of availableTests) {
    const passed = runTest(test);
    
    // Stop if a test fails and continueOnFailure is false
    if (!passed && !testConfig.continueOnFailure) {
      console.error(`${colors.red}Test ${test} failed. Stopping test suite.${colors.reset}`);
      break;
    }
  }
  
  // Print summary
  printSummary();
  
  // Exit with appropriate code
  if (testResults.failed > 0) {
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error(`${colors.red}Error running tests: ${error.message}${colors.reset}`);
  process.exit(1);
});