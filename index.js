
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
app.get('/', function(request, response) {
    console.log("Request for login page");
    response.render(publicDirectoryPath + 'views/login.html');
})


// GET for account creation page page
app.get('/createAccount', function(request, response) {
    console.log("Request for account creation page");
    if (request.session.justCreatedAccount) {
        data = {
            "accountCreationAttempt" : true,
            "success": true,
            "message": "Account successfully created!"
        };
        response.render(publicDirectoryPath + 'views/createAccount.html', data);
    } else if (request.session.failureUsernameTaken) {
        data = {
            "accountCreationAttempt" : true,
            "success": false,
            "message": "Username already in use."
        };
        response.render(publicDirectoryPath + 'views/createAccount.html', data);
    } else {
        data = {
            "accountCreationAttempt" : false
        };
        response.render(publicDirectoryPath + 'views/createAccount.html', data);
    }
});


// GET for home
app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		response.render(publicDirectoryPath + 'views/home.html');
	} else {
		response.send('Please login to view this page!');
	}
	response.end();
});


// POST method for authorizing login attempt
app.post('/auth', function(request, response) {
	var username = request.body.username;
    var password = request.body.password;
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
                response.send({redirect: '/home'});
            } else {
                response.send({message: "Incorrect Username and/or Password!"});
            }			
        });
    });
});


// POST method for adding a new user to the database
app.post('/insertUser', function(request, response) {
    // Get input account info
    var username = request.body.username;
    var password = request.body.password;
    var email = request.body.email;
    if (username && password && email) {
        // open db connection
        sql.connect(config, function (err) {
            if (err) console.log(err);
            var dbConnection = new sql.Request();
            dbConnection.input('username', sql.VarChar, username);
            dbConnection.input('password', sql.VarChar, password);
            dbConnection.input('email', sql.VarChar, email);
            // First, see if 

            var query_sql = 'INSERT INTO Users(username,password,email) VALUES(@username,@password,@email)'
            dbConnection.query(query_sql).then(function(results) {
                if (results["rowsAffected"][0] > 0) {
                    request.session.justCreatedAccount = true;
                    response.redirect('/createAccount');
                }
                else {
                    request.session.failureUsernameTaken = true;
                    response.redirect('/createAccount');
                }
            });
        });
    } else {
        response.send('Please enter username, password, and email!');
		response.end();
    }
});


app.post('/test', function(request, response) {
    response.send({message: "omg!"})
})


app.listen(port, () => console.log(`App listening at http://localhost:${port}`));