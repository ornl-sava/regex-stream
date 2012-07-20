/*global require:true, console:true, process:true */
'use strict';

var input = process.stdin
  , output = process.stdout

input.resume()
input.pipe(output)
