const WebSocket = require('ws');
const { log } = require('./utils');

class WebSocketServer {
  constructor(port) {
    this.port = port;
    this.clients = new Set();
    this.messageQueue = [];
    this.maxQueueSize = 1000;
    this.isRunning = false;

    try {
      this.wss = new WebSocket.Server({ port, perMessageDeflate: true });
      this.setupEventHandlers();
      this.isRunning = true;
      log('info', `WebSocket server started on port ${port}`);
    } catch (error) {
      log('error', 'Failed to initialize WebSocket server:', error);
      this.isRunning = false;
    }
  }

  setupEventHandlers() {
    this.wss.on('connection', (ws, req) => {
      try {
        log('info', `WebSocket client connected from ${req.socket.remoteAddress}. Total clients: ${this.clients.size + 1}`);
        this.clients.add(ws);

        // Send welcome message
        this.sendToClient(ws, {
          type: 'connected',
          message: 'Connected to Facebook Chatbot',
          timestamp: new Date().toISOString(),
        });

        // Handle incoming messages
        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message);
            this.handleClientMessage(data, ws);
          } catch (error) {
            if (error instanceof SyntaxError) {
              log('error', 'Invalid WebSocket message format:', error.message);
            } else {
              log('error', 'Error parsing WebSocket message:', error);
            }
          }
        });

        // Handle client disconnect
        ws.on('close', () => {
          this.clients.delete(ws);
          log('info', `WebSocket client disconnected. Total clients: ${this.clients.size}`);
        });

        // Handle WebSocket errors
        ws.on('error', (error) => {
          log('error', 'WebSocket client error:', error);
        });

        // Heartbeat to detect broken connections
        ws.isAlive = true;
        ws.on('pong', () => {
          ws.isAlive = true;
        });
      } catch (error) {
        log('error', 'Error in connection handler:', error);
      }
    });

    // Handle server errors
    this.wss.on('error', (error) => {
      log('error', 'WebSocket server error:', error);
    });

    // Periodic heartbeat to detect broken connections
    this.heartbeatInterval = setInterval(() => {
      try {
        this.clients.forEach((ws) => {
          if (ws.isAlive === false) {
            return ws.terminate();
          }
          ws.isAlive = false;
          ws.ping();
        });
      } catch (error) {
        log('error', 'Error in heartbeat:', error);
      }
    }, 30000);
  }

  broadcast(data) {
    try {
      if (!data) return;
      const message = JSON.stringify(data);
      let successCount = 0;
      let errorCount = 0;

      this.clients.forEach((client) => {
        try {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
            successCount++;
          } else if (client.readyState === WebSocket.CLOSED) {
            this.clients.delete(client);
          }
        } catch (error) {
          log('error', 'Error sending to client:', error);
          errorCount++;
        }
      });

      if (errorCount > 0) {
        log('warn', `Broadcast errors: ${errorCount} clients, ${successCount} successful`);
      }
    } catch (error) {
      log('error', 'Error in broadcast:', error);
    }
  }

  sendToClient(client, data) {
    try {
      if (!client || !data) return;
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    } catch (error) {
      log('error', 'Error sending to client:', error);
    }
  }

  handleClientMessage(data, ws) {
    try {
      if (!data || !data.type) {
        log('warn', 'Invalid message data received');
        return;
      }

      log('info', 'Received message from client:', { type: data.type });

      switch (data.type) {
        case 'ping':
          this.sendToClient(ws, {
            type: 'pong',
            timestamp: new Date().toISOString(),
          });
          break;

        case 'subscribe':
          this.sendToClient(ws, {
            type: 'subscribed',
            channel: data.channel || 'default',
            timestamp: new Date().toISOString(),
          });
          break;

        case 'unsubscribe':
          this.sendToClient(ws, {
            type: 'unsubscribed',
            channel: data.channel || 'default',
            timestamp: new Date().toISOString(),
          });
          break;

        default:
          log('debug', `Unknown message type: ${data.type}`);
      }
    } catch (error) {
      log('error', 'Error handling client message:', error);
    }
  }

  close() {
    try {
      if (!this.isRunning) return;

      // Clear heartbeat interval
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }

      // Close all client connections
      this.clients.forEach((client) => {
        try {
          client.close();
        } catch (error) {
          log('error', 'Error closing client connection:', error);
        }
      });

      // Close server
      this.wss.close(() => {
        log('info', 'WebSocket server closed');
        this.isRunning = false;
      });
    } catch (error) {
      log('error', 'Error closing WebSocket server:', error);
    }
  }

  getClientCount() {
    return this.clients.size;
  }

  isHealthy() {
    return this.isRunning && this.wss && this.wss.clients;
  }
}

module.exports = WebSocketServer;
