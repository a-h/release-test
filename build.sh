#!/bin/sh
set -e

# Check environment.
if [ "${GITHUB_TOKEN}" = "" || "$GITHUB_TOKEN" != "ghp_*" ]
then
	echo "Missing GITHUB_TOKEN"
	return 1
fi
if [ "${GITHUB_USERNAME}" = "" ]
then
	echo "Missing GITHUB_USERNAME"
	return 1
fi
if [ "${VERSION}" = "" ]
then
	echo "Missing VERSION"
	return 1
fi

# TODO: Change these for your own project.
export REPO_OWNER="a-h"
export REPO_NAME="release-test"

# Build Node.js Docker example.
docker build -t ${REPO_NAME}:latest --progress plain ./node-docker-example/
# Login.
echo "Logging in as" ${GITHUB_USERNAME}
echo ${GITHUB_TOKEN} | docker login ghcr.io -u ${GITHUB_USERNAME} --password-stdin
# Tag.
docker tag ${REPO_NAME}:latest ghcr.io/${REPO_OWNER}/${REPO_NAME}:latest
docker tag ${REPO_NAME}:latest ghcr.io/${REPO_OWNER}/${REPO_NAME}:${VERSION}
docker push --all-tags ghcr.io/${REPO_OWNER}/${REPO_NAME}

# Set up CDK.
docker build -t ${REPO_NAME}:cdk-latest --progress plain ./cdk/
# Login.
echo "Logging in as" ${GITHUB_USERNAME}
echo ${GITHUB_TOKEN} | docker login ghcr.io -u ${GITHUB_USERNAME} --password-stdin
# Tag.
docker tag ${REPO_NAME}:cdk-latest ghcr.io/${REPO_OWNER}/${REPO_NAME}:cdk-latest
docker tag ${REPO_NAME}:cdk-latest ghcr.io/${REPO_OWNER}/${REPO_NAME}:cdk-${VERSION}
docker push --all-tags ghcr.io/${REPO_OWNER}/${REPO_NAME}
