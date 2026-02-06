package handler

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/iwaco/movies/internal/model"
	"github.com/iwaco/movies/internal/repository"
)

type VideoHandler struct {
	repo      *repository.VideoRepository
	mediaRoot string
}

func NewVideoHandler(repo *repository.VideoRepository, mediaRoot string) *VideoHandler {
	return &VideoHandler{repo: repo, mediaRoot: mediaRoot}
}

func (h *VideoHandler) List(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	perPage, _ := strconv.Atoi(r.URL.Query().Get("per_page"))
	if perPage < 1 {
		perPage = 20
	}
	sort := r.URL.Query().Get("sort")
	if sort == "" {
		sort = "date_desc"
	}

	params := model.VideoQueryParams{
		Page:     page,
		PerPage:  perPage,
		Query:    r.URL.Query().Get("q"),
		Tag:      r.URL.Query().Get("tag"),
		Actor:    r.URL.Query().Get("actor"),
		DateFrom: r.URL.Query().Get("date_from"),
		DateTo:   r.URL.Query().Get("date_to"),
		Sort:     sort,
		Favorite: r.URL.Query().Get("favorite") == "true",
	}

	result, err := h.repo.List(params)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, result)
}

func (h *VideoHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	video, err := h.repo.GetByID(id)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, video)
}

func (h *VideoHandler) GetPictures(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	video, err := h.repo.GetByID(id)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	var pictures []string
	dir := video.PicturesDir
	entries, err := os.ReadDir(filepath.Join(h.mediaRoot, dir))
	if err == nil {
		imageExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true}
		for _, entry := range entries {
			if !entry.IsDir() {
				ext := strings.ToLower(filepath.Ext(entry.Name()))
				if imageExts[ext] {
					pictures = append(pictures, filepath.Join(dir, entry.Name()))
				}
			}
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"pictures": pictures})
}

func (h *VideoHandler) ListTags(w http.ResponseWriter, r *http.Request) {
	tags, err := h.repo.ListTags()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if tags == nil {
		tags = []model.Tag{}
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"tags": tags})
}

func (h *VideoHandler) ListActors(w http.ResponseWriter, r *http.Request) {
	actors, err := h.repo.ListActors()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if actors == nil {
		actors = []model.Actor{}
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"actors": actors})
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
