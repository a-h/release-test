#!/bin/sh
if [ "${VERSION}" = "" ]
then
	echo "Missing VERSION"
	return 1
fi
git tag ${VERSION};
git push origin ${VERSION};
