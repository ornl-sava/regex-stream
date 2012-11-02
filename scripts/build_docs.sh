#!/bin/sh

# 
# Build docs
# 
# Use from npm by adding the following to the package.json
#
#    "scripts" : {
#     "docs": "./scripts/build_docs.sh"
#    }
# 
# And use with: `npm run-script docs`
#

#
# Build api doc from dox and copy to jekyll site as html
#
echo 'Building api doc...'
./node_modules/dox-foundation/bin/dox-foundation > doc/api.html < regex-stream.js
API_SRC=doc/api.html
API_DST=site/api.html
cp ${API_SRC} ${API_DST}


#
# Build test doc and add jekyll yaml front matter and copy to site
#
echo 'Building test doc...'
TESTS_SRC=doc/tests.md
TESTS_DST=site/tests.md
./node_modules/mocha/bin/mocha -R markdown > ${TESTS_SRC}
echo '---
layout: default
title: regex-stream tests
---
' > ${TESTS_DST}
cat ${TESTS_SRC} >> ${TESTS_DST}

#
# Copy README to site and add jekyll's yaml front matter and copy to site
#
echo 'Converting README to home page for project web site...'
INDEX_FILE=site/index.md
echo '---
layout: default
title: regex-stream
---
' > ${INDEX_FILE}
cat README.md >> ${INDEX_FILE}
