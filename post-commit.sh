#!/bin/sh
echo 'Merging changes into gh-pages branch'
git stash -q --keep-index
git checkout gh-pages
git merge -s subtree master
git checkout master
git stash pop -q