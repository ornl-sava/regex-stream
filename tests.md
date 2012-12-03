---
layout: default
title: regex-stream tests
---

# TOC
   - [Stream Specification Tests](#stream-specification-tests)
     - [# writable stream-spec](#stream-specification-tests--writable-stream-spec)
     - [# readable stream-spec](#stream-specification-tests--readable-stream-spec)
     - [# through stream-spec](#stream-specification-tests--through-stream-spec)
   - [regex stream Tests](#regex-stream-tests)
     - [# simple stream test](#regex-stream-tests--simple-stream-test)
     - [# simple parse test](#regex-stream-tests--simple-parse-test)
     - [# timestamp parse test](#regex-stream-tests--timestamp-parse-test)
<a name=""></a>
 
<a name="stream-specification-tests"></a>
# Stream Specification Tests
<a name="stream-specification-tests--writable-stream-spec"></a>
## # writable stream-spec
should pass stream-spec validation for writable.

```js
writableStreamSpec(new RegexStream())
```

<a name="stream-specification-tests--readable-stream-spec"></a>
## # readable stream-spec
should pass stream-spec validation for readable.

```js
readableStreamSpec(new RegexStream())
```

<a name="stream-specification-tests--through-stream-spec"></a>
## # through stream-spec
should pass stream-spec validation for through.

```js
readableStreamSpec(new RegexStream())
```

<a name="regex-stream-tests"></a>
# regex stream Tests
<a name="regex-stream-tests--simple-stream-test"></a>
## # simple stream test
should pass pause-unpause stream tests.

```js
pauseUnpauseStream()
```

<a name="regex-stream-tests--simple-parse-test"></a>
## # simple parse test
should pass simple regular expression parsing.

```js
simpleRegex(done)
```

<a name="regex-stream-tests--timestamp-parse-test"></a>
## # timestamp parse test
should pass moment timestamp parsing.

```js
timestampRegex(done)
```

