ROOT_DIR:=$(dir $(realpath $(lastword $(MAKEFILE_LIST))))

default:
	make -C ../dotnet-base/ template=webapi project-name=WebApiTemplate out-dir=$(ROOT_DIR)files
	