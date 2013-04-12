#!/bin/bash
set -e
export CWD=`pwd`
rm -rf $CWD/test/app/node_modules
cd $CWD/test/app && npm link ../..
cd $CWD/test/app && npm install
cd  $CWD/test && node run-tests.js



