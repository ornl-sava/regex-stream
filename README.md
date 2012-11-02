[![Build Status](https://travis-ci.org/ornl-situ/regex-stream.png?branch=master)](https://travis-ci.org/ornl-situ/regex-stream)


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

Note, the moment parser ignores non-alphanumeric characters, see the [moment documentation](http://momentjs.com/docs/#/parsing/string-format/) for more about parsing dates.


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

## Development

If you are going to do development, you may want to use the [git pre-commit hook](http://git-scm.com/book/en/Customizing-Git-Git-Hooks), which will check the `regex-stream.js` file using [jshint](https://github.com/jshint/jshint) script (if you have it installed) and run the [mocha](visionmedia.github.com/mocha/) tests (mocha is in the git repo). If either of these fail, the commit wont work. To use the hook, from project directory, run:

    ln -s ../../scripts/pre-commit.sh .git/hooks/pre-commit

## Documentation

To build the documentation and prepare the github project pages site, run:

    npm run-script docs



# License

regex-stream is freely distributable under the terms of the MIT License.

Copyright (c) John R. Goodall (the "Original Author")

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS, THE U.S. GOVERNMENT, OR UT-BATTELLE BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
