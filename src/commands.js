const { log, sleep, randomDelay } = require('./utils');

class CommandHandler {
  constructor(api) {
    this.api = api;
    this.commands = new Map();
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
  }

  register(name, command) {
    this.commands.set(name.toLowerCase(), command);
    log('info', `Registered command: ${name}`);
  }

  async execute(commandName, args, context) {
    const command = this.commands.get(commandName.toLowerCase());
    if (!command) {
      return { success: false, message: `Command not found: ${commandName}` };
    }

    try {
      const result = await command.execute(args, context);
      return result;
    } catch (error) {
      log('error', `Error executing command ${commandName}:`, error);
      return { success: false, message: `Error executing command: ${error.message}` };
    }
  }

  async handleHelp(context) {
    let helpText = '📚 **Available Commands:**\n\n';
    this.commands.forEach((cmd, name) => {
      helpText += `/${name} - ${cmd.description}\n`;
      helpText += `  Usage: ${cmd.usage}\n\n`;
    });
    return { success: true, message: helpText };
  }

  async handleNickname(args, context) {
    if (args.length === 0) {
      return { success: false, message: 'Please provide a nickname' };
    }

    const newNickname = args.join(' ');
    try {
      await this.api.changeNickname(newNickname, context.threadID, context.userID);
      return { success: true, message: `✅ Nickname changed to: ${newNickname}` };
    } catch (error) {
      return { success: false, message: `Failed to change nickname: ${error.message}` };
    }
  }

  async handleGroupName(args, context) {
    if (args.length === 0) {
      return { success: false, message: 'Please provide a group name' };
    }

    const newGroupName = args.join(' ');
    try {
      await this.api.changeThreadName(newGroupName, context.threadID);
      return { success: true, message: `✅ Group name changed to: ${newGroupName}` };
    } catch (error) {
      return { success: false, message: `Failed to change group name: ${error.message}` };
    }
  }

  async handleLoop(args, context) {
    if (args.length < 3) {
      return { success: false, message: 'Usage: /loop <times> <delay_ms> <message>' };
    }

    const times = parseInt(args[0]);
    const delay = parseInt(args[1]);
    const message = args.slice(2).join(' ');

    if (isNaN(times) || isNaN(delay)) {
      return { success: false, message: 'Times and delay must be numbers' };
    }

    if (times > 100) {
      return { success: false, message: 'Maximum 100 loops allowed' };
    }

    (async () => {
      for (let i = 0; i < times; i++) {
        try {
          await this.api.sendMessage(message, context.threadID);
          log('info', `Loop message sent (${i + 1}/${times})`);
          if (i < times - 1) {
            await sleep(delay);
          }
        } catch (error) {
          log('error', `Error sending loop message: ${error.message}`);
        }
      }
    })();

    return { success: true, message: `🔄 Looping message ${times} times with ${delay}ms delay` };
  }

  async handleAutoReact(args, context) {
    if (args.length === 0) {
      return { success: false, message: 'Please specify reaction type: love|haha|wow|sad|angry|like|dislike' };
    }

    const reactionType = args[0].toLowerCase();
    const validTypes = ['love', 'haha', 'wow', 'sad', 'angry', 'like', 'dislike'];

    if (!validTypes.includes(reactionType)) {
      return { success: false, message: `Invalid reaction type. Valid types: ${validTypes.join(', ')}` };
    }

    // Store in context for message handler to use
    context.autoReactType = reactionType;
    return { success: true, message: `✅ Auto react set to: ${reactionType}` };
  }

  async handleReact(args, context) {
    if (args.length === 0) {
      return { success: false, message: 'Please specify reaction type: love|haha|wow|sad|angry|like|dislike' };
    }

    const reactionType = args[0].toLowerCase();
    try {
      await this.api.setMessageReaction(reactionType, context.messageID, () => {});
      return { success: true, message: `✅ Reacted with: ${reactionType}` };
    } catch (error) {
      return { success: false, message: `Failed to react: ${error.message}` };
    }
  }

  async handleStatus(context) {
    const statusText = `
🤖 **Bot Status:**
- Uptime: ${process.uptime().toFixed(2)}s
- Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB
- Commands Registered: ${this.commands.size}
    `;
    return { success: true, message: statusText };
  }
}

module.exports = CommandHandler;
