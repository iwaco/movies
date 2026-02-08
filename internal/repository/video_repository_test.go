package repository

import (
	"testing"

	"github.com/iwaco/movies/internal/database"
	"github.com/iwaco/movies/internal/model"
)

func setupTestDB(t *testing.T) *database.DB {
	t.Helper()
	db, err := database.New(":memory:")
	if err != nil {
		t.Fatalf("failed to create test db: %v", err)
	}
	return db
}

func seedTestData(t *testing.T, db *database.DB) {
	t.Helper()
	queries := []string{
		`INSERT INTO videos (id, title, url, date, jpg, pictures_dir) VALUES
			('vid1', 'First Video', 'https://example.com/1', '2024-01-15', '/thumb1.jpg', '/pics/vid1/'),
			('vid2', 'Second Video', 'https://example.com/2', '2024-02-20', '/thumb2.jpg', '/pics/vid2/'),
			('vid3', 'Third Video', 'https://example.com/3', '2024-03-10', '/thumb3.jpg', '/pics/vid3/')`,
		`INSERT INTO actors (name) VALUES ('Actor A'), ('Actor B'), ('Actor C')`,
		`INSERT INTO tags (name) VALUES ('tag1'), ('tag2'), ('tag3')`,
		`INSERT INTO video_actors (video_id, actor_id) VALUES ('vid1', 1), ('vid1', 2), ('vid2', 2), ('vid2', 3), ('vid3', 1)`,
		`INSERT INTO video_tags (video_id, tag_id) VALUES ('vid1', 1), ('vid1', 2), ('vid2', 2), ('vid2', 3), ('vid3', 3)`,
		`INSERT INTO video_formats (video_id, name, file_path) VALUES ('vid1', '720p', '/720p_1.mp4'), ('vid1', '1080p', '/1080p_1.mp4'), ('vid2', '480p', '/480p_2.mp4')`,
		`INSERT INTO ratings (video_id, rating) VALUES ('vid1', 4)`,
		`INSERT INTO videos_fts (video_id, title, actors, tags) VALUES
			('vid1', 'First Video', 'Actor A,Actor B', 'tag1,tag2'),
			('vid2', 'Second Video', 'Actor B,Actor C', 'tag2,tag3'),
			('vid3', 'Third Video', 'Actor A', 'tag3')`,
	}
	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			t.Fatalf("failed to seed data: %v\nquery: %s", err, q)
		}
	}
}

func TestVideoRepositoryList(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	seedTestData(t, db)

	repo := NewVideoRepository(db)
	params := model.VideoQueryParams{
		Page:    1,
		PerPage: 20,
		Sort:    "date_desc",
	}
	result, err := repo.List(params)
	if err != nil {
		t.Fatalf("failed to list videos: %v", err)
	}

	if result.Total != 3 {
		t.Errorf("expected total 3, got %d", result.Total)
	}
	if len(result.Data) != 3 {
		t.Errorf("expected 3 videos, got %d", len(result.Data))
	}
	if result.Page != 1 {
		t.Errorf("expected page 1, got %d", result.Page)
	}
	if result.TotalPages != 1 {
		t.Errorf("expected 1 total page, got %d", result.TotalPages)
	}

	// date_desc: vid3 (2024-03-10) should be first
	if result.Data[0].ID != "vid3" {
		t.Errorf("expected first video to be vid3 (newest), got %s", result.Data[0].ID)
	}
}

func TestVideoRepositoryListWithActorsAndTags(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	seedTestData(t, db)

	repo := NewVideoRepository(db)
	result, err := repo.List(model.VideoQueryParams{Page: 1, PerPage: 20, Sort: "date_desc"})
	if err != nil {
		t.Fatalf("failed to list: %v", err)
	}

	// Find vid1 and check actors/tags/formats
	var vid1 *model.Video
	for i := range result.Data {
		if result.Data[i].ID == "vid1" {
			vid1 = &result.Data[i]
			break
		}
	}
	if vid1 == nil {
		t.Fatal("vid1 not found")
	}
	if len(vid1.Actors) != 2 {
		t.Errorf("expected 2 actors for vid1, got %d", len(vid1.Actors))
	}
	if len(vid1.Tags) != 2 {
		t.Errorf("expected 2 tags for vid1, got %d", len(vid1.Tags))
	}
	if len(vid1.Formats) != 2 {
		t.Errorf("expected 2 formats for vid1, got %d", len(vid1.Formats))
	}
	if vid1.Rating != 4 {
		t.Errorf("expected vid1 rating 4, got %d", vid1.Rating)
	}
}

func TestVideoRepositoryPagination(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	seedTestData(t, db)

	repo := NewVideoRepository(db)

	// Page 1, 2 per page
	result, err := repo.List(model.VideoQueryParams{Page: 1, PerPage: 2, Sort: "date_desc"})
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	if len(result.Data) != 2 {
		t.Errorf("expected 2 items on page 1, got %d", len(result.Data))
	}
	if result.Total != 3 {
		t.Errorf("expected total 3, got %d", result.Total)
	}
	if result.TotalPages != 2 {
		t.Errorf("expected 2 total pages, got %d", result.TotalPages)
	}

	// Page 2
	result, err = repo.List(model.VideoQueryParams{Page: 2, PerPage: 2, Sort: "date_desc"})
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	if len(result.Data) != 1 {
		t.Errorf("expected 1 item on page 2, got %d", len(result.Data))
	}
}

func TestVideoRepositoryFilterByTag(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	seedTestData(t, db)

	repo := NewVideoRepository(db)
	result, err := repo.List(model.VideoQueryParams{Page: 1, PerPage: 20, Sort: "date_desc", Tags: []string{"tag1"}})
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	if result.Total != 1 {
		t.Errorf("expected 1 video with tag1, got %d", result.Total)
	}
	if result.Data[0].ID != "vid1" {
		t.Errorf("expected vid1, got %s", result.Data[0].ID)
	}
}

func TestVideoRepositoryFilterByMultipleTags(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	seedTestData(t, db)

	repo := NewVideoRepository(db)

	// vid1 has tag1,tag2. vid2 has tag2,tag3. AND filter: tag1 AND tag2 -> only vid1
	result, err := repo.List(model.VideoQueryParams{Page: 1, PerPage: 20, Sort: "date_desc", Tags: []string{"tag1", "tag2"}})
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	if result.Total != 1 {
		t.Errorf("expected 1 video with tag1 AND tag2, got %d", result.Total)
	}
	if len(result.Data) > 0 && result.Data[0].ID != "vid1" {
		t.Errorf("expected vid1, got %s", result.Data[0].ID)
	}

	// AND filter: tag2 AND tag3 -> only vid2
	result, err = repo.List(model.VideoQueryParams{Page: 1, PerPage: 20, Sort: "date_desc", Tags: []string{"tag2", "tag3"}})
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	if result.Total != 1 {
		t.Errorf("expected 1 video with tag2 AND tag3, got %d", result.Total)
	}
	if len(result.Data) > 0 && result.Data[0].ID != "vid2" {
		t.Errorf("expected vid2, got %s", result.Data[0].ID)
	}

	// AND filter: tag1 AND tag3 -> no videos (no video has both)
	result, err = repo.List(model.VideoQueryParams{Page: 1, PerPage: 20, Sort: "date_desc", Tags: []string{"tag1", "tag3"}})
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	if result.Total != 0 {
		t.Errorf("expected 0 videos with tag1 AND tag3, got %d", result.Total)
	}
}

func TestVideoRepositoryFilterByActor(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	seedTestData(t, db)

	repo := NewVideoRepository(db)
	result, err := repo.List(model.VideoQueryParams{Page: 1, PerPage: 20, Sort: "date_desc", Actors: []string{"Actor C"}})
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	if result.Total != 1 {
		t.Errorf("expected 1 video with Actor C, got %d", result.Total)
	}
	if result.Data[0].ID != "vid2" {
		t.Errorf("expected vid2, got %s", result.Data[0].ID)
	}
}

func TestVideoRepositoryFilterByMultipleActors(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	seedTestData(t, db)

	repo := NewVideoRepository(db)

	// vid1 has Actor A, Actor B. vid2 has Actor B, Actor C. AND filter: Actor A AND Actor B -> only vid1
	result, err := repo.List(model.VideoQueryParams{Page: 1, PerPage: 20, Sort: "date_desc", Actors: []string{"Actor A", "Actor B"}})
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	if result.Total != 1 {
		t.Errorf("expected 1 video with Actor A AND Actor B, got %d", result.Total)
	}
	if len(result.Data) > 0 && result.Data[0].ID != "vid1" {
		t.Errorf("expected vid1, got %s", result.Data[0].ID)
	}

	// AND filter: Actor A AND Actor C -> no videos
	result, err = repo.List(model.VideoQueryParams{Page: 1, PerPage: 20, Sort: "date_desc", Actors: []string{"Actor A", "Actor C"}})
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	if result.Total != 0 {
		t.Errorf("expected 0 videos with Actor A AND Actor C, got %d", result.Total)
	}
}

func TestVideoRepositoryFilterByTagsAndActors(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	seedTestData(t, db)

	repo := NewVideoRepository(db)

	// vid1 has tag1,tag2 and Actor A, Actor B
	// Filter: tag2 AND Actor B -> vid1 and vid2 both have tag2 and Actor B
	result, err := repo.List(model.VideoQueryParams{Page: 1, PerPage: 20, Sort: "date_desc", Tags: []string{"tag2"}, Actors: []string{"Actor B"}})
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	if result.Total != 2 {
		t.Errorf("expected 2 videos with tag2 AND Actor B, got %d", result.Total)
	}

	// Filter: tag1 AND Actor A -> only vid1
	result, err = repo.List(model.VideoQueryParams{Page: 1, PerPage: 20, Sort: "date_desc", Tags: []string{"tag1"}, Actors: []string{"Actor A"}})
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	if result.Total != 1 {
		t.Errorf("expected 1 video with tag1 AND Actor A, got %d", result.Total)
	}
	if len(result.Data) > 0 && result.Data[0].ID != "vid1" {
		t.Errorf("expected vid1, got %s", result.Data[0].ID)
	}
}

func TestVideoRepositoryFilterByDateRange(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	seedTestData(t, db)

	repo := NewVideoRepository(db)
	result, err := repo.List(model.VideoQueryParams{
		Page: 1, PerPage: 20, Sort: "date_desc",
		DateFrom: "2024-02-01", DateTo: "2024-02-28",
	})
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	if result.Total != 1 {
		t.Errorf("expected 1 video in Feb 2024, got %d", result.Total)
	}
}

func TestVideoRepositoryFilterByMinRating(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	seedTestData(t, db)

	repo := NewVideoRepository(db)
	result, err := repo.List(model.VideoQueryParams{
		Page: 1, PerPage: 20, Sort: "date_desc", MinRating: 4,
	})
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	if result.Total != 1 {
		t.Errorf("expected 1 video with rating >= 4, got %d", result.Total)
	}
	if result.Data[0].ID != "vid1" {
		t.Errorf("expected vid1, got %s", result.Data[0].ID)
	}
}

func TestVideoRepositorySearchByTitle(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	seedTestData(t, db)

	repo := NewVideoRepository(db)

	// 英語タイトルの部分一致検索
	result, err := repo.List(model.VideoQueryParams{
		Page: 1, PerPage: 20, Sort: "date_desc", Query: "First",
	})
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	if result.Total != 1 {
		t.Errorf("expected 1 result for 'First', got %d", result.Total)
	}
}

func TestVideoRepositorySearchByActorName(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	seedTestData(t, db)

	repo := NewVideoRepository(db)

	// Actor A は vid1, vid3 に関連
	result, err := repo.List(model.VideoQueryParams{
		Page: 1, PerPage: 20, Sort: "date_desc", Query: "Actor A",
	})
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	if result.Total != 2 {
		t.Errorf("expected 2 results for 'Actor A', got %d", result.Total)
	}

	// Actor C は vid2 のみ
	result, err = repo.List(model.VideoQueryParams{
		Page: 1, PerPage: 20, Sort: "date_desc", Query: "Actor C",
	})
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	if result.Total != 1 {
		t.Errorf("expected 1 result for 'Actor C', got %d", result.Total)
	}
	if result.Data[0].ID != "vid2" {
		t.Errorf("expected vid2, got %s", result.Data[0].ID)
	}
}

func TestVideoRepositorySearchByTagName(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	seedTestData(t, db)

	repo := NewVideoRepository(db)

	// tag1 は vid1 のみ
	result, err := repo.List(model.VideoQueryParams{
		Page: 1, PerPage: 20, Sort: "date_desc", Query: "tag1",
	})
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	if result.Total != 1 {
		t.Errorf("expected 1 result for 'tag1', got %d", result.Total)
	}
	if result.Data[0].ID != "vid1" {
		t.Errorf("expected vid1, got %s", result.Data[0].ID)
	}

	// tag3 は vid2, vid3 に関連
	result, err = repo.List(model.VideoQueryParams{
		Page: 1, PerPage: 20, Sort: "date_desc", Query: "tag3",
	})
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	if result.Total != 2 {
		t.Errorf("expected 2 results for 'tag3', got %d", result.Total)
	}
}

func TestVideoRepositorySearchJapaneseTitle(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	seedTestData(t, db)

	// 日本語タイトルのテストデータを追加
	queries := []string{
		`INSERT INTO videos (id, title, url, date, jpg, pictures_dir) VALUES
			('vid4', '揺れるボヨヨンHカップ', 'https://example.com/4', '2024-04-01', '/thumb4.jpg', '/pics/vid4/'),
			('vid5', '美人OLの秘密の休日', 'https://example.com/5', '2024-05-01', '/thumb5.jpg', '/pics/vid5/')`,
	}
	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			t.Fatalf("failed to seed Japanese data: %v", err)
		}
	}

	repo := NewVideoRepository(db)

	tests := []struct {
		name        string
		query       string
		expectedIDs []string
	}{
		{"タイトル先頭の文字列で検索", "揺れる", []string{"vid4"}},
		{"タイトル途中の文字列で検索", "ボヨヨン", []string{"vid4"}},
		{"タイトル末尾の文字列で検索", "Hカップ", []string{"vid4"}},
		{"別の日本語タイトルで検索", "秘密", []string{"vid5"}},
		{"ヒットしないクエリ", "存在しない", nil},
		{"ワイルドカード%はリテラル扱い", "%", nil},
		{"ワイルドカード_はリテラル扱い", "_", nil},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := repo.List(model.VideoQueryParams{
				Page: 1, PerPage: 20, Sort: "date_desc", Query: tt.query,
			})
			if err != nil {
				t.Fatalf("failed to search '%s': %v", tt.query, err)
			}
			if result.Total != len(tt.expectedIDs) {
				t.Errorf("query '%s': expected %d results, got %d", tt.query, len(tt.expectedIDs), result.Total)
			}
			for i, expectedID := range tt.expectedIDs {
				if i < len(result.Data) && result.Data[i].ID != expectedID {
					t.Errorf("query '%s': expected result[%d] ID=%s, got %s", tt.query, i, expectedID, result.Data[i].ID)
				}
			}
		})
	}
}

func TestVideoRepositorySortDateAsc(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	seedTestData(t, db)

	repo := NewVideoRepository(db)
	result, err := repo.List(model.VideoQueryParams{Page: 1, PerPage: 20, Sort: "date_asc"})
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	if result.Data[0].ID != "vid1" {
		t.Errorf("expected vid1 first with date_asc, got %s", result.Data[0].ID)
	}
}

func TestVideoRepositoryGetByID(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	seedTestData(t, db)

	repo := NewVideoRepository(db)
	video, err := repo.GetByID("vid1")
	if err != nil {
		t.Fatalf("failed to get video: %v", err)
	}
	if video.ID != "vid1" {
		t.Errorf("expected vid1, got %s", video.ID)
	}
	if video.Title != "First Video" {
		t.Errorf("expected 'First Video', got %s", video.Title)
	}
	if len(video.Actors) != 2 {
		t.Errorf("expected 2 actors, got %d", len(video.Actors))
	}
}

func TestVideoRepositoryGetByIDNotFound(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	seedTestData(t, db)

	repo := NewVideoRepository(db)
	_, err := repo.GetByID("nonexistent")
	if err == nil {
		t.Error("expected error for nonexistent video")
	}
}

func TestVideoRepositoryListTags(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	seedTestData(t, db)

	repo := NewVideoRepository(db)
	tags, err := repo.ListTags()
	if err != nil {
		t.Fatalf("failed to list tags: %v", err)
	}
	if len(tags) != 3 {
		t.Errorf("expected 3 tags, got %d", len(tags))
	}
}

func TestVideoRepositoryFilterByHasVideo(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	seedTestData(t, db)

	repo := NewVideoRepository(db)
	result, err := repo.List(model.VideoQueryParams{
		Page: 1, PerPage: 20, Sort: "date_desc", HasVideo: true,
	})
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	if result.Total != 2 {
		t.Errorf("expected 2 videos with formats, got %d", result.Total)
	}
	// vid1 and vid2 have formats, vid3 does not
	ids := map[string]bool{}
	for _, v := range result.Data {
		ids[v.ID] = true
	}
	if !ids["vid1"] || !ids["vid2"] {
		t.Errorf("expected vid1 and vid2, got %v", ids)
	}
	if ids["vid3"] {
		t.Error("vid3 should not be included (no formats)")
	}
}

func TestVideoRepositoryFilterByHasVideoFalse(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	seedTestData(t, db)

	repo := NewVideoRepository(db)
	result, err := repo.List(model.VideoQueryParams{
		Page: 1, PerPage: 20, Sort: "date_desc", HasVideo: false,
	})
	if err != nil {
		t.Fatalf("failed: %v", err)
	}
	if result.Total != 3 {
		t.Errorf("expected 3 videos (all), got %d", result.Total)
	}
}

func TestVideoRepositoryListActors(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	seedTestData(t, db)

	repo := NewVideoRepository(db)
	actors, err := repo.ListActors()
	if err != nil {
		t.Fatalf("failed to list actors: %v", err)
	}
	if len(actors) != 3 {
		t.Errorf("expected 3 actors, got %d", len(actors))
	}
}
