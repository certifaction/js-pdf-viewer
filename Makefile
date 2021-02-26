prepare:
	lerna bootstrap

build:
	lerna run build

publish: build
	lerna publish
