package util

import (
	"fmt"
	"math/rand"
	"net/http"
	"net/http/httputil"
	"os"
	"time"
)

// checks if a string is present in a slice
func IsStringInSlice(s []string, str string) bool {
	for _, v := range s {
		if v == str {
			return true
		}
	}

	return false
}

func DumpRequest(req *http.Request) {
	requestDump, err := httputil.DumpRequest(req, true)
	if err != nil {
		fmt.Print(err)
	}
	fmt.Print(string(requestDump))
}

func FileExists(path string) bool {
	if _, err := os.Stat(path); err == nil {
		return true
	}
	return false
}

// random id generator, default length 100
func GenerateUUID(options ...int) string {
	length := 100

	if len(options) != 0 {
		length = options[0]
	}

	seed := rand.New(rand.NewSource(time.Now().UnixNano()))
	charset := "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz"

	b := make([]byte, length)
	for i := range b {
		b[i] = charset[seed.Intn(len(charset))]
	}

	return string(b)
}
