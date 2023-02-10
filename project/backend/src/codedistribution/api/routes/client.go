package routes

import (
	"codedistribution/clientregistry"
	"codedistribution/models"
	"encoding/json"
	"fmt"
	"net/http"
	"path"
	"strconv"
)

// /clients/{cid}
func HandleClient(res http.ResponseWriter, req *http.Request) {
	res.Header().Add("Content-Type", "application/json")

	var errorMsg models.JsonResponse = models.JsonResponse{
		Error: &models.JsonError{
			Code:    http.StatusBadRequest,
			Message: http.StatusText(http.StatusBadRequest),
		},
	}

	switch req.Method {
	case http.MethodGet:
		getClient(res, req)
	default:
		errorMsg.Send(res)
	}

	req.Body.Close()
}

// GET /clients/{cid}
func getClient(res http.ResponseWriter, req *http.Request) {

	var (
		errorMsg models.JsonResponse = models.JsonResponse{
			Error: &models.JsonError{
				Code:    http.StatusNotFound,
				Message: http.StatusText(http.StatusNotFound),
			},
		}
	)

	if len(req.URL.Query()) != 0 {
		err := fmt.Errorf("no query expected")
		errorMsg.Error.Code = http.StatusBadRequest
		errorMsg.Error.Message = err.Error()
		errorMsg.Send(res)
		return
	}

	stringNumber := path.Base(req.URL.Path)
	clientNum, err := strconv.Atoi(stringNumber)

	if err != nil {
		errorMsg.Send(res)
		return
	}

	client, err := clientregistry.GetClients().Index(clientNum)

	if err != nil {
		errorMsg.Error.Code = http.StatusNotFound
		errorMsg.Error.Message = http.StatusText(http.StatusNotFound)
		errorMsg.Send(res)
		return
	}

	clientPublic := models.ClientPublic{
		Pos:                client.Pos,
		UUID:               client.UUID,
		FragmentStatusList: client.FragmentStatusList,
	}

	res.WriteHeader(http.StatusOK)
	json.NewEncoder(res).Encode(clientPublic)
}
