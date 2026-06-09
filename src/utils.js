const moment = require('moment');

/**
 * Validate timestamp
 * @param {Date|number} timestamp - Timestamp to validate
 * @returns {boolean} Whether timestamp is valid
 */
function isValidTimestamp(timestamp) {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  return date instanceof Date && !isNaN(date);
}

/**
 * Format timestamp to readable format
 * @param {Date|number} timestamp - Timestamp to format
 * @returns {string} Formatted timestamp
 */
function formatTime(timestamp) {
  try {
    if (!isValidTimestamp(timestamp)) {
      return moment().format('YYYY-MM-DD HH:mm:ss');
    }
    return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
  } catch (error) {
    return moment().format('YYYY-MM-DD HH:mm:ss');
  }
}

/**
 * Sleep function for delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
  if (typeof ms !== 'number' || ms < 0) {
    return Promise.resolve();
  }
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random delay
 * @param {number} min - Minimum delay in ms
 * @param {number} max - Maximum delay in ms
 * @returns {number} Random delay
 */
function randomDelay(min = 500, max = 3000) {
  try {
    // Validate inputs
    min = Math.max(0, Math.floor(min));
    max = Math.max(min, Math.floor(max));

    return Math.floor(Math.random() * (max - min + 1)) + min;
  } catch (error) {
    return 1000; // Default fallback
  }
}

/**
 * Parse command from message
 * @param {string} message - Message to parse
 * @returns {Object} Command object with name and args
 */
function parseCommand(message) {
  try {
    if (!message || typeof message !== 'string') {
      return { isCommand: false, name: null, args: [] };
    }

    const trimmed = message.trim();
    if (!trimmed.startsWith('/')) {
      return { isCommand: false, name: null, args: [] };
    }

    const parts = trimmed.slice(1).split(' ').filter(p => p.length > 0);
    if (parts.length === 0) {
      return { isCommand: false, name: null, args: [] };
    }

    const name = parts[0].toLowerCase();
    const args = parts.slice(1);

    return { isCommand: true, name, args };
  } catch (error) {
    return { isCommand: false, name: null, args: [] };
  }
}

/**
 * Log message with timestamp
 * @param {string} level - Log level
 * @param {string} message - Message to log
 * @param {Object} data - Additional data
 */
function log(level = 'info', message, data = {}) {
  try {
    if (!message) return;

    const validLevels = ['info', 'warn', 'error', 'debug'];
    const logLevel = validLevels.includes(level) ? level.toUpperCase() : 'INFO';
    const timestamp = formatTime(new Date());
    
    const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
    console.log(`[${timestamp}] [${logLevel}] ${message}${dataStr ? ' ' + dataStr : ''}`);
  } catch (error) {
    console.error('Error in log function:', error);
  }
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
  try {
    if (!type || typeof type !== 'string') {
      return reactionMap['like'];
    }
    return reactionMap[type.toLowerCase()] || reactionMap['like'];
  } catch (error) {
    return '👍';
  }
}

/**
 * Create message object
 * @param {string} text - Message text
 * @param {Object} options - Additional options
 * @returns {Object} Message object
 */
function createMessage(text, options = {}) {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Message text is required and must be a string');
    }

    return {
      text: text.slice(0, 4096), // Cap message length
      attachments: Array.isArray(options.attachments) ? options.attachments : [],
      sticker: options.sticker || null,
      timestamp: isValidTimestamp(options.timestamp) ? options.timestamp : new Date(),
      ...options,
    };
  } catch (error) {
    log('error', 'Error in createMessage:', error);
    return {
      text: text || 'Message',
      attachments: [],
      sticker: null,
      timestamp: new Date(),
    };
  }
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  try {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  } catch (error) {
    return text || '';
  }
}

/**
 * Validate thread ID
 * @param {string} threadID - Thread ID to validate
 * @returns {boolean} Whether thread ID is valid
 */
function isValidThreadID(threadID) {
  try {
    if (!threadID || typeof threadID !== 'string') return false;
    return threadID.trim().length > 0;
  } catch (error) {
    return false;
  }
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
  escapeHtml,
  isValidThreadID,
  isValidTimestamp,
};
