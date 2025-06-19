// commands/control/bot.js
const logger = require('../../utils/logger');
const { botManager } = require('../../utils/botManager');
const config = require('../../config.json');

module.exports = {
  name: 'bot',
  aliases: ['b'],
  description: 'Manage multiple bots',
  usage: 'bot <create|list|switch|remove|status|all> [args...]',
  execute(bot, args) {
    if (!args[0]) {
      logger.warn('Usage: bot <create|list|switch|remove|status|all> [args...]');
      logger.info('Use "bot all <command> [args]" for mass commands');
      return;
    }

    const action = args[0].toLowerCase();

    switch (action) {
      case 'create':
        handleCreate(args.slice(1));
        break;
      case 'list':
        handleList();
        break;
      case 'switch':
      case 'select':
        handleSwitch(args[1]);
        break;
      case 'remove':
      case 'delete':
        handleRemove(args[1]);
        break;
      case 'status':
        handleStatus();
        break;
      case 'disconnect':
        handleDisconnect(args[1]);
        break;
      case 'all':
        handleMassCommand(args.slice(1));
        break;
      default:
        logger.warn(`Unknown bot action: ${action}`);
        logger.info('Available actions: create, list, switch, remove, status, disconnect, all');
    }
  },
};

function handleCreate(args) {
  if (!args[0]) {
    logger.warn('Usage: bot create <username> [host] [port]');
    return;
  }

  const username = args[0];
  const host = args[1] || config.host;
  const port = args[2] ? parseInt(args[2]) : config.port;

  // Check if bot already exists
  if (botManager.getBot(username)) {
    logger.warn(`Bot '${username}' already exists!`);
    return;
  }

  try {
    logger.info(`Creating bot '${username}'...`);
    const newBot = botManager.createBot(config, username, host, port);
    
    // Load commands and events for the new bot
    const { loadCommands } = require('../../handlers/commandHandler');
    const { loadEvents } = require('../../handlers/eventHandler');
    
    loadCommands(newBot);
    loadEvents(newBot);
    
    logger.success(`Bot '${username}' created → ${host}:${port}`);
  } catch (error) {
    logger.error(`Failed to create bot '${username}': ${error.message}`);
  }
}

function handleList() {
  const bots = botManager.getBotList();
  const activeBot = botManager.getActiveBotId();
  
  if (bots.length === 0) {
    logger.info('No bots currently running');
    return;
  }

  logger.separator();
  logger.status(`Active Bots (${bots.length})`);
  bots.forEach(botId => {
    const bot = botManager.getBot(botId);
    const isActive = botId === activeBot;
    const isConnected = !bot.ended;
    
    const statusIcon = isConnected ? '🟢' : '🔴';
    const activeFlag = isActive ? ' 👑' : '';
    const connection = `${bot.config.host}:${bot.config.port}`;
    
    console.log(`  ${statusIcon} ${botId}${activeFlag} → ${connection}`);
  });
  logger.separator();
}

function handleSwitch(botId) {
  if (!botId) {
    logger.warn('Usage: bot switch <username>');
    return;
  }

  if (botManager.setActiveBot(botId)) {
    logger.success(`Active bot → ${botId}`);
  } else {
    logger.warn(`Bot '${botId}' not found!`);
  }
}

function handleRemove(botId) {
  if (!botId) {
    logger.warn('Usage: bot remove <username>');
    return;
  }

  if (botId === 'all') {
    const count = botManager.getBotCount();
    botManager.disconnectAll();
    logger.success(`Removed all bots (${count})`);
    return;
  }

  if (botManager.removeBot(botId)) {
    logger.success(`Removed bot '${botId}'`);
  } else {
    logger.warn(`Bot '${botId}' not found!`);
  }
}

function handleStatus() {
  const status = botManager.getBotStatus();
  
  if (status.length === 0) {
    logger.info('No bots currently running');
    return;
  }

  logger.separator();
  logger.status(`Bot Status Report (${status.length} total)`);
  
  status.forEach(bot => {
    const activeFlag = bot.active ? ' [ACTIVE]' : '';
    const connFlag = bot.connected ? ' 🟢' : ' 🔴';
    const health = bot.health !== undefined ? ` ❤️${bot.health}` : '';
    const gamemode = bot.gamemode !== undefined ? ` 🎮${bot.gamemode}` : '';
    
    console.log(`  ${bot.id}${activeFlag}${connFlag} → ${bot.host}:${bot.port}${health}${gamemode}`);
  });
  logger.separator();
}

function handleDisconnect(botId) {
  if (!botId) {
    logger.warn('Usage: bot disconnect <username>');
    return;
  }

  if (botManager.disconnectBot(botId)) {
    logger.info(`Disconnected bot '${botId}'`);
  } else {
    logger.warn(`Bot '${botId}' not found!`);
  }
}

function handleMassCommand(args) {
  if (!args[0]) {
    logger.warn('Usage: bot all <command> [args...]');
    logger.info('Example: bot all say hello everyone!');
    return;
  }

  const allBots = botManager.getAllBots();
  const connectedBots = allBots.filter(bot => !bot.ended);
  
  if (connectedBots.length === 0) {
    logger.warn('No connected bots available for mass command');
    return;
  }

  const command = args[0];
  const commandArgs = args.slice(1);
  const botIds = connectedBots.map(bot => bot.botId);
  
  // Log the mass action
  const message = commandArgs.length > 0 ? commandArgs.join(' ') : '';
  logger.massAction(command.toUpperCase(), botIds, message);
  
  // Execute command on all connected bots
  let successCount = 0;
  let failCount = 0;
  
  connectedBots.forEach(bot => {
    try {
      const cmd = bot.commands.get(command) || bot.aliases.get(command);
      
      if (cmd) {
        cmd.execute(bot, commandArgs);
        successCount++;
      } else {
        logger.warn(`Command '${command}' not found for bot '${bot.botId}'`);
        failCount++;
      }
    } catch (error) {
      logger.error(`Error executing '${command}' on bot '${bot.botId}': ${error.message}`);
      failCount++;
    }
  });

  // Summary
  if (successCount > 0) {
    logger.success(`Mass command executed on ${successCount} bot(s)`);
  }
  if (failCount > 0) {
    logger.warn(`Failed on ${failCount} bot(s)`);
  }
}