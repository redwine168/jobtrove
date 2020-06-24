
function validateLogin() {
    username = $("input[name=username]").val();
    password = $("input[name=password]").val();
    $.ajax({
        type: 'POST',
        url: '/auth',
        data: {"username" : username, "password" : password},
        success: function(result) {
            console.log("yair")
            if (typeof result.redirect == 'string') {
                window.location = result.redirect
            } else {
                alert(result.message)
            }    
        }
    })
}

