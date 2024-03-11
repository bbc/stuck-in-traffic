#!/bin/bash

set -e
set -x

remove() {
  npx sls remove -v --stage=${ENV}
}

configure() {
  npm ci
}

set_build_name() {
  echo setting build name...
  echo ${BRANCH_NAME} : ${ENV} > version.txt
}

go() {
  configure
  remove
  set_build_name
}

go