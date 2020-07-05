var socket = io();

userID = $("#userID").val();
username = $("#username-dropdown-button").html();


// Function for closing user info dropdown if click anywhere else in document
window.onclick = function(event) {
    if (!event.target.matches('.nav-bar-user-info')) {
        var dropdowns = document.getElementsByClassName("nav-bar-user-info-dropdown");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('nav-bar-user-info-dropdown-show')) {
                openDropdown.classList.remove('nav-bar-user-info-dropdown-show');
            }
        }
    }
}


// Function for opening new job application form
function openNewJobApplicationForm(clickedBtn) {
    var btnID = $(clickedBtn)[0].id;
    var today = new Date();
    var currentDate = today.toISOString().slice(0,10);
    if (btnID == "new-interested-job-application-btn") {
        $($("#new-interested-job-application-form").children()[4]).val(currentDate);
        $("#new-interested-job-application-form").css({
            'display': 'block'
        })
        $("#current-open-form").val("interested")
    }
    else if (btnID == "new-applied-job-application-btn") {
        $($("#new-applied-job-application-form").children()[4]).val(currentDate);
        $("#new-applied-job-application-form").css({
            'display': 'block'
        })
        $("#current-open-form").val("applied")
    }
    else if (btnID == "new-accepted-job-application-btn") {
        $($("#new-accepted-job-application-form").children()[4]).val(currentDate);
        $("#new-accepted-job-application-form").css({
            'display': 'block'
        })
        $("#current-open-form").val("accepted")
    }
    else if (btnID == "new-rejected-job-application-btn") {
        $($("#new-rejected-job-application-form").children()[4]).val(currentDate);
        $("#new-rejected-job-application-form").css({
            'display': 'block'
        })
        $("#current-open-form").val("rejected")
    } 
    else {
        console.log("Bad button click");
    }
    closeOtherJobApplicationForms(btnID);
}


// Function for closing new job application form
// Resets form values and hides the popup
function closeNewJobApplicationForm(clickedBtn) {
    var today = new Date();
    var currentDate = today.toISOString().slice(0,10);

    // Reset company name
    $($($(clickedBtn).parent()[0]).children()[1]).val("");

    // Reset job title
    $($($(clickedBtn).parent()[0]).children()[2]).val("");

    // Reset notes
    $($($(clickedBtn).parent()[0]).children()[3]).val("");

    // Reset date
    $($($(clickedBtn).parent()[0]).children()[4]).val(currentDate);

    // Hide form
    $($(clickedBtn).parent()[0]).css({
        "display": "none"
    })
}

// Function for closing all new job applications, other than the one opened
function closeOtherJobApplicationForms(btnID) {
    if (btnID == "new-interested-job-application-btn") {
        $("#new-applied-job-application-form").css({
            'display': 'none'
        })
        $("#new-accepted-job-application-form").css({
            'display': 'none'
        })
        $("#new-rejected-job-application-form").css({
            'display': 'none'
        })
    }
    else if (btnID == "new-applied-job-application-btn") {
        $("#new-interested-job-application-form").css({
            'display': 'none'
        })
        $("#new-accepted-job-application-form").css({
            'display': 'none'
        })
        $("#new-rejected-job-application-form").css({
            'display': 'none'
        })
    }
    else if (btnID == "new-accepted-job-application-btn") {
        $("#new-interested-job-application-form").css({
            'display': 'none'
        })
        $("#new-applied-job-application-form").css({
            'display': 'none'
        })
        $("#new-rejected-job-application-form").css({
            'display': 'none'
        })
    }
    else if (btnID == "new-rejected-job-application-btn") {
        $("#new-interested-job-application-form").css({
            'display': 'none'
        })
        $("#new-applied-job-application-form").css({
            'display': 'none'
        })
        $("#new-accepted-job-application-form").css({
            'display': 'none'
        })
    } 
}


// Function on window load
window.onload = function() {
    // update current date field of new job application form
    var today = new Date();
    var currentDate = today.toISOString().slice(0,10);
    $('input[name="dateApplied"]').val(currentDate)
}


// Function for showing error popup for bad job application submission
function showSubmissionErrorPopup(inputWithError, errorMessage) {
    var position = inputWithError.position();
    $("#bad-job-application-popup").offset(position);
    $("#bad-job-application-message").html(errorMessage);
    $("#bad-job-application-popup").css({
        'display': 'block'
    })
}


// Function for hiding submission error popup
function hideSubmissionErrorPopup() {
    $("#submission-error-message").html("")
    $("#bad-job-application-popup").css({
        'display': 'none'
    })
}


// Function for showing job application deletion popup
function showJobApplicationDeletionPopup(btn) {
    $("#delete-job-application-popup").offset($(btn).position());
    $("#delete-job-application-btn-yes").val($(btn).val());
    $("#delete-job-application-popup").css({
        'display': 'block'
    })
}

// Function for hiding job application deletion popup
function hideJobApplicationDeletionPopup() {
    $("#delete-job-application-popup").css({
        'display': 'none'
    })
}


// -----------------------------------------
// ----- Job Application Drag and Drop -----
// -----------------------------------------

// Function for when a drag begins
function onDragStart(event) {
    // Gets job application ID and its origin column, sets this data for transfer
    const jobApplicationID = $($($(event.target).children()[0]).children()[4]).html();
    const originColumn = $(event.target).parent()[0].id
    const dragData = {jobApplicationID: jobApplicationID, originColumn: originColumn}
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));

}

// Function for drag overs, prevents default
function onDragOver(event) {
    event.preventDefault();
}

// Function for when a drop occurs
function onDrop(event) {
    // Get the column that the drop occurred in, as well as the data from the initial drag event
    const dragData = JSON.parse(event.dataTransfer.getData('text'));
    const jobApplicationID = dragData.jobApplicationID;
    const originColumn = dragData.originColumn;
    const destColumn = $(event.target)[0].id;
    console.log("ID: " + jobApplicationID)
    console.log("origin: " + originColumn)
    console.log("dest: " + destColumn)
    // If application dragged to column different from where it started
    if (originColumn != destColumn) {
        updateJobApplicationColumn(jobApplicationID, destColumn);
    }
}

// --------------------------------------------
// ----- Job Application Enlarge on Click -----
// --------------------------------------------

function enlargeJobApplication(clickedDiv) {
    var position = $(clickedDiv).position();
    var backgroundColor = $(clickedDiv).css('background-color');
    console.log(backgroundColor);
    // Get info from clicked job application div
    var companyName = $($($(clickedDiv).children()).children()[0]).html();
    var jobTitle = $($($(clickedDiv).children()).children()[1]).html();
    var dateApplied = $($($(clickedDiv).children()).children()[2]).html();
    var notes = $($($(clickedDiv).children()).children()[3]).html();
    var jobApplicationID = $($($(clickedDiv).children()).children()[4]).html();
    $("#enlarged-job-application").offset(position);
    $(".delete-job-application-btn").val(jobApplicationID);
    $("#enlarged-job-application-company-name").html(companyName);
    $("#enlarged-job-application-job-title").html(jobTitle);
    $("#enlarged-job-application-date-applied").html(dateApplied);
    $("#enlarged-job-application-notes").html(notes);
    $("#enlarged-job-application").css({
        'display': 'block',
        'background-color': backgroundColor
    });
}

function hideEnlargedJobApplication() {
    $("#enlarged-job-application").css({
        'display': 'none',
    })
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


// Function to validate new job application when submitted
function validateNewJobApplication() {
    var form = $("#current-open-form").val();
    // Get form values
    var companyName = $($("#new-" + form + "-job-application-form").children()[1]).val();
    var jobTitle = $($("#new-" + form + "-job-application-form").children()[2]).val();
    var notes = $($("#new-" + form + "-job-application-form").children()[3]).val();
    var dateApplied = $($("#new-" + form + "-job-application-form").children()[4]).val();
    var column = $($("#new-" + form + "-job-application-form").children()[0]).val();
    var goodToPost = true;

    // Make sure date not in the future (only check if date is not empty)
    if (dateApplied != "") {
        var today = new Date().toISOString().slice(0,10);
        var dateInFuture = (new Date(dateApplied).toISOString().slice(0,10)) > today;
        if (dateInFuture) {
            return showSubmissionErrorPopup($("input[name=dateApplied]"), "Cannot select date in the future!");
        }
    }
    // If date is empty (which happens when Interested column is selected), put in today's date
    if (dateApplied == "") {
        dateApplied = new Date();
        // Set time to 12:00:00:00
        dateApplied.setHours(12, 0, 0, 0);
    }
    // Otherwise, we just need to make sure hours set to 12 (account for time zone shift from UTC)
    else {
        dateApplied = new Date(dateApplied + " 12:00:00");
    }
    // Do a final shift of time to make sure dates are stored in database at 12:00:00 UTC
    dateApplied = new Date(dateApplied.getTime() - dateApplied.getTimezoneOffset() * 60000);
    // Put date in format good for database
    dateApplied = dateApplied.toISOString();
    if (goodToPost) {
        $.ajax({
            type: 'POST',
            url: '/insertJobApplication',
            data: {
                "companyName" : companyName,
                "jobTitle" : jobTitle,
                "dateApplied": dateApplied,
                "userID": userID,
                "column": column,
                "notes": notes
            },
            success: function(result) {
                //console.log(result.message);
                closeNewJobApplicationForm();
                // Emit a homepage refresh request to get updated list of job applications
                socket.emit('homepage-refresh-request', {userID}, (error) => {
                    if (error) {
                        alert(error)
                        location.href = '/home'
                    }
                })
            }
        })
    }
}


// Function for deleting a job application
function deleteJobApplication(btn) {
    var jobApplicationID = $(btn).val();
    $.ajax({
        type: 'POST',
        url: '/deleteJobApplication',
        data: {
            "jobApplicationID": jobApplicationID
        },
        success: function(result) {
            //console.log(result.message);
            hideJobApplicationDeletionPopup();
            hideEnlargedJobApplication();
            // Emit a homepage refresh request to get updated list of job applications
            socket.emit('homepage-refresh-request', {userID}, (error) => {
                if (error) {
                    alert(error)
                    location.href = '/home'
                }
            })
        }
    })
}


// Update Job Application column
function updateJobApplicationColumn(jobApplicationID, destColumn) {
    var goodToPost = true;
    if (destColumn == "interested-column") {
        destColumn = "Interested"
    } else if (destColumn == "applied-column") {
        destColumn = "Applied"
    } else if (destColumn == "accepted-column") {
        destColumn = "Accepted"
    } else if (destColumn == "rejected-column") {
        destColumn = "Rejected"
    } else {
        console.log("Bad column name during drag and drop");
        console.log("Column name: " + destColumn)
        goodToPost = false;
    }
    // POST if everything is okay
    if (goodToPost) {
        $.ajax({
            type: 'POST',
            url: '/updateJobApplicationColumn',
            data: {
                "jobApplicationID": jobApplicationID,
                "destColumn": destColumn
            },
            success: function(result) {
                //console.log(result.message);
                // Emit a homepage refresh request to get updated list of job applications
                socket.emit('homepage-refresh-request', {userID}, (error) => {
                    if (error) {
                        alert(error)
                        location.href = '/home'
                    }
                })
            }
        })
    }
}




// -------------------------
// ----- Socket events -----
// -------------------------

// When the server sends list of job applications to the user
socket.on('jobApplications', (jobApplications) => {
    var interestedList = [];
    var appliedList = [];
    var acceptedList = [];
    var rejectedList = [];
    for (var i in jobApplications) {
        var d = new Date(jobApplications[i]["DateApplied"]);
        jobApplications[i]["DateApplied"] = d.toDateString();
        if (jobApplications[i]["BoardColumn"] == "Interested") {
            interestedList.push(jobApplications[i]);
        } else if (jobApplications[i]["BoardColumn"] == "Applied") {
            appliedList.push(jobApplications[i]);
        } else if (jobApplications[i]["BoardColumn"] == "Accepted") {
            acceptedList.push(jobApplications[i]);
        } else if (jobApplications[i]["BoardColumn"] == "Rejected") {
            rejectedList.push(jobApplications[i]);
        } else {
            console.log("Bad column name.");
        }
    }
    // Render job applications in Interested column
    const interestedListTemplate = document.querySelector('#interested-list-template').innerHTML
    const interestedColumn = document.querySelector('#interested-column')
    const interestedHtml = Mustache.render(interestedListTemplate, {
        interestedList
    })
    interestedColumn.innerHTML = interestedHtml;

    // Render job applications in Applied column
    const appliedListTemplate = document.querySelector('#applied-list-template').innerHTML
    const appliedColumn = document.querySelector('#applied-column')
    const appliedHtml = Mustache.render(appliedListTemplate, {
        appliedList
    })
    appliedColumn.innerHTML = appliedHtml;

    // Render job applications in Accepted column
    const acceptedListTemplate = document.querySelector('#accepted-list-template').innerHTML
    const acceptedColumn = document.querySelector('#accepted-column')
    const acceptedHtml = Mustache.render(acceptedListTemplate, {
        acceptedList
    })
    acceptedColumn.innerHTML = acceptedHtml;
    
    // Render job applications in Rejected column
    const rejectedListTemplate = document.querySelector('#rejected-list-template').innerHTML
    const rejectedColumn = document.querySelector('#rejected-column')
    const rejecetedHtml = Mustache.render(rejectedListTemplate, {
        rejectedList
    })
    rejectedColumn.innerHTML = rejecetedHtml;
})


// When a user enters their home page, sends user info to server
socket.emit('homepage-refresh-request', {userID}, (error) => {
    if (error) {
        alert(error)
        location.href = '/home'
    }
})
