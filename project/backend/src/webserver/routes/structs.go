package routes

type TemplateVariable struct {
	RoutePath  string
	StaticPath string
	Title      string
	Styles     []string
	Scripts    []string
}

type Route struct {
	TemplateName      string
	TemplateFile      string
	TemplateVariables TemplateVariable
}

func (t TemplateVariable) IsCurrentPage(path string) bool {
	return t.RoutePath == path
}
