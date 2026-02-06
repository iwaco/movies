package config

import (
	"os"
	"testing"
)

func TestLoadDefaults(t *testing.T) {
	os.Unsetenv("MOVIES_DB_PATH")
	os.Unsetenv("MOVIES_MEDIA_ROOT")
	os.Unsetenv("MOVIES_PORT")

	cfg := Load()

	if cfg.DBPath != "movies.db" {
		t.Errorf("expected default DBPath 'movies.db', got %q", cfg.DBPath)
	}
	if cfg.MediaRoot != "./media" {
		t.Errorf("expected default MediaRoot './media', got %q", cfg.MediaRoot)
	}
	if cfg.Port != "8080" {
		t.Errorf("expected default Port '8080', got %q", cfg.Port)
	}
}

func TestLoadFromEnv(t *testing.T) {
	os.Setenv("MOVIES_DB_PATH", "/tmp/test.db")
	os.Setenv("MOVIES_MEDIA_ROOT", "/var/media")
	os.Setenv("MOVIES_PORT", "3000")
	defer func() {
		os.Unsetenv("MOVIES_DB_PATH")
		os.Unsetenv("MOVIES_MEDIA_ROOT")
		os.Unsetenv("MOVIES_PORT")
	}()

	cfg := Load()

	if cfg.DBPath != "/tmp/test.db" {
		t.Errorf("expected DBPath '/tmp/test.db', got %q", cfg.DBPath)
	}
	if cfg.MediaRoot != "/var/media" {
		t.Errorf("expected MediaRoot '/var/media', got %q", cfg.MediaRoot)
	}
	if cfg.Port != "3000" {
		t.Errorf("expected Port '3000', got %q", cfg.Port)
	}
}
