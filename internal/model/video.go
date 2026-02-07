package model

import "time"

type Video struct {
	ID          string        `json:"id"`
	Title       string        `json:"title"`
	URL         string        `json:"url"`
	Date        string        `json:"date"`
	JPG         string        `json:"jpg"`
	PicturesDir string        `json:"pictures_dir"`
	Actors      []Actor       `json:"actors"`
	Tags        []Tag         `json:"tags"`
	Formats     []VideoFormat `json:"formats"`
	IsFavorite  bool          `json:"is_favorite"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
}

type Actor struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type Tag struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type VideoFormat struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	FilePath string `json:"file_path"`
}

type VideoQueryParams struct {
	Page     int
	PerPage  int
	Query    string
	Tag      string
	Actor    string
	DateFrom string
	DateTo   string
	Sort     string
	Favorite bool
	HasVideo bool
}

type VideoListResult struct {
	Data       []Video `json:"data"`
	Total      int     `json:"total"`
	Page       int     `json:"page"`
	PerPage    int     `json:"per_page"`
	TotalPages int     `json:"total_pages"`
}
