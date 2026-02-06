package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/iwaco/movies/internal/database"
	"github.com/iwaco/movies/internal/importer"
	"github.com/iwaco/movies/internal/repository"
)

func setupTestRouter(t *testing.T) (*chi.Mux, *database.DB) {
	t.Helper()
	db, err := database.New(":memory:")
	if err != nil {
		t.Fatalf("failed to create test db: %v", err)
	}

	videoRepo := repository.NewVideoRepository(db)
	favRepo := repository.NewFavoriteRepository(db)
	imp := importer.New(db)

	vh := NewVideoHandler(videoRepo)
	fh := NewFavoriteHandler(favRepo)
	ih := NewImportHandler(imp)

	r := chi.NewRouter()
	r.Get("/api/v1/videos", vh.List)
	r.Get("/api/v1/videos/{id}", vh.GetByID)
	r.Get("/api/v1/tags", vh.ListTags)
	r.Get("/api/v1/actors", vh.ListActors)
	r.Get("/api/v1/favorites", fh.List)
	r.Post("/api/v1/favorites", fh.Add)
	r.Delete("/api/v1/favorites/{videoID}", fh.Remove)
	r.Post("/api/v1/import", ih.Import)

	return r, db
}

func seedHandlerTestData(t *testing.T, db *database.DB) {
	t.Helper()
	queries := []string{
		`INSERT INTO videos (id, title, url, date, jpg, pictures_dir) VALUES
			('vid1', 'First Video', 'https://example.com/1', '2024-01-15', '/thumb1.jpg', '/pics/vid1/'),
			('vid2', 'Second Video', 'https://example.com/2', '2024-02-20', '/thumb2.jpg', '/pics/vid2/')`,
		`INSERT INTO actors (name) VALUES ('Actor A'), ('Actor B')`,
		`INSERT INTO tags (name) VALUES ('tag1'), ('tag2')`,
		`INSERT INTO video_actors (video_id, actor_id) VALUES ('vid1', 1), ('vid2', 2)`,
		`INSERT INTO video_tags (video_id, tag_id) VALUES ('vid1', 1), ('vid2', 2)`,
		`INSERT INTO video_formats (video_id, name, file_path) VALUES ('vid1', '720p', '/720p.mp4')`,
		`INSERT INTO videos_fts (video_id, title, actors, tags) VALUES
			('vid1', 'First Video', 'Actor A', 'tag1'),
			('vid2', 'Second Video', 'Actor B', 'tag2')`,
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

	if result["total"].(float64) != 2 {
		t.Errorf("expected total 2, got %v", result["total"])
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

func TestAddAndRemoveFavorite(t *testing.T) {
	r, db := setupTestRouter(t)
	defer db.Close()
	seedHandlerTestData(t, db)

	ts := httptest.NewServer(r)
	defer ts.Close()

	// Add favorite
	body := bytes.NewBufferString(`{"video_id": "vid1"}`)
	resp, err := http.Post(ts.URL+"/api/v1/favorites", "application/json", body)
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		t.Errorf("expected 201, got %d", resp.StatusCode)
	}

	// List favorites
	resp, err = http.Get(ts.URL + "/api/v1/favorites")
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	favorites := result["favorites"].([]interface{})
	if len(favorites) != 1 {
		t.Errorf("expected 1 favorite, got %d", len(favorites))
	}

	// Remove favorite
	req, _ := http.NewRequest(http.MethodDelete, ts.URL+"/api/v1/favorites/vid1", nil)
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
