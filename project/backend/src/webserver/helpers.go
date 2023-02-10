package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"strconv"
)

// Returns fallback when ENV var of type String is undefined
func GetEnvString(envKey, fallback string) string {
	if value, ok := os.LookupEnv(envKey); ok {
		return value
	}

	return fallback
}

// Returns fallback when ENV var of type INT is undefined
func GetEnvInt(envKey string, fallback int) int {
	if value, ok := os.LookupEnv(envKey); ok {
		v, err := strconv.Atoi(value)
		if err != nil {
			log.Fatalf("GetEnvInt[%s]: %v", envKey, err)
		}
		return v
	}
	return fallback
}

// Prints command line options (basically flag.Usage() but customized)
var PrintCommandlineUsage = func() {
	fmt.Fprintf(os.Stderr, "Usage of %s:\n", os.Args[0])
	flag.PrintDefaults()
}
