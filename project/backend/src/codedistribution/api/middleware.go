package api

import (
	"codedistribution/global"
	"codedistribution/models"
	"codedistribution/util"
	"net/http"

	"golang.org/x/time/rate"
)

// check if it's a GET or POST request
func isValidRequestMethod(req *http.Request, validRequestMethods []string) bool {
	// dumpRequest(req)
	return util.IsStringInSlice(validRequestMethods[:], req.Method)
}

func ValidateApiKeyMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {

		if !util.IsStringInSlice(global.GetConfig().API_KEYS, req.Header.Get("Authorization")) {
			var errorMsg models.JsonResponse = models.JsonResponse{
				Error: &models.JsonError{
					Code:    http.StatusBadRequest,
					Message: http.StatusText(http.StatusBadRequest),
				},
			}

			errorMsg.Send(res)

			req.Body.Close()
			return
		}

		next.ServeHTTP(res, req)

		// Running after handler
	})
}

// send rate (ticks)
var tickFrequency rate.Limit = 2
var eventsPerTickRate int = 6

// only {eventsPerTickRate} allowed in a tick rate of {tickFrequency}
var limiter = rate.NewLimiter(tickFrequency, eventsPerTickRate)

func ValidateRequestMethodMiddleware(validRequestMethods []string) util.Middleware {
	// Create a new Middleware
	return func(next http.Handler) http.Handler {
		// Define the http.HandlerFunc
		return http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {

			// check rate limit
			if limiter.Allow() == false {
				var errorMsg models.JsonResponse = models.JsonResponse{
					Error: &models.JsonError{
						Code:    http.StatusTooManyRequests,
						Message: http.StatusText(http.StatusTooManyRequests),
					},
				}
				errorMsg.Send(res)

				req.Body.Close()
				return
			}

			if !isValidRequestMethod(req, validRequestMethods) {
				var errorMsg models.JsonResponse = models.JsonResponse{
					Error: &models.JsonError{
						Code:    http.StatusMethodNotAllowed,
						Message: http.StatusText(http.StatusMethodNotAllowed),
					},
				}

				errorMsg.Send(res)

				req.Body.Close()
				return
			}

			next.ServeHTTP(res, req)

			// Running after handler
		})
	}
}
