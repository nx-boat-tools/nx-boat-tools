ROOT_DIR:=$(dir $(realpath $(lastword $(MAKEFILE_LIST))))

default:
	rm -rf $(ROOT_DIR)files
	make -C ../base/dotnet/ template=classlib project-name=ClassLibraryTemplate out-dir=$(ROOT_DIR)files
	