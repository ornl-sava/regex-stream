/*global module:true, require:true, console:true, process:true */

/*
  This module will transform a string into JSON
  It will input a stream, parse it according to a 
  regular expression and output to a stream
*/

'use strict';

module.exports = RegexStream

var Stream = require('stream').Stream
  , inherits = require('inherits')
  , moment = require('moment')


function RegexStream (regexConfig) {
  this.writable = true
  this.readable = true

  this._paused = this._ended = this._destroyed = false

  // set up options for parsing using a regular expression
  if ( typeof regexConfig !== 'undefined' ) {
    // if a regular expression config is defined, all of the pieces need to be defined
    if ( typeof regexConfig.regex === 'undefined' ) {
      this._hasRegex = false
      this.emit('error', new Error('RegexStream: regex not correctly set up'))
    }
    else {
      this._hasRegex = true
      this._regex = new RegExp(regexConfig.regex)
      this._timeRegex = regexConfig.timestamp
      this._labelsRegex = regexConfig.labels
      this._delimiter = regexConfig.delimiter
    }
  }
  else {
    this._hasRegex = false  // there is no regular expression
  }

  Stream.call(this)
  
  return this
}

inherits(RegexStream, Stream)



// assumes UTF-8
RegexStream.prototype.write = function (str) {
  if ( this._ended ) throw new Error('RegexStream: write after end')

  if ( ! this.writable ) throw new Error('RegexStream: not a writable stream')
  
  if ( this._paused ) return false
  
  var self = this
  if ( this._hasRegex ) {
    // parse the input string
    this._parse(str, function(err, json) {
      if ( err ) {
        self.emit('error', new Error('RegexStream: parsing error - ' + err))
      }
      else {
        self.emit('data', JSON.stringify(json))
      }
    })
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


//   callback(error, json)
RegexStream.prototype._parse = function (str, callback) {
  var result = {}
  var error = ''
  try{
    var parsed = this._regex.exec(str)
    if (parsed) {
      for (var i = 1; i < parsed.length; i++) {
        if (this._timeRegex !== '' && this._labelsRegex[i - 1] === 'timestamp')
          result[this._labelsRegex[i - 1]] = this._parseTime(parsed[i], this._timeRegex)
        else 
          result[this._labelsRegex[i - 1]] = parsed[i]
      }
    }
    else {
      error = 'Error parsing string\n  String: ' + str + '\n  Parser: ' + this._regex
    }
  }
  catch (err){
    error = err;
  }
  callback(error, result)
  
}

RegexStream.prototype._parseTime = function (string, rex) {
  var timestamp = moment(string+"+0000", rex+"ZZ")
  // if there is no year in the timestamp regex set it to this year
  if (! rex.match(/YY/))
    timestamp.year(moment().year())
  return timestamp.valueOf()
}
