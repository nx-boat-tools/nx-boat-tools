FrameworkVersion = "netcoreapp3.0"

default:
	rm -rf $(out-dir)
	dotnet new solution -n $(project-name) -o $(out-dir)/sln --force
	dotnet new $(template) -f $(FrameworkVersion) -n $(project-name) -o $(out-dir)/csproj/$(project-name) --force
	dotnet sln $(out-dir)/sln/$(project-name).sln add $(out-dir)/csproj/$(project-name)/$(project-name).csproj
	rm -rf $(out-dir)/csproj/$(project-name)/obj

	# mkdir -p $(out-dir)/sln/
	mkdir -p $(out-dir)/csproj/__className__/
	
	for f in $$(find "$(out-dir)" -type f); do mv "$$f" "$${f}.template"; done;
	for f in $$(find "$(out-dir)" ! -name "$(project-name)"); do mv "$$f" "$${f//$(project-name)/__className__}"; done;

	for f in $$(find "$(out-dir)" -type f); do sed -i.bak 's/$(project-name)/\<\%\= className \%\>/g' "$$f"; done;
	for f in $$(find "$(out-dir)" -type f -name "*.sln.template"); do sed -i.bak 's/..\\csproj\\/\<\%\= projectPathFromSln \%\>/g' "$$f"; done;
	for f in $$(find "$(out-dir)" -type f -name "*.sln.template"); do PROJECT_GUID=$$(sed -n 's/.*.csproj\"\, \"{\(.*\)}\".*/\1/p' "$$f"); sed -i.bak 's/'"$$PROJECT_GUID"'/\<\%\= projectGuid \%\>/g' "$$f"; done;
	
	for f in $$(find "$(out-dir)" -type f -name "*.bak"); do rm -rf $$f; done;

	rm -rf $(out-dir)/csproj/$(project-name)
