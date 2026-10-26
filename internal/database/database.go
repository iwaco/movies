package database

import (
	"database/sql"
	"strings"

	_ "modernc.org/sqlite"
)

type DB = sql.DB

func New(dsn string) (*DB, error) {
	db, err := sql.Open("sqlite", withForeignKeys(dsn))
	if err != nil {
		return nil, err
	}

	if err := RunMigrations(db); err != nil {
		db.Close()
		return nil, err
	}

	return db, nil
}

func RunMigrations(db *DB) error {
	_, err := db.Exec(migrations)
	return err
}

// withForeignKeys appends a _pragma query parameter to dsn so that
// modernc.org/sqlite enables foreign keys on every connection it opens.
// PRAGMA foreign_keys is a per-connection setting, so executing it once
// after sql.Open only affects whichever pooled connection runs it.
func withForeignKeys(dsn string) string {
	sep := "?"
	if strings.Contains(dsn, "?") {
		sep = "&"
	}
	return dsn + sep + "_pragma=foreign_keys(1)"
}
