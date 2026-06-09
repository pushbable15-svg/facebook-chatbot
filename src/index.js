const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const config = require('./config');
const FacebookClient = require('./facebookClient');
const MessageHandler = require('./messageHandler');
const WebSocketServer = require('./websocket');
const { log } = require('./utils');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize WebSocket server
const wsServer = new WebSocketServer(config.websocket.port);

// Initialize Facebook client
const facebookClient = new FacebookClient(config);
let messageHandler;

// ==================== Routes ====================

// Status route
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    connected: facebookClient.isLoggedIn(),
    websocketClients: wsServer.getClientCount(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
  });
});

// Messages route
app.get('/api/messages', (req, res) => {
  if (!messageHandler) {
    return res.status(503).json({ error: 'Bot not initialized' });
  }

  res.json({
    messages: messageHandler.getMessageLog(),
    count: messageHandler.getMessageLog().length,
  });
});

// Send message route
app.post('/api/send-message', (req, res) => {
  const { message, threadID } = req.body;

  if (!message || !threadID) {
    return res.status(400).json({ error: 'Missing message or threadID' });
  }

  if (!messageHandler) {
    return res.status(503).json({ error: 'Bot not initialized' });
  }

  messageHandler.sendMessage(message, threadID)
    .then((result) => {
      res.json({ success: true, messageInfo: result });
    })
    .catch((error) => {
      res.status(500).json({ error: error.message });
    });
});

// Auto response settings route
app.get('/api/auto-response/status', (req, res) => {
  if (!messageHandler) {
    return res.status(503).json({ error: 'Bot not initialized' });
  }

  res.json({
    enabled: messageHandler.autoResponseManager.isEnabled(),
    responses: messageHandler.autoResponseManager.getAll(),
  });
});

app.post('/api/auto-response/enable', (req, res) => {
  if (!messageHandler) {
    return res.status(503).json({ error: 'Bot not initialized' });
  }

  messageHandler.enableAutoResponse();
  res.json({ success: true, message: 'Auto response enabled' });
});

app.post('/api/auto-response/disable', (req, res) => {
  if (!messageHandler) {
    return res.status(503).json({ error: 'Bot not initialized' });
  }

  messageHandler.disableAutoResponse();
  res.json({ success: true, message: 'Auto response disabled' });
});

app.post('/api/auto-response/add', (req, res) => {
  const { trigger, responses } = req.body;

  if (!trigger || !responses) {
    return res.status(400).json({ error: 'Missing trigger or responses' });
  }

  if (!messageHandler) {
    return res.status(503).json({ error: 'Bot not initialized' });
  }

  messageHandler.autoResponseManager.addCustomResponse(trigger, responses);
  res.json({ success: true, message: `Auto response added for trigger: ${trigger}` });
});

// Auto react settings route
app.post('/api/auto-react/set-type', (req, res) => {
  const { type } = req.body;

  if (!type) {
    return res.status(400).json({ error: 'Missing reaction type' });
  }

  if (!messageHandler) {
    return res.status(503).json({ error: 'Bot not initialized' });
  }

  const validTypes = ['love', 'haha', 'wow', 'sad', 'angry', 'like', 'dislike'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: `Invalid reaction type. Valid types: ${validTypes.join(', ')}` });
  }

  messageHandler.setAutoReactType(type);
  res.json({ success: true, message: `Auto react type set to: ${type}` });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ==================== Server Initialization ====================

async function initialize() {
  try {
    log('info', 'Initializing Facebook Chatbot...');

    // Login to Facebook
    log('info', 'Connecting to Facebook...');
    await facebookClient.login();

    // Initialize message handler
    messageHandler = new MessageHandler(facebookClient, wsServer);

    // Enable auto response by default
    messageHandler.enableAutoResponse();

    // Listen for messages
    log('info', 'Starting message listener...');
    facebookClient.listen((event) => {
      if (event.type === 'message') {
        messageHandler.handleMessage(event);
      } else if (event.type === 'message_reply') {
        messageHandler.handleMessage(event);
      }
    });

    // Start HTTP server
    const server = app.listen(config.server.port, config.server.host, () => {
      log('info', `HTTP server running on http://${config.server.host}:${config.server.port}`);
      log('info', `WebSocket server running on ws://localhost:${config.websocket.port}`);
      log('info', '🤖 Facebook Chatbot is running!');
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      log('info', 'Shutting down gracefully...');
      facebookClient.disconnect();
      wsServer.close();
      server.close(() => {
        log('info', 'Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    log('error', 'Failed to initialize chatbot:', error);
    process.exit(1);
  }
}

// Start the server
initialize();

module.exports = app;
