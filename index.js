const app = require('express')();
const http = require('http').createServer(app);
const fs = require('fs');

const chessPage = fs.readFileSync("./chess.html")

app.get('/:party', (req, res) => {
  res.send(chessPage);
});

http.listen(3000, () => {
  console.log('listening on localhost:3000');
});