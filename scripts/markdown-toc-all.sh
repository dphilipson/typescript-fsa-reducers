#!/bin/sh

# Needed for lint-staged if multiple .md files are changed since markdown-toc
# only accepts a single file argument.
for var in "$@"
do
    yarn markdown-toc -i "$var"
done
