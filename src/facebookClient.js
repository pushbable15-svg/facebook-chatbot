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

      // Set timeout for login attempt
      const loginTimeout = setTimeout(() => {
        reject(new Error('Facebook login timeout after 30 seconds'));
      }, 30000);

      facebookApi(loginOptions, (err, api) => {
        clearTimeout(loginTimeout);

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
        try {
          callback(event);
        } catch (error) {
          log('error', 'Error in listen callback:', error);
        }
      }
    });
  }

  sendMessage(text, threadID, callback) {
    if (!this.api) {
      return callback(new Error('Not connected'));
    }

    try {
      this.api.sendMessage(text, threadID, callback);
    } catch (error) {
      callback(error);
    }
  }

  changeNickname(newNickname, threadID, userID, callback) {
    if (!this.api) {
      return callback(new Error('Not connected'));
    }

    try {
      this.api.changeNickname(newNickname, threadID, userID, callback);
    } catch (error) {
      callback(error);
    }
  }

  changeThreadName(newName, threadID, callback) {
    if (!this.api) {
      return callback(new Error('Not connected'));
    }

    try {
      this.api.changeThreadName(newName, threadID, callback);
    } catch (error) {
      callback(error);
    }
  }

  async setMessageReaction(reaction, messageID) {
    return new Promise((resolve, reject) => {
      if (!this.api) {
        return reject(new Error('Not connected'));
      }

      try {
        this.api.setMessageReaction(reaction, messageID, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  getUserInfo(userID, callback) {
    if (!this.api) {
      return callback(new Error('Not connected'));
    }

    try {
      this.api.getUserInfo(userID, callback);
    } catch (error) {
      callback(error);
    }
  }

  getThreadInfo(threadID, callback) {
    if (!this.api) {
      return callback(new Error('Not connected'));
    }

    try {
      this.api.getThreadInfo(threadID, callback);
    } catch (error) {
      callback(error);
    }
  }

  getThreadList(limit, timestamp, callback) {
    if (!this.api) {
      return callback(new Error('Not connected'));
    }

    try {
      this.api.getThreadList(limit, timestamp, callback);
    } catch (error) {
      callback(error);
    }
  }

  disconnect() {
    if (this.api) {
      try {
        this.api.stopListening();
      } catch (error) {
        log('error', 'Error stopping listener:', error);
      }
      this.isConnected = false;
      log('info', 'Disconnected from Facebook Chat API');
    }
  }

  isLoggedIn() {
    return this.isConnected && this.api !== null;
  }
}

module.exports = FacebookClient;
