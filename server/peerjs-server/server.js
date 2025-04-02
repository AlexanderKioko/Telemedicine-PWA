const { ExpressPeerServer } = require('peer');
const express = require('express');
const https = require('https'); // Changed from http to https
const fs = require('fs');
const dotenv = require('dotenv');
const helmet = require('helmet');

// Load environment variables
dotenv.config();

const app = express();
app.use(helmet()); // Security headers

// SSL Configuration (for production)
const sslOptions = process.env.NODE_ENV === 'production' ? {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH)
} : null;

const server = sslOptions ? 
  https.createServer(sslOptions, app) : 
  require('http').createServer(app);

// Enhanced PeerServer Configuration
const peerServer = ExpressPeerServer(server, {
  debug: process.env.NODE_ENV !== 'production',
  path: '/peerjs',
  allow_discovery: false, // Disabled for security
  proxied: true, // Important if behind reverse proxy
  ssl: !!sslOptions,
  concurrent_limit: 100, // Prevent DDoS
  alive_timeout: 60000, // 60s heartbeat
  key: process.env.PEERJS_KEY || 'peerjs_secure_key' // Auth key
});

// Security Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use('/peerjs', peerServer);

// Error Handling
peerServer.on('connection', (client) => {
  console.log(`Client connected: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`Client disconnected: ${client.getId()}`);
});

const PORT = process.env.PEERJS_PORT || 9000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`PeerJS server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});