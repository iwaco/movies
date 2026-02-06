.PHONY: dev build build-converter test test-backend test-frontend clean

dev:
	go run ./cmd/server

build: build-frontend
	go build -o bin/server ./cmd/server

build-converter:
	go build -o bin/converter ./cmd/converter

build-frontend:
	cd frontend && npm run build

test: test-backend test-frontend

test-backend:
	go test ./...

test-frontend:
	cd frontend && npm test -- --run

clean:
	rm -rf bin/ frontend/dist/
