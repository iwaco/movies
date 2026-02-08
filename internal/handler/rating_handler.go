package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/iwaco/movies/internal/repository"
)

type RatingHandler struct {
	repo *repository.RatingRepository
}

func NewRatingHandler(repo *repository.RatingRepository) *RatingHandler {
	return &RatingHandler{repo: repo}
}

func (h *RatingHandler) Set(w http.ResponseWriter, r *http.Request) {
	videoID := chi.URLParam(r, "videoID")
	var req struct {
		Rating int `json:"rating"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if req.Rating < 1 || req.Rating > 5 {
		http.Error(w, "rating must be between 1 and 5", http.StatusBadRequest)
		return
	}
	if err := h.repo.Set(videoID, req.Rating); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *RatingHandler) Remove(w http.ResponseWriter, r *http.Request) {
	videoID := chi.URLParam(r, "videoID")
	if err := h.repo.Remove(videoID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
