# 🤖 Facebook Chatbot

An advanced Facebook Chatbot with real-time messaging, auto-responses, and command-based actions using the unofficial Facebook Chat API (FCA).

## ✨ Features

- **Real-time Messaging** - Send and receive Facebook messages in real-time
- **Auto Responses** - Automatically respond to specific keywords/triggers
- **Auto Reactions** - Automatically react to incoming messages with emoji
- **Nickname Management** - Change your nickname in conversations
- **Group Name Management** - Automatically change group names
- **Message Looping** - Send messages repeatedly with custom delay times
- **Command System** - Built-in command parser and handler
- **Web Dashboard** - Beautiful web interface to manage the bot
- **WebSocket Support** - Real-time updates via WebSocket connections
- **Message History** - Keep track of all sent and received messages
- **Timestamps** - All messages include precise timestamps

## 📋 Prerequisites

- Node.js v14 or higher
- npm or yarn
- Facebook Account (with 2FA disabled or use app-specific password)

## 🚀 Installation

1. Clone the repository:
```bash
git clone https://github.com/pushbable15-svg/facebook-chatbot.git
cd facebook-chatbot
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Configure your Facebook credentials in `.env`:
```env
FACEBOOK_EMAIL=your_email@gmail.com
FACEBOOK_PASSWORD=your_password
PORT=3000
WS_PORT=3001
```

## 🔑 Getting Facebook Credentials

### Option 1: Using Email & Password

1. Disable 2FA on your Facebook account temporarily
2. Update `.env` with your email and password
3. The bot will auto-generate an `appstate.json` on first login

### Option 2: Using App State (Recommended)

1. Use [this tool](https://github.com/jlobos/facebook-chat-api/blob/master/HELP.md) to extract your Facebook app state
2. Export it as JSON and add to `.env`:
```env
FACEBOOK_APP_STATE={"appid":"...","name":"..."}
```

## 📖 Usage

### Starting the Bot

**Development Mode (with hot reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

The bot will be available at:
- Web Dashboard: `http://localhost:3000`
- WebSocket: `ws://localhost:3001`

### Available Commands

Commands start with `/` in any Facebook conversation:

| Command | Usage | Description |
|---------|-------|-------------|
| `/help` | `/help` | Show all available commands |
| `/nickname` | `/nickname <new_name>` | Change your nickname in the conversation |
| `/groupname` | `/groupname <new_name>` | Change group name |
| `/loop` | `/loop <times> <delay_ms> <message>` | Send message repeatedly with delay |
| `/react` | `/react <type>` | React to a message |
| `/autoreact` | `/autoreact <type>` | Set auto reaction type |
| `/status` | `/status` | Show bot status |

### Reaction Types

- `love` ❤️
- `haha` 😆
- `wow` 😮
- `sad` 😢
- `angry` 😠
- `like` 👍
- `dislike` 👎

### Web Dashboard Features

1. **Send Messages** - Send messages directly to any thread
2. **Manage Auto Responses** - Enable/disable and add custom auto responses
3. **Set Auto React** - Choose which emoji to auto-react with
4. **View Message History** - See all sent and received messages with timestamps
5. **Monitor Status** - Check uptime, memory usage, and connected clients

## 📁 Project Structure

```
facebook-chatbot/
├── src/
│   ├── index.js                 # Main server entry point
│   ├── config.js                # Configuration management
│   ├── facebookClient.js        # Facebook Chat API wrapper
│   ├── messageHandler.js        # Message handling and processing
│   ├── commands.js              # Command definitions and handler
│   ├── autoResponses.js         # Auto response system
│   ├── utils.js                 # Utility functions
│   └── websocket.js             # WebSocket server
├── frontend/
│   ├── index.html               # Web dashboard HTML
│   ├── styles.css               # Dashboard styling
│   └── script.js                # Dashboard JavaScript
├── logs/                        # Log files directory
├── package.json                 # Dependencies
└── .env                         # Environment variables
```

## ⚙️ Configuration

Edit `.env` file to customize:

```env
# Facebook Credentials
FACEBOOK_EMAIL=your_email@gmail.com
FACEBOOK_PASSWORD=your_password

# Server Settings
PORT=3000
HOST=localhost
WS_PORT=3001

# Auto Response Settings
AUTO_RESPONSE_ENABLED=true
AUTO_RESPONSE_DELAY=1000

# Auto React Settings
AUTO_REACT_ENABLED=true
AUTO_REACT_TYPE=love

# Logging
LOG_LEVEL=info
```

## 🔌 API Endpoints

### Status
- `GET /api/status` - Get bot status and stats

### Messages
- `GET /api/messages` - Get all messages history
- `POST /api/send-message` - Send a new message

### Auto Response
- `GET /api/auto-response/status` - Get auto response status
- `POST /api/auto-response/enable` - Enable auto responses
- `POST /api/auto-response/disable` - Disable auto responses
- `POST /api/auto-response/add` - Add custom auto response

### Auto React
- `POST /api/auto-react/set-type` - Set auto reaction type

## 📊 Example Usage

### Add Custom Auto Response
```bash
curl -X POST http://localhost:3000/api/auto-response/add \
  -H "Content-Type: application/json" \
  -d '{
    "trigger": "hello",
    "responses": ["Hi there!", "Hey!", "Hello!"]
  }'
```

### Send Message
```bash
curl -X POST http://localhost:3000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello from bot!",
    "threadID": "123456789"
  }'
```

### Get Bot Status
```bash
curl http://localhost:3000/api/status
```

## 🐛 Troubleshooting

### Bot doesn't connect
- Check Facebook credentials in `.env`
- Disable 2FA on Facebook account or use app-specific password
- Try clearing `appstate.json` and restart

### Messages not received
- Check if 2FA is interfering
- Verify thread IDs are correct
- Check server logs for errors

### Auto responses not working
- Make sure auto response is enabled
- Check trigger words match exactly (case-insensitive)
- Verify message handler is initialized

## 📝 Logging

All bot activity is logged to console. Configure log level in `.env`:
- `debug` - Detailed information
- `info` - General information (default)
- `warn` - Warning messages
- `error` - Error messages only

## 🔒 Security Notes

⚠️ **Important:**
- Never commit `.env` file with credentials
- Use app state instead of credentials when possible
- Keep your Facebook account secure
- Consider using a separate Facebook account for the bot
- Disable 2FA on the bot account or use app-specific password

## 📚 Dependencies

- **facebook-chat-api** - Unofficial Facebook Chat API
- **express** - Web framework
- **ws** - WebSocket server
- **dotenv** - Environment variables
- **moment** - Date/time formatting
- **cors** - Cross-origin requests
- **body-parser** - Request body parsing

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the ISC License.

## ⚠️ Disclaimer

This bot uses an unofficial Facebook API. Use it at your own risk. Facebook may ban your account if they detect unauthorized API usage. Always respect Facebook's Terms of Service.

## 🆘 Support

For issues, questions, or suggestions, please open an issue on GitHub.

## 👨‍💻 Author

Created by pushbable15-svg

---

<div align="center">
  Made with ❤️ for the Facebook Bot community
</div>
