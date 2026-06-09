const { log, sleep, randomDelay } = require('./utils');

class CommandHandler {
  constructor(api) {
    this.api = api;
    this.commands = new Map();
    this.commandStats = new Map(); // Track command usage
    this.registerDefaultCommands();
  }

  registerDefaultCommands() {
    // Help command
    this.register('help', {
      description: 'Show all available commands',
      usage: '/help',
      execute: (args, context) => this.handleHelp(context),
    });

    // Nickname command
    this.register('nickname', {
      description: 'Change your nickname in the conversation',
      usage: '/nickname <new_name>',
      execute: (args, context) => this.handleNickname(args, context),
    });

    // Group name command
    this.register('groupname', {
      description: 'Change group name',
      usage: '/groupname <new_name>',
      execute: (args, context) => this.handleGroupName(args, context),
    });

    // Loop message command
    this.register('loop', {
      description: 'Send message repeatedly with delay',
      usage: '/loop <times> <delay_ms> <message>',
      execute: (args, context) => this.handleLoop(args, context),
    });

    // Auto react command
    this.register('autoreact', {
      description: 'Set auto react type',
      usage: '/autoreact <love|haha|wow|sad|angry|like|dislike>',
      execute: (args, context) => this.handleAutoReact(args, context),
    });

    // React command
    this.register('react', {
      description: 'React to message',
      usage: '/react <type>',
      execute: (args, context) => this.handleReact(args, context),
    });

    // Status command
    this.register('status', {
      description: 'Show bot status',
      usage: '/status',
      execute: (args, context) => this.handleStatus(context),
    });

    // Stats command
    this.register('stats', {
      description: 'Show command statistics',
      usage: '/stats',
      execute: (args, context) => this.handleStats(context),
    });
  }

  register(name, command) {
    try {
      if (!name || typeof name !== 'string') {
        throw new Error('Invalid command name');
      }
      this.commands.set(name.toLowerCase(), command);
      this.commandStats.set(name.toLowerCase(), 0);
      log('info', `Registered command: ${name}`);
    } catch (error) {
      log('error', 'Error registering command:', error);
    }
  }

  async execute(commandName, args, context) {
    try {
      if (!commandName || typeof commandName !== 'string') {
        return { success: false, message: 'Invalid command name' };
      }

      const command = this.commands.get(commandName.toLowerCase());
      if (!command) {
        return { success: false, message: `Command not found: ${commandName}` };
      }

      // Track command usage
      const stats = this.commandStats.get(commandName.toLowerCase()) || 0;
      this.commandStats.set(commandName.toLowerCase(), stats + 1);

      try {
        const result = await command.execute(args || [], context);
        return result || { success: false, message: 'Command returned no result' };
      } catch (error) {
        log('error', `Error executing command ${commandName}:`, error);
        return { success: false, message: `Error executing command: ${error.message}` };
      }
    } catch (error) {
      log('error', 'Unexpected error in execute:', error);
      return { success: false, message: 'Unexpected error' };
    }
  }

  async handleHelp(context) {
    try {
      let helpText = '📚 **Available Commands:**\n\n';
      this.commands.forEach((cmd, name) => {
        helpText += `/${name} - ${cmd.description}\n`;
        helpText += `  Usage: ${cmd.usage}\n\n`;
      });
      return { success: true, message: helpText };
    } catch (error) {
      return { success: false, message: `Error: ${error.message}` };
    }
  }

  async handleNickname(args, context) {
    try {
      if (!args || args.length === 0) {
        return { success: false, message: 'Please provide a nickname' };
      }

      if (!context.threadID || !context.userID) {
        return { success: false, message: 'Missing thread or user ID' };
      }

      const newNickname = args.join(' ').slice(0, 100); // Limit nickname length
      
      if (newNickname.length === 0) {
        return { success: false, message: 'Nickname cannot be empty' };
      }

      await this.api.changeNickname(newNickname, context.threadID, context.userID);
      return { success: true, message: `✅ Nickname changed to: ${newNickname}` };
    } catch (error) {
      log('error', 'Error in handleNickname:', error);
      return { success: false, message: `Failed to change nickname: ${error.message}` };
    }
  }

  async handleGroupName(args, context) {
    try {
      if (!args || args.length === 0) {
        return { success: false, message: 'Please provide a group name' };
      }

      if (!context.threadID) {
        return { success: false, message: 'Missing thread ID' };
      }

      const newGroupName = args.join(' ').slice(0, 100); // Limit name length
      
      if (newGroupName.length === 0) {
        return { success: false, message: 'Group name cannot be empty' };
      }

      await this.api.changeThreadName(newGroupName, context.threadID);
      return { success: true, message: `✅ Group name changed to: ${newGroupName}` };
    } catch (error) {
      log('error', 'Error in handleGroupName:', error);
      return { success: false, message: `Failed to change group name: ${error.message}` };
    }
  }

  async handleLoop(args, context) {
    try {
      if (!args || args.length < 3) {
        return { success: false, message: 'Usage: /loop <times> <delay_ms> <message>' };
      }

      if (!context.threadID) {
        return { success: false, message: 'Missing thread ID' };
      }

      const times = parseInt(args[0]);
      const delay = parseInt(args[1]);
      const message = args.slice(2).join(' ');

      // Validation
      if (isNaN(times) || isNaN(delay)) {
        return { success: false, message: 'Times and delay must be numbers' };
      }

      if (times < 1 || times > 100) {
        return { success: false, message: 'Times must be between 1 and 100' };
      }

      if (delay < 100 || delay > 60000) {
        return { success: false, message: 'Delay must be between 100ms and 60000ms' };
      }

      if (!message || message.length === 0) {
        return { success: false, message: 'Message cannot be empty' };
      }

      if (message.length > 4096) {
        return { success: false, message: 'Message is too long (max 4096 characters)' };
      }

      // Run loop asynchronously without blocking
      (async () => {
        for (let i = 0; i < times; i++) {
          try {
            await this.api.sendMessage(message, context.threadID);
            log('info', `Loop message sent (${i + 1}/${times})`);
            if (i < times - 1) {
              await sleep(delay);
            }
          } catch (error) {
            log('error', `Error sending loop message (${i + 1}/${times}):`, error.message);
          }
        }
      })();

      return { success: true, message: `🔄 Looping message ${times} times with ${delay}ms delay` };
    } catch (error) {
      log('error', 'Error in handleLoop:', error);
      return { success: false, message: `Error: ${error.message}` };
    }
  }

  async handleAutoReact(args, context) {
    try {
      if (!args || args.length === 0) {
        return { success: false, message: 'Please specify reaction type: love|haha|wow|sad|angry|like|dislike' };
      }

      const reactionType = args[0].toLowerCase();
      const validTypes = ['love', 'haha', 'wow', 'sad', 'angry', 'like', 'dislike'];

      if (!validTypes.includes(reactionType)) {
        return { success: false, message: `Invalid reaction type. Valid types: ${validTypes.join(', ')}` };
      }

      // Store in context for message handler to use
      if (context) {
        context.autoReactType = reactionType;
      }
      return { success: true, message: `✅ Auto react set to: ${reactionType}` };
    } catch (error) {
      log('error', 'Error in handleAutoReact:', error);
      return { success: false, message: `Error: ${error.message}` };
    }
  }

  async handleReact(args, context) {
    try {
      if (!args || args.length === 0) {
        return { success: false, message: 'Please specify reaction type: love|haha|wow|sad|angry|like|dislike' };
      }

      const reactionType = args[0].toLowerCase();
      const validTypes = ['love', 'haha', 'wow', 'sad', 'angry', 'like', 'dislike'];

      if (!validTypes.includes(reactionType)) {
        return { success: false, message: `Invalid reaction type. Valid types: ${validTypes.join(', ')}` };
      }

      if (!context.messageID) {
        return { success: false, message: 'Message ID required' };
      }

      await this.api.setMessageReaction(reactionType, context.messageID);
      return { success: true, message: `✅ Reacted with: ${reactionType}` };
    } catch (error) {
      log('error', 'Error in handleReact:', error);
      return { success: false, message: `Failed to react: ${error.message}` };
    }
  }

  async handleStatus(context) {
    try {
      const statusText = `
🤖 **Bot Status:**
- Uptime: ${process.uptime().toFixed(2)}s
- Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB
- Commands Registered: ${this.commands.size}
- Commands Executed: ${Array.from(this.commandStats.values()).reduce((a, b) => a + b, 0)}
      `;
      return { success: true, message: statusText };
    } catch (error) {
      log('error', 'Error in handleStatus:', error);
      return { success: false, message: `Error: ${error.message}` };
    }
  }

  async handleStats(context) {
    try {
      let statsText = '📊 **Command Statistics:**\n\n';
      const sortedStats = Array.from(this.commandStats.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Show top 10

      sortedStats.forEach(([cmd, count]) => {
        statsText += `/${cmd}: ${count} uses\n`;
      });

      return { success: true, message: statsText };
    } catch (error) {
      log('error', 'Error in handleStats:', error);
      return { success: false, message: `Error: ${error.message}` };
    }
  }
}

module.exports = CommandHandler;
