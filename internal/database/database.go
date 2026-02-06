package database

import (
	"database/sql"

	_ "modernc.org/sqlite"
)

type DB = sql.DB

func New(dsn string) (*DB, error) {
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}

	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		db.Close()
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
