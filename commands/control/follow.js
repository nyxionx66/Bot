const logger = require('../../utils/logger');

module.exports = {
  name: 'follow',
  aliases: ['f'],
  description: 'Follows a player',
  usage: 'follow <username>',
  execute(bot, args) {
    if (!args[0]) {
      logger.warn('Usage: follow <username>');
      return;
    }

    const username = args[0];
    const target = bot.players[username]?.entity;
    
    if (!target) {
      logger.warn(`Player '${username}' not found or not in range!`);
      return;
    }

    try {
      bot.pathfinder.setGoal(new bot.pathfinder.goals.GoalFollow(target, 1), true);
      logger.bot(`Now following ${username}`);
      
      // Store current follow target for potential stop command
      bot.followTarget = username;
    } catch (error) {
      logger.error(`Failed to follow ${username}: ${error.message}`);
    }
  },
};