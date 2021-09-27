TEMPLATES_DIR = ./src/templates
PACKAGES_DIR = ./packages
PACKAGES_DIST_DIR = ./dist/packages

build:
	npm ci
	npx nx affected:build --base=main
deploy:
	for f in $$(find "$(PACKAGES_DIST_DIR)" -type d -maxdepth 1 ! -name "packages"); do npm publish $$f --dry-run; done;
version:
	git checkout develop;
	npm ci;

	$(eval current_version = $(shell npm pkg get version))
	$(eval new_version = $(shell npx semver -i patch $(current_version)))

	for f in $$(find "$(PACKAGES_DIR)" -type d -maxdepth 1 ! -name "packages"); do cd $$f; npm version $(new_version) --commit-hooks=false --git-tag-version=false; cd ../..; done;
	
	npm version $(new_version) --commit-hooks=false --git-tag-version=false;

	git add .
	git commit -m 'Incrementing version to $(new_version)';
	git tag $(new_version);
templates:
	$(foreach file, $(wildcard $(TEMPLATES_DIR)/*), [ "$(file)" != './templates/base' ] && (make -C $(file));)
