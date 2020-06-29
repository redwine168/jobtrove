
function openLoginFormPopup(clickedBtn) {
    console.log(clickedBtn.id);
    console.log($(".login-form"))
    console.log($(".create-account-form"))
    if (clickedBtn.id == "open-login-form-btn") {
        console.log("1")
        $(".login-form").css({
            'display': 'block'
        })
        $(".create-account-form").css({
            'display': 'none'
        })
    } else if (clickedBtn.id == "open-create-account-form-btn") {
        console.log("2")
        $(".create-account-form").css({
            'display': 'block'
        })
        $(".login-form").css({
            'display': 'none'
        })
    }
    $("#login-form-popup").css({
        'display': 'block'
    })
}

function closeLoginFormPopup() {
    $("input[name=login-username]").val("");
    $("input[name=login-password]").val("");
    $("input[name=create-account-username]").val("");
    $("input[name=create-account-password]").val("");
    $("input[name=create-account-first-name]").val("");
    $("input[name=create-account-last-name]").val("");
    $("input[name=create-account-email]").val("");
    $("#login-message").text("");
    $("#create-account-message").text("");
    $("#login-form-popup").css({
        'display': 'none'
    })
}

function validateLogin() {
    var username = $("input[name=login-username]").val();
    var password = $("input[name=login-password]").val();
    $.ajax({
        type: 'POST',
        url: '/auth',
        data: {"username" : username, "password" : password},
        success: function(result) {
            if (typeof result.redirect == 'string') {
                window.location = result.redirect
            } else {
                $("#login-message").css('color', '#f02626')
                $("#login-message").html(result.message)
            }    
        }
    })
}

function createAccount() {
    username = $("input[name=create-account-username]").val();
    password = $("input[name=create-account-password]").val();
    firstName = $("input[name=create-account-first-name]").val();
    lastName = $("input[name=create-account-last-name]").val();
    email = $("input[name=create-account-email]").val();
    $.ajax({
        type: 'POST',
        url: '/insertUser',
        data: {
            "username" : username,
            "password" : password,
            "firstName" : firstName,
            "lastName" : lastName,
            "email" : email
        },
        success: function(result) {
            if (result.message == "Account created successfully!") {
                $("#create-account-message").css('color', '#53e332')
            } else {
                $("#create-account-message").css('color', '#f02626')
            }
            $("#create-account-message").html(result.message)
            if (result.message == "Account created successfully!") {
                setTimeout(function() {
                    closeLoginFormPopup();
                }, 1000)
            }
        }
    })
}

