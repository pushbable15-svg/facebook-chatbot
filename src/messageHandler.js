const { log, parseCommand, sleep, randomDelay, formatTime } = require('./utils');
const CommandHandler = require('./commands');
const AutoResponseManager = require('./autoResponses');

class MessageHandler {
  constructor(api, wsServer) {
    this.api = api;
    this.wsServer = wsServer;
    this.commandHandler = new CommandHandler(api);
    this.autoResponseManager = new AutoResponseManager();
    this.messageLog = [];
    this.autoReactType = 'love';
    this.maxMessageLog = 1000; // Limit message log size
  }

  async handleMessage(event) {
    try {
      // Validate event
      if (!event || !event.body) {
        return;
      }

      const message = {
        id: event.messageID,
        sender: event.senderID,
        text: event.body || '',
        threadID: event.threadID,
        timestamp: formatTime(new Date(event.timestamp || Date.now())),
        type: 'incoming',
      };

      log('info', `Message received from ${event.senderID}: ${event.body}`, { threadID: event.threadID });

      // Add to log (maintain size limit)
      this.addToMessageLog(message);

      // Broadcast to WebSocket clients
      this.broadcastMessage(message);

      // Parse if it's a command
      const command = parseCommand(event.body);

      if (command.isCommand) {
        await this.handleCommand(command, event);
      } else {
        // Handle auto responses
        await this.handleAutoResponse(event);
      }

      // Handle auto react
      await this.handleAutoReact(event);
    } catch (error) {
      log('error', 'Error handling message:', error);
    }
  }

  async handleCommand(command, event) {
    try {
      const context = {
        threadID: event.threadID,
        userID: event.senderID,
        messageID: event.messageID,
        api: this.api,
      };

      const result = await this.commandHandler.execute(command.name, command.args, context);

      if (result.success) {
        await this.sendMessage(result.message, event.threadID);
      } else {
        await this.sendMessage(`❌ ${result.message}`, event.threadID);
      }
    } catch (error) {
      log('error', 'Error handling command:', error);
      try {
        await this.sendMessage(`❌ Error: ${error.message}`, event.threadID);
      } catch (sendError) {
        log('error', 'Error sending error message:', sendError);
      }
    }
  }

  async handleAutoResponse(event) {
    if (!this.autoResponseManager.isEnabled()) {
      return;
    }

    const response = this.autoResponseManager.getResponse(event.body);
    if (response) {
      // Random delay to seem more natural
      const delay = randomDelay(1000, 3000);
      await sleep(delay);

      try {
        await this.sendMessage(response, event.threadID);
        log('info', `Auto response sent: ${response}`);
      } catch (error) {
        log('error', 'Error sending auto response:', error);
      }
    }
  }

  async handleAutoReact(event) {
    try {
      await this.api.setMessageReaction(this.autoReactType, event.messageID);
      log('info', `Auto reacted with ${this.autoReactType}`);
    } catch (error) {
      // Silently fail for auto reactions
      log('debug', 'Could not auto react:', error.message);
    }
  }

  async sendMessage(text, threadID) {
    return new Promise((resolve, reject) => {
      this.api.sendMessage(text, threadID, (err, messageInfo) => {
        if (err) {
          log('error', 'Error sending message:', err);
          reject(err);
        } else {
          try {
            const outgoingMessage = {
              id: messageInfo?.messageID || 'unknown',
              text: text,
              threadID: threadID,
              timestamp: formatTime(new Date()),
              type: 'outgoing',
            };

            this.addToMessageLog(outgoingMessage);
            this.broadcastMessage(outgoingMessage);
            log('info', `Message sent to ${threadID}: ${text}`);
            resolve(messageInfo);
          } catch (error) {
            log('error', 'Error processing sent message:', error);
            resolve(messageInfo);
          }
        }
      });
    });
  }

  async changeNickname(newNickname, threadID, userID) {
    return new Promise((resolve, reject) => {
      this.api.changeNickname(newNickname, threadID, userID, (err) => {
        if (err) {
          log('error', 'Error changing nickname:', err);
          reject(err);
        } else {
          log('info', `Nickname changed to: ${newNickname}`);
          resolve();
        }
      });
    });
  }

  async changeGroupName(newGroupName, threadID) {
    return new Promise((resolve, reject) => {
      this.api.changeThreadName(newGroupName, threadID, (err) => {
        if (err) {
          log('error', 'Error changing group name:', err);
          reject(err);
        } else {
          log('info', `Group name changed to: ${newGroupName}`);
          resolve();
        }
      });
    });
  }

  broadcastMessage(message) {
    if (this.wsServer) {
      try {
        this.wsServer.broadcast({
          type: 'message',
          data: message,
        });
      } catch (error) {
        log('error', 'Error broadcasting message:', error);
      }
    }
  }

  addToMessageLog(message) {
    this.messageLog.push(message);
    // Keep message log size limited
    if (this.messageLog.length > this.maxMessageLog) {
      this.messageLog.shift();
    }
  }

  getMessageLog() {
    return this.messageLog;
  }

  clearMessageLog() {
    this.messageLog = [];
  }

  setAutoReactType(type) {
    this.autoReactType = type;
  }

  enableAutoResponse() {
    this.autoResponseManager.enable();
  }

  disableAutoResponse() {
    this.autoResponseManager.disable();
  }
}

module.exports = MessageHandler;
