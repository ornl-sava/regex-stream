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


function RegexStream (opts) {
  this.writable = true
  this.readable = true

  this._paused = this._ended = this._destroyed = false

  // set up options for parsing
  if ( typeof opts !== 'undefined' ) {
    this._regex = (typeof opts.regex !== 'undefined' ? opts.regex : '')

    //set up other options here
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
  
  
  
  // do something to the input
  var transformedStr = str
  
  this._emitData(transformedStr)
  
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
  // emit event
}

RegexStream.prototype._emitData = function (str) {
  this.emit('data', str)
}