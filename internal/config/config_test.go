package config

import (
	"os"
	"path/filepath"
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

func TestLoadFromDotEnvFile(t *testing.T) {
	os.Unsetenv("MOVIES_DB_PATH")
	os.Unsetenv("MOVIES_MEDIA_ROOT")
	os.Unsetenv("MOVIES_PORT")

	dir := t.TempDir()
	t.Chdir(dir)

	envContent := "MOVIES_DB_PATH=/data/test.db\nMOVIES_MEDIA_ROOT=/data/media\nMOVIES_PORT=9090\n"
	os.WriteFile(filepath.Join(dir, ".env"), []byte(envContent), 0644)

	cfg := Load()

	if cfg.DBPath != "/data/test.db" {
		t.Errorf("expected DBPath '/data/test.db', got %q", cfg.DBPath)
	}
	if cfg.MediaRoot != "/data/media" {
		t.Errorf("expected MediaRoot '/data/media', got %q", cfg.MediaRoot)
	}
	if cfg.Port != "9090" {
		t.Errorf("expected Port '9090', got %q", cfg.Port)
	}
}

func TestEnvVarOverridesDotEnv(t *testing.T) {
	os.Unsetenv("MOVIES_DB_PATH")
	os.Unsetenv("MOVIES_MEDIA_ROOT")

	dir := t.TempDir()
	t.Chdir(dir)

	envContent := "MOVIES_PORT=9090\n"
	os.WriteFile(filepath.Join(dir, ".env"), []byte(envContent), 0644)

	os.Setenv("MOVIES_PORT", "3000")
	defer os.Unsetenv("MOVIES_PORT")

	cfg := Load()

	if cfg.Port != "3000" {
		t.Errorf("expected Port '3000' (env var should override .env), got %q", cfg.Port)
	}
}

func TestLoadWithoutDotEnvFile(t *testing.T) {
	os.Unsetenv("MOVIES_DB_PATH")
	os.Unsetenv("MOVIES_MEDIA_ROOT")
	os.Unsetenv("MOVIES_PORT")

	dir := t.TempDir()
	t.Chdir(dir)

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
