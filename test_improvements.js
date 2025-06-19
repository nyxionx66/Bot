// Test script for the Mindle Bot improvements
const logger = require('./utils/logger');
const config = require('./config.json');

console.log('=== MINDLE BOT IMPROVEMENT TEST ===\n');

// Test 1: Check if emojis are removed from logger
console.log('Test 1: Logger Formatting (No Emojis)');
logger.info('This is an info message');
logger.success('This is a success message');
logger.warn('This is a warning message');
logger.error('This is an error message');
logger.status('This is a status message');
console.log('');

// Test 2: Check config loading
console.log('Test 2: Configuration Loading');
console.log('Config loaded:', !!config);
console.log('printChat setting:', config.printChat);
console.log('');

// Test 3: Check chat toggle functionality
console.log('Test 3: Chat Toggle Functionality');
logger.setChatEnabled(true);
logger.chat('This chat message should appear');

logger.setChatEnabled(false);
logger.chat('This chat message should NOT appear');

logger.setChatEnabled(true);
logger.chat('This chat message should appear again');
console.log('');

// Test 4: Check formal separator
console.log('Test 4: Formal Separator');
logger.separator();
console.log('');

// Test 5: Mass action logging
console.log('Test 5: Mass Action Logging (No Emojis)');
logger.massAction('SAY', ['bot1', 'bot2', 'bot3'], 'Hello World');
console.log('');

console.log('=== ALL TESTS COMPLETED ===');
