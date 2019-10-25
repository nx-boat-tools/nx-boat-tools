ROOT_DIR:=$(dir $(realpath $(lastword $(MAKEFILE_LIST))))

default:
	make -C ../base/dotnet/ template=console project-name=ConsoleTemplate out-dir=$(ROOT_DIR)files
	