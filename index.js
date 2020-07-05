
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



// ----------------
// ----- GETS -----
// ----------------

// GET for home page (landing page)
app.get('/', function(request, response) {
    console.log("Request for login page");
    response.render(publicDirectoryPath + 'views/home.html');
})


// GET for board page
app.get('/board', function(request, response) {
    var username = request.session.username;
    var userID = request.session.userID;
	if (request.session.loggedin) {
        // Get path for profile image
        sql.connect(config, function(err) {
            if (err) console.log(err);
            var dbConnection = new sql.Request();
            dbConnection.input('userID', sql.Int, userID);
            var query_sql = 'SELECT * FROM ProfileImagePaths WHERE UserID=@userID';
            dbConnection.query(query_sql).then(function(results) {
                if (results.recordset.length > 0) {
                    var imagePath = results.recordset[0]["ImagePath"];
                    response.render(publicDirectoryPath + 'views/board.html', {
                        username: username,
                        userID: userID,
                        imagePath: imagePath
                    });
                }
                else {
                    console.log("Could not retrieve image path.  Sending default path.");
                    var imagePath = "/img/user_imgs/default.png";
                    response.render(publicDirectoryPath + 'views/board.html', {
                        username: username,
                        userID: userID,
                        imagePath: imagePath
                    });
                }
            })
        })
	} else {
		response.send('Please login to view this page!');
	}
});


// GET for profile page
app.get('/profile', function(request, response) {
    var userID = request.session.userID;
    if (request.session.loggedin) {
        // Get data needed for this page
        sql.connect(config, function(err) {
            if (err) console.log(err);
            var dbConnection = new sql.Request();
            dbConnection.input('userID', sql.Int, userID);
            var query_sql = 'SELECT * FROM Users u join ProfileImagePaths pip on u.ID=@userID and pip.UserID=@userID';
            dbConnection.query(query_sql).then(function(results) {
                if (results.recordset.length > 0) {
                    var username = results.recordset[0]["Username"];
                    var firstName = results.recordset[0]["FirstName"];
                    var lastName = results.recordset[0]["LastName"];
                    var email = results.recordset[0]["Email"];
                    var imagePath = results.recordset[0]["ImagePath"];
                    response.render(publicDirectoryPath + 'views/profile.html', {
                        username: username,
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        userID: userID,
                        imagePath: imagePath
                    });
                } else {
                    console.log("Could not retrieve user data. Help plz");
                }
            })
        })
    } else {
        response.send('Please login to view this page!');
    }
});





// -----------------
// ----- POSTS -----
// -----------------




// POST method for authorizing login attempt
app.post('/auth', function(request, response) {
	var username = request.body.username;
    var password = request.body.password;
    sql.connect(config, function (err) {
        if (err) console.log(err);
        var dbConnection = new sql.Request();
        dbConnection.input('username', sql.VarChar, username);
        dbConnection.input('password', sql.VarChar, password);
        var query_sql = 'SELECT * FROM Users WHERE Username = @username AND Password = @password';
        dbConnection.query(query_sql).then(function(results) {
            if (results.recordset.length > 0) {
                request.session.loggedin = true;
                request.session.username = username;
                request.session.userID = results.recordset[0]["ID"];
                response.send({redirect: '/board'});
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
    var firstName = request.body.firstName;
    var lastName = request.body.lastName;
    var email = request.body.email;
    // open db connection
    sql.connect(config, function (err) {
        if (err) console.log(err);
        // initialize connection and parameters
        var dbConnection = new sql.Request();
        dbConnection.input('username', sql.VarChar, username);
        dbConnection.input('password', sql.VarChar, password);
        dbConnection.input('firstName', sql.VarChar, firstName);
        dbConnection.input('lastName', sql.VarChar, lastName);
        dbConnection.input('email', sql.VarChar, email);

        // First, look to see if this username is in use
        var sql_checkUsernameInUse = 'SELECT * FROM Users WHERE Username = @username';
        dbConnection.query(sql_checkUsernameInUse).then(function(usernameResults) {
            // If no results, username is available
            if (usernameResults.recordset.length == 0) {
                // Next, check if email is in use
                var sql_checkEmailInUse = 'SELECT * FROM Users WHERE Email = @email';
                dbConnection.query(sql_checkEmailInUse).then(function(emailResults) {
                    // If no results, email is not assigned to a different account
                    if (emailResults.recordset.length == 0) {
                        // And we can insert new account into table
                        var sql_insertUser = 'INSERT INTO Users(Username,Password,FirstName,LastName,Email) VALUES(@username,@password,@firstName,@lastName,@email); SELECT SCOPE_IDENTITY() AS ID'
                        dbConnection.query(sql_insertUser).then(function(insertResults) {
                            // Add entry to ProfileImagePaths, defaulted to the default image
                            var userID = insertResults.recordset[0]["ID"];
                            dbConnection.input('userID', sql.Int, userID);
                            dbConnection.input('imagePath', sql.VarChar, '/img/user_imgs/default.png');
                            console.log("Created user " + userID);
                            var sql_insertProfileImagePath = 'INSERT INTO ProfileImagePaths(UserID,ImagePath) VALUES (@userID,@imagePath)';
                            dbConnection.query(sql_insertProfileImagePath).then(function(insertResultsTwo) {
                                response.send({message: "Account created successfully!"});
                            })
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
    var notes = request.body.notes
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
        dbConnection.input('notes', sql.VarChar, notes);
        var sql_insertJobApplication = 'INSERT INTO JobApplications(UserID,CompanyName,JobTitle,DateApplied,BoardColumn,Notes) VALUES (@userID,@companyName,@jobTitle,@dateApplied,@column,@notes)'
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


app.post('/navToUserProfilePage', function(request, response) {
    var userID = request.body.userID;
    request.session.loggedin = true;
    request.session.userID = userID;
    response.send({redirect: '/profile'});
})


app.post('/navToBoardPage', function(request, response) {
    var userID = request.body.userID;
    var username = request.body.username;
    request.session.loggedin = true;
    request.session.userID = userID;
    request.session.username = username;
    response.send({redirect: '/board'});
})






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
            var sql_getJobApplications = 'SELECT * FROM JobApplications WHERE UserID=@userID ORDER BY DateApplied DESC';
            dbConnection.query(sql_getJobApplications).then(function(results) {
                io.to(room).emit('jobApplications', results.recordset);
            })
        })
    })
})



// Listen
server.listen(port, () => console.log(`App listening at http://localhost:${port}`));