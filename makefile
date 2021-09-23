TEMPLATES_DIR = ./src/templates

build:
	make -C src
templates:
	$(foreach file, $(wildcard $(TEMPLATES_DIR)/*), [ "$(file)" != './templates/base' ] && (make -C $(file));)
