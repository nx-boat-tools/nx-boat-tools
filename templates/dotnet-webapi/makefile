ROOT_DIR:=$(dir $(realpath $(lastword $(MAKEFILE_LIST))))

default:
	make -C ../base/dotnet/ template=webapi project-name=WebApiTemplate out-dir=$(ROOT_DIR)files
	