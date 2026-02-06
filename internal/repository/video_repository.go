package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/iwaco/movies/internal/model"
)

type VideoRepository struct {
	db *sql.DB
}

func NewVideoRepository(db *sql.DB) *VideoRepository {
	return &VideoRepository{db: db}
}

func (r *VideoRepository) List(params model.VideoQueryParams) (*model.VideoListResult, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	argIdx := 1

	if params.Query != "" {
		where = append(where, fmt.Sprintf("v.id IN (SELECT video_id FROM videos_fts WHERE videos_fts MATCH $%d)", argIdx))
		args = append(args, params.Query+"*")
		argIdx++
	}
	if params.Tag != "" {
		where = append(where, fmt.Sprintf("v.id IN (SELECT vt.video_id FROM video_tags vt JOIN tags t ON t.id = vt.tag_id WHERE t.name = $%d)", argIdx))
		args = append(args, params.Tag)
		argIdx++
	}
	if params.Actor != "" {
		where = append(where, fmt.Sprintf("v.id IN (SELECT va.video_id FROM video_actors va JOIN actors a ON a.id = va.actor_id WHERE a.name = $%d)", argIdx))
		args = append(args, params.Actor)
		argIdx++
	}
	if params.DateFrom != "" {
		where = append(where, fmt.Sprintf("v.date >= $%d", argIdx))
		args = append(args, params.DateFrom)
		argIdx++
	}
	if params.DateTo != "" {
		where = append(where, fmt.Sprintf("v.date <= $%d", argIdx))
		args = append(args, params.DateTo)
		argIdx++
	}
	if params.Favorite {
		where = append(where, "v.id IN (SELECT video_id FROM favorites)")
	}

	whereClause := strings.Join(where, " AND ")

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM videos v WHERE %s", whereClause)
	var total int
	if err := r.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		return nil, err
	}

	// Sort
	orderBy := "v.date DESC"
	switch params.Sort {
	case "date_asc":
		orderBy = "v.date ASC"
	case "title_asc":
		orderBy = "v.title ASC"
	case "title_desc":
		orderBy = "v.title DESC"
	}

	// Pagination
	page := params.Page
	if page < 1 {
		page = 1
	}
	perPage := params.PerPage
	if perPage < 1 {
		perPage = 20
	}
	offset := (page - 1) * perPage
	totalPages := (total + perPage - 1) / perPage
	if totalPages < 1 {
		totalPages = 1
	}

	query := fmt.Sprintf(`SELECT v.id, v.title, v.url, v.date, v.jpg, v.pictures_dir, v.created_at, v.updated_at
		FROM videos v WHERE %s ORDER BY %s LIMIT $%d OFFSET $%d`, whereClause, orderBy, argIdx, argIdx+1)
	args = append(args, perPage, offset)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var videos []model.Video
	for rows.Next() {
		var v model.Video
		if err := rows.Scan(&v.ID, &v.Title, &v.URL, &v.Date, &v.JPG, &v.PicturesDir, &v.CreatedAt, &v.UpdatedAt); err != nil {
			return nil, err
		}
		videos = append(videos, v)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Load actors, tags, formats, favorite status for each video
	for i := range videos {
		if err := r.loadRelations(&videos[i]); err != nil {
			return nil, err
		}
	}

	return &model.VideoListResult{
		Data:       videos,
		Total:      total,
		Page:       page,
		PerPage:    perPage,
		TotalPages: totalPages,
	}, nil
}

func (r *VideoRepository) GetByID(id string) (*model.Video, error) {
	var v model.Video
	err := r.db.QueryRow(`SELECT id, title, url, date, jpg, pictures_dir, created_at, updated_at FROM videos WHERE id = $1`, id).
		Scan(&v.ID, &v.Title, &v.URL, &v.Date, &v.JPG, &v.PicturesDir, &v.CreatedAt, &v.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if err := r.loadRelations(&v); err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *VideoRepository) ListTags() ([]model.Tag, error) {
	rows, err := r.db.Query("SELECT id, name FROM tags ORDER BY name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []model.Tag
	for rows.Next() {
		var t model.Tag
		if err := rows.Scan(&t.ID, &t.Name); err != nil {
			return nil, err
		}
		tags = append(tags, t)
	}
	return tags, rows.Err()
}

func (r *VideoRepository) ListActors() ([]model.Actor, error) {
	rows, err := r.db.Query("SELECT id, name FROM actors ORDER BY name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var actors []model.Actor
	for rows.Next() {
		var a model.Actor
		if err := rows.Scan(&a.ID, &a.Name); err != nil {
			return nil, err
		}
		actors = append(actors, a)
	}
	return actors, rows.Err()
}

func (r *VideoRepository) loadRelations(v *model.Video) error {
	// Actors
	rows, err := r.db.Query(`SELECT a.id, a.name FROM actors a
		JOIN video_actors va ON va.actor_id = a.id WHERE va.video_id = $1 ORDER BY a.name`, v.ID)
	if err != nil {
		return err
	}
	defer rows.Close()
	v.Actors = []model.Actor{}
	for rows.Next() {
		var a model.Actor
		if err := rows.Scan(&a.ID, &a.Name); err != nil {
			return err
		}
		v.Actors = append(v.Actors, a)
	}
	if err := rows.Err(); err != nil {
		return err
	}

	// Tags
	tagRows, err := r.db.Query(`SELECT t.id, t.name FROM tags t
		JOIN video_tags vt ON vt.tag_id = t.id WHERE vt.video_id = $1 ORDER BY t.name`, v.ID)
	if err != nil {
		return err
	}
	defer tagRows.Close()
	v.Tags = []model.Tag{}
	for tagRows.Next() {
		var t model.Tag
		if err := tagRows.Scan(&t.ID, &t.Name); err != nil {
			return err
		}
		v.Tags = append(v.Tags, t)
	}
	if err := tagRows.Err(); err != nil {
		return err
	}

	// Formats
	fmtRows, err := r.db.Query(`SELECT id, name, file_path FROM video_formats WHERE video_id = $1 ORDER BY name`, v.ID)
	if err != nil {
		return err
	}
	defer fmtRows.Close()
	v.Formats = []model.VideoFormat{}
	for fmtRows.Next() {
		var f model.VideoFormat
		if err := fmtRows.Scan(&f.ID, &f.Name, &f.FilePath); err != nil {
			return err
		}
		v.Formats = append(v.Formats, f)
	}
	if err := fmtRows.Err(); err != nil {
		return err
	}

	// Favorite
	var count int
	r.db.QueryRow("SELECT COUNT(*) FROM favorites WHERE video_id = $1", v.ID).Scan(&count)
	v.IsFavorite = count > 0

	return nil
}
