const express = require('express');
const http = require("http");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static('public'));

const sessions = {};

io.on("connection", socket => {
  
  socket.on("boardResponse", board => {
    sessions[socket.session][sessions[socket.session].length-1]
      .emit("boardUpdate", board)
  })
  
  socket.on("login", session => {
    
    socket.session = session
    if(!sessions[session]){
      sessions[session] = [socket]
    }else{
      sessions[session].push(socket)
    }
    
    const length = sessions[session].length
    if(length > 1){
      sessions[session][0].emit("boardRequest")
    }else{
      socket.emit("init")
    }
    
    socket.emit("player", sessions[session].length < 3)
    
    socket.join(session)
  
    socket.emit("userCountUpdate", sessions[session].length)
    socket.broadcast.to(session).emit("userCountUpdate", sessions[session].length)
  
    socket.on("disconnect", () => {
      sessions[socket.session] = sessions[socket.session].filter(s => s !== socket)
      socket.broadcast.to(socket.session).emit("userCountUpdate", sessions[session].length)
    })
  
    socket.on("moveTo", (id, pos) => {
      socket.broadcast.to(socket.session).emit("moveTo", id, pos)
    })
  
    socket.on("reset", () => {
      socket.broadcast.to(socket.session).emit("reset")
    })
  
    socket.on("ajuste", (id) => {
      socket.broadcast.to(socket.session).emit("ajuste", id)
    })
  
    socket.on("eat", (eaterId, id) => {
      socket.broadcast.to(socket.session).emit("eat", eaterId, id)
    })
  })
})

server.listen(3000, () => {
  console.log('listening on localhost:3000');
});