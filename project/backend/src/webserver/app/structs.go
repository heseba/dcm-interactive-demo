package app

import "github.com/gorilla/mux"

type TemplateSettings struct {
	TemplateDir string
	PageDir     string
	PartialDir  string
}

type AppConfig struct {
	Router           *mux.Router
	StaticPath       string
	TemplateSettings TemplateSettings
}
