
// Perform transformations on records


// Import node.js core modules
//  http://nodejs.org/docs/latest/api/
var fs = require('fs');


// Import 3rd party modules

// Import underscore module for collection manipulation and utils
//  http://documentcloud.github.com/underscore/
var _ = require('underscore');

// Import Underscore.string for string manipulation
//  https://github.com/epeli/underscore.string
// Import to separate object, 
//  because there are conflict functions (include, reverse, contains)
var _s = require('underscore.string');
// Mix in non-conflict functions to Underscore namespace
//var _.mixin(_.str.exports());
// All functions, include conflict, will be available through _.str object
//var _.str.include('Underscore.string', 'string'); // => true


// support files
var supportDataDir = './support_data';
var stateFipsFileName = 'states.json';
var stateFipsFilePath = supportDataDir + '/' + stateFipsFileName;

// (synchronously) open up support data files for fips codes
var stateFips = JSON.parse( fs.readFileSync(stateFipsFilePath) );



// Perform transformations on each record in the raw data
var transformRecord = function (d) {
    _.each(d, function(val, key, data) {

        // Add locale metadata
        if ( key === 'STATE' ) {
            var s = _.find(stateFips, function(obj) { return obj['Alpha'] == val; }); 
            data['Locale'] = _.isUndefined(s) ? '' : s['Name'];
            data['Locale Short'] = val;
            data['Locale Level'] = "State";
            var c = _.find(stateFips, function(obj) { return obj['Alpha'] == val; }); 
            data['Locale State FIPS Code'] = _.isUndefined(c) ? '' : c['Code'];
        }
        else if ( key === 'HHR' ) {
            data['Locale'] = val;
            data['Locale Short'] = val;
            data['Locale Level'] = "HospitalReferralRegion";
            data['Locale HRR Code'] = '';
        }

        // transform percentages from x.x% to 0.0xx
        if ( key.match(/\%/) ) { 
            newValue = Math.round( (parseFloat(val) / 100) * 1000 ) / 1000; 
            console.log(val + " --> " + newValue);
            data[key] = newValue;
        }
        
    });
    return d;
};

// export for use in other node.js files
exports.transformRecord = transformRecord;