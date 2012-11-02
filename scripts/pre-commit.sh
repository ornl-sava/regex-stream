#!/bin/bash
#
# A git pre-commit hook for node.js projects to 
#   * lint JavaScript files with [jshint](https://github.com/jshint/jshint/)
#   * run [mocha](http://visionmedia.github.com/mocha/) tests from npm, as defined in package.json
#   * build docs (e.g. using docco or markdox), as defined in package.json
#
# package.json should have a scripts block that defines how to run tests and build docs:
#   "scripts" : {
#      "test": "./node_modules/mocha/bin/mocha -R spec"
#    , "docs": "./node_modules/markdox/bin/markdox -o doc/regex-stream.md regex-stream.js"
#    }


FILE=regex-stream.js
JSHINT=`which jshint`
JSHINT_EXISTS=$?
NPM=/usr/local/bin/npm

# Exit if npm is not installed
if [[ ! -x ${NPM} ]]; then
  echo 'npm must be installed.'
  exit 1
fi

# Stash unstaged changes before running tests
git stash -q --keep-index

#
# If jshint script is available, run it
#

JSH_EXIT_CODE=0
if [[ ${JSHINT_EXISTS} -eq 0 ]]; then 
  echo 'Linting ' ${FILE} '...'
  ${JSHINT} ${FILE}
  JSH_EXIT_CODE=$?
fi

# jshint produces exit code of 0 if it code is clean
if [[ ${JSH_EXIT_CODE} -ne 0 ]]; then
  echo ""
  echo "JSHint detected syntax problems. Commit aborted."
fi

#
# Run mocha tests
#

TST_EXIT_CODE=0
echo 'Running tests...'
${NPM} test
TST_EXIT_CODE=$?

# mocha tests produces exit code of 0 if the code has no errors
if [[ ${TST_EXIT_CODE} -ne 0 ]]; then
  echo ""
  echo "Tests failed. Commit aborted."
fi

# Exit if any error codes
ERROR=$((${JSH_EXIT_CODE} + ${TST_EXIT_CODE}))
if [[ ${ERROR} -ne 0 ]]; then
  git stash pop -q
  exit ${ERROR}
fi

git stash pop -q
