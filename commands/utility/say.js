const logger = require('../../utils/logger');

module.exports = {
  name: 'say',
  aliases: ['s', 'chat'],
  description: 'Bot sends a chat message.',
  usage: 'say <message>',
  execute(bot, args) {
    const msg = args.join(' ');
    if (msg) {
      bot.chat(msg);
      logger.botAction(bot.botId, 'say', msg);
    } else {
      logger.warn('Usage: say <message>');
      logger.info('Example: say Hello everyone!');
    }
  },
};