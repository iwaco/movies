package handler

import (
	"database/sql"
	"net/http"
)

type HealthHandler struct {
	db *sql.DB
}

func NewHealthHandler(db *sql.DB) *HealthHandler {
	return &HealthHandler{db: db}
}

func (h *HealthHandler) Healthz(w http.ResponseWriter, r *http.Request) {
	if err := h.db.QueryRow("SELECT 1").Err(); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		w.Write([]byte(`{"status":"error"}`))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}

func (h *HealthHandler) Readyz(w http.ResponseWriter, r *http.Request) {
	if err := h.db.QueryRow("SELECT 1").Err(); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		w.Write([]byte(`{"status":"error"}`))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}
