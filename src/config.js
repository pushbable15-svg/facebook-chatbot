require('dotenv').config();

module.exports = {
  facebook: {
    email: process.env.FACEBOOK_EMAIL,
    password: process.env.FACEBOOK_PASSWORD,
    appState: process.env.FACEBOOK_APP_STATE,
  },
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
  },
  websocket: {
    port: process.env.WS_PORT || 3001,
  },
  autoResponse: {
    enabled: process.env.AUTO_RESPONSE_ENABLED === 'true',
    delay: parseInt(process.env.AUTO_RESPONSE_DELAY) || 1000,
  },
  autoReact: {
    enabled: process.env.AUTO_REACT_ENABLED === 'true',
    type: process.env.AUTO_REACT_TYPE || 'love',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
