
const path = require("path");
const express = require('express');
var session = require('express-session');
const http = require('http');
const socketio = require('socket.io');
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const sql = require('mssql');

// Additional setup and initialization
var app = express();
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
const port = process.env.PORT || 1337;
const publicDirectoryPath = path.join(__dirname, 'public/');
app.use(express.static(publicDirectoryPath));
app.use(cookieParser());
const server = http.createServer(app);
const io = socketio(server);

// Database config
var config = {
    server: 'jobtrovedb.database.windows.net',
    user: 'troveadmin',
    password: 'Num168ber!',
    database: 'jobtrove'
};



// GET for login page
app.get('/', function(req, res) {
    console.log("Request for login page");
    res.sendFile(publicDirectoryPath + 'views/login.html');
})


app.post('/auth', function(request, response) {
	var username = request.body.username;
    var password = request.body.password;
    console.log(username + ", " + password);
	if (username && password) {
        sql.connect(config, function (err) {
            if (err) console.log(err);
            var dbConnection = new sql.Request();
            dbConnection.input('username', sql.VarChar, username);
            dbConnection.input('password', sql.VarChar, password);
            var query_sql = 'SELECT * FROM Users WHERE username = @username AND password = @password';
		    dbConnection.query(query_sql).then(function(results) {
                if (results.recordset.length > 0) {
                    request.session.loggedin = true;
                    request.session.username = username;
                    response.redirect('/home');
                } else {
                    response.send('Incorrect Username and/or Password!');
                }			
                response.end();
            });
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});


// GET for home
app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		response.send('Welcome back, ' + request.session.username + '!');
	} else {
		response.send('Please login to view this page!');
	}
	response.end();
});




app.listen(port, () => console.log(`App listening at http://localhost:${port}`));