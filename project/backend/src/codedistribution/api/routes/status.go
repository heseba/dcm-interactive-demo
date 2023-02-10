package routes

import (
	"codedistribution/models"
	"net/http"
)

// GET /
func GetStatus(res http.ResponseWriter, req *http.Request) {
	apiResp := &models.JsonResponse{
		Status: http.StatusText(http.StatusOK),
	}

	apiResp.Send(res)
	req.Body.Close()
}
