/*
 *
 * # regex-stream
 *
 * This module will transform a string into stringified JSON object
 * It will input a stream, parse it according to a regular expression and output to a stream.
 *
 * # Example:
 *    var RegexStream = require('regex-stream')
 *    var regexStream = new RegexStream(parserConfig)
 *    util.pump(inputStream, regexStream)
 *    util.pump(regexStream, outputStream)
 *
 */

 /*jshint node:true, indent:2, globalstrict: true, asi: true, laxcomma: true, laxbreak: true */
 /*global module:true, require:true, console:true, process:true */

'use strict';

module.exports = RegexStream

var Stream = require('stream').Stream
  , util = require('util')
  , moment = require('moment')


/**
 *
 * Constructor is a single global object
 *
 * Available properties for `regexConfig` configuration object: 
 *
 *  `regexConfig.regex`               //regex to use when parsing
 *  `regexConfig.labels`              //list of names, for each field found with above
 *  `regexConfig.delimiter`           //regex used to find divisions between log entries
 *  `regexConfig.fields`              //object containing info on 'special' fields
 *  `regexConfig.fields.timestamp`    //currently the only implemented 'special' field. contains the [momentjs formatted](http://momentjs.com/docs/#/parsing/string-format/) regex for how to parse the timestamp.
 *  `regexConfig.fields.timestamp`.regex    //contains the regex mentioned above, eg. "DD/MMM/YYYY HH:mm:ss"
 *  `regexConfig.fields.timestamp`.type     //the type of timestamp, currently only "moment" is defined.
 *  `regexConfig.stringifyOutput      //will call 'JSON.stringify()' on everything before outputting it.
 *
 * @param {Object} regexConfig The regular expression configuration. 
 *
 */
function RegexStream(regexConfig) {
  
  // name of the application, defined in package.json, used for errors
  this._appName = require('./package').name
  this._version = require('./package').version
  this._errorPrefix = this._appName + ': '

  this.writable = true
  this.readable = true

  if (regexConfig && regexConfig.stringifyOutput) {
    this._stringifyOutput = true
  }
  else {
    this._stringifyOutput = false
  }

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
  if (typeof regexConfig !== 'undefined') {
    // if a regular expression config is defined, make sure required pieces are defined
    if (typeof regexConfig.regex === 'undefined') {
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


/**
 *
 * Parse a chunk and emit the parsed data. Implements writable stream method [stream.write(string)](http://nodejs.org/docs/latest/api/stream.html#stream_stream_write_string_encoding)
 * 
 * @param {String} data to write to stream (assumes UTF-8)
 * @return {boolean} true if written, false if it will be sent later
 *
 */
RegexStream.prototype.write = function (data) {
  // cannot write to a stream after it has ended
  if (this._ended)
    throw this._errorWriteAfterEnd

  // stream must be writable in order to write to it
  if (! this.writable) 
    throw this._errorUnwritable
  
  // stream must not be paused
  if (this._paused) 
    return false
  
  //always prepend whatever you have.
  data = this._buffer + data
  this._buffer = '';

  var lines = data.split(this._delimiter);

  //always save the last item.  the end method will always give us a final newline to flush this out.
  this._buffer = lines.pop()

  // loop through each all of the lines and parse
  for (var i = 0 ; i < lines.length ; i++) {
    var result
    if (lines[i] !== "") {
      try {
        // parse each line and emit the data (or error)
        if (this._hasRegex) {
          result = this._parseString(lines[i])
          //console.log( 'got a result of: ' + JSON.stringify(result))
          if (this._stringifyOutput) {
            result = JSON.stringify(result)
          }
          this.emit('data', result)
        }
        else {
          // just emit the original data
          result = lines[i]
          if (this._stringifyOutput && typeof result !== "string") {
            result = JSON.stringify(result)
          }
          this.emit('data', result)
        }
      }
      catch (err) {
        //console.log('some error emitted for some reason: ' + err)
        var error = new Error('RegexStream: parsing error - ' + err)
        this.emit('error', error)
      }
    }
    this._linecount += 1
  }
  
  return true   
}

/*
 *
 * Write optional parameter and terminate the stream, allowing queued write data to be sent before closing the stream. Implements writable stream method [stream.end(string)](http://nodejs.org/docs/latest/api/stream.html#stream_stream_end)
 *
 * @param {String} data The data to write to stream (assumes UTF-8)
 *
 */
RegexStream.prototype.end = function (str) {
  if (this._ended) return
  
  if (! this.writable) return

  if (arguments.length) {
    this.write(str)
  }

  //since we're done, there should be a single, complete item remaining in the buffer, so handle it.
  if (this._buffer !== "") {
    try {
      var result = this._parseString(this._buffer)
      this._buffer = ''
      if (this._stringifyOutput) {
        result = JSON.stringify(result)
      }
      this.emit('data', result)
    }
    catch (err) {
      this._buffer = ''
      var error = new Error('RegexStream: parsing error - ' + err)
      this.emit('error', error)
    }
  }
  
  this._ended = true
  this.readable = false
  this.writable = false

  this.emit('end')
  this.emit('close')
}

/*
 *
 * Destroy the stream. Stream is no longer writable nor readable. Implements writable stream method [stream.destroy()](http://nodejs.org/docs/latest/api/stream.html#stream_stream_destroy_1)
 *
 */
RegexStream.prototype.destroy = function () {
  if (this._destroyed) return
  
  this._destroyed = true
  this._ended = true

  this.readable = false
  this.writable = false

  this.emit('end')
  this.emit('close')
}

/*
 *
 * Pause the stream. Implements readable stream method [stream.pause()](http://nodejs.org/docs/latest/api/stream.html#stream_stream_pause)
 *
 */
RegexStream.prototype.pause = function () {
  if (this._paused) return
  
  this._paused = true
  this.emit('pause')
}

/*
 *
 * Resume stream after a pause, emitting a drain. Implements readable stream method [stream.resume()](http://nodejs.org/docs/latest/api/stream.html#stream_stream_resume)
 *
 */
RegexStream.prototype.resume = function () {
  if (this._paused) {
    this._paused = false
    this.emit('drain')
  }
}


/*
 *
 * Use the configured regular expression to parse the data
 * If data cannot be properly parsed, an error is emitted
 *
 * @param {String} data The string to parse with the regex passed to constructor
 * @return {Object} result The parsed object if successful, or empty object if not
 * @api private
 *
 */
RegexStream.prototype._parseString = function (data) {
  var result = {}
    , parseError = this._errorPrefix + 'error parsing string, "' + data + '", with parser, "' + this._regex + '"'
    , label
    , j
    , parsed

  if (this._regex) {
    parsed = this._regex.exec(data)

    for (j = 1 ; j < parsed.length ; j++) {
      label = this._labels[j - 1]
      
      // if a special field parser has been defined, use it - otherwise append to result
      if (this._fieldsRegex.hasOwnProperty(label)) {
        if (this._fieldsRegex[label].type === 'moment') {
          result[label] = this._parseMoment(parsed[j], this._fieldsRegex[label].regex)
        }
        else {
          this.emit('error', new Error(this._errorPrefix + this._fieldsRegex[label].type + ' is not a defined type.'))
        }
      }
      else {
        result[label] = parsed[j]
      }
    }

    if (result === {}) {
      this.emit('error', new Error(this._errorPrefix + parseError + ' - result was null'))
    }
  }
  else {
    result = data;
  }

  return result
}

/*
 *
 * Uses [Moment.js](http://momentjs.com/) to parse a string into a timestamp
 * If data cannot be properly parsed, an error is emitted
 * 
 * @param {String} string The string to parse
 * @param {String} formatter The formatter to use to parse
 * @return {Number} timestamp The number of *milliseconds* since the Unix Epoch
 * @api private
 *
 */
RegexStream.prototype._parseMoment = function (string, formatter) {

  // set to UTC by adding '+0000' to input string and 'ZZ' to format string
  if (! formatter.match(/\+Z+/)) {
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
    this.emit('error', new Error(this._errorPrefix + 'Timestamp parsing error. ' + err))
  }

  return false
}
