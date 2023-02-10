package models

import (
	"encoding/json"
	"net/http"
)

type JsonResponse struct {
	Status string     `json:"status,omitempty"`
	Error  *JsonError `json:"error,omitempty"`
}

type JsonError struct {
	Code    int    `json:"code,omitempty"`
	Message string `json:"message,omitempty"`
}

func (err JsonError) Send(res http.ResponseWriter) {
	res.Header().Add("Content-Type", "application/json")
	// the error code we define for the ApiError
	res.WriteHeader(err.Code)

	json.NewEncoder(res).Encode(err)
}
func (resp JsonResponse) Send(res http.ResponseWriter) {
	res.Header().Add("Content-Type", "application/json")

	if resp.Error != nil {
		res.WriteHeader(resp.Error.Code)
	} else {
		res.WriteHeader(http.StatusOK)
	}

	json.NewEncoder(res).Encode(resp)
}
