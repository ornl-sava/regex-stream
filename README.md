# Parse strings into JSON using regular expressions

This module will take in a string as a [stream](http://nodejs.org/docs/latest/api/stream.html), parse it using a [regular expression](https://developer.mozilla.org/en/JavaScript/Guide/Regular_Expressions), and output it to a JSON string as a stream.


## Install

npm install regex-stream


## Parse configuration

A parser is defined by a regular expression (`regex`) and an array of `labels`. You may optionally include a `delimiter` (default is `\n`) and a `timestamp` parser, which will use the [moment.js](http://momentjs.com/) library to parse a timestamp into a number representing the [milliseconds since the Unix Epoch](http://momentjs.com/docs/#/parsing/milliseconds-since-the-unix-epoch/), allowing greater precision than unix timestamp. See [the moment formatter docs](http://momentjs.com/docs/#/parsing/string-format/) for more.

    parser = {
        "regex": "^([\\S\\s]+): ([\\S]\\s+)$"
      , "labels": ["Time label", "Another label"]
      , "delimiter": "\r\n|\n"
      , "fields": {
          "Time label": {"regex": "YYYY/MM/DD HH:MM:SS", "type": "moment"}
        }
    }


## Usage

The parser will output JSON for each line (defined by a `delimiter`) in the file, where the keys for each associated value is defined by `labels` that are in the same order as the [parenthesized matches](https://developer.mozilla.org/en/JavaScript/Guide/Regular_Expressions#Using_Parenthesized_Substring_Matches). Lines that do not match the pattern will [emit](http://nodejs.org/docs/latest/api/events.html#events_class_events_eventemitter) (not throw) an error, so you can safely ignore it or do something when it happens.

This example just splits up the lines

    var util = require('util')
      , RegexStream = require('regex-stream')
      , input = require('fs').createReadStream('./data.txt', {encoding:'utf-8'})
      , parser = {
          "regex": "^([\\S]+) ([\\S]+) ([\\S]+)"
        , "labels": ["A label", "B label", "C label"]
      }
      , regexStream = new RegexStream(parser)

    // pipe data from input file to the regexStream parser to stdout
    util.pump(input, regexStream)
    util.pump(regexStream, process.stdout)


See the `examples` directory for more examples.

## Docs

Docs can be built with [docco](http://jashkenas.github.com/docco/), which creates an annotated source code document in `docs`:

    npm install docco -g
    docco regex-stream.js