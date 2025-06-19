const config = require('../config.json');
const logger = require('../utils/logger');

module.exports = {
  name: 'chat',
  execute(bot, username, message) {
    if (username === bot.username) return;
    
    try {
      if (config.printChat) {
        logger.chat(`${username}: ${message}`);
      }
    } catch (error) {
      // If config fails to load, default to not printing chat
    }
  },
};