package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/iwaco/movies/internal/model"
	"github.com/iwaco/movies/internal/repository"
)

type FavoriteHandler struct {
	repo *repository.FavoriteRepository
}

func NewFavoriteHandler(repo *repository.FavoriteRepository) *FavoriteHandler {
	return &FavoriteHandler{repo: repo}
}

func (h *FavoriteHandler) Add(w http.ResponseWriter, r *http.Request) {
	var req struct {
		VideoID string `json:"video_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if err := h.repo.Add(req.VideoID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (h *FavoriteHandler) Remove(w http.ResponseWriter, r *http.Request) {
	videoID := chi.URLParam(r, "videoID")
	if err := h.repo.Remove(videoID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *FavoriteHandler) List(w http.ResponseWriter, r *http.Request) {
	favorites, err := h.repo.List()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if favorites == nil {
		favorites = []model.Favorite{}
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"favorites": favorites})
}
