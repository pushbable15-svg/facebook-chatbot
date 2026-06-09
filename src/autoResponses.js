const { log, sleep, randomDelay } = require('./utils');

class AutoResponseManager {
  constructor() {
    this.responses = new Map();
    this.enabled = false;
    this.loadDefaultResponses();
  }

  loadDefaultResponses() {
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
  }

  addResponse(trigger, responses) {
    this.responses.set(trigger.toLowerCase(), responses);
  }

  removeResponse(trigger) {
    return this.responses.delete(trigger.toLowerCase());
  }

  getResponse(message) {
    const lowerMessage = message.toLowerCase();

    for (const [trigger, responses] of this.responses) {
      if (lowerMessage.includes(trigger)) {
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }

    return null;
  }

  addCustomResponse(trigger, responses) {
    if (!Array.isArray(responses)) {
      responses = [responses];
    }
    this.addResponse(trigger, responses);
    log('info', `Added auto response for trigger: ${trigger}`);
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
    return this.enabled;
  }

  getAll() {
    return Object.fromEntries(this.responses);
  }
}

module.exports = AutoResponseManager;
