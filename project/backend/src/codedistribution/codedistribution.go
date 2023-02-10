package codedistribution

import (
	"fmt"

	"codedistribution/api"
	"codedistribution/fragmentregistry"
	"codedistribution/functionexecuter"
	"codedistribution/global"
	ws "codedistribution/websocket"
)

func GetModuleInfo() global.ModuleInfo {
	return global.CreateModuleInfo()
}

func Initialize(config ...Config) error {
	// 	println("INIT FRAMEWORK")

	var cfg Config

	// passed config params where spread into an array
	if len(config) > 0 {
		cfg = config[0]
	} else {
		return fmt.Errorf("missing codedistribution config")
	}

	global.SetConfig(global.GlobalConfig{
		JWT_ACCESS_SECRET:   cfg.JWT_ACCESS_SECRET,
		JWT_REFRESH_SECRET:  cfg.JWT_REFRESH_SECRET,
		API_KEYS:            cfg.API_KEYS,
		ApiRoute:            cfg.APIPath,
		ValidRunOnLocations: []string{"server", "client"},
	})
	global.SetModuleInfo(cfg.ModuleInfo)

	ws.New(ws.WebSocketConfig{
		Router: cfg.Router,
		Path:   cfg.WSPath,
	})

	// for the decision system
	api.New(api.ApiConfig{
		Router: cfg.Router,
		Path:   cfg.APIPath,
	})

	err := fragmentregistry.New()
	if err != nil {
		return err
	}
	functionexecuter.New()

	return nil
}
