const chalk = require('chalk');

class Logger {
  constructor(appName = 'Mindle') {
    this.appName = appName;
    this.lastLogTime = 0;
    this.duplicateCount = 0;
    this.lastMessage = '';
    this.chatEnabled = true;
  }

  timestamp() {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    return chalk.gray(`[${time}]`);
  }

  formatMessage(level, msg, ...args) {
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';
    
    return `${this.timestamp()} ${level} ${msg}${formattedArgs}`;
  }

  // Check for duplicate messages to reduce spam
  isDuplicate(message) {
    if (message === this.lastMessage) {
      this.duplicateCount++;
      return true;
    } else {
      if (this.duplicateCount > 0) {
        console.log(chalk.gray(`  (repeated ${this.duplicateCount} times)`));
        this.duplicateCount = 0;
      }
      this.lastMessage = message;
      return false;
    }
  }

  // Chat toggle functionality
  setChatEnabled(enabled) {
    this.chatEnabled = enabled;
    this.info(`Chat logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  info(msg, ...args) {
    const message = this.formatMessage(chalk.blue('INFO'), msg, ...args);
    if (!this.isDuplicate(message)) {
      console.log(message);
    }
  }

  warn(msg, ...args) {
    const message = this.formatMessage(chalk.yellow('WARN'), msg, ...args);
    console.warn(message);
  }

  error(msg, ...args) {
    const message = this.formatMessage(chalk.red('ERROR'), msg, ...args);
    console.error(message);
  }

  success(msg, ...args) {
    const message = this.formatMessage(chalk.green('SUCCESS'), msg, ...args);
    if (!this.isDuplicate(message)) {
      console.log(message);
    }
  }

  debug(msg, ...args) {
    try {
      const config = require('../config.json');
      if (config.debug) {
        console.log(this.formatMessage(chalk.magenta('DEBUG'), msg, ...args));
      }
    } catch (err) {
      // If config can't be loaded, don't show debug messages
    }
  }

  chat(msg, ...args) {
    if (this.chatEnabled) {
      console.log(this.formatMessage(chalk.cyan('CHAT'), msg, ...args));
    }
  }

  bot(msg, ...args) {
    console.log(this.formatMessage(chalk.blueBright('BOT'), msg, ...args));
  }

  // Method for bot-specific actions
  botAction(botId, action, msg, ...args) {
    const prefix = chalk.dim(`[${botId}]`);
    const actionColor = action === 'say' ? chalk.green : chalk.blue;
    console.log(`${this.timestamp()} ${prefix} ${actionColor(action.toUpperCase())} ${msg}${args.length > 0 ? ' ' + args.join(' ') : ''}`);
  }

  // Method for system status updates
  status(msg, ...args) {
    console.log(this.formatMessage(chalk.cyan('STATUS'), msg, ...args));
  }

  // Method for command execution
  command(botId, cmd, args = []) {
    const prefix = chalk.dim(`[${botId}]`);
    const argsStr = args.length > 0 ? ` ${args.join(' ')}` : '';
    console.log(`${this.timestamp()} ${prefix} ${chalk.yellow('CMD')} ${cmd}${argsStr}`);
  }

  // Clean separator for better readability
  separator() {
    console.log(chalk.gray('──────────────────────────────────────────────────'));
  }

  // Mass action logging
  massAction(action, botIds, msg) {
    const count = botIds.length;
    const botsStr = count > 3 ? `${botIds.slice(0, 3).join(', ')}... (+${count - 3} more)` : botIds.join(', ');
    console.log(this.formatMessage(chalk.magenta('MASS'), `${action} -> [${botsStr}] ${msg}`));
  }
}

// Create default instance
const logger = new Logger();

// Export both the class and default instance
module.exports = logger;
module.exports.Logger = Logger;