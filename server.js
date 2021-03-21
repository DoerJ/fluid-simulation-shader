var express = require('express');
var app = express();

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// looking for the root files
app.use(express.static(__dirname + '/'));

var server = require('http').Server(app);
const port = 5000;
server.listen(port, () => {
  console.log(`Listening to port ${port}...`);
})
