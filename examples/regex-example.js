/*global require:true, console:true, process:true */
'use strict';

// this example parses the input text into json

var util = require('util')

var input = require('fs').createReadStream('./input/firewall.csv', {encoding:'utf-8'})
  , output = require('fs').createWriteStream('./output/firewall-out.txt', {encoding:'utf-8'})

var RegexStream = require('../regex-stream.js')

// define the regular expression
var firewallParser = {
  "regex": "^(Line Number: \\d+){0,1},{0,1}([\\s\\S]+),([\\s\\S]+),([\\s\\S]+),([\\s\\S]+),([\\s\\S]+),([\\s\\S]+),([\\s\\S]+),([\\s\\S]+),([\\s\\S]+),([\\s\\S]+),([\\s\\S]+),([\\s\\S]+),([\\s\\S]+),([\\s\\S]+),([\\s\\S]+)"
  , "labels": ["lineNumber", "timestamp", "priority", "operation", "messageCode", "protocol", "sourceIP", "destIP", "sourceHostname", "destHostname", "sourcePort", "destPort", "destService", "direction", "connectionsBuilt", "connectionsTornDown"]
  , "timestamp": "DD/MMM/YYYY HH:mm:ss"
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