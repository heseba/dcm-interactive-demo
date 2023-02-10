package middleware

import (
	"net/http"
	"strings"
)

// mime.AddExtensionType(".txt", "text/plain; charset=utf-8")
// mime.AddExtensionType(".html", "text/html")
// mime.AddExtensionType(".css", "text/css; charset=utf-8")
// mime.AddExtensionType(".js", "application/javascript; charset=utf-8")

// Prepares HTTP headers for each request
func HeaderMiddleware(next http.Handler) http.Handler {
	var prepareHeaderHandler http.HandlerFunc = func(res http.ResponseWriter, req *http.Request) {

		// only for development, disables cache and set content-type for wasm.
		// res.Header().Add("Cache-Control", "no-cache")

		if strings.HasSuffix(req.URL.Path, ".wasm") {
			res.Header().Set("content-type", "application/wasm")
		}
		// contentType := req.Header.Get("Content-Type")
		// if contentType != "" {
		// 	log.Printf("HeaderMiddleware: new Content-Type: %s", contentType)
		// }

		// Call the next handler, which can be another middleware in the chain, or the final handler.
		next.ServeHTTP(res, req)
	}

	return http.HandlerFunc(prepareHeaderHandler)
}
