package model

import "time"

type Rating struct {
	ID        int       `json:"id"`
	VideoID   string    `json:"video_id"`
	Rating    int       `json:"rating"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
