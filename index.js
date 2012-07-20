/*global require:true, console:true, process:true */
'use strict';

var JSONStream = require('JSONStream')

var input
  , parser
  , output

//input = process.stdin
//input = require('fs').createReadStream('./in.txt', {encoding:'utf-8'})
input = require('fs').createReadStream('./in.json', {encoding:'utf-8'})

parser = JSONStream.parse([true, 't'])

var stringify = JSONStream.stringify()

output = process.stdout
//output = require('fs').createWriteStream('./out.txt', {encoding:'utf-8'})


input.resume()
input.pipe(parser).pipe(stringify).pipe(output)


// for debugging
parser.on('data', function(data) {
  console.log('parsed:', data)
})


// listen for stream end events
/*
input.on('end', function() {
  console.log('Close input stream')
  output.end()
})
parser.on('end', function() {
  console.log('Close parser stream')
})
output.on('end', function() {
  console.log('Close output stream')
})
*/

// listen for errors
input.on('error', function(err) {
  console.log('Input Error '+ err)
  throw err
})
parser.on('error', function(err) {
  console.log('Parser Error '+ err)
  throw err
})
output.on('error', function(err) {
  console.log('Output Error '+ err)
  throw err
})