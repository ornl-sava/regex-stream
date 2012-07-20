/*global require:true, console:true, process:true */
'use strict';

var input
  , output

input = require('fs').createReadStream('./in.txt', {encoding:'utf-8'})
output = require('fs').createWriteStream('./out.txt', {encoding:'utf-8'})

input.resume()
input.pipe(output)

// listen for stream end events
input.on('end', function() {
  console.log('Close input stream')
  output.end()
})
output.on('end', function() {
  console.log('Close output stream')
})

// listen for errors
input.on('error', function(err) {
  console.log('Input Error '+ err)
  throw err
})
output.on('error', function(err) {
  console.log('Output Error '+ err)
  throw err
})