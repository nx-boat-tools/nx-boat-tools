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

build:
	echo $(NEWLINE)🛠 Building affected projects compared to $(base_ref)...

	npm ci
	npx nx affected:build --base=$(base_ref)
format:
	echo $(NEWLINE)🧼️ Formatting and linting affected files compared to $(base_ref)...

	npm ci
	npx nx format:write --base=$(base_ref)
	npx nx affected:lint --fix --base=$(base_ref)

ifeq ($(commit), true)
	$(eval changes = $(shell git status -s))
	$(if $(strip $(changes)), git add .; git commit -m 'Formatting and lint changes'; git push -u origin $(PUSH_BRANCH))
endif
artifacts:
	echo $(NEWLINE)🏺 Creating build artifacts...

	$(eval last_version = $(shell git describe --abbrev=0 --tags))
	$(eval last_version_hash = $(shell git rev-list -n 1 $(last_version)))
	$(eval current_version = $(shell npm pkg get version))

	mkdir -p $(ARTIFACTS_DIR)

	npm ci
	npx nx affected:build --base=$(last_version_hash)

	echo
	for f in $$(find "$(PACKAGES_DIST_DIR)" -type d -maxdepth 1 ! -name "packages"); do 📦 Zipping $$f...; package="$$(basename $$f)_$(current_version).zip"; zip -q -r $(ARTIFACTS_DIR)/$$package $$f; done;
	
	echo $(current_version) >> RELEASE_VERSION
version:
	echo $(NEWLINE)🏷 Tagging and updating version...

	npm ci;

	$(eval current_version = $(shell npm pkg get version))
	$(eval new_version = $(shell npx semver -i patch $(current_version)))

ifeq ($(tag), true)
	git tag v$(current_version);
	git push origin v$(current_version)
endif
ifdef commit-branch
	git checkout $(commit-branch)
endif

	for f in $$(find "$(PACKAGES_DIR)" -type d -maxdepth 1 ! -name "packages"); do cd $$f; npm version $(new_version) --commit-hooks=false --git-tag-version=false; cd ../..; done;
	npm version $(new_version) --commit-hooks=false --git-tag-version=false;

ifeq ($(commit), true)
	git add .
	git commit -m 'Bumping version to $(new_version)';
	git push -u origin $(PUSH_BRANCH)
endif
templates:
	echo $(NEWLINE)🆕 Refreshing generator file templates...

	$(foreach file, $(wildcard $(TEMPLATES_DIR)/*), [ "$(file)" != './templates/base' ] && (make -C $(file));)
