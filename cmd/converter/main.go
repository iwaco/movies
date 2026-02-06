package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"github.com/iwaco/movies/internal/converter"
)

func main() {
	inputFile := flag.String("input", "", "input JS file path (required)")
	output := flag.String("output", "", "output file path (default: stdout)")
	flag.Parse()

	if *inputFile == "" {
		fmt.Fprintln(os.Stderr, "error: -input flag is required")
		flag.Usage()
		os.Exit(1)
	}

	baseDir := filepath.Dir(*inputFile)

	input, err := os.ReadFile(*inputFile)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error reading input file: %v\n", err)
		os.Exit(1)
	}

	result, err := converter.ConvertFile(input, baseDir)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error converting: %v\n", err)
		os.Exit(1)
	}

	if *output != "" {
		if err := os.WriteFile(*output, result, 0644); err != nil {
			fmt.Fprintf(os.Stderr, "error writing output file: %v\n", err)
			os.Exit(1)
		}
	} else {
		fmt.Println(string(result))
	}
}
