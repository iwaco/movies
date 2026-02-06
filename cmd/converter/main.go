package main

import (
	"flag"
	"fmt"
	"os"

	"github.com/iwaco/movies/internal/converter"
)

func main() {
	baseDir := flag.String("base", "", "base directory for resolving paths (required)")
	output := flag.String("output", "", "output file path (default: stdout)")
	flag.Parse()

	if *baseDir == "" {
		fmt.Fprintln(os.Stderr, "error: -base flag is required")
		flag.Usage()
		os.Exit(1)
	}

	args := flag.Args()
	if len(args) != 1 {
		fmt.Fprintln(os.Stderr, "error: exactly one input file is required")
		flag.Usage()
		os.Exit(1)
	}

	input, err := os.ReadFile(args[0])
	if err != nil {
		fmt.Fprintf(os.Stderr, "error reading input file: %v\n", err)
		os.Exit(1)
	}

	result, err := converter.ConvertFile(input, *baseDir)
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
