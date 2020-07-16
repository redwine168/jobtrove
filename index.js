
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
                    var about = results.recordset[0]["About"];
                    var skills = results.recordset[0]["Skills"];
                    response.render(publicDirectoryPath + 'views/profile.html', {
                        username: username,
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        userID: userID,
                        imagePath: imagePath,
                        about: about,
                        skills: skills
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


// GET for To-Do List page
app.get('/to-do', function(request, response) {
    var userID = request.session.userID;
    var username = request.session.username;
    response.render(publicDirectoryPath + 'views/to-do.html', {
        userID: userID,
        username: username
    })
})





// -----------------
// ----- POSTS -----
// -----------------


// -----------------------
// ----- Users Table -----
// -----------------------


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
        dbConnection.input('about', sql.VarChar, "");
        dbConnection.input('skills', sql.VarChar, "");

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
                        var sql_insertUser = 'INSERT INTO Users(Username,Password,FirstName,LastName,Email,About,Skills) VALUES(@username,@password,@firstName,@lastName,@email,@about,@skills); SELECT SCOPE_IDENTITY() AS ID'
                        dbConnection.query(sql_insertUser).then(function(insertResults) {
                            // Add entry to ProfileImagePaths, defaulted to the default image
                            var userID = insertResults.recordset[0]["ID"];
                            dbConnection.input('userID', sql.Int, userID);
                            dbConnection.input('imagePath', sql.VarChar, '/img/user_imgs/default.png');
                            console.log("Created user " + userID);
                            var sql_insertProfileImagePath = 'INSERT INTO ProfileImagePaths(UserID,ImagePath) VALUES (@userID,@imagePath)';
                            dbConnection.query(sql_insertProfileImagePath).then(function(insertResultsTwo) {
                                // Add entry to ToDoListOrders
                                dbConnection.input('toDoOrder', sql.VarChar, '');
                                dbConnection.input('completedOrder', sql.VarChar, '');
                                var sql_insertToDoListOrder = 'INSERT INTO ToDoListOrders(UserID,ToDoOrder,CompletedOrder) VALUES (@userID,@toDoOrder,@completedOrder)';
                                dbConnection.query(sql_insertToDoListOrder).then(function(insertResultsThree) {
                                    response.send({message: "Account created successfully!"});
                                })
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


app.post('/updateUserAbout', function(request, response) {
    // Get input info
    var userID = request.body.userID;
    var about = request.body.about;
    // open db connection
    sql.connect(config, function (err) {
        if (err) console.log(err);
        // initialize connection and parameters
        var dbConnection = new sql.Request();
        dbConnection.input('userID', sql.Int, userID);
        dbConnection.input('about', sql.VarChar, about);
        var sql_updateUserAbout = 'UPDATE Users SET About=@about WHERE ID=@userID';
        dbConnection.query(sql_updateUserAbout).then(function(result) {
            response.send({message: "About updated successfully!"});
        });
    })
});


app.post('/addSkillToUser', function(request, response) {
    // Get input info
    var userID = request.body.userID;
    var skill = "," + request.body.skill;
    // open db connection
    sql.connect(config, function (err) {
        if (err) console.log(err);
        // initialize connection and parameters
        var dbConnection = new sql.Request();
        dbConnection.input('userID', sql.Int, userID);
        dbConnection.input('skill', sql.VarChar, skill);
        var sql_addSkillToUser = 'UPDATE Users SET Skills=Skills+@skill WHERE ID=@userID';
        dbConnection.query(sql_addSkillToUser).then(function(result) {
            response.send({message: "Skill added successfully!"});
        });
    })
})


app.post('/deleteSkill', function(request, response) {
    // Get input info
    var userID = request.body.userID;
    var skill = "," + request.body.skill;
    // open db connection
    sql.connect(config,function (err) {
        if (err) console.log(err);
        // initialize connection and parameters
        var dbConnection = new sql.Request();
        dbConnection.input('userID', sql.Int, userID);
        dbConnection.input('skill', sql.VarChar, skill);
        // First we must get the string contained in Skills column of Users table
        var sql_getUserSkills = 'SELECT * FROM Users WHERE ID=@userID';
        dbConnection.query(sql_getUserSkills).then(function(result) {
            var skillString = result.recordset[0]["Skills"];
            var newSkillString = skillString.replace(skill, "");
            // Now with the new updated skill string, put it back in table
            dbConnection.input('newSkillString', sql.VarChar, newSkillString);
            var sql_updateUserSkills = 'UPDATE Users SET Skills=@newSkillString WHERE ID=@userID';
            dbConnection.query(sql_updateUserSkills).then(function(result2) {
                response.send({message: "Skill deleted successfully!"});
            })
        })
    })
})



// ---------------------------------
// ----- JobApplications Table -----
// ---------------------------------

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


app.post('/updateJobApplication', function(request, response) {
    // Get input info
    var jobApplicationID = request.body.jobApplicationID; 
    var companyName = request.body.companyName; 
    var jobTitle = request.body.jobTitle; 
    var dateApplied = request.body.dateApplied; 
    var column = request.body.column; 
    var notes = request.body.notes;
    // open db connection
    sql.connect(config, function(err) {
        if (err) console.log(err);
        // initialize connection and parameters
        var dbConnection = new sql.Request();
        dbConnection.input('jobApplicationID', sql.Int, jobApplicationID);
        dbConnection.input('companyName', sql.VarChar, companyName);
        dbConnection.input('jobTitle', sql.VarChar, jobTitle);
        dbConnection.input('dateApplied', sql.VarChar, dateApplied);
        dbConnection.input('column', sql.VarChar, column);
        dbConnection.input('notes', sql.VarChar, notes);
        var sql_updateJobApplication = "UPDATE JobApplications SET CompanyName=@companyName, JobTitle=@jobTitle, DateApplied=@dateApplied, BoardColumn=@column, Notes=@notes WHERE ID=@jobApplicationID";
        // execute query
        dbConnection.query(sql_updateJobApplication).then(function(updateResults) {
            response.send({message: "Job Application updated successfully!"});
        })
    })
})


// Function for handling the update of a Job App column, which occurs from a drag and drop
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
        dbConnection.query(sql_updateJobApplicationColumn).then(function(result) {
            response.send({message: "Job Application column updated successfully!"});
        });
    })
});


// -------------------------
// ---- ToDoTasks Table ----
// -------------------------

app.post('/insertToDoTask', function(request, response) {
    // Get input info
    var userID = request.body.userID;
    var taskName = request.body.taskName;
    // open db connection
    sql.connect(config, function (err) {
        if (err) console.log(err);
        // initialize connection and parameters
        var dbConnection = new sql.Request();
        dbConnection.input('userID', sql.Int, userID);
        dbConnection.input('taskName', sql.VarChar, taskName);
        var sql_insertToDoTask = "INSERT INTO ToDoTasks(UserID,TaskName,Completed) VALUES (@userID,@taskName,0);  SELECT SCOPE_IDENTITY() AS ID";
        dbConnection.query(sql_insertToDoTask).then(function(results) {
            var taskID = results.recordset[0]["ID"];
            response.send({message: taskID});
        })
    })
})


app.post('/updateToDoTask', function(request, response) {
    // Get input info
    var taskID = request.body.taskID;
    var destination = request.body.destination;
    // open db connection
    sql.connect(config, function (err) {
        if (err) console.log(err);
        // initialize connection and parameters
        var dbConnection = new sql.Request();
        dbConnection.input('taskID', sql.Int, taskID);
        dbConnection.input('destination', sql.Int, destination);
        var sql_updateToDoTask = "UPDATE ToDoTasks SET Completed=@destination WHERE ID=@taskID";
        dbConnection.query(sql_updateToDoTask).then(function(results) {
            response.send({message: "Task successfully updated!"});
        })
    })
})


app.post('/deleteToDoTask', function(request, response) {
    // Get input info
    var taskID = request.body.taskID;
    // open db connection
    sql.connect(config, function (err) {
        if (err) console.log(err);
        // initialize connection and parameters
        var dbConnection = new sql.Request();
        dbConnection.input('taskID', sql.Int, taskID);
        var sql_deleteToDoTask = "DELETE FROM ToDoTasks WHERE ID=@taskID";
        dbConnection.query(sql_deleteToDoTask).then(function(results) {
            response.send({message: "To Do Task updated successfully!"});
        })
    })
})


// -------------------------------
// ---- ToDoListOrders Table -----
// -------------------------------

app.post('/updateToDoListOrder', function(request, response) {
    // Get input info
    var userID = request.body.userID;
    var column = request.body.column;
    var newOrder = request.body.newOrder;
    // open db connection
    sql.connect(config, function (err) {
        if (err) console.log(err);
        // initialize connection and parameters
        var dbConnection = new sql.Request();
        dbConnection.input('userID', sql.Int, userID);
        dbConnection.input('newOrder', sql.VarChar, newOrder);
        // First we need to get the current order for 
        if (column == "ToDoOrder") {
            var sql_selectCurrentOrder = "UPDATE ToDoListOrders SET ToDoOrder=@newOrder WHERE UserID=@userID";
        } else {
            var sql_selectCurrentOrder = "UPDATE ToDoListOrders SET CompletedOrder=@newOrder WHERE UserID=@userID";
        }
        dbConnection.query(sql_selectCurrentOrder).then(function(results) {
            response.send({message: "To Do List Order updated successfully!"});
        })
    })
})






// ----------------------------
// ----- Navigation POSTs -----
// ----------------------------

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


app.post('/navToToDoListPage', function(request, response) {
    var userID = request.body.userID;
    var username = request.body.username;
    request.session.loggedin = true;
    request.session.userID = userID;
    request.session.username = username;
    response.send({redirect: '/to-do'})
})






// --------------------
// ------ SOCKET ------
// --------------------

// When a user connects
io.on('connection', (socket) => {

    // When a user requests a refresh to their board page
    socket.on('board-refresh-request', (userInfo, callback) => {
        // Get user info and add socket to appropriate room
        var userID = userInfo.userID;
        var room = 'board' + userID;
        socket.join(room);

        // open db connection
        sql.connect(config, function(err) {
            if (err) console.log(err);
            // Initialize connection and parameters
            var dbConnection = new sql.Request();
            dbConnection.input('userID', sql.Int, userID);
            var sql_getJobApplications = 'SELECT * FROM JobApplications WHERE UserID=@userID ORDER BY DateApplied DESC';
            dbConnection.query(sql_getJobApplications).then(function(results) {
                io.to(room).emit('job-applications', results.recordset);
            })
        })
    })

    // When a user requests a refresh to their profile page (skills)
    socket.on('skills-refresh-request', (userInfo, callback) => {
        // Get user info and add socket to appropriate room
        var userID = userInfo.userID;
        var room = 'profile' + userID;
        socket.join(room);
        // open db connection
        sql.connect(config, function(err) {
            if (err) console.log(err);
            // Initialize connection and parameters
            var dbConnection = new sql.Request();
            dbConnection.input('userID', sql.Int, userID);
            var sql_getSkills = 'SELECT * FROM Users WHERE ID=@userID';
            dbConnection.query(sql_getSkills).then(function(results) {
                io.to(room).emit('skills', results.recordset[0]["Skills"]);
            })
        })
    })

    // When a user requests a refresh to their To-Do List page
    socket.on('to-do-list-refresh-request', (userInfo, callback) => {
        var userID = userInfo.userID;
        var room = 'todo' + userID;
        socket.join(room);
        // open db connection
        sql.connect(config, function(err) {
            if (err) console.log(err);
            // Initialize connection and parameters
            var dbConnection = new sql.Request();
            dbConnection.input('userID', sql.Int, userID);
            var sql_getToDoTasks = 'SELECT * FROM ToDoTasks WHERE UserID=@userID';
            dbConnection.query(sql_getToDoTasks).then(function(tasksResults) {
                var sql_getToDoListOrders = 'SELECT * FROM ToDoListOrders WHERE UserID=@userID';
                dbConnection.query(sql_getToDoListOrders).then(function(tasksOrderResults) {
                    io.to(room).emit('to-do-tasks', {tasks: tasksResults.recordset, tasksOrder: tasksOrderResults.recordset});
                })
            })
        })
    })

})



// Listen
server.listen(port, () => console.log(`App listening at http://localhost:${port}`));