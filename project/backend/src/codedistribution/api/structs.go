package api

import "net/http"

type ApiRoutes []ApiRoute
type ApiRoute struct {
	Path                string
	ValidRequestMethods []string
	Handler             http.HandlerFunc
}
