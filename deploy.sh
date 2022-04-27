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
if [ "${AWS_SESSION_TOKEN}" = "" ]
then
	echo "Missing AWS_SESSION_TOKEN - is a role logged in?"
	exit 1
fi

# Deploy.
echo Running CDK deploy
echo REPO_OWNER=${REPO_OWNER} 
echo REPO_NAME=${REPO_NAME} 
echo VERSION=${VERSION} 
echo `env`
docker run -e AWS_SESSION_TOKEN -e REPO_OWNER -e REPO_NAME -e VERSION ghcr.io/${REPO_OWNER}/${REPO_NAME}:cdk-${VERSION} deploy --require-approval=never
