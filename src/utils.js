const moment = require('moment');

/**
 * Format timestamp to readable format
 * @param {Date|number} timestamp - Timestamp to format
 * @returns {string} Formatted timestamp
 */
function formatTime(timestamp) {
  return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
}

/**
 * Sleep function for delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random delay
 * @param {number} min - Minimum delay in ms
 * @param {number} max - Maximum delay in ms
 * @returns {number} Random delay
 */
function randomDelay(min = 500, max = 3000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Parse command from message
 * @param {string} message - Message to parse
 * @returns {Object} Command object with name and args
 */
function parseCommand(message) {
  const trimmed = message.trim();
  if (!trimmed.startsWith('/')) {
    return { isCommand: false, name: null, args: [] };
  }

  const parts = trimmed.slice(1).split(' ');
  const name = parts[0].toLowerCase();
  const args = parts.slice(1);

  return { isCommand: true, name, args };
}

/**
 * Log message with timestamp
 * @param {string} level - Log level
 * @param {string} message - Message to log
 * @param {Object} data - Additional data
 */
function log(level = 'info', message, data = {}) {
  const timestamp = formatTime(new Date());
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data);
}

/**
 * Reaction type mappings
 */
const reactionMap = {
  'love': '❤️',
  'haha': '😆',
  'wow': '😮',
  'sad': '😢',
  'angry': '😠',
  'like': '👍',
  'dislike': '👎',
};

/**
 * Get reaction emoji by type
 * @param {string} type - Reaction type
 * @returns {string} Reaction emoji
 */
function getReactionEmoji(type) {
  return reactionMap[type] || reactionMap['like'];
}

/**
 * Create message object
 * @param {string} text - Message text
 * @param {Object} options - Additional options
 * @returns {Object} Message object
 */
function createMessage(text, options = {}) {
  return {
    text,
    attachments: options.attachments || [],
    sticker: options.sticker || null,
    timestamp: new Date(),
    ...options,
  };
}

module.exports = {
  formatTime,
  sleep,
  randomDelay,
  parseCommand,
  log,
  reactionMap,
  getReactionEmoji,
  createMessage,
};
