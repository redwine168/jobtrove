

function createAccount() {
    username = $("input[name=username]").val();
    password = $("input[name=password]").val();
    email = $("input[name=email]").val();
    $.ajax({
        type: 'POST',
        url: '/insertUser',
        data: {
            "username" : username,
            "password" : password,
            "email" : email
        },
        success: function(result) {
            if (result.message == "Account created successfully!") {
                $("#accountCreationMessage").css('color', '#53e332')
            } else {
                $("#accountCreationMessage").css('color', '#f02626')
            }
            $("#accountCreationMessage").html(result.message)
        }
    })
}