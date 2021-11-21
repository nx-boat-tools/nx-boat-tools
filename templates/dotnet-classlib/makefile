ROOT_DIR:=$(dir $(realpath $(lastword $(MAKEFILE_LIST))))

default:
	rm -rf $(ROOT_DIR)files
	make -C ../dotnet-base/ template=classlib project-name=ClassLibraryTemplate out-dir=../../packages/dotnet/src/generators/classlib/files/generated
	