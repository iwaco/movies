package repository

import (
	"database/sql"

	"github.com/iwaco/movies/internal/model"
)

type FavoriteRepository struct {
	db *sql.DB
}

func NewFavoriteRepository(db *sql.DB) *FavoriteRepository {
	return &FavoriteRepository{db: db}
}

func (r *FavoriteRepository) Add(videoID string) error {
	_, err := r.db.Exec("INSERT OR IGNORE INTO favorites (video_id) VALUES ($1)", videoID)
	return err
}

func (r *FavoriteRepository) Remove(videoID string) error {
	_, err := r.db.Exec("DELETE FROM favorites WHERE video_id = $1", videoID)
	return err
}

func (r *FavoriteRepository) List() ([]model.Favorite, error) {
	rows, err := r.db.Query("SELECT id, video_id, created_at FROM favorites ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var favorites []model.Favorite
	for rows.Next() {
		var f model.Favorite
		if err := rows.Scan(&f.ID, &f.VideoID, &f.CreatedAt); err != nil {
			return nil, err
		}
		favorites = append(favorites, f)
	}
	return favorites, rows.Err()
}
