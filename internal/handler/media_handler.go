package handler

import (
	"net/http"
)

func NewMediaHandler(mediaRoot string) http.Handler {
	return http.StripPrefix("/media", http.FileServer(http.Dir(mediaRoot)))
}
