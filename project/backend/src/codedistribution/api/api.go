package api

import (
	"codedistribution/api/routes"
	"codedistribution/util"
	"net/http"

	"github.com/gorilla/mux"
)

type ApiConfig struct {
	Router *mux.Router
	Path   string
}

func New(apiConfig ApiConfig) {
	apiRoutes := ApiRoutes{
		// for WebSocket Client registration, deals with tokens
		{
			Path:                apiConfig.Path + "/auth",
			ValidRequestMethods: []string{"POST"},
			Handler:             http.HandlerFunc(routes.HandleAuth),
		},
		// for API calls
		{
			Path:                apiConfig.Path,
			ValidRequestMethods: []string{"GET"},
			Handler:             http.HandlerFunc(routes.GetStatus),
		},
		{
			Path:                apiConfig.Path + "/clients",
			ValidRequestMethods: []string{"GET", "PUT", "OPTIONS"},
			Handler:             http.HandlerFunc(routes.HandleClients),
		},
		{
			Path:                apiConfig.Path + "/clients/{cid}",
			ValidRequestMethods: []string{"GET"},
			Handler:             http.HandlerFunc(routes.HandleClient),
		},
		{
			Path:                apiConfig.Path + "/clients/{cid}/fragments",
			ValidRequestMethods: []string{"GET", "PUT", "OPTIONS"},
			Handler:             http.HandlerFunc(routes.HandleFragments),
		},
		{
			Path:                apiConfig.Path + "/clients/{cid}/fragments/{fid}",
			ValidRequestMethods: []string{"GET", "PUT", "OPTIONS"},
			Handler:             http.HandlerFunc(routes.HandleFragment),
		},
	}

	// register routes
	for _, apiRoute := range apiRoutes {
		apiHandler := http.HandlerFunc(apiRoute.Handler)

		// don't check for API keys if it hits the auth route for the websocket
		if apiRoute.Path == apiConfig.Path+"/auth" {
			middlewareChain := util.CreateMiddlewareChain(ValidateRequestMethodMiddleware(apiRoute.ValidRequestMethods)).Then(apiHandler)
			apiConfig.Router.Handle(apiRoute.Path, middlewareChain)
		} else {
			middlewareChain := util.CreateMiddlewareChain(ValidateRequestMethodMiddleware(apiRoute.ValidRequestMethods), ValidateApiKeyMiddleware).Then(apiHandler)
			apiConfig.Router.Handle(apiRoute.Path, middlewareChain)
		}

		// .Methods(validRequestMethods...) would not respond with anything but the 405 code but we want an error json message
	}
}
