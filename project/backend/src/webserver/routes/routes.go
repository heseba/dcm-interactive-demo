package routes

import (
	"path"
	"webserver/app"
)

func prependStaticPath(arr []string) []string {
	for i, v := range arr {
		arr[i] = path.Join(app.Config.StaticPath, v)
	}
	return arr
}

var Routes []Route

func Initialize() {
	Routes = []Route{
		{
			TemplateName: "Home",
			TemplateFile: path.Join(app.Config.TemplateSettings.PageDir, "home.html"),
			TemplateVariables: TemplateVariable{
				RoutePath:  "/",
				StaticPath: app.Config.StaticPath,
				Title:      "Web Shop",
				Scripts:    prependStaticPath([]string{"js/index.js"}),
				Styles:     prependStaticPath([]string{"css/global.min.css"}),
			},
		},
		{
			TemplateName: "Playground",
			TemplateFile: path.Join(app.Config.TemplateSettings.PageDir, "playground.html"),
			TemplateVariables: TemplateVariable{
				RoutePath:  "/playground",
				StaticPath: app.Config.StaticPath,
				Title:      "WASM Playground",
				Scripts:    prependStaticPath([]string{"js/playground.js"}),
				Styles:     prependStaticPath([]string{"css/global.min.css"}),
			},
		},
	}

	var notFoundRoute Route = Route{
		TemplateName: "Error",
		TemplateFile: path.Join(app.Config.TemplateSettings.PageDir, "404.html"),
		TemplateVariables: TemplateVariable{
			RoutePath:  "",
			StaticPath: app.Config.StaticPath,
			Title:      "404 - Not Found",
			Scripts:    prependStaticPath([]string{}),
			Styles:     prependStaticPath([]string{"css/404.min.css"}),
		},
	}

	// initialze handlers
	for _, route := range Routes {
		// app.Config.Router.NewRoute().Path(route.TemplateVariables.RoutePath).Handler( RouteHandler(route))
		app.Config.Router.Handle(route.TemplateVariables.RoutePath, RouteHandler(route))
	}

	app.Config.Router.NotFoundHandler = RouteHandler(notFoundRoute)
}
