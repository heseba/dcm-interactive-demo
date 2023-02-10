package app

import "log"

var Config AppConfig

func New(config ...AppConfig) {
	var cfg AppConfig

	// passed config params where spread into an array
	if len(config) > 0 {
		cfg = config[0]
	} else {
		log.Fatal("Missing App config.")
	}

	Config = cfg
}
