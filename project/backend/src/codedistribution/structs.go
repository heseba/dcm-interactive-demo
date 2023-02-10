package codedistribution

import (
	global "codedistribution/global"

	"github.com/gorilla/mux"
)

type Config struct {
	Router             *mux.Router
	WSPath             string
	APIPath            string
	JWT_ACCESS_SECRET  string
	JWT_REFRESH_SECRET string
	API_KEYS           []string
	ModuleInfo         global.ModuleInfo
}
