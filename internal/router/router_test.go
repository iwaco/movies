package router

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/iwaco/movies/internal/config"
	"github.com/iwaco/movies/internal/database"
)

func TestNewRouter(t *testing.T) {
	db, err := database.New(":memory:")
	if err != nil {
		t.Fatalf("failed to create db: %v", err)
	}
	defer db.Close()

	cfg := &config.Config{
		DBPath:    ":memory:",
		MediaRoot: "/tmp/media",
		Port:      "8080",
	}

	r := New(db, cfg)
	if r == nil {
		t.Fatal("expected non-nil router")
	}

	// Test that API routes are registered
	ts := httptest.NewServer(r)
	defer ts.Close()

	routes := []struct {
		method string
		path   string
		expect int
	}{
		{"GET", "/api/v1/videos", http.StatusOK},
		{"GET", "/api/v1/tags", http.StatusOK},
		{"GET", "/api/v1/actors", http.StatusOK},
		{"DELETE", "/api/v1/ratings/nonexistent", http.StatusNoContent},
	}

	for _, rt := range routes {
		req, _ := http.NewRequest(rt.method, ts.URL+rt.path, nil)
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatalf("failed to %s %s: %v", rt.method, rt.path, err)
		}
		resp.Body.Close()
		if resp.StatusCode != rt.expect {
			t.Errorf("%s %s: expected %d, got %d", rt.method, rt.path, rt.expect, resp.StatusCode)
		}
	}
}
