var RegexStream = require('../regex-stream.js')
  , should = require('should')

describe('RegEx Parse Tests', function() {

  describe('# simple parse test', function(){
    it('should pass simple regular expression parsing', function(){
      simpleRegex()
    })
  })

}) 


var simpleRegex = function (done) {
  // define the test data
  var data = '23 45 67\n89 12 34\n56 78 90'

  // define the regular expression
  var parser = {
      "regex": "^([\\S]+) ([\\S]+) ([\\S]+)"
    , "labels": ["A label", "B label", "C label"]
    , "delimiter": "\r\n|\n"
  }

  var expected = {"A label":"23","B label":"45","C label":"67"}

  var regexStream = new RegexStream(parser)
  regexStream._parse(data, function(err, out) {
    if ( err )
      throw err
    out.should.eql(expected)
  })
  
}