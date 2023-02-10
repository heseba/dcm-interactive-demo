package global

type GlobalConfig struct {
	JWT_ACCESS_SECRET   string
	JWT_REFRESH_SECRET  string
	API_KEYS            []string
	ApiRoute            string
	ValidRunOnLocations []string
}

var globalConfig GlobalConfig

func SetConfig(gc GlobalConfig) {
	globalConfig = gc
}

func GetConfig() *GlobalConfig {
	return &globalConfig
}
