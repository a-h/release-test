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

# Node.js Docker example.
docker build -t release-test:latest --progress plain ./node-docker-example/
# Login.
echo "Logging in as" ${GITHUB_USERNAME}
echo ${GITHUB_TOKEN} | docker login ghcr.io -u ${GITHUB_USERNAME} --password-stdin
# Tag.
docker tag release-test:latest ghcr.io/a-h/release-test:latest
docker tag release-test:latest ghcr.io/a-h/release-test:${VERSION}
docker push --all-tags ghcr.io/a-h/release-test
