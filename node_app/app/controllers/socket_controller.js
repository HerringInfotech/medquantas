module.exports.respond = function (socket) {
  // console.log('user connected');
  socket.on('connected', (data ) => {
    if (global.io) {
      global.io.emit("connected", data);
    } else {
      console.error("Socket connection error: 'global.io' is undefined.");
    }
  });

  socket.on('disconnect', function () {
    // console.log('user disconnected');
  });
};

