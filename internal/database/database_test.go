package database

import (
	"testing"
)

func TestNewDB(t *testing.T) {
	db, err := New(":memory:")
	if err != nil {
		t.Fatalf("failed to create database: %v", err)
	}
	defer db.Close()

	// Verify videos table exists
	_, err = db.Exec("INSERT INTO videos (id, title) VALUES ('test1', 'Test Video')")
	if err != nil {
		t.Fatalf("videos table should exist: %v", err)
	}

	// Verify actors table exists
	_, err = db.Exec("INSERT INTO actors (name) VALUES ('Actor A')")
	if err != nil {
		t.Fatalf("actors table should exist: %v", err)
	}

	// Verify tags table exists
	_, err = db.Exec("INSERT INTO tags (name) VALUES ('tag1')")
	if err != nil {
		t.Fatalf("tags table should exist: %v", err)
	}

	// Verify video_actors table exists
	_, err = db.Exec("INSERT INTO video_actors (video_id, actor_id) VALUES ('test1', 1)")
	if err != nil {
		t.Fatalf("video_actors table should exist: %v", err)
	}

	// Verify video_tags table exists
	_, err = db.Exec("INSERT INTO video_tags (video_id, tag_id) VALUES ('test1', 1)")
	if err != nil {
		t.Fatalf("video_tags table should exist: %v", err)
	}

	// Verify video_formats table exists
	_, err = db.Exec("INSERT INTO video_formats (video_id, name, file_path) VALUES ('test1', '720p', '/path/to/720p.mp4')")
	if err != nil {
		t.Fatalf("video_formats table should exist: %v", err)
	}

	// Verify favorites table exists
	_, err = db.Exec("INSERT INTO favorites (video_id) VALUES ('test1')")
	if err != nil {
		t.Fatalf("favorites table should exist: %v", err)
	}

	// Verify videos_fts virtual table exists
	_, err = db.Exec("INSERT INTO videos_fts (video_id, title, actors, tags) VALUES ('test1', 'Test Video', 'Actor A', 'tag1')")
	if err != nil {
		t.Fatalf("videos_fts table should exist: %v", err)
	}
}

func TestNewDBIdempotent(t *testing.T) {
	db, err := New(":memory:")
	if err != nil {
		t.Fatalf("failed to create database: %v", err)
	}
	defer db.Close()

	// Running migrations again should not fail
	err = RunMigrations(db)
	if err != nil {
		t.Fatalf("running migrations twice should not fail: %v", err)
	}
}

func TestForeignKeysEnabled(t *testing.T) {
	db, err := New(":memory:")
	if err != nil {
		t.Fatalf("failed to create database: %v", err)
	}
	defer db.Close()

	var fk int
	err = db.QueryRow("PRAGMA foreign_keys").Scan(&fk)
	if err != nil {
		t.Fatalf("failed to check foreign_keys pragma: %v", err)
	}
	if fk != 1 {
		t.Errorf("expected foreign_keys to be enabled (1), got %d", fk)
	}
}
