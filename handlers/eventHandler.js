const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');


function loadEvents(bot) {
  const eventsDir = path.join(__dirname, '../events');
  
  if (!fs.existsSync(eventsDir)) {
    logger.warn('Events directory not found, skipping event loading...');
    return;
  }

  const eventFiles = fs.readdirSync(eventsDir).filter(file => file.endsWith('.js'));
  let totalEvents = 0;

  for (const file of eventFiles) {
    try {
      const filePath = path.join(eventsDir, file);
      
      // Clear require cache to allow reloading
      delete require.cache[require.resolve(filePath)];
      
      const event = require(filePath);
      
      // Validate event structure
      if (!event.name) {
        logger.warn(`Event in ${file} missing 'name' property, skipping...`);
        continue;
      }

      if (typeof event.execute !== 'function') {
        logger.warn(`Event '${event.name}' missing 'execute' function, skipping...`);
        continue;
      }

      // Register event listener
      bot.on(event.name, (...args) => {
        try {
          event.execute(bot, ...args);
        } catch (error) {
          logger.error(`Error executing event '${event.name}': ${error.message}`);
        }
      });

      totalEvents++;
      logger.debug(`Registered event: ${event.name} from ${file}`);
    } catch (error) {
      logger.error(`Failed to load event from ${file}: ${error.message}`);
    }
  }

  logger.success(`Event loading complete: ${totalEvents} events registered`);
}

function reloadEvents(bot) {
  logger.info('Reloading events...');
  
  // Remove all existing listeners (be careful with this in production)
  bot.removeAllListeners();
  
  // Reload events
  loadEvents(bot);
}

module.exports = { loadEvents, reloadEvents };