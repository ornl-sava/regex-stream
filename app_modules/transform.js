
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

// fips codes
//  See Geocodes: http://www.census.gov/popest/geotopics.html
//  Also: http://www.census.gov/popest/archives/files/90s-fips.txt
var stateFipsFilePath = supportDataDir + '/' + 'states.json';
//var hhrCodeFilePath = supportDataDir + '/' + 'hhrs.json';
//var countyFipsFilePath = supportDataDir + '/' + 'counties.json';


// (synchronously) open up support data files for fips codes
var stateFips = JSON.parse( fs.readFileSync(stateFipsFilePath) );



// Perform transformations on each record in the raw data
var transformRecord = function (d, debug) {
    _.each(d, function(val, key, data) {

        // Add locale metadata
        if ( _s.trim(_s.capitalize(key)) === "State" ) {
            if ( debug ) { console.log('Appending state locale info.'); }
            var s = _.find(stateFips, function(obj) { return obj['Alpha'] == val; }); 
            data['Locale'] = _.isUndefined(s) ? '' : s['Name'];
            data['Locale Short'] = val;
            data['Locale Level'] = "State";
            var c = _.find(stateFips, function(obj) { 
                if ( val.length === 2) { 
                    return obj['Alpha'] == val;
                }
                else {
                    return obj['Name'] == val;   
                }
            }); 
            data['Locale State FIPS Code'] = _.isUndefined(c) ? '' : c['Code'];
        }
        else if ( _s.trim(_s.capitalize(key)) === "Hrr" ) {
            if ( debug ) { console.log('Appending HRR locale info.'); }
            data['Locale'] = val;
            data['Locale Short'] = val;
            data['Locale Level'] = "HospitalReferralRegion";
            data['Locale HRR Code'] = '';
        }
        else if (_s.trim(_s.capitalize(key)) === "County" ) {
            if ( debug ) { console.log('Appending County locale info.'); }
            data['Locale'] = val;
            data['Locale Short'] = val;
            data['Locale Level'] = "County";
            data['Locale County Code'] = '';
            data['Locale County FIPS Code'] = '';
        }

        // transform percentages from x.x% to 0.0xx
        if ( key.match(/percent/i) || val.match(/[\d\.]+\%/) ) { 
            var noPercent = _s.toNumber(parseFloat(val) / 100, 4); 
            if ( debug ) { console.log('Transform - ' + key + " : " + val + " -> " + noPercent); }
            data[key] = noPercent;
        }
        // remove dollar signs and commas from numbers
        else if ( val.match(/\$*[\d,]+/) ) { 
            var newVal = _s.toNumber(val.replace(/,/g, '').replace(/^\$/, ''), 2);
            if ( debug ) { console.log('Transform - ' + key + " : " + val + " -> " + newVal); }
            data[key] = newVal;
        }
        
        // other transformations 
        
        // Need to only add locale metadata if it isnt already there
        // Need to deal with National records 
        
    });
    return d;
};

// export for use in other node.js files
exports.transformRecord = transformRecord;