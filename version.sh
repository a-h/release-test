#!/bin/sh
echo "version.sh"
export VERSION=v1.0.`git rev-list --count HEAD`;
echo "Version:" $VERSION
