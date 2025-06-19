const logger = require('../utils/logger');

module.exports = {
  name: 'spawn',
  execute(bot) {
    logger.success('Bot spawned in the world.');
  },
};