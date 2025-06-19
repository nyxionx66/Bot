// Enhanced botManager.js with multi-bot support and cleaner logging
const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const logger = require('./logger');

class BotManager {
  constructor() {
    this.bots = new Map();
    this.activeBotId = null;
  }

  createBot(config, customUsername = null, customHost = null, customPort = null) {
    const botConfig = {
      host: customHost || config.host,
      port: customPort || config.port,
      username: customUsername || config.username,
      auth: config.auth,
      version: config.version
    };

    const bot = mineflayer.createBot(botConfig);
    const botId = botConfig.username;

    // Store bot reference
    this.bots.set(botId, bot);
    
    // Set as active bot if it's the first one
    if (!this.activeBotId) {
      this.activeBotId = botId;
    }

    // Add bot identification
    bot.botId = botId;
    bot.config = botConfig;

    // Load pathfinder plugin
    bot.loadPlugin(pathfinder);

    // Connection event handlers
    bot.once('spawn', () => {
      const mcData = require('minecraft-data')(bot.version);
      bot.pathfinder.setMovements(new Movements(bot, mcData));
      logger.success(`Bot '${botId}' spawned successfully`);
    });

    bot.on('login', () => {
      logger.info(`Bot '${botId}' connected to ${botConfig.host}:${botConfig.port}`);
    });

    bot.on('end', (reason) => {
      const cleanReason = reason || 'Unknown';
      logger.warn(`Bot '${botId}' disconnected: ${cleanReason}`);
      this.removeBot(botId);
    });

    bot.on('error', (err) => {
      // Filter out common non-critical errors
      if (err.message.includes('client timed out') || 
          err.message.includes('socketClosed') ||
          err.message.includes('keepAliveError')) {
        logger.warn(`Bot '${botId}' connection issue: ${err.message}`);
      } else {
        logger.error(`Bot '${botId}' error: ${err.message}`);
      }
    });

    // Enhanced packet handling with cleaner output
    bot._client.on('packet', (data, meta) => {
      if (meta.name === 'system_chat' || meta.name === 'game_message') {
        const raw = data.content;

        // Debug logging (only if enabled)
        if (config.debug) {
          logger.debug(`[${botId}] ${meta.name}:`, data);
        }

        try {
          const parsed = JSON.parse(raw);
          const fullText = parsed.extra?.map(e => e.text).join('') || parsed.text || '';

          // Auto-captcha detection and resolution
          const captchaMatch = fullText.match(/\/captcha\s+(\w+)/i);
          if (captchaMatch) {
            const code = captchaMatch[1];
            logger.botAction(botId, 'captcha', code);
            bot.chat(`/captcha ${code}`);
            return;
          }

          // Filter out spam messages and only show important chat
          const isImportant = fullText.includes('join') || 
                             fullText.includes('left') || 
                             fullText.includes('Command:') ||
                             fullText.includes('Member:') ||
                             fullText.includes('CwR:') ||
                             fullText.includes('Example:');

          if (isImportant && fullText.trim()) {
            // Clean up the message format
            const cleanText = fullText.replace(/§[0-9a-fk-or]/g, '').trim();
            if (cleanText) {
              logger.chat(`[${botId}] ${cleanText}`);
            }
          }
        } catch (err) {
          // Only log parsing errors in debug mode
          if (config.debug) {
            logger.debug(`[${botId}] Failed to parse chat JSON: ${err.message}`);
          }
        }
      }
    });

    logger.success(`Created bot '${botId}' - ${botConfig.host}:${botConfig.port}`);
    return bot;
  }

  getBot(botId = null) {
    if (botId) {
      return this.bots.get(botId);
    }
    return this.bots.get(this.activeBotId);
  }

  getAllBots() {
    return Array.from(this.bots.values());
  }

  getBotList() {
    return Array.from(this.bots.keys());
  }

  setActiveBot(botId) {
    if (this.bots.has(botId)) {
      this.activeBotId = botId;
      logger.info(`Active bot switched to ${botId}`);
      return true;
    }
    return false;
  }

  getActiveBot() {
    return this.getBot();
  }

  getActiveBotId() {
    return this.activeBotId;
  }

  removeBot(botId) {
    const bot = this.bots.get(botId);
    if (bot) {
      if (!bot.ended) {
        bot.quit();
      }
      this.bots.delete(botId);
      
      // If this was the active bot, switch to another one
      if (this.activeBotId === botId) {
        const remainingBots = this.getBotList();
        this.activeBotId = remainingBots.length > 0 ? remainingBots[0] : null;
        if (this.activeBotId) {
          logger.info(`👑 Active bot switched → ${this.activeBotId} (previous bot removed)`);
        }
      }
      
      logger.info(`🗑️ Removed bot '${botId}'`);
      return true;
    }
    return false;
  }

  disconnectBot(botId) {
    const bot = this.bots.get(botId);
    if (bot && !bot.ended) {
      bot.quit();
      return true;
    }
    return false;
  }

  disconnectAll() {
    let count = 0;
    for (const [botId, bot] of this.bots) {
      if (!bot.ended) {
        bot.quit();
        count++;
      }
    }
    this.bots.clear();
    this.activeBotId = null;
    logger.info(`🛑 Disconnected ${count} bot(s)`);
  }

  getBotCount() {
    return this.bots.size;
  }

  getConnectedBotCount() {
    return this.getAllBots().filter(bot => !bot.ended).length;
  }

  getBotStatus() {
    const status = [];
    for (const [botId, bot] of this.bots) {
      status.push({
        id: botId,
        active: botId === this.activeBotId,
        connected: !bot.ended,
        host: bot.config.host,
        port: bot.config.port,
        health: bot.health,
        gamemode: bot.game?.gameMode
      });
    }
    return status;
  }
}

// Create singleton instance
const botManager = new BotManager();

module.exports = { 
  BotManager, 
  botManager,
  // Legacy function for backward compatibility
  createBot: (config) => botManager.createBot(config)
};