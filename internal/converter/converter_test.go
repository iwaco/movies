package converter

import (
	"encoding/json"
	"os"
	"testing"
)

func TestParseJS_Basic(t *testing.T) {
	input, err := os.ReadFile("testdata/basic.js")
	if err != nil {
		t.Fatal(err)
	}

	got, err := ParseJS(input)
	if err != nil {
		t.Fatalf("ParseJS() error = %v", err)
	}

	// Result should be valid JSON array
	var arr []json.RawMessage
	if err := json.Unmarshal(got, &arr); err != nil {
		t.Fatalf("ParseJS() returned invalid JSON: %v", err)
	}

	if len(arr) != 2 {
		t.Errorf("ParseJS() returned %d items, want 2", len(arr))
	}
}

func TestParseJS_UnquotedKeys(t *testing.T) {
	input, err := os.ReadFile("testdata/unquoted.js")
	if err != nil {
		t.Fatal(err)
	}

	got, err := ParseJS(input)
	if err != nil {
		t.Fatalf("ParseJS() error = %v", err)
	}

	var arr []map[string]interface{}
	if err := json.Unmarshal(got, &arr); err != nil {
		t.Fatalf("ParseJS() returned invalid JSON: %v", err)
	}

	if len(arr) != 1 {
		t.Fatalf("ParseJS() returned %d items, want 1", len(arr))
	}

	if arr[0]["id"] != "xyz789" {
		t.Errorf("id = %v, want xyz789", arr[0]["id"])
	}
}

func TestParseJS_Empty(t *testing.T) {
	input, err := os.ReadFile("testdata/empty.js")
	if err != nil {
		t.Fatal(err)
	}

	got, err := ParseJS(input)
	if err != nil {
		t.Fatalf("ParseJS() error = %v", err)
	}

	var arr []json.RawMessage
	if err := json.Unmarshal(got, &arr); err != nil {
		t.Fatalf("ParseJS() returned invalid JSON: %v", err)
	}

	if len(arr) != 0 {
		t.Errorf("ParseJS() returned %d items, want 0", len(arr))
	}
}

func TestConvert(t *testing.T) {
	input, err := os.ReadFile("testdata/basic.js")
	if err != nil {
		t.Fatal(err)
	}

	jsonData, err := ParseJS(input)
	if err != nil {
		t.Fatalf("ParseJS() error = %v", err)
	}

	movies, err := Convert(jsonData)
	if err != nil {
		t.Fatalf("Convert() error = %v", err)
	}

	if len(movies) != 2 {
		t.Fatalf("Convert() returned %d items, want 2", len(movies))
	}

	// Check first movie
	m := movies[0]
	if m.ID != "abc123" {
		t.Errorf("ID = %q, want %q", m.ID, "abc123")
	}
	if m.Title != "Sample Movie" {
		t.Errorf("Title = %q, want %q", m.Title, "Sample Movie")
	}
	if m.URL != "https://example.com/abc123" {
		t.Errorf("URL = %q, want %q", m.URL, "https://example.com/abc123")
	}
	if m.Date != "2024-01-15" {
		t.Errorf("Date = %q, want %q", m.Date, "2024-01-15")
	}
	if m.JPG != "/some/dir/thumb.jpg" {
		t.Errorf("JPG = %q, want %q", m.JPG, "/some/dir/thumb.jpg")
	}
	if m.PicturesDir != "/some/dir/pics/" {
		t.Errorf("PicturesDir = %q, want %q", m.PicturesDir, "/some/dir/pics/")
	}

	wantFormats := map[string]string{
		"720p":  "/some/dir/video_720p.mp4",
		"1080p": "/some/dir/video_1080p.mp4",
	}
	for k, want := range wantFormats {
		if got, ok := m.Formats[k]; !ok || got != want {
			t.Errorf("Formats[%q] = %q, want %q", k, got, want)
		}
	}

	if len(m.Actors) != 2 || m.Actors[0] != "Actor A" || m.Actors[1] != "Actor B" {
		t.Errorf("Actors = %v, want [Actor A, Actor B]", m.Actors)
	}
	if len(m.Tags) != 2 || m.Tags[0] != "tag1" || m.Tags[1] != "tag2" {
		t.Errorf("Tags = %v, want [tag1, tag2]", m.Tags)
	}

	// Check second movie
	m2 := movies[1]
	if m2.JPG != "/other/path/cover.jpg" {
		t.Errorf("second JPG = %q, want %q", m2.JPG, "/other/path/cover.jpg")
	}
	if m2.PicturesDir != "/other/path/images/" {
		t.Errorf("second PicturesDir = %q, want %q", m2.PicturesDir, "/other/path/images/")
	}
}

func TestConvert_ExcludesDirAndDetail(t *testing.T) {
	input, err := os.ReadFile("testdata/basic.js")
	if err != nil {
		t.Fatal(err)
	}

	jsonData, err := ParseJS(input)
	if err != nil {
		t.Fatalf("ParseJS() error = %v", err)
	}

	movies, err := Convert(jsonData)
	if err != nil {
		t.Fatalf("Convert() error = %v", err)
	}

	// Verify output JSON doesn't contain "dir" or "detail" fields
	out, err := json.Marshal(movies[0])
	if err != nil {
		t.Fatal(err)
	}

	var raw map[string]interface{}
	json.Unmarshal(out, &raw)

	if _, ok := raw["dir"]; ok {
		t.Error("output should not contain 'dir' field")
	}
	if _, ok := raw["detail"]; ok {
		t.Error("output should not contain 'detail' field")
	}
}

func TestConvertFile(t *testing.T) {
	input, err := os.ReadFile("testdata/basic.js")
	if err != nil {
		t.Fatal(err)
	}

	got, err := ConvertFile(input)
	if err != nil {
		t.Fatalf("ConvertFile() error = %v", err)
	}

	// Should be valid JSON
	var movies []MovieOutput
	if err := json.Unmarshal(got, &movies); err != nil {
		t.Fatalf("ConvertFile() returned invalid JSON: %v", err)
	}

	if len(movies) != 2 {
		t.Errorf("ConvertFile() returned %d items, want 2", len(movies))
	}

	// Verify path resolution
	if movies[0].JPG != "/some/dir/thumb.jpg" {
		t.Errorf("JPG = %q, want %q", movies[0].JPG, "/some/dir/thumb.jpg")
	}
}

func TestConvertFile_Empty(t *testing.T) {
	input, err := os.ReadFile("testdata/empty.js")
	if err != nil {
		t.Fatal(err)
	}

	got, err := ConvertFile(input)
	if err != nil {
		t.Fatalf("ConvertFile() error = %v", err)
	}

	var movies []MovieOutput
	if err := json.Unmarshal(got, &movies); err != nil {
		t.Fatalf("ConvertFile() returned invalid JSON: %v", err)
	}

	if len(movies) != 0 {
		t.Errorf("ConvertFile() returned %d items, want 0", len(movies))
	}
}

func TestConvertFile_UnquotedKeys(t *testing.T) {
	input, err := os.ReadFile("testdata/unquoted.js")
	if err != nil {
		t.Fatal(err)
	}

	got, err := ConvertFile(input)
	if err != nil {
		t.Fatalf("ConvertFile() error = %v", err)
	}

	var movies []MovieOutput
	if err := json.Unmarshal(got, &movies); err != nil {
		t.Fatalf("ConvertFile() returned invalid JSON: %v", err)
	}

	if len(movies) != 1 {
		t.Fatalf("ConvertFile() returned %d items, want 1", len(movies))
	}

	m := movies[0]
	if m.ID != "xyz789" {
		t.Errorf("ID = %q, want %q", m.ID, "xyz789")
	}
	if m.JPG != "/unquoted/dir/photo.jpg" {
		t.Errorf("JPG = %q, want %q", m.JPG, "/unquoted/dir/photo.jpg")
	}
	if m.PicturesDir != "/unquoted/dir/gallery/" {
		t.Errorf("PicturesDir = %q, want %q", m.PicturesDir, "/unquoted/dir/gallery/")
	}
}
