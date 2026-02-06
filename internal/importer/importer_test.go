package importer

import (
	"testing"

	"github.com/iwaco/movies/internal/database"
)

func setupImporterTestDB(t *testing.T) *database.DB {
	t.Helper()
	db, err := database.New(":memory:")
	if err != nil {
		t.Fatalf("failed to create test db: %v", err)
	}
	return db
}

func TestImportJSON(t *testing.T) {
	db := setupImporterTestDB(t)
	defer db.Close()

	jsonData := []byte(`[
		{
			"id": "abc123",
			"title": "Sample Video",
			"url": "https://example.com/video/abc123",
			"date": "2024-06-15",
			"actors": ["Actor A", "Actor B"],
			"tags": ["tag1", "tag2"],
			"jpg": "/path/to/thumbnail.jpg",
			"pictures_dir": "/path/to/pictures/abc123/",
			"formats": {
				"720p": "/path/to/720p.mp4",
				"1080p": "/path/to/1080p.mp4"
			}
		},
		{
			"id": "def456",
			"title": "Test Video 2",
			"url": "https://example.com/video/def456",
			"date": "2024-07-20",
			"actors": ["Actor B", "Actor C"],
			"tags": ["tag2", "tag3"],
			"jpg": "/path/to/thumbnail2.jpg",
			"pictures_dir": "/path/to/pictures/def456/",
			"formats": {
				"480p": "/path/to/480p.mp4"
			}
		}
	]`)

	imp := New(db)
	count, err := imp.Import(jsonData)
	if err != nil {
		t.Fatalf("failed to import: %v", err)
	}
	if count != 2 {
		t.Errorf("expected 2 imported, got %d", count)
	}

	// Verify videos were inserted
	var videoCount int
	err = db.QueryRow("SELECT COUNT(*) FROM videos").Scan(&videoCount)
	if err != nil {
		t.Fatalf("failed to count videos: %v", err)
	}
	if videoCount != 2 {
		t.Errorf("expected 2 videos, got %d", videoCount)
	}

	// Verify actors (Actor A, Actor B, Actor C = 3 unique)
	var actorCount int
	err = db.QueryRow("SELECT COUNT(*) FROM actors").Scan(&actorCount)
	if err != nil {
		t.Fatalf("failed to count actors: %v", err)
	}
	if actorCount != 3 {
		t.Errorf("expected 3 actors, got %d", actorCount)
	}

	// Verify tags (tag1, tag2, tag3 = 3 unique)
	var tagCount int
	err = db.QueryRow("SELECT COUNT(*) FROM tags").Scan(&tagCount)
	if err != nil {
		t.Fatalf("failed to count tags: %v", err)
	}
	if tagCount != 3 {
		t.Errorf("expected 3 tags, got %d", tagCount)
	}

	// Verify video_actors
	var vaCount int
	err = db.QueryRow("SELECT COUNT(*) FROM video_actors").Scan(&vaCount)
	if err != nil {
		t.Fatalf("failed to count video_actors: %v", err)
	}
	if vaCount != 4 {
		t.Errorf("expected 4 video_actors, got %d", vaCount)
	}

	// Verify video_formats
	var vfCount int
	err = db.QueryRow("SELECT COUNT(*) FROM video_formats").Scan(&vfCount)
	if err != nil {
		t.Fatalf("failed to count video_formats: %v", err)
	}
	if vfCount != 3 {
		t.Errorf("expected 3 video_formats, got %d", vfCount)
	}

	// Verify FTS data
	var ftsCount int
	err = db.QueryRow("SELECT COUNT(*) FROM videos_fts").Scan(&ftsCount)
	if err != nil {
		t.Fatalf("failed to count videos_fts: %v", err)
	}
	if ftsCount != 2 {
		t.Errorf("expected 2 fts entries, got %d", ftsCount)
	}
}

func TestImportEmptyJSON(t *testing.T) {
	db := setupImporterTestDB(t)
	defer db.Close()

	imp := New(db)
	count, err := imp.Import([]byte(`[]`))
	if err != nil {
		t.Fatalf("failed to import empty: %v", err)
	}
	if count != 0 {
		t.Errorf("expected 0 imported, got %d", count)
	}
}

func TestImportInvalidJSON(t *testing.T) {
	db := setupImporterTestDB(t)
	defer db.Close()

	imp := New(db)
	_, err := imp.Import([]byte(`not json`))
	if err == nil {
		t.Error("expected error for invalid JSON")
	}
}

func TestImportIdempotent(t *testing.T) {
	db := setupImporterTestDB(t)
	defer db.Close()

	jsonData := []byte(`[
		{
			"id": "abc123",
			"title": "Sample Video",
			"url": "https://example.com/video/abc123",
			"date": "2024-06-15",
			"actors": ["Actor A"],
			"tags": ["tag1"],
			"jpg": "/thumb.jpg",
			"pictures_dir": "/pics/",
			"formats": {"720p": "/720p.mp4"}
		}
	]`)

	imp := New(db)
	_, err := imp.Import(jsonData)
	if err != nil {
		t.Fatalf("first import failed: %v", err)
	}

	// Import same data again should not fail (upsert)
	count, err := imp.Import(jsonData)
	if err != nil {
		t.Fatalf("second import failed: %v", err)
	}
	if count != 1 {
		t.Errorf("expected 1 imported on second run, got %d", count)
	}

	// Should still have only 1 video
	var videoCount int
	db.QueryRow("SELECT COUNT(*) FROM videos").Scan(&videoCount)
	if videoCount != 1 {
		t.Errorf("expected 1 video after re-import, got %d", videoCount)
	}
}
