const facebookApi = require('facebook-chat-api');
const { log } = require('./utils');

class FacebookClient {
  constructor(config) {
    this.config = config;
    this.api = null;
    this.isConnected = false;
  }

  async login() {
    return new Promise((resolve, reject) => {
      const credentials = {
        email: this.config.facebook.email,
        password: this.config.facebook.password,
      };

      // Try to use appState if available
      let loginOptions = credentials;
      if (this.config.facebook.appState) {
        try {
          loginOptions = JSON.parse(this.config.facebook.appState);
          log('info', 'Using saved appState for login');
        } catch (error) {
          log('warn', 'Invalid appState, using credentials');
          loginOptions = credentials;
        }
      }

      facebookApi(loginOptions, (err, api) => {
        if (err) {
          log('error', 'Failed to login to Facebook:', err);
          reject(err);
          return;
        }

        this.api = api;
        this.isConnected = true;
        log('info', 'Successfully logged in to Facebook Chat API');
        resolve(api);
      });
    });
  }

  async listen(callback) {
    if (!this.api) {
      throw new Error('Not connected to Facebook Chat API');
    }

    this.api.listen((err, event) => {
      if (err) {
        log('error', 'Listen error:', err);
        return;
      }

      if (callback) {
        callback(event);
      }
    });
  }

  sendMessage(text, threadID, callback) {
    if (!this.api) {
      return callback(new Error('Not connected'));
    }

    this.api.sendMessage(text, threadID, callback);
  }

  changeNickname(newNickname, threadID, userID, callback) {
    if (!this.api) {
      return callback(new Error('Not connected'));
    }

    this.api.changeNickname(newNickname, threadID, userID, callback);
  }

  changeThreadName(newName, threadID, callback) {
    if (!this.api) {
      return callback(new Error('Not connected'));
    }

    this.api.changeThreadName(newName, threadID, callback);
  }

  setMessageReaction(reaction, messageID, callback) {
    if (!this.api) {
      return callback(new Error('Not connected'));
    }

    this.api.setMessageReaction(reaction, messageID, callback);
  }

  getUserInfo(userID, callback) {
    if (!this.api) {
      return callback(new Error('Not connected'));
    }

    this.api.getUserInfo(userID, callback);
  }

  getThreadInfo(threadID, callback) {
    if (!this.api) {
      return callback(new Error('Not connected'));
    }

    this.api.getThreadInfo(threadID, callback);
  }

  getThreadList(limit, timestamp, callback) {
    if (!this.api) {
      return callback(new Error('Not connected'));
    }

    this.api.getThreadList(limit, timestamp, callback);
  }

  disconnect() {
    if (this.api) {
      this.api.stopListening();
      this.isConnected = false;
      log('info', 'Disconnected from Facebook Chat API');
    }
  }

  isLoggedIn() {
    return this.isConnected;
  }
}

module.exports = FacebookClient;
