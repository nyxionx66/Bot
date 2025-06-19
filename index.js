const { botManager } = require('./utils/botManager');
const { loadCommands, reloadCommands } = require('./handlers/commandHandler');
const { loadEvents, reloadEvents } = require('./handlers/eventHandler');
const logger = require('./utils/logger');
const config = require('./config.json');
const readline = require('readline');

// Create and initialize main bot
logger.info('🤖 Starting Mindle multi-bot system...');
const mainBot = botManager.createBot(config);

// Load commands and events for main bot
loadCommands(mainBot);
loadEvents(mainBot);

// Setup command line interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
});

// Show initial prompt with instructions
logger.separator();
logger.success('Multi-bot system ready!');
logger.info('Commands: exit, reload, list, bots, help');
logger.info('Bot management: bot create <name>, bot all <command>');
logger.separator();

// Update prompt to show current bot status
function updatePrompt() {
  const activeBot = botManager.getActiveBotId();
  const botCount = botManager.getBotCount();
  const connectedCount = botManager.getAllBots().filter(bot => !bot.ended).length;
  
  if (activeBot) {
    rl.setPrompt(`[${activeBot}] (${connectedCount}/${botCount}) > `);
  } else {
    rl.setPrompt(`[no-bot] (0/0) > `);
  }
}

// Initial prompt update
updatePrompt();
rl.prompt();

// Handle command line input
rl.on('line', (input) => {
  const trimmedInput = input.trim();
  
  if (!trimmedInput) {
    rl.prompt();
    return;
  }

  // Handle special built-in commands
  if (trimmedInput === 'exit' || trimmedInput === 'quit') {
    logger.info('🛑 Shutting down all bots...');
    botManager.disconnectAll();
    process.exit(0);
  }

  if (trimmedInput === 'reload') {
    try {
      const allBots = botManager.getAllBots();
      allBots.forEach(bot => {
        reloadCommands(bot);
      });
      logger.success(`🔄 Commands reloaded for ${allBots.length} bot(s)!`);
    } catch (error) {
      logger.error(`Failed to reload commands: ${error.message}`);
    }
    updatePrompt();
    rl.prompt();
    return;
  }

  if (trimmedInput === 'list' || trimmedInput === 'commands') {
    const activeBot = botManager.getActiveBot();
    if (activeBot) {
      const commands = Array.from(activeBot.commands.keys());
      logger.info(`📋 Available commands (${commands.length}): ${commands.join(', ')}`);
      logger.info(`👑 Active bot: ${botManager.getActiveBotId()}`);
    } else {
      logger.warn('No active bot available');
    }
    updatePrompt();
    rl.prompt();
    return;
  }

  if (trimmedInput === 'bots') {
    const bots = botManager.getBotList();
    const activeBot = botManager.getActiveBotId();
    
    if (bots.length === 0) {
      logger.info('No bots currently running');
    } else {
      logger.separator();
      logger.status(`Active Bots (${bots.length})`);
      bots.forEach(botId => {
        const bot = botManager.getBot(botId);
        const isActive = botId === activeBot;
        const isConnected = !bot.ended;
        const statusIcon = isConnected ? '🟢' : '🔴';
        const activeFlag = isActive ? ' 👑' : '';
        
        console.log(`  ${statusIcon} ${botId}${activeFlag}`);
      });
      logger.separator();
    }
    updatePrompt();
    rl.prompt();
    return;
  }

  if (trimmedInput === 'help') {
    logger.separator();
    logger.info('📖 Mindle Bot System Help');
    console.log('  System Commands:');
    console.log('    exit/quit     - Shutdown all bots');
    console.log('    reload        - Reload all commands');
    console.log('    list          - Show available commands');
    console.log('    bots          - Show bot status');
    console.log('    help          - Show this help');
    console.log('');
    console.log('  Bot Management:');
    console.log('    bot create <name> [host] [port] - Create new bot');
    console.log('    bot list                        - List all bots');
    console.log('    bot switch <name>               - Switch active bot');
    console.log('    bot remove <name>               - Remove bot');
    console.log('    bot all <command>               - Run command on all bots');
    console.log('');
    console.log('  Examples:');
    console.log('    bot create mybot');
    console.log('    bot all say Hello everyone!');
    console.log('    say Hello from current bot');
    logger.separator();
    updatePrompt();
    rl.prompt();
    return;
  }

  // Parse and execute regular commands
  const [cmd, ...args] = trimmedInput.split(' ');
  
  // Get the active bot
  const activeBot = botManager.getActiveBot();
  
  if (!activeBot) {
    logger.warn('❌ No active bot available. Create a bot first with "bot create <username>"');
    updatePrompt();
    rl.prompt();
    return;
  }

  const command = activeBot.commands.get(cmd) || activeBot.aliases.get(cmd);
  
  if (command) {
    try {
      const botId = botManager.getActiveBotId();
      logger.command(botId, cmd, args);
      command.execute(activeBot, args);
    } catch (error) {
      logger.error(`Error executing command '${cmd}': ${error.message}`);
    }
  } else {
    logger.warn(`❓ Unknown command: ${cmd}. Type "help" for available commands.`);
  }

  updatePrompt();
  rl.prompt();
});

// Update prompt periodically
setInterval(() => {
  updatePrompt();
}, 3000);

// Handle process termination gracefully
process.on('SIGINT', () => {
  logger.info('\n🛑 Received SIGINT, shutting down all bots gracefully...');
  botManager.disconnectAll();
  rl.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🛑 Received SIGTERM, shutting down all bots gracefully...');
  botManager.disconnectAll();
  rl.close();
  process.exit(0);
});

// Handle unexpected errors
process.on('uncaughtException', (error) => {
  logger.error(`💥 Uncaught exception: ${error.message}`);
  logger.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`🚨 Unhandled rejection at: ${promise}, reason: ${reason}`);
});