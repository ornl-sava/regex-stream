/*global require:true, console:true, process:true */
'use strict';

// this example doesnt actually do anything, just passes the data through

var util = require('util')

var input = require('fs').createReadStream('./input/simple.txt', {encoding:'utf-8'})

var RegexStream = require('../regex-stream.js')
var regexStream = new RegexStream()

// pipe data from input file to the regexStream parser to stdout
util.pump(input, regexStream)
util.pump(regexStream, process.stdout)

// listen for errors
input.on('error', function(err) {
  console.log('Input Error '+ err)
  throw err
})

regexStream.on('error', function(err) {
  console.log('Regex Error '+ err)
  throw err
})