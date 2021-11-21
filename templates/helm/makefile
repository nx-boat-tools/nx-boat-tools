ROOT_DIR:=$(dir $(realpath $(lastword $(MAKEFILE_LIST))))

project-name = my-chart
out-dir = ../../packages/helm/src/generators/helm-local/files/generated

default:
	rm -rf $(ROOT_DIR)files
	rm -rf $(out-dir)
	helm create ${project-name}

	mkdir -p $(out-dir)
	mv ${project-name}/{*,.[^.]*} ${out-dir}/
	rm -r $(project-name)

	for f in $$(find "$(out-dir)" -type f); do mv "$$f" "$${f}.template"; done;
	for f in $$(find "$(out-dir)" ! -name "$(project-name)"); do mv "$$f" "$${f//$(project-name)/__className__}"; done;
	for f in $$(find "$(out-dir)" -type f); do sed -i.bak 's/$(project-name)/\<\%\= name \%\>/g' "$$f"; done;

	for f in $$(find "$(out-dir)" -type f -name "*.bak"); do rm -rf $$f; done;
