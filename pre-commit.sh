#!/bin/sh
# A pre-commit hook for git to lint JavaScript files with jshint
# @see https://github.com/jshint/jshint/


FILE=regex-stream.js
JSHINT=`which jshint`
JSHINT_EXISTS=$?
NPM=/usr/local/bin/npm


# Stash unstaged changes before running tests
#git stash -q --keep-index

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

TST_EXIT_CODE=1
./node_modules/mocha/bin/mocha -R TAP ./test/*-test.js 2>/dev/null | grep ' Tests' | grep -q '^not ok'
TST_EXIT_CODE=$((${TST_EXIT_CODE} - $?))

# if mocha test produces output that starts with 'not ok', then grep reports
# that the string was found (0), if no lines start with 'not ok', not found (1)
if [[ ${TST_EXIT_CODE} -ne 0 ]]; then
  echo ""
  echo "Tests failed. Commit aborted."
fi

#git stash pop -q

exit $((${JSH_EXIT_CODE} + ${TST_EXIT_CODE}))