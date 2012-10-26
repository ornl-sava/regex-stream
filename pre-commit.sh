#!/bin/sh
# A pre-commit hook for git to lint JavaScript files with jshint
# @see https://github.com/jshint/jshint/


FILE=regex-stream.js
JSHINT=`which jshint`
JSHINT_EXISTS=$?
NPM=/usr/local/bin/npm


# Stash unstaged changes before running tests
git stash -q --keep-index

#
# If jshint script is available, run it
#

JSH_EXIT_CODE=0
if [[ ${JSHINT_EXISTS} -eq 0 ]]; then 
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
${NPM} test
TST_EXIT_CODE=$?

# mocha tests produces exit code of 0 if the code has no errors
if [[ ${TST_EXIT_CODE} -ne 0 ]]; then
  echo ""
  echo "Tests failed. Commit aborted."
fi

git stash pop -q

# Exit if any error codes
ERROR=$((${JSH_EXIT_CODE} + ${TST_EXIT_CODE}))
if [[ ${ERROR} -ne 0 ]]; then
  exit ${ERROR}
fi

# 
# Build docs
# 

${NPM} run-script docs