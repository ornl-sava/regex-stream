

<!-- Start regex-stream.js -->

# regex-stream

This module will transform a string into stringified JSON object
It will input a stream, parse it according to a regular expression and output to a stream.

# Example:
   var RegexStream = require('regex-stream')
   var regexStream = new RegexStream(parserConfig)
   util.pump(inputStream, regexStream)
   util.pump(regexStream, outputStream)

shint node:true, indent:2, globalstrict: true, asi: true, laxcomma: true, laxbreak: true

lobal module:true, require:true, console:true, process:true

## RegexStream(regexConfig)

Constructor is a single global object

Available properties for `regexConfig` configuration object: 

 `regexConfig.relativeTime`        //if true, will output the results in 'relative time', meaning with a delay of the entry's timestamp minus the startTime argument below.
 `regexConfig.startTime`           //will ignore entries before this time.  specified in seconds, unix-style
 `regexConfig.endTime`             //will ignore entries after this time.  specified in seconds, unix-style
 `regexConfig.regex`               //regex to use when parsing
 `regexConfig.labels`              //list of names, for each field found with above
 `regexConfig.delimiter`           //regex used to find divisions between log entries
 `regexConfig.fields`              //object containing info on 'special' fields
 `regexConfig.fields.timestamp`    //currently the only implemented 'special' field. contains the [momentjs formatted](http://momentjs.com/docs/#/parsing/string-format/) regex for how to parse the timestamp.
 `regexConfig.fields.timestamp`.regex    //contains the regex mentioned above, eg. &quot;DD/MMM/YYYY HH:mm:ss&quot;
 `regexConfig.fields.timestamp`.type     //the type of timestamp, currently only &quot;moment&quot; is defined.

### Params: 

* **Object** *regexConfig* The regular expression configuration.

## write(data)

Parse a chunk and emit the parsed data. Implements writable stream method [stream.write(string)](http://nodejs.org/docs/latest/api/stream.html#stream_stream_write_string_encoding)

### Params: 

* **String** *data* to write to stream (assumes UTF-8)

### Return:

* **boolean** true if written, false if it will be sent later

## end(data)

Write optional parameter and terminate the stream, allowing queued write data to be sent before closing the stream. Implements writable stream method [stream.end(string)](http://nodejs.org/docs/latest/api/stream.html#stream_stream_end)

### Params: 

* **String** *data* The data to write to stream (assumes UTF-8)

## destroy()

Destroy the stream. Stream is no longer writable nor readable. Implements writable stream method [stream.destroy()](http://nodejs.org/docs/latest/api/stream.html#stream_stream_destroy_1)

## pause()

Pause the stream. Implements readable stream method [stream.pause()](http://nodejs.org/docs/latest/api/stream.html#stream_stream_pause)

## resume()

Resume stream after a pause, emitting a drain. Implements readable stream method [stream.resume()](http://nodejs.org/docs/latest/api/stream.html#stream_stream_resume)

## _parseString(data)

Use the configured regular expression to parse the data
If data cannot be properly parsed, an error is emitted

### Params: 

* **String** *data* The string to parse with the regex passed to constructor

### Return:

* **Object** result The parsed object if successful, or empty object if not

## _parseMoment(string, formatter)

Uses [Moment.js](http://momentjs.com/) to parse a string into a timestamp
If data cannot be properly parsed, an error is emitted

### Params: 

* **String** *string* The string to parse

* **String** *formatter* The formatter to use to parse

### Return:

* **Number** timestamp The number of *milliseconds* since the Unix Epoch

<!-- End regex-stream.js -->

