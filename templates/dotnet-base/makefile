LatestFrameworkVersion = "7.0"
LTSFrameworkVersion = "6.0"

default: 
	make version template=$(template) out-dir=$(out-dir)/latest framework-version=${LatestFrameworkVersion}
	echo '{ "sdk": { "version": "6.0.101" }}' > global.json
	make version template=$(template) out-dir=$(out-dir)/LTS framework-version=${LTSFrameworkVersion}
	rm -rf global.json

version:
	rm -rf $(out-dir)
	# mkdir -p ${out-dir}/sln
	dotnet new sln -n __className__ -o $(out-dir)/sln --force
	dotnet new $(template) -n __className__ -o $(out-dir)/csproj/__className__ --force
	dotnet sln $(out-dir)/sln/__className__.sln add $(out-dir)/csproj/__className__/__className__.csproj
	rm -rf $(out-dir)/csproj/__className__/obj

	# mkdir -p $(out-dir)/sln/
	# mkdir -p $(out-dir)/csproj/__className__/
	
	for f in $$(find "$(out-dir)" -type f); do mv "$$f" "$${f}.template"; done;
	# for f in $$(find "$(out-dir)" ! -name "$(project-name)"); do mv "$$f" "$${f//$(project-name)/__className__}"; done;

	for f in $$(find "$(out-dir)" -type f); do sed -i.bak 's/__className__/\<\%\= className \%\>/g' "$$f"; done;
	for f in $$(find "$(out-dir)" -type f -name "*.sln.template"); do sed -i.bak 's/..\\csproj\\/\<\%\= projectPathFromSln \%\>/g' "$$f"; done;
	for f in $$(find "$(out-dir)" -type f -name "*.sln.template"); do PROJECT_GUID=$$(sed -n 's/.*.csproj\"\, \"{\(.*\)}\".*/\1/p' "$$f"); sed -i.bak 's/'"$$PROJECT_GUID"'/\<\%\= projectGuid \%\>/g' "$$f"; done;

	for f in $$(find "$(out-dir)" -type f -name "*.bak"); do rm -rf $$f; done;

	# rm -rf $(out-dir)/csproj/$(project-name)
