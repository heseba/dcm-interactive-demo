package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"path"
	"path/filepath"
	"time"

	"codedistribution"
	"webserver/app"
	"webserver/middleware"
	"webserver/routes"

	"github.com/gorilla/mux"
)

var (
	host      string = GetEnvString("HOST", "0.0.0.0")
	port      int    = GetEnvInt("SERVERPORT", 8000)
	publicDir string = "frontend/public"
	staticDir string = path.Join(publicDir, "/static")

	staticRoute string = "/static"
	staticPath  string = fmt.Sprintf("%s/", staticRoute)
	templateDir string = "frontend/templates"
)

func main() {
	// ANCHOR
	// fastergoding.Run("-mod", "mod") // dev server hot reload, comment out when debugging

	// command line flags: ./webserver -port=8000 -dir=../
	flag.StringVar(&host, "host", host, "hostname")
	flag.IntVar(&port, "port", port, "listen to port")
	flag.StringVar(&publicDir, "dir", publicDir, "directory to serve")
	flag.StringVar(&staticDir, "static", staticDir, "static files to serve")
	flag.Parse()

	// use Gorilla's mux Router instead of the default ServeMux
	var router *mux.Router = mux.NewRouter()
	router.StrictSlash(true)

	// MIDDLEWARE
	router.Use(middleware.HeaderMiddleware)
	router.Use(middleware.CorsMiddleware("*"))
	// router.Use(middleware.LoggerMiddleware)

	// serve all static files
	var fs http.Handler = http.FileServer(http.Dir(staticDir))
	router.PathPrefix(staticPath).Handler(http.StripPrefix(staticPath, fs)).Methods("GET")

	// CodeDistributer initialisation
	myModuleInfo := codedistribution.GetModuleInfo()
	err := codedistribution.Initialize(codedistribution.Config{
		Router:             router,
		WSPath:             "/ws",
		APIPath:            "/api/v1",
		JWT_ACCESS_SECRET:  "~4sQU*AFX~%Pe</q",
		JWT_REFRESH_SECRET: "D#5f=q_jeEQ~&v7E",
		API_KEYS:           []string{"VtbcwHVdN5rRmZWA", "vrb2Etiu2sUDrCe2"},
		ModuleInfo:         myModuleInfo,
	})
	if err != nil {
		log.Fatalf("CodeDistributor: %v", err)
	}

	// http.Handle in comparison with http.HandleFunc needs a trailing / to successfully work
	templateDir, _ := filepath.Abs(templateDir)

	app.New(app.AppConfig{
		Router:     router,
		StaticPath: staticPath,
		TemplateSettings: app.TemplateSettings{
			TemplateDir: templateDir,
			PageDir:     path.Join(templateDir, "/pages"),
			PartialDir:  path.Join(templateDir, "/partials"),
		},
	})

	// ROUTES
	routes.Initialize()

	server := &http.Server{
		// our router
		Handler: router,
		Addr:    fmt.Sprintf("%s:%d", host, port),
		// Good practice: enforce timeouts for servers you create!
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	log.Printf("Serving %s on http://%s:%d", publicDir, host, port)
	// log.Fatal(http.ListenAndServe(":"+port, router))
	log.Fatal(server.ListenAndServe())
}
