var cradle = require('cradle');

var DEFAULT_DB_NAME = 'iom_test';
var DEFAULT_DB_HOST = 'http://127.0.0.1';
var DEFAULT_DB_PORT = 5984;
var DEFAULT_DB_OPTS = { cache: false, raw: false };

var dbOptions = DEFAULT_DB_OPTS; // not configurable
var dbName = DEFAULT_DB_NAME;
var dbHost = DEFAULT_DB_HOST;
var dbPort = DEFAULT_DB_PORT;



var db;
try {
    db = new(cradle.Connection)(dbHost,dbPort,dbOptions).database(dbName);
}
catch (err) {
    console.error('Unable to connect to a running CouchDB instance at '+ dbHost + ':' + dbPort + '/' + dbName);
    console.error('Check that the server is running and try again');
    console.error(err);
    process.exit(1);
}



// create db if it does not exist and load views and data
db.exists(function (err, exists) {
    if (err) { 
        console.error('Unable to check if CouchDB instance exists '+ dbHost + ':' + dbPort + '/' + dbName);
        console.error('Check that the server is running and try again');
        console.error(err);
        process.exit(1);
    }
    if ( ! exists ) {
        console.log('Creating database, ' + dbName + ', on ' + dbHost);
// 
//  CREATE FUNCTION IS NOT WORKING PROPERLY 
//
        db.create(function (err, res) {
            if ( err || res.ok === false ) { 
                console.error('Error creating database ' + dbName); 
                console.error(err);
                process.exit(1);
            }
        });
    }
    console.log("done");
});

