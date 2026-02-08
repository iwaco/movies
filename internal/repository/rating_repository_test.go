package repository

import (
	"testing"

	"github.com/iwaco/movies/internal/database"
)

func setupRatingTestDB(t *testing.T) *database.DB {
	t.Helper()
	db, err := database.New(":memory:")
	if err != nil {
		t.Fatalf("failed to create test db: %v", err)
	}
	_, err = db.Exec(`INSERT INTO videos (id, title) VALUES ('vid1', 'Test Video 1'), ('vid2', 'Test Video 2')`)
	if err != nil {
		t.Fatalf("failed to seed video: %v", err)
	}
	return db
}

func TestRatingRepositorySet(t *testing.T) {
	db := setupRatingTestDB(t)
	defer db.Close()

	repo := NewRatingRepository(db)

	// Set rating
	err := repo.Set("vid1", 3)
	if err != nil {
		t.Fatalf("failed to set rating: %v", err)
	}

	// Verify
	rating, err := repo.Get("vid1")
	if err != nil {
		t.Fatalf("failed to get rating: %v", err)
	}
	if rating != 3 {
		t.Errorf("expected rating 3, got %d", rating)
	}
}

func TestRatingRepositorySetUpdate(t *testing.T) {
	db := setupRatingTestDB(t)
	defer db.Close()

	repo := NewRatingRepository(db)

	// Set initial rating
	_ = repo.Set("vid1", 3)

	// Update rating
	err := repo.Set("vid1", 5)
	if err != nil {
		t.Fatalf("failed to update rating: %v", err)
	}

	rating, err := repo.Get("vid1")
	if err != nil {
		t.Fatalf("failed to get rating: %v", err)
	}
	if rating != 5 {
		t.Errorf("expected rating 5, got %d", rating)
	}
}

func TestRatingRepositoryRemove(t *testing.T) {
	db := setupRatingTestDB(t)
	defer db.Close()

	repo := NewRatingRepository(db)
	_ = repo.Set("vid1", 4)

	err := repo.Remove("vid1")
	if err != nil {
		t.Fatalf("failed to remove rating: %v", err)
	}

	rating, err := repo.Get("vid1")
	if err != nil {
		t.Fatalf("failed to get rating: %v", err)
	}
	if rating != 0 {
		t.Errorf("expected rating 0 after removal, got %d", rating)
	}
}

func TestRatingRepositoryGetUnrated(t *testing.T) {
	db := setupRatingTestDB(t)
	defer db.Close()

	repo := NewRatingRepository(db)

	rating, err := repo.Get("vid1")
	if err != nil {
		t.Fatalf("failed to get rating: %v", err)
	}
	if rating != 0 {
		t.Errorf("expected rating 0 for unrated video, got %d", rating)
	}
}

func TestRatingRepositoryList(t *testing.T) {
	db := setupRatingTestDB(t)
	defer db.Close()

	repo := NewRatingRepository(db)
	_ = repo.Set("vid1", 3)
	_ = repo.Set("vid2", 5)

	ratings, err := repo.List()
	if err != nil {
		t.Fatalf("failed to list ratings: %v", err)
	}
	if len(ratings) != 2 {
		t.Errorf("expected 2 ratings, got %d", len(ratings))
	}
}
