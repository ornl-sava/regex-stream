var RegexStream = require('../regex-stream.js')
  , should = require('should')

describe('RegEx Parse Tests', function() {

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
  // define the test data
  var data = '23 45 67\n89 12 34\n56 78 90'

  // define the regular expression
  var parser = {
      "regex": "^([\\S]+) ([\\S]+) ([\\S]+)"
    , "labels": ["A label", "B label", "C label"]
    , "delimiter": "\r\n|\n"
  }

  var expected = [
    {"A label":"23","B label":"45","C label":"67"}
  , {"A label":"89","B label":"12","C label":"34"}
  , {"A label":"56","B label":"78","C label":"90"}
  ]

  var regexStream = new RegexStream(parser)
  regexStream._parseString(data, function(err, out) {
    if ( err )
      throw err
    out.should.eql(expected)
  })
  
}

var timestampRegex = function (done) {
  // define the test data
  var data = '2012/07/25 10:00:00: First line\n2012/07/25 14:14:14: Second line\n2012/07/26 07:00:00: Third line\n2012/07/26 07:07:07: Fourth line'

  // define the regular expression
  var parser = {
      "regex": "^([\\S\\s]+): ([\\S\\s]+)"
    , "labels": ["timestamp", "line"]
  }

  var expected = [
    { timestamp: '2012/07/25 10:00:00', line: 'First line' }
  , { timestamp: '2012/07/25 14:14:14', line: 'Second line' }
  , { timestamp: '2012/07/26 07:00:00', line: 'Third line' }
  , { timestamp: '2012/07/26 07:07:07', line: 'Fourth line' }
  ]

  var regexStream = new RegexStream(parser)
  regexStream._parseString(data, function(err, out) {
    if ( err )
      throw err
    out.should.eql(expected)
  })
  
}
