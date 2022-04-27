#!/bin/sh
set -e

# Check environment.
if [ "${REPO_OWNER}" = "" ]
then
	echo "Missing REPO_OWNER"
	exit 1
fi
if [ "${REPO_NAME}" = "" ]
then
	echo "Missing REPO_NAME"
	exit 1
fi
if [ "${VERSION}" = "" ]
then
	echo "Missing VERSION"
	exit 1
fi

# Deploy.
echo Running CDK deploy
echo REPO_OWNER=${REPO_OWNER} 
echo REPO_NAME=${REPO_NAME} 
echo VERSION=${VERSION} 
cd cdk && cdk deploy --require-approval=never
