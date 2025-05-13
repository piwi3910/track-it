import { getRedisClient } from '../src/cache/redis';
import { CacheService } from '../src/cache';
import { getCacheMetrics, flushCache } from '../src/cache/cache-metrics';

/**
 * Simple test script to verify Redis cache functionality
 */
async function testCache() {
  try {
    console.log('Testing Redis cache...');
    
    // Get client
    const redis = getRedisClient();
    
    // Test connection
    console.log('Testing connection...');
    await redis.ping();
    console.log('✅ Connection successful');
    
    // Clean start
    console.log('Flushing cache...');
    await flushCache();
    console.log('✅ Cache flushed');
    
    // Test basic set/get
    console.log('\nTesting basic set/get operations...');
    const testKey = 'test:key:1';
    const testData = { id: 1, name: 'Test Item', tags: ['test', 'sample'] };
    
    console.log('Setting data...');
    await CacheService.set(testKey, testData, 60);
    
    console.log('Getting data...');
    const retrievedData = await CacheService.get(testKey);
    
    if (JSON.stringify(retrievedData) === JSON.stringify(testData)) {
      console.log('✅ Data retrieved correctly');
    } else {
      console.log('❌ Data mismatch:');
      console.log('Original:', testData);
      console.log('Retrieved:', retrievedData);
    }
    
    // Test exists
    console.log('\nTesting exists method...');
    const exists = await CacheService.exists(testKey);
    console.log(`Key exists: ${exists ? '✅ Yes' : '❌ No'}`);
    
    // Test pattern deletion
    console.log('\nTesting pattern deletion...');
    
    // Create multiple keys
    await CacheService.set('test:users:1', { id: 1, name: 'User 1' });
    await CacheService.set('test:users:2', { id: 2, name: 'User 2' });
    await CacheService.set('test:tasks:1', { id: 1, title: 'Task 1' });
    
    // Delete by pattern
    console.log('Deleting all user keys...');
    await CacheService.deleteByPattern('test:users:*');
    
    // Check results
    const userKey = await CacheService.exists('test:users:1');
    const taskKey = await CacheService.exists('test:tasks:1');
    
    console.log(`User key exists: ${userKey ? '❌ Still exists' : '✅ Deleted'}`);
    console.log(`Task key exists: ${taskKey ? '✅ Still exists' : '❌ Deleted'}`);
    
    // Get metrics
    console.log('\nRetrieving cache metrics...');
    const metrics = await getCacheMetrics();
    console.log('Cache metrics:');
    console.log(`- Total keys: ${metrics.totalKeys}`);
    console.log(`- Memory used: ${metrics.memoryUsage.used}`);
    console.log('- Keys by prefix:');
    Object.entries(metrics.keysByPrefix).forEach(([prefix, count]) => {
      console.log(`  - ${prefix}: ${count}`);
    });
    
    // Clean up
    console.log('\nCleaning up...');
    await flushCache();
    console.log('✅ Cache flushed');
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // Disconnect
    console.log('\nDisconnecting...');
    setTimeout(async () => {
      try {
        await getRedisClient().quit();
        console.log('✅ Disconnected from Redis');
        process.exit(0);
      } catch (err) {
        console.error('Error disconnecting:', err);
        process.exit(1);
      }
    }, 500);
  }
}

// Run the test
testCache();