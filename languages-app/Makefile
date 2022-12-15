all:

test:
	JAEGER_COLLECTOR_HOST=http://fake-tracer.local && go test -v -timeout=0

build:
	go build -o language-app . && chmod +x language-app

run:
	./language-app