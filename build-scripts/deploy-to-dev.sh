#!/bin/bash

set -e
set -x

configure() {
  npm ci
  npm run test
}

deploy() {
  npx sls deploy -v --force --stage=${ENV}
}

set_build_name() {
  echo setting build name...
  echo ${BRANCH_NAME} : ${GIT_COMMIT:0:7} : ${ENV} > version.txt
}

go() {
  configure
  deploy
  set_build_name
}

go