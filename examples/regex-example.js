/*global require:true, console:true, process:true */
'use strict';

// this example parses the input text into json

var util = require('util')

var input = require('fs').createReadStream('./input/regex-example-data.txt', {encoding:'utf-8'})
  , output = require('fs').createWriteStream('./output/regex-example-out.txt', {encoding:'utf-8'})

var RegexStream = require('../regex-stream.js')

// define the regular expression
var firewallParser = {
    "regex": "^([\\S]+) ([\\S]+) ([\\S]+)"
  , "labels": ["A label", "B label", "C label"]
  , "delimiter": "\r\n|\n"
}

var regexStream = new RegexStream(firewallParser)

// pipe data from input file to the regexStream parser to stdout
util.pump(input, regexStream)
util.pump(regexStream, output)

// listen for errors
input.on('error', function(err) {
  console.log('Input Error '+ err)
  throw err
})

regexStream.on('error', function(err) {
  console.log('Regex Error '+ err)
  throw err
})