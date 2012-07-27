/*global module:true, require:true, console:true, process:true */

/*
  This module will transform a string into JSON string
  It will input a stream, parse it according to a 
  regular expression and output to a stream
*/

'use strict';

module.exports = RegexStream

var Stream = require('stream').Stream
  , util = require('util')
  , moment = require('moment')


function RegexStream (regexConfig) {
  this.writable = true
  this.readable = true

  this._paused = this._ended = this._destroyed = false

  this._buffer = ''
  
  // set up options for parsing using a regular expression
  if ( typeof regexConfig !== 'undefined' ) {
    // if a regular expression config is defined, all of the pieces need to be defined
    if ( typeof regexConfig.regex === 'undefined' ) {
      this._hasRegex = false
      this.emit('error', new Error('RegexStream: regex not correctly set up'))
    }
    else {
      this._hasRegex = true
      
      // required
      this._regex = new RegExp(regexConfig.regex)
      this._labelsRegex = regexConfig.labels
      
      // optional
      this._timeRegex = regexConfig.timestamp || ''
      this._delimiter = new RegExp(regexConfig.delimiter || '\n') // default to split on newline
    }
  }
  else {
    this._hasRegex = false  // there is no regular expression
  }

  Stream.call(this)
  
  return this
}

util.inherits(RegexStream, Stream)



// assumes UTF-8
RegexStream.prototype.write = function (str) {
  // cannot write to a stream after it has ended
  if ( this._ended ) 
    throw new Error('RegexStream: write after end')

  if ( ! this.writable ) 
    throw new Error('RegexStream: not a writable stream')
  
  if ( this._paused ) 
    return false
  
  var self = this

  // parse each line asynchronously and emit the data (or error)
  // TODO - empty funciton here b/c wanted a callback for testing, best if tests listen for events and get rid of the callback
  if ( this._hasRegex ) {
    this._parseString(str, function() {}) 
  }
  else {
    // just emit the original data
    self.emit('data', str)
  }
  
  return true  
}

RegexStream.prototype.end = function (str) {
  if ( this._ended ) return
  
  if ( ! this.writable ) return
  
  this._ended = true
  this.readable = false
  this.writable = false
  
  if ( arguments.length )
    this.write(str)

  this.emit('end')
  this.emit('close')
}

RegexStream.prototype.pause = function () {
  if ( this._paused ) return
  
  this._paused = true
  this.emit('pause')
}

RegexStream.prototype.resume = function () {
  if ( this._paused ) {
    this._paused = false
    this.emit('drain')
  }
}

RegexStream.prototype.destroy = function () {
  if ( this._destroyed ) return
  
  this._destroyed = true
  this._ended = true

  this.readable = false
  this.writable = false

  this.emit('end')
  this.emit('close')
}

RegexStream.prototype.flush = function () {
  this.emit('flush')
}


// callback is just used for testing
RegexStream.prototype._parseString = function (data, callback) {
  var lines = []
    , error = ''
    , result = {}
    , results = []
  
  // this._buffer has any remainder from the last stream, prepend to the first of lines
  if ( this._buffer !== '') {
    data = this._buffer + data
    this._buffer = '';
  }

  // split using the delimiter
  lines = data.split(this._delimiter);

  // loop through each all of the lines and parse
  for ( var i = 0 ; i < lines.length ; i++ ) {
    try {
      result = {}
      var parsed = this._regex.exec(lines[i])
      if (parsed) {
        for (var j = 1; j < parsed.length; j++) {
          if (this._timeRegex !== '' && this._labelsRegex[j - 1] === 'timestamp')
            result[this._labelsRegex[j - 1]] = this._parseTime(parsed[j], this._timeRegex)
          else 
            result[this._labelsRegex[j - 1]] = parsed[j]
        }
        this.emit('data', JSON.stringify(result))
        results.push(result)
      }
      else {
        error =  new Error('RegexStream: error parsing string\n  Line: ' + lines[i] + '\n  Parser: ' + this._regex)
        this.emit('error', error)
      }
    }
    catch (err){
      error = new Error('RegexStream: parsing error - ' + err)
      this.emit('error', error)
    }
  }
  
  // if not at end of file, save this line into this._buffer for next time
  if ( lines.length > 1 && this.readable )
    this._buffer = lines.pop()

  callback(error, results)
}

// Uses [Moment.js](http://momentjs.com/) to parse a string into a timestamp
// @return {Number} timestamp The number of milliseconds since the Unix Epoch
RegexStream.prototype._parseTime = function (string, rex) {
  var timestamp = moment(string+"+0000", rex+"ZZ")
  // if there is no year in the timestamp regex set it to this year
  if (! rex.match(/YY/))
    timestamp.year(moment().year())
  return timestamp.valueOf()
}
