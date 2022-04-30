#!/bin/sh
echo "tag.sh"
if [ "${VERSION}" = "" ]
then
	echo "Missing VERSION"
	return 1
fi
echo "Tagging with version" $VERSION
git tag ${VERSION};
git push origin ${VERSION};
