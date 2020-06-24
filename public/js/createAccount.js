
function test() {
    $.ajax({
        type: 'POST',
        url: '/test',
        success: function(result) {
            alert(result.message)
        }
    })
}

test();