TEMPLATES_DIR = ./src/templates

all:
	make templates;
	make schematics;
schematics:
	yarn build;
templates:
	$(foreach file, $(wildcard $(TEMPLATES_DIR)/*), [ "$(file)" != './templates/base' ] && (make -C $(file));)
