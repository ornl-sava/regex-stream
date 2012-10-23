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
// available options: 
//  regexConfig.relativeTime        //if true, will output the results in 'relative time', meaning with a delay of the entry's timestamp minus the startTime argument below.
//  regexConfig.startTime           //will ignore entries before this time.  specified in seconds, unix-style
//  regexConfig.endTime             //will ignore entries after this time.  specified in seconds, unix-style
//  regexConfig.regex               //regex to use when parsing
//  regexConfig.labels              //list of names, for each field found with above
//  regexConfig.delimiter           //regex used to find divisions between log entries
//  regexConfig.fields              //object containing info on 'special' fields
//  regexConfig.fields.timestamp    //currently the only implemented 'special' field. contains the regex for how to parse the timestamp.
//  regexConfig.fields.timestamp.regex    //contains the regex mentioned above, eg. "DD/MMM/YYYY HH:mm:ss"
//  regexConfig.fields.timestamp.type     //the type of timestamp, currently only "moment" is defined.
function RegexStream (regexConfig) {
  
  // name of the application, defined in package.json, used for errors
  this._appName = require('./package').name
  this._version = require('./package').version
  this._errorPrefix = this._appName + '(' + this._version + '): '

  this.writable = true
  this.readable = true

  this.relativeTime = false
  if(regexConfig && regexConfig.relativeTime && regexConfig.relativeTime === true)
    this.relativeTime = true

  this.hasTimestamp = false
  if(regexConfig && regexConfig.fields && regexConfig.fields.timestamp)
    this.hasTimestamp = true

  this.startTime = 0
  if(regexConfig && regexConfig.startTime) 
    this.startTime = regexConfig.startTime

  this.endTime = Number.MAX_VALUE 
  if(regexConfig && regexConfig.endTime) 
    this.endTime = regexConfig.endTime

  this._paused = this._ended = this._destroyed = false

  this._buffer = ''
  
  this._linecount = 0 //for debugging

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
  
  //always prepend whatever you have.
  data = this._buffer + data
  this._buffer = '';

  var lines = data.split(this._delimiter);

  //always save the last item.  the end method will always give us a final newline to flush this out.
  this._buffer = lines.pop()

  var self = this
  var emitDelayed = function(msg){
    var delay = msg.timestamp - (self.startTime*1000)
    //console.log('delay of ' + delay)
    setTimeout( function(){
        if(! self._ended){
          //console.log('emitting')
          self.emit('data', msg)
        }else{
          //console.log('not emitting, ended already')
        }
      }, delay )
  }

  // loop through each all of the lines and parse
  for ( var i = 0 ; i < lines.length ; i++ ) {
    if(lines[i] !== ""){
      try {
        // parse each line and emit the data (or error)
        if ( this._hasRegex ) {
          var result = this._parseString(lines[i])
          //console.log( 'got a result of: ' + JSON.stringify(result))
          if( ! this.hasTimestamp ){
            this.emit('data', result)
          }else{
            if( this.startTime < (result.timestamp/1000) && (result.timestamp/1000) < this.endTime ){
              if(this.relativeTime){
                emitDelayed(result)
              }else{
                this.emit('data', result)
              }
            }
          }
        }else{
          // just emit the original data
          this.emit('data', lines[i])
        }
      }catch (err){
        //console.log('some error emitted for some reason: ' + err)
        var error = new Error('RegexStream: parsing error - ' + err)
        this.emit('error', error)
      }
    }
    this._linecount += 1
  }
  
  return true   
}

RegexStream.prototype.end = function (str) {
  if ( this._ended ) return
  
  if ( ! this.writable ) return

  if ( arguments.length ){
    this.write(str)
  }

  //since we're done, presumably this is a single, complete item remaining in the buffer, so handle it.
  if(this._buffer !== ""){
    try {
      var result = this._parseString(this._buffer)
      this._buffer = ''
      this.emit('data', result)
    }catch (err){
      //console.log('some error emitted for some reason: ' + err)
      this._buffer = ''
      var error = new Error('asdf RegexStream: parsing error - ' + err)
      this.emit('error', error)
    }
  }
  
  this._ended = true
  this.readable = false
  this.writable = false

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
RegexStream.prototype._parseString = function (data) {
  var result = {}
  var error = ""
  var parseError = this._errorPrefix + 'error parsing string, "' + data + '", with parser, "' + this._regex + '"'
  var label
  var j
  var parsed

  parsed = this._regex.exec(data)

  for ( j = 1 ; j < parsed.length ; j++ ) {
    label = this._labels[j - 1]
    
    // if a special field parser has been defined, use it - otherwise append to result
    if ( this._fieldsRegex.hasOwnProperty(label) ) {
      if ( this._fieldsRegex[label].type === 'moment' ){
        result[label] = this._parseMoment(parsed[j], this._fieldsRegex[label].regex)
      }else{
        this.emit('error', new Error(this._errorPrefix + this._fieldsRegex[label].type + ' is not a defined type.'))
      }
    }
    else {
      result[label] = parsed[j]
    }
  }

  if( result === {}){
    this.emit('error', new Error(parseError + ': result was null'))
  }

  return result
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
