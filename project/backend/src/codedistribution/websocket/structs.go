package websocket

import (
	"github.com/gorilla/mux"
)

type WebSocketConfig struct {
	Router *mux.Router
	Path   string
}

type Function struct {
	ID     int           `json:"id,omitempty"`
	Name   string        `json:"name,omitempty"`
	Params []interface{} `json:"params,omitempty"`
	Defer  bool          `json:"defer,omitempty"`
}
