
var socket = io();

userID = $("#userID").val();
username = $("#username-dropdown-button").html();


$("#to-do-tasks").sortable({ 
    items: "> li:not(:last)",
    update: function() {
        updateToDoListOrderAfterSort()
    }
});
$("#completed-tasks").sortable({
    update: function() {
        updateToDoListOrderAfterSort()
    }
});



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
function checkboxChange(clickedBox) {
    if (clickedBox.checked){
        var thisTaskID = $(clickedBox).parent().find('.taskID').html();
        // Update the task, sending it to Completed column ( = 1)
        updateToDoTask(thisTaskID, 1);
    } else {
        var thisTaskID = $(clickedBox).parent().find('.taskID').html();
        // Update the task, sending it to To Do column ( = 0)
        updateToDoTask(thisTaskID, 0);
    }
}

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


function updateToDoListOrderAfterSort() {
    var currToDoOrder = [];
    var currCompletedOrder = [];
    $('#to-do-tasks li').each(function() {
        if (!$(this).hasClass("new-task")) {
            currToDoOrder.push($(this).find(".taskID").html());
        }
    })
    $('#completed-tasks li').each(function() {
        if (!$(this).hasClass("new-task")) {
            currCompletedOrder.push($(this).find(".taskID").html());
        }
    })
    // Join the arrays into a comma separated string
    var newToDoOrder = currToDoOrder.join().toString();
    var newCompletedOrder = currCompletedOrder.join().toString();
    updateToDoListOrder("ToDoOrder", newToDoOrder);
    updateToDoListOrder("CompletedOrder", newCompletedOrder);
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
            var newTaskID = result.message;
            var currOrder = [];
            $('#to-do-tasks li').each(function() {
                if (!$(this).hasClass("new-task")) {
                    currOrder.push($(this).find(".taskID").html());
                }
            })
            var column = "ToDoOrder";
            currOrder.push(newTaskID.toString());
            var newOrder = currOrder.join().toString();
            updateToDoListOrder(column, newOrder);
        }
    })
}


// Function for updating a To Do List Task, in the event of a check or uncheck as completed
function updateToDoTask(taskID, destination) {
    $("#currentTaskID").val(taskID);
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
            var currToDoOrder = [];
            var currCompletedOrder = [];
            $('#to-do-tasks li').each(function() {
                if (!$(this).hasClass("new-task")) {
                    currToDoOrder.push($(this).find(".taskID").html());
                }
            })
            $('#completed-tasks li').each(function() {
                if (!$(this).hasClass("new-task")) {
                    currCompletedOrder.push($(this).find(".taskID").html());
                }
            })
            var taskID = $("#currentTaskID").val();
            if (currToDoOrder.includes(taskID)) {
                currCompletedOrder.push(taskID);
                var i = currToDoOrder.indexOf(taskID);
                currToDoOrder.splice(i, 1);
            }
            else {
                var i = currCompletedOrder.indexOf(taskID);
                currCompletedOrder.splice(i, 1);
                currToDoOrder.push(taskID);
            }

            // Join the arrays into a comma separated string
            var newToDoOrder = currToDoOrder.join().toString();
            var newCompletedOrder = currCompletedOrder.join().toString();
            updateToDoListOrder("ToDoOrder", newToDoOrder);
            updateToDoListOrder("CompletedOrder", newCompletedOrder);
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
            var currToDoOrder = [];
            var currCompletedOrder = [];
            $('#to-do-tasks li').each(function() {
                if (!$(this).hasClass("new-task")) {
                    currToDoOrder.push($(this).find(".taskID").html());
                }
            })
            $('#completed-tasks li').each(function() {
                if (!$(this).hasClass("new-task")) {
                    currCompletedOrder.push($(this).find(".taskID").html());
                }
            })
            if (currToDoOrder.includes(taskID)) {
                var i = currToDoOrder.indexOf(taskID);
                currToDoOrder.splice(i, 1);
                var column = "ToDoOrder";
                var newOrder = currToDoOrder.join().toString();
            } else {
                var i = currToDoOrder.indexOf(taskID);
                currToDoOrder.splice(i, 1);
                var column = "CompletedOrder";
                var newOrder = currCompletedOrder.join().toString();
            }
            updateToDoListOrder(column, newOrder);
        }
    })
}


// Function for updating the order of one of the To Do Lists
function updateToDoListOrder(column, newOrder) {
    console.log(column, newOrder);
    $.ajax({
        type: 'POST',
        url: '/updateToDoListOrder',
        data: {
            "userID": userID,
            "column": column,
            "newOrder": newOrder
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


// -------------------------
// ----- Socket Events -----
// -------------------------

// When the server sends list of job applications to the user
socket.on('to-do-tasks', (tasksData) => {
    var tasks = tasksData.tasks;
    var toDoOrder = tasksData.tasksOrder[0]["ToDoOrder"].split(',');
    var completedOrder = tasksData.tasksOrder[0]["CompletedOrder"].split(',');
    var toDoList = [];
    var completedList = [];
    for (var i in tasks) {
        if (tasks[i]["Completed"] == 0) {
            toDoList.push(tasks[i]);
        } else {
            completedList.push(tasks[i]);
        }
    }

    // Sort To Do Tasks
    tempToDoList = []
    for (var i in toDoOrder) {
        for (var j in toDoList) {
            if (toDoList[j]["ID"] == toDoOrder[i]) {
                tempToDoList.push(toDoList[j]);
            }
        }
    }
    toDoList = tempToDoList;

    // Sort Completed Tasks
    tempCompletedList = []
    for (var i in completedOrder) {
        for (var j in completedList) {
            if (completedList[j]["ID"] == completedOrder[i]) {
                tempCompletedList.push(completedList[j]);
            }
        }
    }
    completedList = tempCompletedList;

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
