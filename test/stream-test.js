var RegexStream = require('../regex-stream.js')
  , fs = require('fs')
  , path = require('path')
  , util = require('util')
  , should = require('should')
  , moment = require('moment')

describe('regex stream Tests', function() {

  before(function(done) {
    var outPath = path.join('test', 'output')
    fs.exists(outPath, function(exists) {
      if (exists) {
        fs.readdir(outPath, function(err, files) {
          if ( files.length ) {
            for (var i = 0 ; i < files.length ; i++ ) {
              fs.unlink( path.join(outPath, files[i]), function(err) {
                if ( err )
                  throw err
              }) 
            }
          }
          done()
        })
      }
      else {
        done()
      }
    })
  })

  describe('# simple parse test', function(){
    it('should pass simple regular expression parsing', function(){
      simpleRegex()
    })
  })

  describe('# timestamp parse test', function(){
    it('should pass moment timestamp parsing', function(){
      timestampRegex()
    })
  })

}) 

//TODO - test invalid code, blank lines at end, etc.

var simpleRegex = function (done) {
  // define the test data and output file
  var inFile = path.join('test', 'input', 'simpleRegexData.txt')
    , dataStream = fs.createReadStream(inFile, {encoding:'utf8'})
    , outFile = path.join('test', 'output', 'simpleRegexOutput.txt')
    , outStream = fs.createWriteStream(outFile, {encoding:'utf8'})
    , parser = {
        "regex": "^([\\S]+) ([\\S]+) ([\\S]+)"
      , "labels": ["A label", "B label", "C label"]
      , "delimiter": "\r\n|\n"
      }
    , expected = [
        {"A label":"23","B label":"45","C label":"67"}
      , {"A label":"89","B label":"12","C label":"34"}
      , {"A label":"56","B label":"78","C label":"90"}
      ]

  var regexStream = new RegexStream(parser)
  util.pump(dataStream, regexStream)
  util.pump(regexStream, outStream)

  outStream.on('end', function() {
    fs.readFileSync(outFile).should.eql(expected)
  })
  
}

var timestampRegex = function (done) {
  // define the test data and output file
  var inFile = path.join('test', 'input', 'timestampRegexData.txt')
    , dataStream = fs.createReadStream(inFile, {encoding:'utf8'})
    , outFile = path.join('test', 'output', 'timestampRegexOutput.txt')
    , outStream = fs.createWriteStream(outFile, {encoding:'utf8'})
    , timeFormatter = "YYYY/MM/DD HH:MM:SS+Z"
    , parser = {
        "regex": "^([\\S\\s]+): ([\\S\\s]+)"
      , "labels": ["timestamp", "line"]
      , "fields": {
          "timestamp": {"regex": timeFormatter, "type": "moment"}
        }
      }
    , expected = [
        { timestamp: moment('2012/07/25 10:00:00+0000', timeFormatter).valueOf(), line: 'First line' }
      , { timestamp: moment('2012/07/25 14:14:14+0000', timeFormatter).valueOf(), line: 'Second line' }
      , { timestamp: moment('2012/07/26 07:00:00+0000', timeFormatter).valueOf(), line: 'Third line' }
      , { timestamp: moment('2012/07/26 07:07:07+0000', timeFormatter).valueOf(), line: 'Fourth line' }
      ]

  var regexStream = new RegexStream(parser)
  util.pump(dataStream, regexStream)
  util.pump(regexStream, outStream)

  outStream.on('end', function() {
    fs.readFileSync(outFile).should.eql(expected)
  })
    
}
