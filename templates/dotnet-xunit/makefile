ROOT_DIR:=$(dir $(realpath $(lastword $(MAKEFILE_LIST))))

default:
	rm -rf $(ROOT_DIR)files
	make -C ../dotnet-base/ template=xunit out-dir=../../packages/dotnet/src/generators/test/files/generated/xunit
	