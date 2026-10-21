.PHONY: setup install test artifacts lint build clean

# Harness contract (ADR-0006): `make setup` then `make test` (exit code = verdict).
setup: install

install:
	npm ci

# Runs the suite and writes nested reports under tmp/artifacts/test/, so the
# Hexlet checker finds them after the `test` service exits.
# asciinema (tmp/artifacts/demo/) and screenshots (tmp/artifacts/screens/) are recorded by hand.
test:
	npm run test

artifacts: test

lint:
	npm run lint

build:
	npm run build

clean:
	rm -rf tmp/artifacts/test
