
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
const io = socketio.listen(server)


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
    response.render(publicDirectoryPath + 'views/createAccount.html');
});


// GET for home
app.get('/home', function(request, response) {
    var username = request.session.username;
    var userID = request.session.userID;
	if (request.session.loggedin) {
        response.cookie = {username: request.session.username}
		response.render(publicDirectoryPath + 'views/home.html', {username: username, userID: userID});
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
                request.session.userID = results.recordset[0]["ID"];
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
    // open db connection
    sql.connect(config, function (err) {
        if (err) console.log(err);
        // initialize connection and parameters
        var dbConnection = new sql.Request();
        dbConnection.input('username', sql.VarChar, username);
        dbConnection.input('password', sql.VarChar, password);
        dbConnection.input('email', sql.VarChar, email);

        // First, look to see if this username is in use
        var sql_checkUsernameInUse = 'SELECT * FROM Users WHERE username = @username';
        dbConnection.query(sql_checkUsernameInUse).then(function(usernameResults) {
            // If no results, username is available
            if (usernameResults.recordset.length == 0) {
                // Next, check if email is in use
                var sql_checkEmailInUse = 'SELECT * FROM Users WHERE email = @email';
                dbConnection.query(sql_checkEmailInUse).then(function(emailResults) {
                    // If no results, email is not assigned to a different account
                    if (emailResults.recordset.length == 0) {
                        // And we can insert new account into table
                        var sql_insertUser = 'INSERT INTO Users(username,password,email) VALUES(@username,@password,@email)'
                        dbConnection.query(sql_insertUser).then(function(insertResults) {
                            response.send({message: "Account created successfully!"});
                        });
                    }
                    // If results, email is associated to another account
                    else {
                        response.send({message: "That email address is already in use!"});
                    }
                })
            }
            // If results, username is in use and attempt fails
            else {
                response.send({message: "Username not available!"});
            }
        })
    });
});


app.post('/insertJobApplication', function(request, response) {
    // Get input info
    var companyName = request.body.companyName;
    var jobTitle = request.body.jobTitle;
    var dateApplied = request.body.dateApplied;
    var userID = request.body.userID;
    var column = request.body.column;
    // open db connection
    sql.connect(config, function (err) {
        if (err) console.log(err);
        // initialize connection and parameters
        var dbConnection = new sql.Request();
        dbConnection.input('companyName', sql.VarChar, companyName);
        dbConnection.input('jobTitle', sql.VarChar, jobTitle);
        dbConnection.input('dateApplied', sql.VarChar, dateApplied);
        dbConnection.input('userID', sql.Int, userID);
        dbConnection.input('column', sql.VarChar, column);
        var sql_insertJobApplication = 'INSERT INTO JobApplications(UserID,CompanyName,JobTitle,DateApplied,BoardColumn) VALUES (@userID,@companyName,@jobTitle,@dateApplied,@column)'
        dbConnection.query(sql_insertJobApplication).then(function(insertResults) {
            response.send({message: "Job Application created successfully!"});
        });
    })
})


app.post('/deleteJobApplication', function(request, response) {
    // Get input info
    var jobApplicationID = request.body.jobApplicationID;
    // open db connection
    sql.connect(config, function (err) {
        if (err) console.log(err);
        // initialize connection and parameters
        var dbConnection = new sql.Request();
        dbConnection.input('jobApplicationID', sql.Int, jobApplicationID);
        var sql_deleteJobApplication = 'DELETE FROM JobApplications WHERE ID=@jobApplicationID';
        dbConnection.query(sql_deleteJobApplication).then(function(deletionResults) {
            response.send({message: "Job Application deleted successfully!"});
        });
    });
});


app.post('/updateJobApplicationColumn', function(request, response) {
    // Get input info
    var jobApplicationID = request.body.jobApplicationID;
    var destColumn = request.body.destColumn;
    // open db connection
    sql.connect(config, function (err) {
        if (err) console.log(err);
        // initialize connection and parameters
        var dbConnection = new sql.Request();
        dbConnection.input('jobApplicationID', sql.Int, jobApplicationID);
        dbConnection.input('destColumn', sql.VarChar, destColumn);
        var sql_updateJobApplicationColumn = 'UPDATE JobApplications SET BoardColumn=@destColumn WHERE ID=@jobApplicationID';
        dbConnection.query(sql_updateJobApplicationColumn).then(function(deletionResults) {
            response.send({message: "Job Application column updated successfully!"});
        });
    })
});




// --------------------
// ------ SOCKET ------
// --------------------

// When a user connects
io.on('connection', (socket) => {

    // When a user enters their homepage
    socket.on('homepage-refresh-request', (userInfo, callback) => {
        // Get user info and add socket to appropriate room
        var userID = userInfo.userID;
        var room = 'home' + userID;
        socket.join(room);

        // open db connection
        sql.connect(config, function(err) {
            if (err) console.log(err);
            // Initialize connection and parameters
            var dbConnection = new sql.Request();
            dbConnection.input('userID', sql.Int, userID);
            var sql_getJobApplications = 'SELECT * FROM JobApplications WHERE UserID=@userID';
            dbConnection.query(sql_getJobApplications).then(function(results) {
                socket.emit('jobApplications', results.recordset);
                io.to(room).emit('jobApplications', results.recordset);
            })
        })
    })
})



// Listen
server.listen(port, () => console.log(`App listening at http://localhost:${port}`));