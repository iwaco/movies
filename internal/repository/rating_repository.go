package repository

import (
	"database/sql"

	"github.com/iwaco/movies/internal/model"
)

type RatingRepository struct {
	db *sql.DB
}

func NewRatingRepository(db *sql.DB) *RatingRepository {
	return &RatingRepository{db: db}
}

func (r *RatingRepository) Set(videoID string, rating int) error {
	_, err := r.db.Exec(
		`INSERT INTO ratings (video_id, rating) VALUES ($1, $2)
		 ON CONFLICT(video_id) DO UPDATE SET rating = $2, updated_at = CURRENT_TIMESTAMP`,
		videoID, rating,
	)
	return err
}

func (r *RatingRepository) Remove(videoID string) error {
	_, err := r.db.Exec("DELETE FROM ratings WHERE video_id = $1", videoID)
	return err
}

func (r *RatingRepository) Get(videoID string) (int, error) {
	var rating int
	err := r.db.QueryRow("SELECT rating FROM ratings WHERE video_id = $1", videoID).Scan(&rating)
	if err == sql.ErrNoRows {
		return 0, nil
	}
	return rating, err
}

func (r *RatingRepository) List() ([]model.Rating, error) {
	rows, err := r.db.Query("SELECT id, video_id, rating, created_at, updated_at FROM ratings ORDER BY updated_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ratings []model.Rating
	for rows.Next() {
		var rt model.Rating
		if err := rows.Scan(&rt.ID, &rt.VideoID, &rt.Rating, &rt.CreatedAt, &rt.UpdatedAt); err != nil {
			return nil, err
		}
		ratings = append(ratings, rt)
	}
	return ratings, rows.Err()
}
