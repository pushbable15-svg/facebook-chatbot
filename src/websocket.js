const WebSocket = require('ws');
const { log } = require('./utils');

class WebSocketServer {
  constructor(port) {
    this.port = port;
    this.wss = new WebSocket.Server({ port });
    this.clients = new Set();

    this.wss.on('connection', (ws) => {
      log('info', `WebSocket client connected. Total clients: ${this.clients.size + 1}`);
      this.clients.add(ws);

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(data, ws);
        } catch (error) {
          log('error', 'Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        log('info', `WebSocket client disconnected. Total clients: ${this.clients.size}`);
      });

      ws.on('error', (error) => {
        log('error', 'WebSocket error:', error);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to Facebook Chatbot',
        timestamp: new Date().toISOString(),
      }));
    });

    log('info', `WebSocket server started on port ${port}`);
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  send(data, targetClient) {
    if (targetClient.readyState === WebSocket.OPEN) {
      targetClient.send(JSON.stringify(data));
    }
  }

  handleClientMessage(data, ws) {
    log('info', 'Received message from client:', data);

    // Handle different message types
    switch (data.type) {
      case 'ping':
        this.send({ type: 'pong', timestamp: new Date().toISOString() }, ws);
        break;

      case 'subscribe':
        this.send({
          type: 'subscribed',
          channel: data.channel,
          timestamp: new Date().toISOString(),
        }, ws);
        break;

      default:
        log('info', `Unknown message type: ${data.type}`);
    }
  }

  close() {
    this.wss.close(() => {
      log('info', 'WebSocket server closed');
    });
  }

  getClientCount() {
    return this.clients.size;
  }
}

module.exports = WebSocketServer;
