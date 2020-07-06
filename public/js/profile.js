
var socket = io();

username = $("#username-dropdown-button").html();
userID = $("#userID").val();
firstName = $("#firstName").val();
lastName = $("#lastName").val();
email = $("#email").val();

window.onload = function() {
    $("#profile-full-name").html(firstName + " " + lastName);
    $("#profile-email").html(email);
}



function showNewSkillInput() {
    $("#new-skill-btn").css({"display": "none"});
    $("#new-skill-input").css({"display": "inline-block"});
    $("#new-skill-input").focus();
}

function hideNewSkillInput() {
    $("#new-skill-input").val("");
    $("#new-skill-input").css({"display": "none"});
    $("#new-skill-btn").css({"display": "inline-block"});
}


// --------------------------------
// ----- Navigation Functions -----
// --------------------------------

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


// Function for navigation to Board page
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


// Function for navigation to To-Do List page
function navToToDoListPage() {
    $.ajax({
        type: 'POST',
        url: '/navToToDoListPage',
        data: {
            "userID": userID
        },
        success: function(result) {
            console.log("success")
            if (typeof result.redirect == 'string') {
                console.log("res redirect: " + result.redirect)
                window.location = result.redirect;
            }
        }
    })
}

// -----------------------------
// ----- Server POST Calls -----
// -----------------------------

function updateUserAbout() {
    var about = $("#profile-about").val();
    $.ajax({
        type: 'POST',
        url: '/updateUserAbout',
        data: {
            "userID": userID,
            "about": about
        }
    })
}


function addSkill() {
    var skill = $("#new-skill-input").val();
    hideNewSkillInput();
    if (skill != "") {
        $.ajax({
            type: 'POST',
            url: '/addSkillToUser',
            data: {
                "userID": userID,
                "skill": skill
            },
            success: function(result) {
                socket.emit('skills-refresh-request', {userID}, (error) => {
                    if (error) {
                        alert(error)
                        location.href = '/home'
                    }
                })
            }
        })
    }
}


function deleteSkill(clickedBtn) {
    skillHTML = $($(clickedBtn).parent()[0]).html();
    skill = skillHTML.slice(0, skillHTML.indexOf(" <button"));
    $.ajax({
        type: 'POST',
        url: '/deleteSkill',
        data: {
            "userID": userID,
            "skill": skill
        },
        success: function(result) {
            socket.emit('skills-refresh-request', {userID}, (error) => {
                if (error) {
                    alert(error)
                    location.href = '/home'
                }
            })
        }
    })
}


// -------------------------
// ----- Socket events -----
// -------------------------

// When the server sends list of skills to the user
socket.on('skills', (skills) => {
    skillsList = []
    if (skills != "") {
        skills = skills.split(',');
        skillsList = []
        for (var i in skills) {
            // Ignore first element (since list begins with comma)
            if (i != 0) {
                skillsList.push({"Skill": skills[i]});
            }
        }
    }
    // Render skills in appropriate paragraph
    const skillsTemplate = $("#skills-template").html();
    const skillsHTML = Mustache.render(skillsTemplate, {
        skillsList
    })
    $("#profile-skills").html(skillsHTML);
})


// When a user enters their profile page, sends user info to server
socket.emit('skills-refresh-request', {userID}, (error) => {
    if (error) {
        alert(error)
        location.href = '/home'
    }
})