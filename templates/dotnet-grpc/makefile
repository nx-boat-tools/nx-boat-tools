ROOT_DIR:=$(dir $(realpath $(lastword $(MAKEFILE_LIST))))

default:
	rm -rf $(ROOT_DIR)files
	make -C ../dotnet-base/ template=grpc out-dir=../../packages/dotnet/src/generators/grpc/files/generated
	