.PHONY: setup install test test-e2e artifacts lint build contract clean

# Harness contract (ADR-0006): `make setup` then `make test` (exit code = verdict).
setup: install

install:
	npm ci

# Runs the suite and writes nested reports under tmp/artifacts/test/, so the
# Hexlet checker finds them after the `test` service exits.
# asciinema (tmp/artifacts/demo/) and screenshots (tmp/artifacts/screens/) are recorded by hand.
test:
	npm run test

test-e2e:
	npm run test:e2e

artifacts: test

# Regenerates the OpenAPI document and the TypeScript SDK from typespec/.
contract:
	npm run contract:generate

lint:
	npm run lint

build:
	npm run build

clean:
	rm -rf tmp/artifacts/test
