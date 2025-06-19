const logger = require('../../utils/logger');

module.exports = {
  name: 'help',
  aliases: ['h'],
  description: 'Lists all available commands.',
  execute(bot, args) {
    if (args.length > 0) {
      // Show detailed help for specific command
      const commandName = args[0].toLowerCase();
      const command = bot.commands.get(commandName);
      
      if (command) {
        logger.info(`Command: ${command.name}`);
        if (command.aliases && command.aliases.length > 0) {
          logger.info(`Aliases: ${command.aliases.join(', ')}`);
        }
        logger.info(`Description: ${command.description || 'No description available.'}`);
        if (command.usage) {
          logger.info(`Usage: ${command.usage}`);
        }
      } else {
        logger.warn(`Command '${commandName}' not found.`);
      }
    } else {
      // Show all commands
      const commands = Array.from(bot.commands.values());
      logger.info(`Available Commands (${commands.length}):`);
      
      commands.forEach(command => {
        const aliases = command.aliases && command.aliases.length > 0 
          ? ` (${command.aliases.join(', ')})` 
          : '';
        const description = command.description || 'No description.';
        console.log(`  ${command.name}${aliases} - ${description}`);
      });
      
      logger.info('Use "help <command>" for detailed information.');
    }
  }
};