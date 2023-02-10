package middleware

import (
	"net/http"

	"github.com/gorilla/mux"
)

// set CORS policy to * by default
func CorsMiddleware(params ...string) mux.MiddlewareFunc {
	host := "*"

	if len(params) > 0 {
		host = params[0]
	}

	// needs to return a MiddlewareFunc
	return func(next http.Handler) http.Handler {
		var prepareCorsHandler http.HandlerFunc = func(res http.ResponseWriter, req *http.Request) {

			res.Header().Set("Access-Control-Allow-Origin", host)
			res.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
			res.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Authorization")
			// Call the next handler, which can be another middleware in the chain, or the final handler.
			next.ServeHTTP(res, req)
		}

		return http.HandlerFunc(prepareCorsHandler)
	}
}
