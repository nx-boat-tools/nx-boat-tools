ROOT_DIR:=$(dir $(realpath $(lastword $(MAKEFILE_LIST))))

default:
	rm -rf $(ROOT_DIR)files
	make -C ../dotnet-base/ template=console project-name=ConsoleTemplate out-dir=../../packages/dotnet/src/generators/console/files/generated
	