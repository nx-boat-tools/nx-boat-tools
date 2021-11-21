ROOT_DIR:=$(dir $(realpath $(lastword $(MAKEFILE_LIST))))

# project-name = my-chart
out-dir = ../../packages/helm/src/generators/helm-local/files/generated

default:
	rm -rf $(out-dir)
	# rm -rf $(project-name)
	mkdir -p $(out-dir)
	helm create __className__

	mv "__className__/.helmignore" "__className__/__dot__helmignore";

	mv __className__/* ${out-dir}/
	rm -r __className__

	for f in $$(find "$(out-dir)" -type f); do mv "$$f" "$${f}.template"; done;
	# for f in $$(find "$(out-dir)" ! -name "$(project-name)"); do mv "$$f" "$${f//$(project-name)/__className__}"; done;
	for f in $$(find "$(out-dir)" -type f); do sed -i.bak 's/__className__/\<\%\= name \%\>/g' "$$f"; done;

	for f in $$(find "$(out-dir)" -type f -name "*.bak"); do rm -rf $$f; done;
