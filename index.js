const app = require('./node_app/app');
const socketController = require('./node_app/app/controllers/socket_controller');
const http = require('http');

// Host and Port
const httpHost = 'localhost';
const httpPort = 6500;

// Create server
const server = http.createServer(app);

// Setup Socket.IO with CORS
const io = require('socket.io')(server, {
  cors: {
    origin: [
      "http://localhost:9000",
      "http://costing.atmedo.in",
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Global access if needed
global.io = io;

// Socket Controller
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);
  socketController.respond(socket);
});

// Start server
server.listen(httpPort, function () {
  console.log("Express server listening on port", httpPort);
});
console.log('Server listening on --> ' + httpHost + ':' + httpPort);
