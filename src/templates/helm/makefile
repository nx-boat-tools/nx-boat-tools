project-name = my-chart
out-dir = ./files

default:
	rm -rf $(out-dir)
	helm create my-chart

	mkdir -p $(out-dir)
	mv ${project-name}/{*,.[^.]*} files/
	rm -r $(project-name)

	for f in $$(find "$(out-dir)" -type f); do mv "$$f" "$${f}.template"; done;
	for f in $$(find "$(out-dir)" ! -name "$(project-name)"); do mv "$$f" "$${f//$(project-name)/__className__}"; done;
	for f in $$(find "$(out-dir)" -type f); do sed -i.bak 's/$(project-name)/\<\%\= name \%\>/g' "$$f"; done;

	for f in $$(find "$(out-dir)" -type f -name "*.bak"); do rm -rf $$f; done;
