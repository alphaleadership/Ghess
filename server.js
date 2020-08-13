const express = require('express');
const http = require("http");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static('public'));

io.on("connection", socket => {
  socket.on("moveTo", (id, pos) => {
    socket.broadcast.emit("moveTo", id, pos)
  })
  socket.on("reset", () => {
    socket.broadcast.emit("reset")
  })
  socket.on("ajuste", (id) => {
    socket.broadcast.emit("ajuste", id)
  })
})

server.listen(3000, () => {
  console.log('listening on localhost:3000');
});