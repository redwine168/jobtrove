var socket = io();

userID = $("#userID").val();

// Function for opening new job application form
// Makes popup visible
function openJobApplicationForm() {
    document.getElementById("job-application-popup-form").style.display = "block";
}


// Function for closing new job application form
// Resets form values and hides the popup
function closeJobApplicationForm() {
    var today = new Date();
    var currentDate = today.toISOString().slice(0,10);
    $('input[name="dateApplied"]').val(currentDate)
    $("input[name=companyName]").val("");
    $("input[name=jobTitle]").val("");
    document.getElementById("job-application-popup-form").style.display = "none";
    hideSubmissionErrorPopup();
}


// Function on window load -> update current date field of new job application form
window.onload = function() {
    var today = new Date();
    var currentDate = today.toISOString().slice(0,10);
    $('input[name="dateApplied"]').val(currentDate)
}


// Function for when Column selection changes -> update form options based on choice
$("#columnSelection").change(function() {
    var column = $(this).val();
    // If Interested selected, hide Date Applied input and label
    if (column == "Interested") {
        $("input[name=dateApplied]").val("");
        $("input[name=dateApplied]").hide();
        $("label[for=dateApplied]").hide();
    } 
    // Any other column, show Date Applied input and label, and set value to today's date
    else {
        var today = new Date();
        var currentDate = today.toISOString().slice(0,10);
        $('input[name="dateApplied"]').val(currentDate)
        $("input[name=dateApplied]").show();
        $("label[for=dateApplied]").show();
    }
})


// Function to validate new job application when submitted
function validateNewJobApplication() {
    // Get form values
    var companyName = $("input[name=companyName]").val();
    var jobTitle = $("input[name=jobTitle]").val();
    var dateApplied = $("input[name=dateApplied]").val();
    var userID = $("input[name=userID]").val();
    var columnDropdown = document.getElementById("columnSelection");
    var column = columnDropdown.options[columnDropdown.selectedIndex].value;
    
    var goodToPost = true;

    // Make sure date not in the future (only check if date is not empty)
    if (dateApplied != "") {
        var today = new Date().toISOString().slice(0,10);
        var dateInFuture = (new Date(dateApplied).toISOString().slice(0,10)) > today;
        if (dateInFuture) {
            return showSubmissionErrorPopup($("input[name=dateApplied]"), "Cannot select date in the future!");
        }
    }
    if (goodToPost) {
        $.ajax({
            type: 'POST',
            url: '/insertJobApplication',
            data: {
                "companyName" : companyName,
                "jobTitle" : jobTitle,
                "dateApplied": dateApplied,
                "userID": userID,
                "column": column
            },
            success: function(result) {
                console.log(result.message);
                closeJobApplicationForm();
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


// Function for showing error popup for bad job application submission
function showSubmissionErrorPopup(inputWithError, errorMessage) {
    var position = inputWithError.position();
    $("#bad-job-application-popup").offset(position);
    $("#submission-error-message").html(errorMessage)
    document.getElementById("bad-job-application-popup").style.display = "block";
}


// Function for hiding submission error popup
function hideSubmissionErrorPopup() {
    $("#submission-error-message").html("")
    document.getElementById("bad-job-application-popup").style.display = "none";
}


// When the server sends list of job applications for the user
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