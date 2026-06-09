const { log, sleep, randomDelay } = require('./utils');

class AutoResponseManager {
  constructor() {
    this.responses = new Map();
    this.enabled = false;
    this.maxResponses = 100; // Limit to prevent memory issues
    this.responseTimestamps = new Map(); // Track last trigger time to avoid spam
    this.cooldownMs = 500; // Minimum time between same trigger responses
    this.loadDefaultResponses();
  }

  loadDefaultResponses() {
    try {
      // Greeting responses
      this.addResponse('hello', ['Hey! 👋', 'Hi there! 😊', 'Hello! How can I help?']);
      this.addResponse('hi', ['Hey! 👋', 'Hi there! 😊', 'Hello! How can I help?']);
      this.addResponse('hey', ['Hey! 👋', 'Hi there! 😊', 'Hello! How can I help?']);

      // Questions
      this.addResponse('how are you', ['I\'m good! Thanks for asking! 😊', 'Doing great! 🎉', 'All systems operational! 🤖']);
      this.addResponse('what is your name', ['I\'m a Facebook Chatbot! 🤖', 'Call me Bot! 🤖']);

      // Good morning/night
      this.addResponse('good morning', ['Good morning! ☀️', 'Morning! Let\'s have a productive day!']);
      this.addResponse('good night', ['Good night! Sleep well! 😴', 'See you tomorrow! 🌙']);

      // Thanks
      this.addResponse('thanks', ['You\'re welcome! 😊', 'Happy to help!', 'Anytime! 👍']);
      this.addResponse('thank you', ['You\'re welcome! 😊', 'Happy to help!', 'Anytime! 👍']);

      // Goodbye
      this.addResponse('goodbye', ['Bye! 👋', 'See you later! 😊', 'Take care!']);
      this.addResponse('bye', ['Bye! 👋', 'See you later! 😊', 'Take care!']);
    } catch (error) {
      log('error', 'Error loading default responses:', error);
    }
  }

  addResponse(trigger, responses) {
    try {
      if (!trigger || typeof trigger !== 'string') {
        log('warn', 'Invalid trigger provided to addResponse');
        return false;
      }

      if (!Array.isArray(responses)) {
        responses = [responses];
      }

      // Filter empty responses
      responses = responses.filter(r => r && typeof r === 'string' && r.trim().length > 0);
      if (responses.length === 0) {
        log('warn', 'No valid responses provided');
        return false;
      }

      // Check size limit
      if (this.responses.size >= this.maxResponses) {
        log('warn', 'Max auto responses reached. Removing oldest response.');
        const firstKey = this.responses.keys().next().value;
        this.responses.delete(firstKey);
      }

      this.responses.set(trigger.toLowerCase(), responses);
      this.responseTimestamps.set(trigger.toLowerCase(), 0); // Initialize timestamp
      return true;
    } catch (error) {
      log('error', 'Error in addResponse:', error);
      return false;
    }
  }

  removeResponse(trigger) {
    try {
      if (!trigger || typeof trigger !== 'string') {
        return false;
      }
      const result = this.responses.delete(trigger.toLowerCase());
      this.responseTimestamps.delete(trigger.toLowerCase());
      return result;
    } catch (error) {
      log('error', 'Error in removeResponse:', error);
      return false;
    }
  }

  getResponse(message) {
    try {
      if (!message || typeof message !== 'string') {
        return null;
      }

      const lowerMessage = message.toLowerCase();
      const now = Date.now();

      for (const [trigger, responses] of this.responses) {
        if (lowerMessage.includes(trigger)) {
          // Check cooldown
          const lastTriggerTime = this.responseTimestamps.get(trigger) || 0;
          if (now - lastTriggerTime < this.cooldownMs) {
            continue; // Skip if in cooldown
          }

          // Update timestamp
          this.responseTimestamps.set(trigger, now);

          // Return random response
          if (Array.isArray(responses) && responses.length > 0) {
            return responses[Math.floor(Math.random() * responses.length)];
          }
        }
      }

      return null;
    } catch (error) {
      log('error', 'Error in getResponse:', error);
      return null;
    }
  }

  addCustomResponse(trigger, responses) {
    try {
      if (!trigger || typeof trigger !== 'string') {
        throw new Error('Invalid trigger');
      }

      if (!Array.isArray(responses)) {
        responses = [responses];
      }

      // Validate and sanitize responses
      responses = responses.filter(r => r && typeof r === 'string');
      if (responses.length === 0) {
        throw new Error('No valid responses provided');
      }

      const success = this.addResponse(trigger, responses);
      if (success) {
        log('info', `Added auto response for trigger: ${trigger}`);
      }
      return success;
    } catch (error) {
      log('error', 'Error in addCustomResponse:', error);
      return false;
    }
  }

  enable() {
    this.enabled = true;
    log('info', 'Auto responses enabled');
  }

  disable() {
    this.enabled = false;
    log('info', 'Auto responses disabled');
  }

  isEnabled() {
    return this.enabled === true;
  }

  getAll() {
    try {
      return Object.fromEntries(this.responses);
    } catch (error) {
      log('error', 'Error in getAll:', error);
      return {};
    }
  }

  clear() {
    this.responses.clear();
    this.responseTimestamps.clear();
    log('info', 'All auto responses cleared');
  }

  getStats() {
    return {
      totalResponses: this.responses.size,
      enabled: this.enabled,
      maxResponses: this.maxResponses,
    };
  }
}

module.exports = AutoResponseManager;
