package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/iwaco/movies/internal/config"
	"github.com/iwaco/movies/internal/database"
	"github.com/iwaco/movies/internal/router"
)

func main() {
	cfg := config.Load()

	db, err := database.New(cfg.DBPath)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer db.Close()

	r := router.New(db, cfg)

	handler := router.WithSPAFallback(r, "frontend/dist/index.html")

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("starting server on %s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
