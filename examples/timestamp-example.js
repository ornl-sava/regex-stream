/*global require:true, console:true, process:true */
'use strict';

// this example parses the input text into json

var util = require('util')
  , RegexStream = require('../regex-stream.js')
  , input = require('fs').createReadStream('./input/timestamp-example-data.txt', {encoding:'utf-8'})
  , parser = {
      "regex": "^([\\S\\s]+): ([\\S\\s]+)$"
    , "labels": ["Time label", "Another label"]
    , "delimiter": "\r\n|\n"
    , "fields": {
        "Time label": {"regex": "YYYY/MM/DD HH:MM:SS", "type": "moment"}
      }
  }
  , regexStream = new RegexStream(parser)

// pipe data from input file to the regexStream parser to stdout
util.pump(input, regexStream)
util.pump(regexStream, process.stdout)

// listen for errors
input.on('error', function(err) {
  console.log('Input Error '+ err)
})

regexStream.on('error', function(err) {
  console.log('Regex Error '+ err)
})