package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/iwaco/movies/internal/database"
	"github.com/iwaco/movies/internal/importer"
	"github.com/iwaco/movies/internal/repository"
)

func setupTestRouter(t *testing.T) (*chi.Mux, *database.DB) {
	return setupTestRouterWithMediaRoot(t, "/test-media")
}

func setupTestRouterWithMediaRoot(t *testing.T, mediaRoot string) (*chi.Mux, *database.DB) {
	t.Helper()
	db, err := database.New(":memory:")
	if err != nil {
		t.Fatalf("failed to create test db: %v", err)
	}

	videoRepo := repository.NewVideoRepository(db)
	ratingRepo := repository.NewRatingRepository(db)
	imp := importer.New(db)

	vh := NewVideoHandler(videoRepo, mediaRoot)
	rh := NewRatingHandler(ratingRepo)
	ih := NewImportHandler(imp)

	r := chi.NewRouter()
	r.Get("/api/v1/videos", vh.List)
	r.Get("/api/v1/videos/{id}", vh.GetByID)
	r.Get("/api/v1/videos/{id}/pictures", vh.GetPictures)
	r.Get("/api/v1/tags", vh.ListTags)
	r.Get("/api/v1/actors", vh.ListActors)
	r.Put("/api/v1/ratings/{videoID}", rh.Set)
	r.Delete("/api/v1/ratings/{videoID}", rh.Remove)
	r.Post("/api/v1/import", ih.Import)

	return r, db
}

func seedHandlerTestData(t *testing.T, db *database.DB) {
	t.Helper()
	queries := []string{
		`INSERT INTO videos (id, title, url, date, jpg, pictures_dir) VALUES
			('vid1', 'First Video', 'https://example.com/1', '2024-01-15', '/thumb1.jpg', '/pics/vid1/'),
			('vid2', 'Second Video', 'https://example.com/2', '2024-02-20', '/thumb2.jpg', '/pics/vid2/'),
			('vid3', 'Third Video', 'https://example.com/3', '2024-03-10', '/thumb3.jpg', '/pics/vid3/')`,
		`INSERT INTO actors (name) VALUES ('Actor A'), ('Actor B')`,
		`INSERT INTO tags (name) VALUES ('tag1'), ('tag2')`,
		`INSERT INTO video_actors (video_id, actor_id) VALUES ('vid1', 1), ('vid2', 2)`,
		`INSERT INTO video_tags (video_id, tag_id) VALUES ('vid1', 1), ('vid2', 2)`,
		`INSERT INTO video_formats (video_id, name, file_path) VALUES ('vid1', '720p', '/720p.mp4'), ('vid2', '480p', '/480p.mp4')`,
		`INSERT INTO videos_fts (video_id, title, actors, tags) VALUES
			('vid1', 'First Video', 'Actor A', 'tag1'),
			('vid2', 'Second Video', 'Actor B', 'tag2'),
			('vid3', 'Third Video', '', '')`,
	}
	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			t.Fatalf("failed to seed: %v\nquery: %s", err, q)
		}
	}
}

func TestListVideos(t *testing.T) {
	r, db := setupTestRouter(t)
	defer db.Close()
	seedHandlerTestData(t, db)

	ts := httptest.NewServer(r)
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/api/v1/videos")
	if err != nil {
		t.Fatalf("failed to GET /api/v1/videos: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	if result["total"].(float64) != 3 {
		t.Errorf("expected total 3, got %v", result["total"])
	}
}

func TestGetVideoByID(t *testing.T) {
	r, db := setupTestRouter(t)
	defer db.Close()
	seedHandlerTestData(t, db)

	ts := httptest.NewServer(r)
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/api/v1/videos/vid1")
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	var video map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&video)

	if video["id"].(string) != "vid1" {
		t.Errorf("expected vid1, got %v", video["id"])
	}
}

func TestGetVideoByIDNotFound(t *testing.T) {
	r, db := setupTestRouter(t)
	defer db.Close()

	ts := httptest.NewServer(r)
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/api/v1/videos/nonexistent")
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNotFound {
		t.Errorf("expected 404, got %d", resp.StatusCode)
	}
}

func TestListTags(t *testing.T) {
	r, db := setupTestRouter(t)
	defer db.Close()
	seedHandlerTestData(t, db)

	ts := httptest.NewServer(r)
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/api/v1/tags")
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	tags := result["tags"].([]interface{})
	if len(tags) != 2 {
		t.Errorf("expected 2 tags, got %d", len(tags))
	}
}

func TestListActors(t *testing.T) {
	r, db := setupTestRouter(t)
	defer db.Close()
	seedHandlerTestData(t, db)

	ts := httptest.NewServer(r)
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/api/v1/actors")
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	actors := result["actors"].([]interface{})
	if len(actors) != 2 {
		t.Errorf("expected 2 actors, got %d", len(actors))
	}
}

func TestSetAndRemoveRating(t *testing.T) {
	r, db := setupTestRouter(t)
	defer db.Close()
	seedHandlerTestData(t, db)

	ts := httptest.NewServer(r)
	defer ts.Close()

	// Set rating
	body := bytes.NewBufferString(`{"rating": 4}`)
	req, _ := http.NewRequest(http.MethodPut, ts.URL+"/api/v1/ratings/vid1", body)
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	// Verify rating via video detail
	resp, err = http.Get(ts.URL + "/api/v1/videos/vid1")
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	defer resp.Body.Close()

	var video map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&video)

	if video["rating"].(float64) != 4 {
		t.Errorf("expected rating 4, got %v", video["rating"])
	}

	// Remove rating
	req, _ = http.NewRequest(http.MethodDelete, ts.URL+"/api/v1/ratings/vid1", nil)
	resp2, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	resp2.Body.Close()

	if resp2.StatusCode != http.StatusNoContent {
		t.Errorf("expected 204, got %d", resp2.StatusCode)
	}
}

func TestImportHandler(t *testing.T) {
	r, db := setupTestRouter(t)
	defer db.Close()

	ts := httptest.NewServer(r)
	defer ts.Close()

	jsonData := `[
		{
			"id": "imp1",
			"title": "Imported Video",
			"url": "https://example.com/imp1",
			"date": "2024-01-01",
			"actors": ["Actor X"],
			"tags": ["tagX"],
			"jpg": "/thumb.jpg",
			"pictures_dir": "/pics/imp1/",
			"formats": {"720p": "/720p.mp4"}
		}
	]`

	resp, err := http.Post(ts.URL+"/api/v1/import", "application/json", bytes.NewBufferString(jsonData))
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	if result["imported"].(float64) != 1 {
		t.Errorf("expected 1 imported, got %v", result["imported"])
	}
}

func TestGetPictures_NotFound(t *testing.T) {
	r, db := setupTestRouter(t)
	defer db.Close()

	ts := httptest.NewServer(r)
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/api/v1/videos/nonexistent/pictures")
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNotFound {
		t.Errorf("expected 404, got %d", resp.StatusCode)
	}
}

func TestGetPictures_EmptyArray(t *testing.T) {
	r, db := setupTestRouter(t)
	defer db.Close()
	seedHandlerTestData(t, db)

	ts := httptest.NewServer(r)
	defer ts.Close()

	// vid1 exists but /test-media directory does not, so pictures should be []
	resp, err := http.Get(ts.URL + "/api/v1/videos/vid1/pictures")
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	pictures, ok := result["pictures"].([]interface{})
	if !ok {
		t.Fatalf("expected pictures to be an array, got %T (%v)", result["pictures"], result["pictures"])
	}
	if len(pictures) != 0 {
		t.Errorf("expected 0 pictures, got %d", len(pictures))
	}
}

func TestGetPictures_WithImages(t *testing.T) {
	// Create a temporary directory with test images
	tmpDir := t.TempDir()
	picsDir := filepath.Join(tmpDir, "pics", "vid1")
	if err := os.MkdirAll(picsDir, 0755); err != nil {
		t.Fatalf("failed to create pics dir: %v", err)
	}

	// Create test image files
	for _, name := range []string{"img1.jpg", "img2.png", "not_image.txt"} {
		if err := os.WriteFile(filepath.Join(picsDir, name), []byte("fake"), 0644); err != nil {
			t.Fatalf("failed to create test file: %v", err)
		}
	}

	r, db := setupTestRouterWithMediaRoot(t, tmpDir)
	defer db.Close()
	seedHandlerTestData(t, db)

	ts := httptest.NewServer(r)
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/api/v1/videos/vid1/pictures")
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	pictures := result["pictures"].([]interface{})
	if len(pictures) != 2 {
		t.Fatalf("expected 2 pictures, got %d: %v", len(pictures), pictures)
	}

	// Verify paths start with /
	for _, p := range pictures {
		path := p.(string)
		if path[0] != '/' {
			t.Errorf("expected path to start with /, got %s", path)
		}
	}
}

func TestListVideosHasVideoTrue(t *testing.T) {
	r, db := setupTestRouter(t)
	defer db.Close()
	seedHandlerTestData(t, db)

	ts := httptest.NewServer(r)
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/api/v1/videos?has_video=true")
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	if result["total"].(float64) != 2 {
		t.Errorf("expected 2 videos with formats, got %v", result["total"])
	}
}

func TestListVideosHasVideoFalse(t *testing.T) {
	r, db := setupTestRouter(t)
	defer db.Close()
	seedHandlerTestData(t, db)

	ts := httptest.NewServer(r)
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/api/v1/videos?has_video=false")
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	if result["total"].(float64) != 3 {
		t.Errorf("expected 3 videos (all), got %v", result["total"])
	}
}

func TestListVideosHasVideoInvalid(t *testing.T) {
	r, db := setupTestRouter(t)
	defer db.Close()
	seedHandlerTestData(t, db)

	ts := httptest.NewServer(r)
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/api/v1/videos?has_video=invalid")
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", resp.StatusCode)
	}
}

func TestListVideosWithQueryParams(t *testing.T) {
	r, db := setupTestRouter(t)
	defer db.Close()
	seedHandlerTestData(t, db)

	ts := httptest.NewServer(r)
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/api/v1/videos?tag=tag1&page=1&per_page=10")
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	if result["total"].(float64) != 1 {
		t.Errorf("expected 1 video with tag1, got %v", result["total"])
	}
}

func TestListVideosWithMultipleTags(t *testing.T) {
	r, db := setupTestRouter(t)
	defer db.Close()

	// Seed data with overlapping tags
	queries := []string{
		`INSERT INTO videos (id, title, url, date, jpg, pictures_dir) VALUES
			('vid1', 'First Video', 'https://example.com/1', '2024-01-15', '/thumb1.jpg', '/pics/vid1/'),
			('vid2', 'Second Video', 'https://example.com/2', '2024-02-20', '/thumb2.jpg', '/pics/vid2/')`,
		`INSERT INTO tags (name) VALUES ('tagA'), ('tagB'), ('tagC')`,
		`INSERT INTO video_tags (video_id, tag_id) VALUES ('vid1', 1), ('vid1', 2), ('vid2', 2), ('vid2', 3)`,
		`INSERT INTO videos_fts (video_id, title, actors, tags) VALUES
			('vid1', 'First Video', '', 'tagA,tagB'),
			('vid2', 'Second Video', '', 'tagB,tagC')`,
	}
	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			t.Fatalf("failed to seed: %v\nquery: %s", err, q)
		}
	}

	ts := httptest.NewServer(r)
	defer ts.Close()

	// Multiple tags: tagA AND tagB -> only vid1
	resp, err := http.Get(ts.URL + "/api/v1/videos?tag=tagA&tag=tagB")
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	if result["total"].(float64) != 1 {
		t.Errorf("expected 1 video with tagA AND tagB, got %v", result["total"])
	}
}
