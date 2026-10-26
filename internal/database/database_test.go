package database

import (
	"context"
	"database/sql"
	"fmt"
	"path/filepath"
	"strings"
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

	// Verify ratings table exists
	_, err = db.Exec("INSERT INTO ratings (video_id, rating) VALUES ('test1', 3)")
	if err != nil {
		t.Fatalf("ratings table should exist: %v", err)
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

func TestWithForeignKeys(t *testing.T) {
	tests := []struct {
		dsn  string
		want string
	}{
		{"movies.db", "movies.db?_pragma=foreign_keys(1)"},
		{"/data/movies.db", "/data/movies.db?_pragma=foreign_keys(1)"},
		{":memory:", ":memory:?_pragma=foreign_keys(1)"},
		{"movies.db?_pragma=busy_timeout(5000)", "movies.db?_pragma=busy_timeout(5000)&_pragma=foreign_keys(1)"},
		{"file:movies.db?mode=rwc", "file:movies.db?mode=rwc&_pragma=foreign_keys(1)"},
		{"file:movies.db", "file:movies.db?_pragma=foreign_keys(1)"},
	}
	for _, tt := range tests {
		if got := withForeignKeys(tt.dsn); got != tt.want {
			t.Errorf("withForeignKeys(%q) = %q, want %q", tt.dsn, got, tt.want)
		}
	}
}

// foreign_keys is a per-connection setting, so it must be enabled on every
// connection the pool opens, not just the first one.
func TestForeignKeysEnabledOnAllConnections(t *testing.T) {
	dir := t.TempDir()
	dsns := map[string]string{
		"path":     filepath.Join(dir, "path.db"),
		"query":    filepath.Join(dir, "query.db") + "?_pragma=busy_timeout(5000)",
		"file URI": "file:" + filepath.Join(dir, "uri.db") + "?mode=rwc",
	}
	for name, dsn := range dsns {
		t.Run(name, func(t *testing.T) {
			db, err := New(dsn)
			if err != nil {
				t.Fatalf("failed to create database: %v", err)
			}
			defer db.Close()
			db.SetMaxOpenConns(3)

			ctx := context.Background()
			var conns []*sql.Conn
			for i := 0; i < 3; i++ {
				conn, err := db.Conn(ctx)
				if err != nil {
					t.Fatalf("failed to get connection %d: %v", i, err)
				}
				defer conn.Close()
				conns = append(conns, conn)
			}

			for i, conn := range conns {
				var fk int
				if err := conn.QueryRowContext(ctx, "PRAGMA foreign_keys").Scan(&fk); err != nil {
					t.Fatalf("conn %d: failed to check foreign_keys pragma: %v", i, err)
				}
				if fk != 1 {
					t.Errorf("conn %d: expected foreign_keys to be enabled (1), got %d", i, fk)
				}

				_, err := conn.ExecContext(ctx, "INSERT INTO ratings (video_id, rating) VALUES ($1, 3)", fmt.Sprintf("missing%d", i))
				if err == nil || !strings.Contains(err.Error(), "FOREIGN KEY") {
					t.Errorf("conn %d: expected foreign key violation inserting rating for missing video, got %v", i, err)
				}
			}
		})
	}
}
