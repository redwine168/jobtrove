
const path = require("path");
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const sql = require('mssql');

// Additional setup and initialization
const app = express();
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
const server = http.createServer(app);
const port = process.env.PORT || 1337;
const publicDirectoryPath = path.join(__dirname, 'public/')
app.use(express.static(publicDirectoryPath))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
const io = socketio(server);

// GET for landing page
app.get('/', function(req, res) {
    console.log("Request for login page");
    res.sendFile(publicDirectoryPath + 'views/login.html');
})





app.listen(port, () => console.log(`App listening at http://localhost:${port}`));