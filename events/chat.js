const config = require('../config.json');
const logger = require('../utils/logger');

module.exports = {
  name: 'chat',
  execute(bot, username, message) {
    if (username === bot.username || !config.printChat) return;
    logger.chat(`${username}: ${message}`);
  },
};