package router

import (
	"database/sql"
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/iwaco/movies/internal/config"
	"github.com/iwaco/movies/internal/handler"
	"github.com/iwaco/movies/internal/importer"
	"github.com/iwaco/movies/internal/repository"
)

func New(db *sql.DB, cfg *config.Config) *chi.Mux {
	videoRepo := repository.NewVideoRepository(db)
	ratingRepo := repository.NewRatingRepository(db)
	imp := importer.New(db)

	vh := handler.NewVideoHandler(videoRepo, cfg.MediaRoot)
	rh := handler.NewRatingHandler(ratingRepo)
	ih := handler.NewImportHandler(imp)
	hh := handler.NewHealthHandler(db)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Get("/healthz", hh.Healthz)
	r.Get("/readyz", hh.Readyz)

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/videos", vh.List)
		r.Get("/videos/{id}", vh.GetByID)
		r.Get("/videos/{id}/pictures", vh.GetPictures)
		r.Get("/tags", vh.ListTags)
		r.Get("/actors", vh.ListActors)
		r.Put("/ratings/{videoID}", rh.Set)
		r.Delete("/ratings/{videoID}", rh.Remove)
		r.Post("/import", ih.Import)
	})

	r.Handle("/media/*", handler.NewMediaHandler(cfg.MediaRoot))

	return r
}

func WithSPAFallback(r *chi.Mux, indexPath string) http.Handler {
	distDir := filepath.Dir(indexPath)
	fileServer := http.FileServer(http.Dir(distDir))

	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		// Try chi router first
		rctx := chi.NewRouteContext()
		if r.Match(rctx, req.Method, req.URL.Path) {
			r.ServeHTTP(w, req)
			return
		}
		// Try serving static file from dist directory
		filePath := filepath.Join(distDir, req.URL.Path)
		if info, err := os.Stat(filePath); err == nil && !info.IsDir() {
			fileServer.ServeHTTP(w, req)
			return
		}
		// Fallback to SPA index.html
		http.ServeFile(w, req, indexPath)
	})
}
