/*global require:true, console:true, process:true */
'use strict';

var util = require('util')

var input = require('fs').createReadStream('./input/simple.txt', {encoding:'utf-8'})

var RegexStream = require('../regex-stream.js')
var regex = new RegexStream(' ')

// pipe data from input file to the regex parser to stdout
util.pump(input, regex)
util.pump(regex, process.stdout)

// you can also pipe the output to a file
util.pump(regex, require('fs').createWriteStream('./output/simple-out.txt', {encoding:'utf-8'}))

// listen for errors
input.on('error', function(err) {
  console.log('Input Error '+ err)
  throw err
})

regex.on('error', function(err) {
  console.log('Regex Error '+ err)
  throw err
})