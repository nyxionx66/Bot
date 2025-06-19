const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

function loadCommands(bot) {
  bot.commands = new Map();
  bot.aliases = new Map();

  const categories = ['utility', 'control'];
  let totalCommands = 0;
  let totalAliases = 0;

  for (const category of categories) {
    const commandDir = path.join(__dirname, '../commands', category);
    
    if (!fs.existsSync(commandDir)) {
      logger.warn(`Command directory '${category}' not found, skipping...`);
      continue;
    }

    const commandFiles = fs.readdirSync(commandDir).filter(file => file.endsWith('.js'));
    let categoryCommands = 0;

    for (const file of commandFiles) {
      try {
        const filePath = path.join(commandDir, file);
        
        // Clear require cache to allow reloading
        delete require.cache[require.resolve(filePath)];
        
        const command = require(filePath);
        
        // Validate command structure
        if (!command.name) {
          logger.warn(`Command in ${category}/${file} missing 'name' property, skipping...`);
          continue;
        }

        if (typeof command.execute !== 'function') {
          logger.warn(`Command '${command.name}' missing 'execute' function, skipping...`);
          continue;
        }

        // Check for duplicate command names
        if (bot.commands.has(command.name)) {
          logger.warn(`Duplicate command name '${command.name}' found in ${category}/${file}, overwriting...`);
        }

        bot.commands.set(command.name, command);
        categoryCommands++;
        totalCommands++;

        // Handle aliases
        if (command.aliases && Array.isArray(command.aliases)) {
          for (const alias of command.aliases) {
            if (bot.aliases.has(alias)) {
              logger.warn(`Duplicate alias '${alias}' for command '${command.name}', overwriting...`);
            }
            bot.aliases.set(alias, command);
            totalAliases++;
          }
        }

        logger.debug(`Loaded command: ${command.name} from ${category}/${file}`);
      } catch (error) {
        logger.error(`Failed to load command from ${category}/${file}: ${error.message}`);
      }
    }

    if (categoryCommands > 0) {
      logger.info(`Loaded ${categoryCommands} commands from '${category}' category`);
    }
  }

  logger.success(`Command loading complete: ${totalCommands} commands, ${totalAliases} aliases`);
}

function reloadCommands(bot) {
  logger.info('Reloading commands...');
  loadCommands(bot);
}

module.exports = { loadCommands, reloadCommands };