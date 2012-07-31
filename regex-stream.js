/*global module:true, require:true, console:true, process:true */

/*
  This module will transform a string into JSON string
  It will input a stream, parse it according to a regular expression and output to a stream
  Create a new stream:
      var RegexStream = require('regex-stream')
      var regexStream = new RegexStream(parserConfig)
  Hook it into a stream:
      util.pump(inputStream, regexStream)
      util.pump(regexStream, outputStream)
*/

'use strict';

module.exports = RegexStream

var Stream = require('stream').Stream
  , util = require('util')
  , moment = require('moment')


// Constructor is a single global object
function RegexStream (regexConfig) {
  
  // name of the application, defined in package.json, used for errors
  this._appName = require('./package').name
  this._version = require('./package').version
  this._errorPrefix = this._appName + '(' + this._version + '): '

  this.writable = true
  this.readable = true

  this._paused = this._ended = this._destroyed = false

  this._buffer = ''
  
  // if there is no regular expression configuration, just pass the stream through
  this._hasRegex = false
  
  // set up static errors
  this._errorBadConfig = new Error(this._errorPrefix + 'regular expression configuration incorrect.')
  this._errorWriteAfterEnd = new Error(this._errorPrefix + 'attempt to write to a stream that has ended.')
  this._errorUnwritable = new Error(this._errorPrefix + 'attempt to write to a stream that is not writable.')
  
  
  // set up options for parsing using a regular expression
  if ( typeof regexConfig !== 'undefined' ) {
    // if a regular expression config is defined, make sure required pieces are defined
    if ( typeof regexConfig.regex === 'undefined' ) {
      this._hasRegex = false
      this.emit('error', this._errorBadConfig)
    }
    else {
      this._hasRegex = true
      
      // required configuration options
      this._regex = new RegExp(regexConfig.regex)
      this._labels = regexConfig.labels
      
      // optional configuration options
      this._delimiter = new RegExp(regexConfig.delimiter || '\n') // default to split on newline
      this._fieldsRegex = regexConfig.fields || {}

    }
  }

  Stream.call(this)
  
  return this
}

// inherit from [Stream](http://nodejs.org/docs/latest/api/stream.html)
util.inherits(RegexStream, Stream)



// parse a chunk and emit the parsed data (assumes UTF-8)
RegexStream.prototype.write = function (chunk) {
  // cannot write to a stream after it has ended
  if ( this._ended ) 
    throw this._errorWriteAfterEnd

  // stream must be writable in order to write to it
  if ( ! this.writable ) 
    throw this._errorUnwritable
  
  // stream must not be paused
  if ( this._paused ) 
    return false
  
  // parse each line and emit the data (or error) if a regex config was defined, or just output the string
  // TODO - empty funciton here b/c wanted a callback for testing, best if tests listen for events and get rid of the callback
  if ( this._hasRegex )
    this._parseString(chunk, function() {})
  else
    this.emit('data', chunk)
  
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


// use the configured regular expression to parse the data
// callback is just used for testing
RegexStream.prototype._parseString = function (data, callback) {
  var lines = []
    , error = ''
    , parseError = this._errorPrefix + 'error parsing string, "' + lines[i] + '", with parser, "' + this._regex + '"'
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
              this.emit('error', new Error(this._errorPrefix + this._fieldsRegex[label].type + ' is not a defined type.'))
          }
          else {
            result[label] = parsed[j]
          }
        }
        this.emit('data', JSON.stringify(result))
        results.push(result)
      }
      else {
        this.emit('error', new Error(parseError))
      }
    }
    catch (err){
      this.emit('error', new Error(parseError + ' -- ' + err))
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
