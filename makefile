TEMPLATES_DIR = ./templates
PACKAGES_DIR = ./packages
PACKAGES_DIST_DIR = ./dist/packages
ARTIFACTS_DIR = ./dist/artifacts
PUSH_BRANCH = develop

define NEWLINE

endef

ifndef base_ref
base_ref := main
endif

ifeq ($(commit-branch),)
PUSH_BRANCH = $(commit-branch)
endif

.PHONY: build
build:
	if [ ! -d './packages/helm/src/generators/local-chart/files/generated' ]; then make templates; fi

	echo $(NEWLINE)$(NEWLINE)🛠 Building affected projects compared to $(base_ref)...

	yarn install --immutable
	yarn dlx nx affected --base=$(base_ref) --target=copyTemplates
	yarn dlx nx affected:build --base=$(base_ref) --parallel=5
	yarn dlx nx affected:test --base=$(base_ref) --parallel=5

.PHONY: format
format:
	echo $(NEWLINE)🧼️ Formatting and linting affected files compared to $(base_ref)...

	yarn install --immutable
	yarn dlx nx format:write --base=$(base_ref)
	yarn dlx nx affected:lint --fix --base=$(base_ref)

ifeq ($(commit), true)
	$(eval changes = $(shell git status -s))
	$(if $(strip $(changes)), git add .; git commit -m 'cleanup(misc): formatting and lint changes'; git push -u origin $(PUSH_BRANCH))
endif

.PHONY: artifacts
artifacts:
	echo $(NEWLINE)🏺 Creating build artifacts...

	$(eval last_version = $(shell git describe --abbrev=0 --tags))
	$(eval last_version_hash = $(shell git rev-list -n 1 $(last_version)))
	$(eval current_version = $(shell npm pkg get version))

	mkdir -p $(ARTIFACTS_DIR)

	yarn install --immutable
	yarn dlx nx affected --base=$(last_version_hash) --target=updateDependencies
	yarn dlx nx affected --base=$(last_version_hash) --target=copyTemplates
	yarn dlx nx affected:build --base=$(last_version_hash) --parallel=5

	echo
	for f in $$(find "$(PACKAGES_DIST_DIR)" -type d -maxdepth 1 ! -name "packages"); do echo 📦 Zipping $$f...; package="$$(basename $$f)_$(current_version).zip"; zip -q -r $(ARTIFACTS_DIR)/$$package $$f; done;
	
	rm RELEASE_VERSION
	echo $(current_version) >> RELEASE_VERSION

.PHONY: version
version:
	# NOTE: We're not using @jscutlery/semver because we want to control the tags ourselves 

	echo $(NEWLINE)🏷 Tagging and updating version...

	yarn install --immutable;

	$(eval current_version = $(shell npm pkg get version))
	$(eval new_version = $(shell yarn dlx -q semver -i patch $(current_version)))

ifeq ($(tag), true)
	git tag v$(current_version);
	git push origin v$(current_version)
endif
ifdef commit-branch
	git checkout $(commit-branch)
endif

	npm version $(new_version) --commit-hooks=false --git-tag-version=false;
	yarn dlx nx run-many --target=version --all --parallel=5 --to='$(new_version)' --git-tag-version=false

	yarn dlx nx run-many --target=updateDependencies --all --parallel=5

ifeq ($(commit), true)
	git add .
	git commit -m 'chore(repo): bumping version to $(new_version)';
	git push -u origin $(PUSH_BRANCH)
endif

.PHONY: templates
clean:
	rm -rfd ./build
	rm -rfd ./coverage
	rm -rfd ./dist
	rm -rfd ./node_modules
	rm -rfd ./tmp
	rm -rfd ./RELEASE_VERSION
	rm -rfd ./packages/docker/src/generators/docker/files/generated
	rm -rfd ./packages/dotnet/src/generators/classlib/files/generated
	rm -rfd ./packages/dotnet/src/generators/console/files/generated
	rm -rfd ./packages/dotnet/src/generators/webapi/files/generated
	rm -rfd ./packages/helm/src/generators/local-chart/files/generated

.PHONY: templates
templates:
	echo $(NEWLINE)🆕 Refreshing generator file templates...

	$(foreach file, $(wildcard $(TEMPLATES_DIR)/*), [ "$(file)" != './templates/dotnet-base' ] && (make -C $(file));)

.PHONY: local-registry-enable
local-registry-enable:
	echo "Setting registry to local registry"
	echo "To Disable: make local-registry-disable"

	npm config set registry http://localhost:4873/
	# yarn config set npmRegistryServer http://localhost:4873/

.PHONY: local-registry-disable
local-registry-disable:
	npm config delete registry
	# yarn config unset npmRegistryServer

	$(eval CURRENT_NPM_REGISTRY = $(shell npm config get registry))
	# $(eval CURRENT_YARN_REGISTRY = $(shell yarn config get npmRegistryServer))

	echo "Reverting registries"
	echo "  > NPM:  $(CURRENT_NPM_REGISTRY)"
	# echo "  > YARN: $(CURRENT_YARN_REIGSTRY)"

.PHONY: local-registry-clear
local-registry-clear:
	echo "Clearing Local Registry"

	rm -rf ./build/local-registry/storage

.PHONY: local-registry-start
local-registry-start:
	echo "Starting Local Registry"

ifneq (,$(wildcard RELEASE_VERSION))
	rm RELEASE_VERSION
endif

	echo "999.0.0" >> RELEASE_VERSION

	VERDACCIO_HANDLE_KILL_SIGNALS=true
	yarn verdaccio --config ./.verdaccio/config.yml

.PHONY: local-registry-publish
local-registry-publish:
	echo "📤 Publishing packages to local registry"

	$(eval NPM_REGISTRY = $(shell npm config get registry))

ifneq (,$(findstring http://localhost*,$(NPM_REGISTRY)))
    echo 🛑 STOPPING 🛑  \n\n$$NPM_REGISTRY does not look like a local registry! 😨

	exit 1
endif

ifeq (,$(wildcard RELEASE_VERSION))
	$(eval current_version = $(shell npm pkg get version))
else
	$(eval current_version = $(shell head -n 1 RELEASE_VERSION))
	rm RELEASE_VERSION
endif

	$(eval new_version = $(shell npx semver -i prerelease --preid local $(current_version)))

	echo $(new_version) >> RELEASE_VERSION

	make templates

	yarn dlx nx run-many --target=build --all --parallel=5
	yarn dlx nx run-many --target=copyTemplates --all --parallel=5
	yarn dlx nx run-many --target=version --all --parallel=5 --to='$(new_version)' --pathPrefix=dist
	yarn dlx nx run-many --target=updateDependencies --all --parallel=5 --peerVersion='$(new_version)' --pathPrefix=dist

	for f in $$(find "$(PACKAGES_DIST_DIR)" -type d -maxdepth 1 ! -name "packages"); do echo 📝  Publishing $$f...; cd $$f; npm publish --tag next --access public --registry=$(NPM_REGISTRY); cd ../../..; done;

local-registry-workspace:
	make local-registry-disable;

	rm -rf ./tmp/local-test
	mkdir -p ./tmp
	cd ./tmp; npm i create-nx-workspace; npx create-nx-workspace --preset=empty --name=local-test --nxCloud=false;

	cp makefile ./tmp/local-test/makefile

	cd ./tmp/local-test; \
	make local-registry-enable; \
	npm i -D @nx-boat-tools/dotnet@next; \
	npm i -D @nx-boat-tools/docker@next; \
	npm i -D @nx-boat-tools/helm@next; \
	npx nx g @nx-boat-tools/dotnet:webapi my-test --frameworkVersion=latest; \
	npx nx g @nx-boat-tools/docker:docker my-test --dockerRepoOrUser=my-user --minikube=true --baseDockerImage=mcr.microsoft.com/dotnet/aspnet:latest --runPortMappings=8080:80 --runVolumeMounts=dist/apps/my-test:/app --runVariables=Logging__Console__FormatterName:Simple; \
	npx nx g @nx-boat-tools/helm:local-chart my-test --environments=dev,prod --runResourceName=service/my-test; \
	printf "ENV LOGGING__CONSOLE__FORMATTERNAME=Simple\nWORKDIR /app\nCOPY . .\nENTRYPOINT [\"dotnet\", \"MyTest.dll\"]" >> ./apps/my-test/dockerfile
