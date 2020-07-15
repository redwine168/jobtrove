
var socket = io();

userID = $("#userID").val();
username = $("#username-dropdown-button").html();


$("#to-do-tasks").sortable( { items: "> li:not(:last)" } );
$("#completed-tasks").sortable();
$("#to-do-tasks").disableSelection();



// Function for validating and adding a new To Do task
function addTask() {
    var taskName = $(".add-task-input").val();
    if (taskName != "") {
        createNewToDoTask(taskName);
    }
}

// Function for deleting a To Do task
function deleteTask(clickedBtn) {
    var thisTaskID = $(clickedBtn).parent().find('.taskID').html();
    deleteToDoTask(thisTaskID);
}

// Function when a task is marked as completed
$('.to-do-list-container').on('change','#to-do-tasks li input[type="checkbox"]',function(){
    if($(this).prop('checked')){
        var thisTaskID = $(this).parent().parent().find('.taskID').html();
        // Update the task, sending it to Completed column ( = 1)
        updateToDoTask(thisTaskID, 1);
    }
});

// Delete done task from "already done"
$('.to-do-list').on('click','.remove-item',function() {
    removeItem(this);
});

// Count tasks in To Do List
function countToDoTasks() {
    var count = $("#to-do-tasks li").length - 1;
    $('.to-do-tasks-count').html(count);
}

// Count tasks in Completed List
function countCompletedTasks(){
    var count = $("#completed-tasks li").length;
    $('.completed-tasks-count').html(count);
}




// -----------------------------
// ----- Server POST calls -----
// -----------------------------


// Function for navigation to User Profile Page
function navToUserProfilePage() {
    $.ajax({
        type: 'POST',
        url: '/navToUserProfilePage',
        data: {
            "userID": userID
        },
        success: function(result) {
            if (typeof result.redirect == 'string') {
                window.location = result.redirect;
            }
        }
    })
}

// Function for navigation to Board Page
function navToBoardPage() {
    $.ajax({
        type: 'POST',
        url: '/navToBoardPage',
        data: {
            "userID": userID,
            "username": username
        },
        success: function(result) {
            if (typeof result.redirect == 'string') {
                window.location = result.redirect;
            }
        }
    })
}


// Function for navigation to To-Do List Page
function navToToDoListPage() {
    $.ajax({
        type: 'POST',
        url: '/navToToDoListPage',
        data: {
            "userID": userID,
            "username": username
        },
        success: function(result) {
            if (typeof result.redirect == 'string') {
                window.location = result.redirect;
            }
        }
    })
}


// Function for creating a new To Do List Task
function createNewToDoTask(taskName) {
    $.ajax({
        type: 'POST',
        url: '/insertToDoTask',
        data: {
            "userID": userID,
            "taskName": taskName
        },
        success: function(result) {
            //console.log(result.message);
            // Emit a refresh request to get updated list of tasks
            socket.emit('to-do-list-refresh-request', {userID}, (error) => {
                if (error) {
                    alert(error)
                    location.href = '/to-do'
                }
            })
            countToDoTasks();
            countCompletedTasks();
        }
    })
}


// Function for updating a To Do List Task
function updateToDoTask(taskID, destination) {
    $.ajax({
        type: 'POST',
        url: '/updateToDoTask',
        data: {
            "taskID": taskID,
            "destination": destination
        },
        success: function(result) {
            //console.log(result.message);
            // Emit a refresh request to get updated list of tasks
            socket.emit('to-do-list-refresh-request', {userID}, (error) => {
                if (error) {
                    alert(error)
                    location.href = '/to-do'
                }
            })
            countToDoTasks();
            countCompletedTasks()
        }
    })
}


// Function for deleting a To Do List Task
function deleteToDoTask(taskID) {
    $.ajax({
        type: 'POST',
        url: '/deleteToDoTask',
        data: {
            "taskID": taskID
        },
        success: function(result) {
            //console.log(result.message);
            // Emit a refresh request to get updated list of tasks
            socket.emit('to-do-list-refresh-request', {userID}, (error) => {
                if (error) {
                    alert(error)
                    location.href = '/to-do'
                }
            })
            countToDoTasks();
            countCompletedTasks()
        }
    })
}


// -------------------------
// ----- Socket Events -----
// -------------------------

// When the server sends list of job applications to the user
socket.on('to-do-tasks', (tasks) => {
    var toDoList = [];
    var completedList = [];
    for (var i in tasks) {
        if (tasks[i]["Completed"] == 0) {
            toDoList.push(tasks[i]);
        } else {
            completedList.push(tasks[i]);
        }
    }
    // Render tasks in To Do list
    const toDoListTemplate = document.querySelector('#to-do-list-template').innerHTML
    const toDoTasksList = document.querySelector('#to-do-tasks')
    const toDoListHtml = Mustache.render(toDoListTemplate, {
        toDoList
    })
    toDoTasksList.innerHTML = toDoListHtml;

    // Render tasks in Completed list
    const completedListTemplate = document.querySelector('#completed-list-template').innerHTML
    const completedTasksList = document.querySelector('#completed-tasks')
    const completedListHtml = Mustache.render(completedListTemplate, {
        completedList
    })
    completedTasksList.innerHTML = completedListHtml;

    countToDoTasks();
    countCompletedTasks()
})

// When a user enters their home page, sends user info to server
socket.emit('to-do-list-refresh-request', {userID}, (error) => {
    if (error) {
        alert(error)
        location.href = '/to-do'
    }
})
