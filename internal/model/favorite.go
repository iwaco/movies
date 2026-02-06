package model

import "time"

type Favorite struct {
	ID        int       `json:"id"`
	VideoID   string    `json:"video_id"`
	CreatedAt time.Time `json:"created_at"`
}
