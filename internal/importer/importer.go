package importer

import (
	"database/sql"
	"encoding/json"
	"strings"
)

type Importer struct {
	db *sql.DB
}

type videoJSON struct {
	ID          string            `json:"id"`
	Title       string            `json:"title"`
	URL         string            `json:"url"`
	Date        string            `json:"date"`
	Actors      []string          `json:"actors"`
	Tags        []string          `json:"tags"`
	JPG         string            `json:"jpg"`
	PicturesDir string            `json:"pictures_dir"`
	Formats     map[string]string `json:"formats"`
}

func New(db *sql.DB) *Importer {
	return &Importer{db: db}
}

func (imp *Importer) Import(data []byte) (int, error) {
	var videos []videoJSON
	if err := json.Unmarshal(data, &videos); err != nil {
		return 0, err
	}

	tx, err := imp.db.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	for _, v := range videos {
		// Upsert video
		_, err := tx.Exec(`INSERT INTO videos (id, title, url, date, jpg, pictures_dir)
			VALUES ($1, $2, $3, $4, $5, $6)
			ON CONFLICT(id) DO UPDATE SET title=$2, url=$3, date=$4, jpg=$5, pictures_dir=$6, updated_at=CURRENT_TIMESTAMP`,
			v.ID, v.Title, v.URL, v.Date, v.JPG, v.PicturesDir)
		if err != nil {
			return 0, err
		}

		// Clean up old relations for this video
		tx.Exec("DELETE FROM video_actors WHERE video_id = $1", v.ID)
		tx.Exec("DELETE FROM video_tags WHERE video_id = $1", v.ID)
		tx.Exec("DELETE FROM video_formats WHERE video_id = $1", v.ID)
		tx.Exec("DELETE FROM videos_fts WHERE video_id = $1", v.ID)

		// Insert actors
		var actorNames []string
		for _, name := range v.Actors {
			_, err := tx.Exec("INSERT OR IGNORE INTO actors (name) VALUES ($1)", name)
			if err != nil {
				return 0, err
			}
			var actorID int
			if err := tx.QueryRow("SELECT id FROM actors WHERE name = $1", name).Scan(&actorID); err != nil {
				return 0, err
			}
			_, err = tx.Exec("INSERT OR IGNORE INTO video_actors (video_id, actor_id) VALUES ($1, $2)", v.ID, actorID)
			if err != nil {
				return 0, err
			}
			actorNames = append(actorNames, name)
		}

		// Insert tags
		var tagNames []string
		for _, name := range v.Tags {
			_, err := tx.Exec("INSERT OR IGNORE INTO tags (name) VALUES ($1)", name)
			if err != nil {
				return 0, err
			}
			var tagID int
			if err := tx.QueryRow("SELECT id FROM tags WHERE name = $1", name).Scan(&tagID); err != nil {
				return 0, err
			}
			_, err = tx.Exec("INSERT OR IGNORE INTO video_tags (video_id, tag_id) VALUES ($1, $2)", v.ID, tagID)
			if err != nil {
				return 0, err
			}
			tagNames = append(tagNames, name)
		}

		// Insert formats
		for name, filePath := range v.Formats {
			_, err := tx.Exec("INSERT OR IGNORE INTO video_formats (video_id, name, file_path) VALUES ($1, $2, $3)",
				v.ID, name, filePath)
			if err != nil {
				return 0, err
			}
		}

		// Update FTS
		_, err = tx.Exec("INSERT INTO videos_fts (video_id, title, actors, tags) VALUES ($1, $2, $3, $4)",
			v.ID, v.Title, strings.Join(actorNames, ","), strings.Join(tagNames, ","))
		if err != nil {
			return 0, err
		}
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return len(videos), nil
}
