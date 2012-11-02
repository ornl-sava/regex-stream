var RegexStream = require('../regex-stream.js')
  , fs = require('fs')
  , path = require('path')
  , util = require('util')
  , tester = require('stream-tester')
  , should = require('should')
  , moment = require('moment')

describe('regex stream Tests', function() {

  before(function(done) {
    var outPath = path.join('test', 'output')
    fs.exists(outPath, function(exists) {
      if (exists) {
        fs.readdir(outPath, function(err, files) {
          if ( files && files.length ) {
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
        fs.mkdir(outPath, 0755, function(err) {
          done()
        })
      }
    })
  })

  describe('# simple stream test', function(){
    it('should pass pause-unpause stream tests', function(){
      pauseUnpauseStream()
    })
  })


  describe('# simple parse test', function(){
    it('should pass simple regular expression parsing', function(done){
      simpleRegex(done)
    })
  })

  describe('# timestamp parse test', function(){
    it('should pass moment timestamp parsing', function(done){
      timestampRegex(done)
    })
  })

}) 

//TODO - test invalid code, blank lines at end, etc.

var pauseUnpauseStream = function () {
  tester.createRandomStream(10000) //10k random numbers
    .pipe(tester.createUnpauseStream())
    .pipe(new RegexStream())
    .pipe(tester.createPauseStream())  
}

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
      , "stringifyOutput" : true
      }
    , expected = [
        {"A label":"23","B label":"45","C label":"67"}
      , {"A label":"89","B label":"12","C label":"34"}
      , {"A label":"56","B label":"78","C label":"90"}
      ]

  var regexStream = new RegexStream(parser)
  util.pump(dataStream, regexStream)
  util.pump(regexStream, outStream)

  outStream.on('close', function() {
    fs.readFile(outFile, function (err, data) {
      if (err) throw err
      //do a little cleanup of the data - this is fine, just putting it back into an array since we output items individually above.
      data = ''+data
      data = data.split('}{').join('},{')
      data = '[' + data + ']'
      //console.log(data)
      JSON.parse(data).should.eql(expected)
      done()
    })
  })
  
}

var timestampRegex = function (done) {
  // define the test data and output file
  var inFile = path.join('test', 'input', 'timestampRegexData.txt')
    , dataStream = fs.createReadStream(inFile, {encoding:'utf8'})
    , outFile = path.join('test', 'output', 'timestampRegexOutput.txt')
    , outStream = fs.createWriteStream(outFile, {encoding:'utf8'})
    , timeFormatter = "YYYY-MM-DD HH-mm-ss-Z"
    , parser = {
        "regex": "^([\\S\\s]+): ([\\S\\s]+)"
      , "labels": ["timestamp", "line"]
      , "fields": {
          "timestamp": {"regex": timeFormatter, "type": "moment"}
        }
      , "stringifyOutput" : true
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

  outStream.on('close', function() {
    fs.readFile(outFile, function (err, data) {
      if (err) throw err
      //do a little cleanup of the data - this is fine, just putting it back into an array since we output items individually above.
      data = ''+data
      data = data.split('}{').join('},{')
      data = '[' + data + ']'
      //console.log(data)
      JSON.parse(data).should.eql(expected)
      done()
    })
  })
    
}
