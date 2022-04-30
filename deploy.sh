#!/bin/sh
set -e

# Check environment.
echo "deploy.sh"
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
if [ "${GH_TOKEN_SECRET_ARN}" = "" ]
then
	echo "Missing GH_TOKEN_SECRET_ARN"
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
export AWS_ACCOUNT_ID=`aws sts get-caller-identity --query "Account" --output text`
echo AWS_REGION=${AWS_REGION}
echo AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}
docker run \
	-e AWS_DEFAULT_REGION \
	-e AWS_REGION \
	-e AWS_ACCOUNT_ID \
	-e AWS_ACCESS_KEY_ID \
	-e AWS_SECRET_ACCESS_KEY \
	-e AWS_SESSION_TOKEN \
	-e REPO_OWNER \
	-e REPO_NAME \
	-e VERSION \
	-e GH_TOKEN_SECRET_ARN \
	ghcr.io/${REPO_OWNER}/${REPO_NAME}:cdk-${VERSION} deploy --require-approval=never
