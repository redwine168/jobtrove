function validateForm() {
    // Retrieve input values from form
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;

    // Check to make sure each input is valid
    // If an input is invalid, set the 'goodToPost' var to false, which will prevent POST 
    var goodToPost = true;

    // Validate name 
    if (!validateUsername(username)) {
        event.preventDefault();
        goodToPost = false;
    }

    // Validate email 
    if (!validatePassword(password)) {
        goodToPost = false;
    }

    // if none of the validations failed 
    if (goodToPost) {
        console.log("Successful login");
    }
    return goodToPost
}


function validateUsername(username) {
    // First check that at least two characters were entered  
    if (username.length < 2) {
        // return false (and show error) if input is too short
        document.getElementById("username").style.borderColor = "red";
        document.getElementById("usernameErrorMessage").innerHTML = "Username must be at least two characters";
        return false;
    }
    // Reset input field to get rid of error messages if valid input is submitted
    document.getElementById("username").style.borderColor = "black";
    document.getElementById("usernameErrorMessage").innerHTML = "";
    return true;
}


function validatePassword(password) {
    // First check that at least two characters were entered  
    if (password.length < 2) {
        // return false (and show error) if input is too short
        document.getElementById("password").style.borderColor = "red";
        document.getElementById("passwordErrorMessage").innerHTML = "Password must be at least two characters";
        return false;
    }
    // Reset input field to get rid of error messages if valid input is submitted
    document.getElementById("password").style.borderColor = "black";
    document.getElementById("passwordErrorMessage").innerHTML = "";
    return true;
}

