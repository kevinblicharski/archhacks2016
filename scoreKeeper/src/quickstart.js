
var wolfram = require('wolfram').createClient("YOURCLIENTKEY");

wolfram.query("Compton", function(err, result) {
    if(err) throw err
    console.log("Result: %j", result)
});
