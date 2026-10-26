package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/iwaco/movies/internal/database"
)

func TestHealthHandler_Healthz(t *testing.T) {
	db, err := database.New(":memory:")
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}
	defer db.Close()

	h := NewHealthHandler(db)

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()

	h.Healthz(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("expected Content-Type application/json, got %s", ct)
	}
}

func TestHealthHandler_Readyz(t *testing.T) {
	db, err := database.New(":memory:")
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}
	defer db.Close()

	h := NewHealthHandler(db)

	req := httptest.NewRequest(http.MethodGet, "/readyz", nil)
	rec := httptest.NewRecorder()

	h.Readyz(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("expected Content-Type application/json, got %s", ct)
	}
}

func TestHealthHandler_Healthz_DBClosed(t *testing.T) {
	db, err := database.New(":memory:")
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}
	db.Close()

	h := NewHealthHandler(db)

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()

	h.Healthz(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("expected status %d, got %d", http.StatusServiceUnavailable, rec.Code)
	}
}

func TestHealthHandler_Readyz_DBClosed(t *testing.T) {
	db, err := database.New(":memory:")
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}
	db.Close()

	h := NewHealthHandler(db)

	req := httptest.NewRequest(http.MethodGet, "/readyz", nil)
	rec := httptest.NewRecorder()

	h.Readyz(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("expected status %d, got %d", http.StatusServiceUnavailable, rec.Code)
	}
}

func TestHealthHandler_DoesNotLeakConnections(t *testing.T) {
	tests := []struct {
		name    string
		path    string
		handler func(h *HealthHandler) http.HandlerFunc
	}{
		{"healthz", "/healthz", func(h *HealthHandler) http.HandlerFunc { return h.Healthz }},
		{"readyz", "/readyz", func(h *HealthHandler) http.HandlerFunc { return h.Readyz }},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, err := database.New(":memory:")
			if err != nil {
				t.Fatalf("failed to open database: %v", err)
			}
			defer db.Close()

			h := NewHealthHandler(db)
			handle := tt.handler(h)

			for i := 0; i < 100; i++ {
				req := httptest.NewRequest(http.MethodGet, tt.path, nil)
				rec := httptest.NewRecorder()
				handle(rec, req)
				if rec.Code != http.StatusOK {
					t.Fatalf("request %d: expected status %d, got %d", i, http.StatusOK, rec.Code)
				}
			}

			stats := db.Stats()
			if stats.InUse != 0 {
				t.Errorf("expected no connections in use, got %d", stats.InUse)
			}
			if stats.OpenConnections > 1 {
				t.Errorf("expected at most 1 open connection, got %d", stats.OpenConnections)
			}
		})
	}
}
