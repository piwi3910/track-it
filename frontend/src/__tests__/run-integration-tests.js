#!/usr/bin/env node

/**
 * Integration Test Runner Script
 * 
 * This script checks if the backend server is running before running integration tests.
 * If the backend is not running, it provides clear instructions.
 */

import { execSync } from 'child_process';
import fetch from 'cross-fetch';

// Configuration
const BACKEND_URL = 'http://localhost:3001';
const TEST_PATTERNS = {
  auth: '**/auth.test.ts',
  tasks: '**/tasks.test.ts',
  comments: '**/comments.test.ts',
  templates: '**/templates.test.ts',
  workflows: '**/workflows/*.test.ts',
  all: '**/*.test.ts'
};

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

// Check if the backend server is running
async function isBackendRunning() {
  try {
    const response = await fetch(BACKEND_URL);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Run integration tests
async function runTests() {
  console.log(`${colors.cyan}${colors.bright}===== Track-It Integration Test Runner =====${colors.reset}\n`);
  
  // Check if backend is running
  console.log(`${colors.cyan}Checking if backend server is running...${colors.reset}`);
  const backendRunning = await isBackendRunning();
  
  if (!backendRunning) {
    console.error(`${colors.red}${colors.bright}ERROR: Backend server is not running at ${BACKEND_URL}${colors.reset}`);
    console.error(`${colors.yellow}Please start the backend server with:${colors.reset}`);
    console.error(`${colors.green}  cd ../backend && npm run dev${colors.reset}`);
    console.error(`${colors.yellow}Then run this script again.${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.green}Backend server is running. Proceeding with tests...${colors.reset}\n`);
  
  // Get test suite to run
  const testSuite = process.argv[2] || 'all';
  if (!TEST_PATTERNS[testSuite]) {
    console.error(`${colors.red}Unknown test suite: ${testSuite}${colors.reset}`);
    console.error(`${colors.yellow}Available suites: ${Object.keys(TEST_PATTERNS).join(', ')}${colors.reset}`);
    process.exit(1);
  }
  
  const testPattern = TEST_PATTERNS[testSuite];
  console.log(`${colors.cyan}${colors.bright}Running test suite: ${testSuite} (${testPattern})${colors.reset}\n`);
  
  // Run tests
  try {
    execSync(
      `NODE_OPTIONS=--experimental-vm-modules npx jest --testMatch="**/__tests__/integration/${testPattern}" --runInBand`,
      { stdio: 'inherit' }
    );
    
    console.log(`\n${colors.green}${colors.bright}✓ All tests passed!${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}✗ Tests failed with exit code: ${error.status}${colors.reset}`);
    process.exit(error.status);
  }
}

// Print usage information
function printUsage() {
  console.log(`${colors.cyan}${colors.bright}Track-It Integration Test Runner${colors.reset}`);
  console.log(`${colors.cyan}Usage: node ${process.argv[1].split('/').pop()} [suite]${colors.reset}`);
  console.log();
  console.log(`${colors.cyan}Available test suites:${colors.reset}`);
  console.log(`  ${colors.green}auth${colors.reset}      - Authentication API tests`);
  console.log(`  ${colors.green}tasks${colors.reset}     - Task Management API tests`);
  console.log(`  ${colors.green}comments${colors.reset}  - Comment Management API tests`);
  console.log(`  ${colors.green}templates${colors.reset} - Template Management API tests`);
  console.log(`  ${colors.green}workflows${colors.reset} - End-to-end workflow tests`);
  console.log(`  ${colors.green}all${colors.reset}       - All integration tests (default)`);
  console.log();
  console.log(`${colors.cyan}Examples:${colors.reset}`);
  console.log(`  ${colors.green}node run-integration-tests.js auth${colors.reset}      # Run only auth tests`);
  console.log(`  ${colors.green}node run-integration-tests.js workflows${colors.reset} # Run only workflow tests`);
  console.log(`  ${colors.green}node run-integration-tests.js${colors.reset}           # Run all tests`);
}

// Check if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printUsage();
  process.exit(0);
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Error running tests: ${error.message}${colors.reset}`);
  process.exit(1);
});