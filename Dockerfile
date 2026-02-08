# Stage 1: Build frontend
FROM node:22-alpine AS frontend-build
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Build backend
FROM golang:1.25-alpine AS backend-build
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server ./cmd/server

# Stage 3: Runtime
FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=backend-build /build/server /app/server
COPY --from=frontend-build /build/dist/ /app/frontend/dist/
USER 65532:65532
EXPOSE 8080
ENTRYPOINT ["/app/server"]
