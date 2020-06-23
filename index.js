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

// Connect to database
var config = {
    user: 'mealconnectionadmin',
    password: 'ifoundaway2020!',
    server: 'mealconnectiondb.database.windows.net',
    database: 'mealconnectiondb'
};

// Set folders for html, css, and js files
app.set('views', path.join(__dirname, '../public/views'))

// Get helper functions for socket.io
const { addUserChat, removeUserChat, getUserChat, getUsersInRoomChat } = require('./utils/usersAtRestaurantPage')

io.on('connection', (socket) => {

    socket.on('joinRestaurantPage', ({}, callback) => {
        const {error, user} = addUserRestaurantPage({id: socket.id})

    });

})






// GET for landing page
app.get('/', function(req, res) {
    console.log("Request for landing page");
    res.sendFile(publicDirectoryPath + 'views/landingPage.html');
})

// GET for restaurant page
app.get('/restaurant', function(req, res) {
    console.log("Request for restaurant page");
    sql.connect(config, function (err) {
        if (err) console.log(err);
        var request = new sql.Request();
        request.query('select * from Hospitals', function (err, recordset) {
            if (err) console.log(err);
            var x = recordset["recordset"][0];
            res.render(publicDirectoryPath + 'views/restaurant.html', data = x);
        });
    });
});

// GET for hospital page
app.get('/hospital', function(req, res) {
    console.log("Request for hospital page");
    res.sendFile(publicDirectoryPath + 'views/hospital.html');
});

//This server is running through the port 1337
server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
});