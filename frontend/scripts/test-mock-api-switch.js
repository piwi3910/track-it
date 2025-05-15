/**
 * Test script to verify the mock API switching functionality
 * 
 * This script tests the ability to switch between real and mock API
 * when the backend is unavailable.
 * 
 * Usage:
 * 1. Run the frontend application: cd frontend && npm run dev
 * 2. Open the application in a browser
 * 3. Run this script: node scripts/test-mock-api-switch.js
 */

// Import required modules
import chalk from 'chalk';
import puppeteer from 'puppeteer';

// Test configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const TIMEOUT = 30000; // 30 seconds timeout

// Helper to create logger with timestamp
const log = {
  info: (msg) => console.log(`${chalk.gray(new Date().toISOString())} ${chalk.blue('INFO')} ${msg}`),
  success: (msg) => console.log(`${chalk.gray(new Date().toISOString())} ${chalk.green('SUCCESS')} ${msg}`),
  error: (msg) => console.log(`${chalk.gray(new Date().toISOString())} ${chalk.red('ERROR')} ${msg}`),
  warn: (msg) => console.log(`${chalk.gray(new Date().toISOString())} ${chalk.yellow('WARN')} ${msg}`),
};

/**
 * Test the API status badge is visible and working
 */
async function testApiStatusBadge(page) {
  try {
    log.info('Looking for API status badge...');
    
    // Wait for API status badge to be visible
    const badgeSelector = 'button[aria-label="API Status"]';
    await page.waitForSelector(badgeSelector, { timeout: TIMEOUT });
    
    log.success('API status badge found!');
    
    // Click on the badge to open the popover
    await page.click(badgeSelector);
    
    // Wait for the popover to open
    await page.waitForSelector('.mantine-Popover-dropdown');
    
    log.success('API status popover opened successfully');
    return true;
  } catch (error) {
    log.error(`Failed to test API status badge: ${error.message}`);
    return false;
  }
}

/**
 * Test switching to mock API when real API is unavailable
 */
async function testSwitchToMockApi(page) {
  try {
    log.info('Testing switch to mock API...');
    
    // Open the API status popover
    const badgeSelector = 'button[aria-label="API Status"]';
    await page.click(badgeSelector);
    
    // Wait for the popover to open
    await page.waitForSelector('.mantine-Popover-dropdown');
    
    // Check if we need to switch to mock API (if already using mock, switch to real first)
    const mockBadgeText = await page.$eval('.mantine-Badge-root', el => el.textContent);
    
    if (mockBadgeText.includes('Mock')) {
      log.info('Already using mock API, switching to real API first...');
      
      // Click the "Try Real API" button
      await page.click('text=Try Real API');
      await page.waitForTimeout(1000);
      
      // Re-open the popover
      await page.click(badgeSelector);
      await page.waitForSelector('.mantine-Popover-dropdown');
    }
    
    // Now check for the "Switch to Mock API" button
    const switchButton = await page.$('text=Switch to Mock API');
    
    if (!switchButton) {
      log.error('Switch to Mock API button not found');
      return false;
    }
    
    // Click the button
    log.info('Clicking "Switch to Mock API" button...');
    await switchButton.click();
    
    // Wait for the badge to change to "Mock"
    await page.waitForTimeout(1000);
    await page.click(badgeSelector);
    await page.waitForSelector('.mantine-Popover-dropdown');
    
    // Verify that we're now using the mock API
    const badgeText = await page.$eval('.mantine-Badge-root', el => el.textContent);
    
    if (badgeText.includes('Mock')) {
      log.success('Successfully switched to mock API!');
      return true;
    } else {
      log.error(`Failed to switch to mock API. Badge text: ${badgeText}`);
      return false;
    }
  } catch (error) {
    log.error(`Failed to test mock API switch: ${error.message}`);
    return false;
  }
}

/**
 * Test switching back to real API
 */
async function testSwitchToRealApi(page) {
  try {
    log.info('Testing switch back to real API...');
    
    // Open the API status popover
    const badgeSelector = 'button[aria-label="API Status"]';
    await page.click(badgeSelector);
    
    // Wait for the popover to open
    await page.waitForSelector('.mantine-Popover-dropdown');
    
    // Check if we're using mock API
    const badgeText = await page.$eval('.mantine-Badge-root', el => el.textContent);
    
    if (!badgeText.includes('Mock')) {
      log.info('Already using real API, switching to mock API first...');
      
      // Check for the "Switch to Mock API" button
      const mockButton = await page.$('text=Switch to Mock API');
      
      if (mockButton) {
        await mockButton.click();
        await page.waitForTimeout(1000);
        await page.click(badgeSelector);
        await page.waitForSelector('.mantine-Popover-dropdown');
      } else {
        log.error('Switch to Mock API button not found');
        return false;
      }
    }
    
    // Now click the "Try Real API" button
    const realApiButton = await page.$('text=Try Real API');
    
    if (!realApiButton) {
      log.error('Try Real API button not found');
      return false;
    }
    
    log.info('Clicking "Try Real API" button...');
    await realApiButton.click();
    
    // Wait for the badge to change (may or may not succeed depending on if backend is available)
    await page.waitForTimeout(2000);
    
    // Re-open the popover
    await page.click(badgeSelector);
    await page.waitForSelector('.mantine-Popover-dropdown');
    
    // If backend is not available, we'll see error messages
    const errorTexts = await page.$$eval('text=Connection attempts', els => els.length);
    
    if (errorTexts > 0) {
      log.warn('Backend appears to be offline - API check shows error indicators');
    }
    
    log.success('Successfully tested trying real API connection');
    return true;
  } catch (error) {
    log.error(`Failed to test real API switch: ${error.message}`);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  log.info('=== Mock API Switch Test ===');
  log.info(`Opening ${FRONTEND_URL}...`);
  
  const browser = await puppeteer.launch({ 
    headless: false, // To visually see the tests
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(TIMEOUT);
    
    // Navigate to the frontend
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
    log.success('Page loaded');
    
    // Run tests
    if (await testApiStatusBadge(page)) {
      log.success('✓ API status badge test passed');
    } else {
      log.error('✗ API status badge test failed');
    }
    
    if (await testSwitchToMockApi(page)) {
      log.success('✓ Switch to mock API test passed');
    } else {
      log.error('✗ Switch to mock API test failed');
    }
    
    if (await testSwitchToRealApi(page)) {
      log.success('✓ Switch to real API test passed');
    } else {
      log.error('✗ Switch to real API test failed');
    }
    
    log.info('All tests completed');
  } catch (error) {
    log.error(`Test failed with error: ${error.message}`);
  } finally {
    log.info('Closing browser...');
    await browser.close();
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});