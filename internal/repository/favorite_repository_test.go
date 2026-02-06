package repository

import (
	"testing"

	"github.com/iwaco/movies/internal/database"
)

func setupFavoriteTestDB(t *testing.T) *database.DB {
	t.Helper()
	db, err := database.New(":memory:")
	if err != nil {
		t.Fatalf("failed to create test db: %v", err)
	}
	// seed a video
	_, err = db.Exec(`INSERT INTO videos (id, title) VALUES ('vid1', 'Test Video')`)
	if err != nil {
		t.Fatalf("failed to seed video: %v", err)
	}
	return db
}

func TestFavoriteRepositoryAdd(t *testing.T) {
	db := setupFavoriteTestDB(t)
	defer db.Close()

	repo := NewFavoriteRepository(db)
	err := repo.Add("vid1")
	if err != nil {
		t.Fatalf("failed to add favorite: %v", err)
	}

	// Adding the same video again should not error (upsert behavior)
	err = repo.Add("vid1")
	if err != nil {
		t.Fatalf("adding duplicate favorite should not error: %v", err)
	}
}

func TestFavoriteRepositoryRemove(t *testing.T) {
	db := setupFavoriteTestDB(t)
	defer db.Close()

	repo := NewFavoriteRepository(db)
	_ = repo.Add("vid1")

	err := repo.Remove("vid1")
	if err != nil {
		t.Fatalf("failed to remove favorite: %v", err)
	}
}

func TestFavoriteRepositoryList(t *testing.T) {
	db := setupFavoriteTestDB(t)
	defer db.Close()

	// Add more videos
	_, _ = db.Exec(`INSERT INTO videos (id, title) VALUES ('vid2', 'Video 2')`)

	repo := NewFavoriteRepository(db)
	_ = repo.Add("vid1")
	_ = repo.Add("vid2")

	favorites, err := repo.List()
	if err != nil {
		t.Fatalf("failed to list favorites: %v", err)
	}
	if len(favorites) != 2 {
		t.Errorf("expected 2 favorites, got %d", len(favorites))
	}
}
