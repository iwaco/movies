package handler

import (
	"io"
	"net/http"

	"github.com/iwaco/movies/internal/importer"
)

type ImportHandler struct {
	imp *importer.Importer
}

func NewImportHandler(imp *importer.Importer) *ImportHandler {
	return &ImportHandler{imp: imp}
}

func (h *ImportHandler) Import(w http.ResponseWriter, r *http.Request) {
	data, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "failed to read body", http.StatusBadRequest)
		return
	}

	count, err := h.imp.Import(data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"imported": count})
}
