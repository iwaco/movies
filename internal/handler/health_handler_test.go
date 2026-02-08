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
