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
  
  this._appName = require('./package').name

  this.writable = true
  this.readable = true

  this._paused = this._ended = this._destroyed = false

  this._buffer = ''
  
  // set up static errors
  this._errorBadConfig = new Error(this._appName + ': ' + 'regular expression configuration incorrect.')
  this._errorWriteAfterEnd = new Error(this._appName + ': ' + 'attempt to write to a stream that has ended.')
  this._errorUnwritable = new Error(this._appName + ': ' + 'attempt to write to a stream that is not writable.')
  
  
  // set up options for parsing using a regular expression
  if ( typeof regexConfig !== 'undefined' ) {
    // if a regular expression config is defined, all of the pieces need to be defined
    if ( typeof regexConfig.regex === 'undefined' ) {
      this._hasRegex = false
      this.emit('error', this._errorBadConfig)
    }
    else {
      this._hasRegex = true
      
      // required
      this._regex = new RegExp(regexConfig.regex)
      this._labels = regexConfig.labels
      
      // optional
      this._delimiter = new RegExp(regexConfig.delimiter || '\n') // default to split on newline
      this._fieldsRegex = regexConfig.fields || {}

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
    throw this._errorWriteAfterEnd

  if ( ! this.writable ) 
    throw this._errorUnwritable
  
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
    , results = []
  
  // this._buffer has any remainder from the last stream, prepend to the first of lines
  if ( this._buffer !== '') {
    data = this._buffer + data
    this._buffer = ''
  }

  // split using the delimiter
  lines = data.split(this._delimiter)

  // loop through each all of the lines and parse
  var i
  for ( i = 0 ; i < lines.length ; i++ ) {
    try {
      var result = {}
        , label
        , j
      var parsed = this._regex.exec(lines[i])
      if (parsed) {
        for ( j = 1 ; j < parsed.length ; j++ ) {
          
          label = this._labels[j - 1]
          
          // if a special field parser has been defined, use it - otherwise append to results
          if ( this._fieldsRegex.hasOwnProperty(label) ) {
            if ( this._fieldsRegex[label].type === 'moment' )
              result[label] = this._parseMoment(parsed[j], this._fieldsRegex[label].regex)
            else
              this.emit('error', new Error(this._appName + ': ' + this._fieldsRegex[label].type + ' is not a defined type.'))
          }
          else {
            result[label] = parsed[j]
          }
        }
        this.emit('data', JSON.stringify(result))
        results.push(result)
      }
      else {
        error =  new Error(this._appName + ': error parsing string\n  Line: ' + lines[i] + '\n  Parser: ' + this._regex)
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
// @return {Number} timestamp The number of *milliseconds* since the Unix Epoch
RegexStream.prototype._parseMoment = function (string, formatter) {

  // set to UTC by adding '+0000' to input string and 'ZZ' to format string
  if (! formatter.match(/\+Z+/) ) {
    string = string + '+0000'
    formatter = formatter + 'ZZ'
  }

  try {
    // parse using the formatter for moment
    var timestamp = moment(string, formatter)

    // if there is no year in the timestamp regex set it to this year
    if (! formatter.match(/YY/))
      timestamp.year(moment().year())

    return timestamp.valueOf()
    
  }
  catch (err) {
    this.emit('error', new Error(this._appName + ': Timestamp parsing error. ' + err))
  }

  return false
}
