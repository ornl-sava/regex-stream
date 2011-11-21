


// convert ip string to a number
var ip2number = function (s) {
    var arr = s.split(".");
    var n = 0
    for (var i = 0; i < 4; i++) {
        n = n * 256
        n += parseInt(arr[i],10)
    }
    return n;
}

// check for valid host
var checkHost = function (val) {
    var valid = true;
//    if( val.match(/[0-9]+\./) ) {
//        var ipNum = ip2number(val);
//        if ( val <= 0 || val > 4294967295 ) { valid = false; }
//    }
    // check dns
    return valid;
}



exports.utilities = checkHost;