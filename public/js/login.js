
function validateLogin() {
    var username = $("input[name=username]").val();
    var password = $("input[name=password]").val();
    $.ajax({
        type: 'POST',
        url: '/auth',
        data: {"username" : username, "password" : password},
        success: function(result) {
            if (typeof result.redirect == 'string') {
                window.location = result.redirect
            } else {
                $("#loginMessage").css('color', '#f02626')
                $("#loginMessage").html(result.message)
            }    
        }
    })
}

