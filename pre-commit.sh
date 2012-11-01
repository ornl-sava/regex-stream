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


# 
# Build docs
# 

echo 'Building docs...'
${NPM} run-script docs

# Add generated docs to this commit
git add doc/

# Add jekyll yaml front matter to docs and copy to site
TESTS_SRC=doc/tests.md
TESTS_DST=site/tests.md
echo '---
layout: default
title: regex-stream tests
---
' > ${TESTS_DST}
cat ${TESTS_SRC} >> ${TESTS_DST}
git add ${TESTS_DST}

API_SRC=doc/api.html
API_DST=site/api.html
cp ${API_SRC} ${API_DST}
git add ${API_DST}

#
# Copy README to site and add jekyll's yaml front matter
#
INDEX_FILE=site/index.md
echo '---
layout: default
title: regex-stream
---
' > ${INDEX_FILE}
cat README.md >> ${INDEX_FILE}
git add ${INDEX_FILE}

git stash pop -q
