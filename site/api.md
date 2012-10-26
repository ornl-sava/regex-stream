---
layout: default
title: regex-stream API
---



<!-- Start regex-stream.js -->

shint node:true, indent:2, globalstrict: true, asi: true, laxcomma: true, laxbreak: true

lobal module:true, require:true, console:true, process:true

This module will transform a string into stringified JSON object
It will input a stream, parse it according to a regular expression and output to a stream.

# Example:
   var RegexStream = require('regex-stream')
   var regexStream = new RegexStream(parserConfig)
   util.pump(inputStream, regexStream)
   util.pump(regexStream, outputStream)

## RegexStream(regexConfig)

Constructor is a single global object

### Params: 

* **Object** *regexConfig* The regular expression configuration. Available options: 

## write(data)

Parse a chunk and emit the parsed data

### Params: 

* **String** *data* to write to stream (assumes UTF-8)

## end(data)

Write optional parameter and terminate the stream, allowing queued write data to be sent before closing the stream.

### Params: 

* **String** *data* The data to write to stream (assumes UTF-8)

## pause()

Pause the stream

## resume()

Resume stream after a pause, emitting a drain

## destroy()

Destroy the stream. Stream is no longer writable nor readable.

## parseString(data)

Use the configured regular expression to parse the data
If data cannot be properly parsed, an error is emitted

### Params: 

* **String** *data* The string to parse with the regex passed to constructor

### Return:

* **Object** result The parsed object if successful, or empty object if not

## parseMoment(string, formatter)

Uses [Moment.js](http://momentjs.com/) to parse a string into a timestamp
If data cannot be properly parsed, an error is emitted

### Params: 

* **String** *string* The string to parse

* **String** *formatter* The formatter to use to parse

### Return:

* **Number** timestamp The number of *milliseconds* since the Unix Epoch

<!-- End regex-stream.js -->

