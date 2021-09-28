TEMPLATES_DIR = ./src/templates
PACKAGES_DIR = ./packages
PACKAGES_DIST_DIR = ./dist/packages
ARTIFACTS_DIR = ./dist/artifacts

define NEWLINE

endef

ifeq ($(base_ref),)
base_ref := main
endif

build:
	echo $(NEWLINE)🛠 Building affected projects...

	npm ci
	npx nx affected:build --base=$(base_ref)
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

	git tag v$(current_version);
	git push origin v$(current_version)
	git checkout develop

	for f in $$(find "$(PACKAGES_DIR)" -type d -maxdepth 1 ! -name "packages"); do cd $$f; npm version $(new_version) --commit-hooks=false --git-tag-version=false; cd ../..; done;
	
	npm version $(new_version) --commit-hooks=false --git-tag-version=false;

	git add .
	git commit -m 'Bumping version to $(new_version)';
	git push -u origin develop
templates:
	echo $(NEWLINE)🆕 Refreshing generator file templates...

	$(foreach file, $(wildcard $(TEMPLATES_DIR)/*), [ "$(file)" != './templates/base' ] && (make -C $(file));)
