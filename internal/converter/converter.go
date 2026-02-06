package converter

import (
	"encoding/json"
	"fmt"
	"path"
	"regexp"
	"strings"
)

// MovieOutput represents the output format compatible with the import API.
type MovieOutput struct {
	ID          string            `json:"id"`
	Title       string            `json:"title"`
	URL         string            `json:"url"`
	Date        string            `json:"date"`
	Actors      []string          `json:"actors"`
	Tags        []string          `json:"tags"`
	JPG         string            `json:"jpg"`
	PicturesDir string            `json:"pictures_dir"`
	Formats     map[string]string `json:"formats"`
}

type movieJS struct {
	ID      string            `json:"id"`
	Dir     string            `json:"dir"`
	JPG     string            `json:"jpg"`
	Detail  string            `json:"detail"`
	Title   string            `json:"title"`
	URL     string            `json:"url"`
	Date    string            `json:"date"`
	Actors  []string          `json:"actors"`
	Tags    []string          `json:"tags"`
	Formats map[string]string `json:"formats"`
}

var unquotedKeyRe = regexp.MustCompile(`(?m)([\{\,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:`)

// ParseJS converts a JavaScript variable assignment (var movies = [...];)
// into valid JSON bytes.
func ParseJS(input []byte) ([]byte, error) {
	s := string(input)

	// Remove "var movies = " prefix (with flexible whitespace)
	s = strings.TrimSpace(s)
	idx := strings.Index(s, "=")
	if idx == -1 {
		return nil, fmt.Errorf("no assignment found in input")
	}
	s = strings.TrimSpace(s[idx+1:])

	// Remove trailing semicolon
	s = strings.TrimRight(s, "; \t\n\r")

	// Quote unquoted keys: { key: or , key: → { "key": or , "key":
	s = unquotedKeyRe.ReplaceAllString(s, `${1}"${2}":`)

	// Remove trailing commas before } or ]
	trailingCommaRe := regexp.MustCompile(`,\s*([}\]])`)
	s = trailingCommaRe.ReplaceAllString(s, `$1`)

	// Validate it's valid JSON
	if !json.Valid([]byte(s)) {
		return nil, fmt.Errorf("resulting JSON is not valid")
	}

	return []byte(s), nil
}

// Convert transforms parsed JSON data into MovieOutput structs with resolved paths.
func Convert(jsonData []byte, baseDir string) ([]MovieOutput, error) {
	var jsMovies []movieJS
	if err := json.Unmarshal(jsonData, &jsMovies); err != nil {
		return nil, fmt.Errorf("unmarshal: %w", err)
	}

	movies := make([]MovieOutput, 0, len(jsMovies))
	for _, m := range jsMovies {
		dir := m.Dir

		// Resolve jpg path
		jpg := path.Join(baseDir, dir, m.JPG)

		// Resolve pictures_dir, preserving trailing slash
		picturesDir := path.Join(baseDir, dir, m.Detail) + "/"

		// Resolve format paths
		formats := make(map[string]string, len(m.Formats))
		for k, v := range m.Formats {
			formats[k] = path.Join(baseDir, dir, v)
		}

		movies = append(movies, MovieOutput{
			ID:          m.ID,
			Title:       m.Title,
			URL:         m.URL,
			Date:        m.Date,
			Actors:      m.Actors,
			Tags:        m.Tags,
			JPG:         jpg,
			PicturesDir: picturesDir,
			Formats:     formats,
		})
	}

	return movies, nil
}

// ConvertFile reads a JS file and returns formatted JSON output.
func ConvertFile(input []byte, baseDir string) ([]byte, error) {
	jsonData, err := ParseJS(input)
	if err != nil {
		return nil, fmt.Errorf("parse JS: %w", err)
	}

	movies, err := Convert(jsonData, baseDir)
	if err != nil {
		return nil, fmt.Errorf("convert: %w", err)
	}

	out, err := json.MarshalIndent(movies, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("marshal: %w", err)
	}

	return out, nil
}
