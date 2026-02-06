package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBPath    string
	MediaRoot string
	Port      string
}

func Load() *Config {
	_ = godotenv.Load()
	return &Config{
		DBPath:    getEnv("MOVIES_DB_PATH", "movies.db"),
		MediaRoot: getEnv("MOVIES_MEDIA_ROOT", "./media"),
		Port:      getEnv("MOVIES_PORT", "8080"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
